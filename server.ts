import express, { Request, Response, NextFunction } from "express";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { ProjectController } from "./src/server/controllers/ProjectController";
import { ResalePropertyController } from "./src/server/controllers/ResalePropertyController";
import { ReportController } from "./src/server/controllers/ReportController";
import { sendNewProjectNotification, sendApprovalRequestNotification, sendStatusUpdateNotification, sendPasswordResetEmail, sendPasswordResetOtpEmail, sendUserWelcomeInvitationEmail, sanitizeSmtpCredentials } from "./src/server/services/emailService";
import { getDb, saveDb } from "./src/lib/db";
import { uploadFileToCdn } from "./src/server/services/minioService";
import compression from "compression";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { setupSwagger } from "./src/server/swagger";
import nodemailer from "nodemailer";

if (fs.existsSync(path.join(process.cwd(), ".env"))) {
  dotenv.config({ override: true });
} else if (fs.existsSync(path.join(process.cwd(), ".env.example"))) {
  dotenv.config({ path: path.join(process.cwd(), ".env.example"), override: true });
} else {
  dotenv.config({ override: true });
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

const projectController = new ProjectController();
const resalePropertyController = new ResalePropertyController();
const reportController = new ReportController();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for rate limiting (essential for Cloud Run/Nginx environments)
  app.set('trust proxy', 1);

  // --- Security & Optimization Principles ---
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development convenience (AI Studio preview)
    crossOriginEmbedderPolicy: false
  }));
  app.use(compression());
  app.use(cors({
    origin: "*", // Allow all origins for the preview environment
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-role", "x-user-name"]
  }));

  // Global Rate Limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: false,
    message: { error: "Too many requests, please try again later." }
  });
  app.use(globalLimiter);

  // Request Duration Logger
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 500) {
        console.warn(`[Slow Request] ${req.method} ${req.url} took ${duration}ms`);
      }
    });
    next();
  });

  // Stricter Rate Limiting for Auth
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 100, // Limit each IP to 100 requests per hour for auth
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: false,
    message: { error: "Too many authentication attempts, please try again later." }
  });
  app.use("/api/auth", authLimiter);

  setupSwagger(app);

  const ROLE_PERMISSIONS: Record<string, string[]> = {
    admin: ['MANAGE_USERS', 'VIEW_PROJECTS', 'ADD_PROJECTS', 'EDIT_PROJECTS', 'DELETE_PROJECTS', 'APPROVE_DELETIONS', 'VIEW_LOGS', 'VIEW_STATS', 'VIEW_RESALE', 'ADD_RESALE', 'EDIT_RESALE', 'DELETE_RESALE', 'MANAGE_PERMISSIONS', 'MANAGE_TEAM', 'VIEW_REPORTS', 'ADD_REPORTS', 'EDIT_REPORTS', 'DELETE_REPORTS'],
    team_leader: ['VIEW_PROJECTS', 'ADD_PROJECTS', 'EDIT_PROJECTS', 'REQUEST_DELETION', 'VIEW_STATS', 'VIEW_RESALE', 'ADD_RESALE', 'EDIT_RESALE', 'MANAGE_TEAM', 'VIEW_REPORTS', 'ADD_REPORTS', 'EDIT_REPORTS', 'DELETE_REPORTS'],
    employee: ['VIEW_PROJECTS', 'VIEW_RESALE', 'ADD_PROJECTS', 'EDIT_PROJECTS', 'REQUEST_DELETION', 'VIEW_REPORTS', 'EDIT_REPORTS']
  };

  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

  const persistentUploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(persistentUploadsDir)) {
    fs.mkdirSync(persistentUploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(persistentUploadsDir));
  app.use('/uploads', express.static(path.join(process.cwd(), 'dist', 'uploads')));

  // --- Middleware ---
  function checkPermission(permission: string) { 
    return async (req: Request, res: Response, next: NextFunction) => {
      let userRole = '';
      let userId = '';

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          userId = decoded.id;
          userRole = decoded.role;
          // Inject so standard backend flow can pick it up
          req.headers['x-user-id'] = userId;
          req.headers['x-user-role'] = userRole;
          if (decoded.username) {
              req.headers['x-user-name'] = decoded.username;
          }
        } catch (err) {
          return res.status(401).json({ error: "Invalid or expired token" });
        }
      } else {
        // Fallback for previous style requests
        userRole = (req.headers['x-user-role'] || req.query.role || req.body.role) as string;
        userId = (req.headers['x-user-id'] || req.query.userId || req.body.userId) as string;
      }
      
      if (!userRole) return res.status(401).json({ error: "Unauthorized: No valid credentials provided" });

      const db = getDb();
      if (userId) {
        const u = db?.users.find((u: any) => u.id === userId);
        if (u) {
          if (!req.headers['x-user-name']) {
             req.headers['x-user-name'] = u.name;
          }
          u.lastActive = new Date().toISOString();
          if (u.permissions && u.permissions.includes(permission)) return next();
        }
      }

      const permissions = ROLE_PERMISSIONS[userRole] || [];
      if (!permissions.includes(permission)) {
        return res.status(403).json({ error: `Forbidden: Role '${userRole}' does not have '${permission}' permission.` });
      }
      next();
    };
  }

  async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.headers['x-user-id'] = decoded.id;
        req.headers['x-user-role'] = decoded.role;
        
        const db = getDb();
        const u = db?.users.find((u: any) => u.id === decoded.id);
        if (u) {
          req.headers['x-user-name'] = u.name;
        } else {
          return res.status(401).json({ error: "User not found" });
        }
        return next();
      } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
    }
    
    // Fallback for previous style requests
    if (req.headers['x-user-name'] || req.headers['x-user-id']) {
      return next();
    }
    
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  // --- Database Explorer API ---
  app.get('/api/database/tables', checkPermission('VIEW_STATS'), async (req, res) => {
    const db = getDb();
    if (!db) {
       res.status(500).json({ error: "Database not initialized" });
       return;
    }
    const callerName = (req.headers['x-user-name'] || 'Admin') as string;
    const userId = req.headers['x-user-id'] as string;
    await createLog('READ_DATABASE_SCHEMA', callerName, 'Accessed database list of tables', userId);

    const tables = Object.keys(db).filter(k => Array.isArray(db[k]));
    res.json(tables);
  });

  app.get('/api/database/tables/:table', checkPermission('VIEW_STATS'), async (req, res) => {
    const db = getDb();
    if (!db) {
       res.status(500).json({ error: "Database not initialized" });
       return;
    }
    const table = req.params.table;
    const callerName = (req.headers['x-user-name'] || 'Admin') as string;
    const userId = req.headers['x-user-id'] as string;
    await createLog('READ_DATABASE_TABLE', callerName, `Accessed database table: ${table}`, userId);

    if (db[table] && Array.isArray(db[table])) {
       res.json(db[table]);
    } else {
       res.status(404).json({ error: "Table not found" });
    }
  });

  // Enable CORS for public API
  const publicCors = cors({
    origin: '*',
    methods: ['GET'],
    allowedHeaders: ['x-api-key']
  });

  // --- Database Seeding ---
  const seedUsers = async () => {
    const db = getDb();
    if (!db) return;

    const adminEmail = 'admin@pysync.local';
    const adminExists = db.users.find((u: any) => u.email === adminEmail);
    
    if (!adminExists) {
      console.log("Seeding initial users...");
      const initialUsers = [
        { 
          id: '1', 
          name: 'Super Admin', 
          email: adminEmail, 
          username: 'super.admin.init',
          role: 'admin', 
          status: 'Active',
          passwordHash: await bcrypt.hash('password123', 10),
          mustResetPassword: false,
          permissions: ROLE_PERMISSIONS.admin,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        },
        { 
          id: '2', 
          name: 'Employee User', 
          email: 'employee@pysync.local', 
          username: 'employee.user.init',
          role: 'employee', 
          status: 'Active',
          passwordHash: await bcrypt.hash('password123', 10),
          mustResetPassword: false,
          permissions: ROLE_PERMISSIONS.employee,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        },
        { 
          id: '3', 
          name: 'Team Leader', 
          email: 'leader@pysync.local', 
          username: 'team.leader.init',
          role: 'team_leader', 
          status: 'Active',
          passwordHash: await bcrypt.hash('password123', 10),
          mustResetPassword: false,
          permissions: ROLE_PERMISSIONS.team_leader,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        }
      ];
      db.users.push(...initialUsers);
      saveDb(db);
      console.log("Initial users seeded.");
    }
  };

  const seedProjects = async () => {
    const db = getDb();
    if (!db) return;

    const projectData = [
      // DLF (5)
      { title: 'DLF The Arbour', builder: 'DLF', location: 'Sector 63, Gurgaon', type: 'Apartment', config: '4 BHK', price: 75000000, area: '3956 sqft', coordinates: { lat: 28.3976, lng: 77.0620 }, images: [{ name: 'DLF_Arbour_Main.jpg', size: 1500000, data: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1920&q=80' }] },
      { title: 'DLF The Ultima', builder: 'DLF', location: 'Sector 81, Gurgaon', type: 'Apartment', config: '3 BHK', price: 25000000, area: '2100 sqft', coordinates: { lat: 28.3846, lng: 76.9531 } },
      { title: 'DLF The Crest', builder: 'DLF', location: 'Sector 54, Gurgaon', type: 'Apartment', config: '4 BHK', price: 85000000, area: '3500 sqft', coordinates: { lat: 28.4312, lng: 77.1005 }, images: [{ name: 'DLF_The_Crest_Main.jpg', size: 1800000, data: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1920&q=80' }] },
      { title: 'DLF Camellias', builder: 'DLF', location: 'Sector 42, Gurgaon', type: 'Apartment', config: '5 BHK', price: 450000000, area: '7400 sqft', coordinates: { lat: 28.4552, lng: 77.0940 } },
      { title: 'DLF Cyber City', builder: 'DLF', location: 'DLF Phase 2, Gurgaon', type: 'Commercial', config: 'Office Space', price: 120000000, area: '15000 sqft', coordinates: { lat: 28.4900, lng: 77.0850 } },
      
      // Signature Global (3)
      { title: 'Signature Global City 37D', builder: 'Signature Global', location: 'Sector 37D, Gurgaon', type: 'Apartment', config: '3 BHK', price: 12000000, area: '1450 sqft', coordinates: { lat: 28.4350, lng: 76.9600 } },
      { title: 'Signature Global Park 4 & 5', builder: 'Signature Global', location: 'Sector 81, Gurgaon', type: 'Apartment', config: '2 BHK', price: 8500000, area: '1080 sqft', coordinates: { lat: 28.3846, lng: 76.9531 } },
      { title: 'Signature Global Prime', builder: 'Signature Global', location: 'Sector 63A, Gurgaon', type: 'Apartment', config: '2 BHK', price: 7500000, area: '950 sqft', coordinates: { lat: 28.4000, lng: 77.0700 }, images: [{ name: 'Signature_Global_Prime_Aerial.jpg', size: 2100000, data: 'https://images.unsplash.com/photo-1590608897129-79da98d15969?auto=format&fit=crop&w=1920&q=80' }] },
      
      // M3M (4)
      { title: 'M3M Golfestate', builder: 'M3M', location: 'Sector 65, Gurgaon', type: 'Apartment', config: '4 BHK', price: 65000000, area: '3800 sqft', coordinates: { lat: 28.3900, lng: 77.0650 } },
      { title: 'M3M Merlin', builder: 'M3M', location: 'Sector 67, Gurgaon', type: 'Apartment', config: '3 BHK', price: 28000000, area: '2400 sqft', coordinates: { lat: 28.3850, lng: 77.0600 } },
      { title: 'M3M Woodshire', builder: 'M3M', location: 'Sector 107, Gurgaon', type: 'Apartment', config: '3 BHK', price: 18000000, area: '1900 sqft', coordinates: { lat: 28.5100, lng: 77.0000 } },
      { title: 'M3M Marina', builder: 'M3M', location: 'Sector 68, Gurgaon', type: 'Apartment', config: '2 BHK', price: 14000000, area: '1300 sqft', coordinates: { lat: 28.3800, lng: 77.0500 } },
      
      // Godrej Properties (2)
      { title: 'Godrej Aria', builder: 'Godrej Properties', location: 'Sector 79, Gurgaon', type: 'Apartment', config: '3 BHK', price: 22000000, area: '2200 sqft', coordinates: { lat: 28.3700, lng: 76.9700 } },
      { title: 'Godrej Frontier', builder: 'Godrej Properties', location: 'Sector 80, Gurgaon', type: 'Apartment', config: '4 BHK', price: 32000000, area: '3100 sqft', coordinates: { lat: 28.3650, lng: 76.9650 } }
    ];

    const currentTitles = new Set(db.projects.map((p: any) => p.title));
    const missingProjectsData = projectData.filter(p => !currentTitles.has(p.title));

    if (missingProjectsData.length === 0) {
      // Small patch: if projects already exist but don't have coordinates, add them
      let updated = false;
      db.projects.forEach((p: any) => {
        if (!p.coordinates) {
          const match = projectData.find(pd => pd.title === p.title);
          if (match) {
            p.coordinates = match.coordinates;
            updated = true;
          }
        }
      });
      if (updated) saveDb(db);
      return;
    }

    console.log(`Seeding ${missingProjectsData.length} missing projects...`);
    
    let lastSerial = db.lastProjectSerial || db.projects.length;
    
    const initialProjects: any[] = missingProjectsData.map((p) => {
      lastSerial++;
      return {
        id: `p${lastSerial}`,
        title: p.title,
        type: p.type,
        configuration: p.config,
        possessionStatus: ['Ready to Move', 'Under Construction', 'New Launch'][Math.floor(Math.random() * 3)],
        price: p.price,
        location: p.location,
        status: 'Active',
        area: p.area,
        bathrooms: String(Math.floor(Math.random() * 2) + 2),
        builderName: p.builder,
        projectType: p.type === 'Commercial' ? 'Commercial' : 'Residential',
        coordinates: p.coordinates,
        pdfs: [],
        images: (p as any).images || [],
        createdAt: new Date().toISOString(),
        assignedTo: 'Super Admin',
        createdByUserId: '1' // Initial Admin
      };
    });

    db.projects.push(...initialProjects);
    db.lastProjectSerial = lastSerial;
    saveDb(db);
    console.log(`${initialProjects.length} projects seeded.`);
  };

  const seedResaleProperties = async () => {
    const db = getDb();
    if (!db) return;

    if (db.resaleProperties && db.resaleProperties.length > 0) {
       // Small patch: add coordinates if missing
       const resaleData = [
         { society: 'DLF Crest', lat: 28.4312, lng: 77.1005 },
         { society: 'Emaar Palm Drive', lat: 28.4100, lng: 77.0800 },
         { society: 'IREO Victory Valley', lat: 28.3900, lng: 77.0700 }
       ];
       let updated = false;
       db.resaleProperties.forEach((p: any) => {
         if (!p.coordinates) {
            const match = resaleData.find(rd => p.societyName.includes(rd.society));
            if (match) {
              p.coordinates = { lat: match.lat, lng: match.lng };
              updated = true;
            } else {
              // Default to some random offset from Gurgaon center if no match
              p.coordinates = { lat: 28.4595 + (Math.random() - 0.5) * 0.1, lng: 77.0266 + (Math.random() - 0.5) * 0.1 };
              updated = true;
            }
         }
       });
       if (updated) saveDb(db);
       return;
    }

    console.log("Seeding initial resale properties...");
    const initialResale = [
      {
        id: 'r1',
        propertyHolderName: 'John Doe',
        societyName: 'DLF The Crest',
        location: 'Sector 54, Gurgaon',
        builderName: 'DLF',
        propertyType: 'Apartment',
        sizeSqft: 3500,
        bhk: '4 BHK',
        price: 82000000,
        isNegotiable: 'YES' as const,
        floorNumber: '12th',
        propertyAge: '2 Years',
        coordinates: { lat: 28.4312, lng: 77.1005 },
        brokeragePercentage: 1,
        status: 'Active' as const,
        createdAt: new Date().toISOString(),
        createdByUserId: '1' // Initial Admin
      },
      {
        id: 'r2',
        propertyHolderName: 'Jane Smith',
        societyName: 'Emaar Palm Drive',
        location: 'Sector 66, Gurgaon',
        builderName: 'Emaar',
        propertyType: 'Apartment',
        sizeSqft: 2200,
        bhk: '3 BHK',
        price: 35000000,
        isNegotiable: 'NO' as const,
        floorNumber: '5th',
        propertyAge: '5 Years',
        coordinates: { lat: 28.4100, lng: 77.0800 },
        brokeragePercentage: 1.5,
        status: 'Active' as const,
        createdAt: new Date().toISOString(),
        createdByUserId: '1' // Initial Admin
      }
    ];
    db.resaleProperties = initialResale;
    saveDb(db);
    console.log("Resale properties seeded.");
  };

  await seedUsers();
  await seedProjects();
  await seedResaleProperties();

  // --- Utilities ---
  const generateUsername = async (name: string) => {
    const parts = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
    const first = parts[0] || 'user';
    const last = parts[parts.length - 1] || 'name';
    let username = "";
    let isUnique = false;
    const db = getDb();
    while (!isUnique) {
      const suffix = crypto.randomBytes(2).toString('hex');
      username = `${first}.${last}.${suffix}`;
      const existing = db?.users.find((u: any) => u.username === username);
      if (!existing) {
        isUnique = true;
      }
    }
    return username;
  };

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const all = uppercase + lowercase + digits + symbols;
    
    let password = "";
    // Ensure at least one of each
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest to 8 characters
    for (let i = 0; i < 4; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters long";
    return null;
  };

  // --- SSE Clients ---
  let clients: Response[] = [];
  const passwordResetTokens = new Map<string, { email: string, expires: number }>();

  const broadcastEvent = (event: any) => {
    clients.forEach(client => {
      try {
        client.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (err) {
        console.error("Error broadcasting event:", err);
      }
    });
  };

  const broadcastLog = async (log: any) => {
    broadcastEvent({ type: 'NEW_LOG', log });
  };

  const createNotification = async (userId: string | null, title: string, message: string, type: 'info' | 'success' | 'warning' = 'info', createdByUserId?: string) => {
    const db = getDb();
    if (!db) return;

    const notif = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      type,
      readBy: [],
      createdAt: new Date().toISOString(),
      createdByUserId: createdByUserId || 'system'
    };
    
    if (!db.notifications) {
      db.notifications = [];
    }
    db.notifications.push(notif);
    saveDb(db);
    
    clients.forEach(client => {
      try {
        client.write(`data: ${JSON.stringify({ type: 'NEW_NOTIFICATION', notification: notif })}\n\n`);
      } catch (err) {
        console.error("Error broadcasting notification:", err);
      }
    });
  };

  const createLog = async (action: string, user: string, summary: string, createdByUserId?: string) => {
    const db = getDb();
    if (!db) return;

    const log = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      user,
      summary,
      timestamp: new Date().toISOString(),
      createdByUserId: createdByUserId || 'system'
    };
    
    db.logs.push(log);
    saveDb(db);
    
    broadcastLog(log);
    return log;
  };

  const getAdminEmails = () => {
    const db = getDb();
    return db.users.filter((u: any) => u.role === 'admin').map((u: any) => u.email);
  };

  const getUserEmail = (userName: string) => {
    const db = getDb();
    const user = db.users.find((u: any) => u.name === userName);
    return user ? user.email : null;
  };

  projectController.setDependencies(createLog, createNotification, getAdminEmails, sendNewProjectNotification, sendStatusUpdateNotification, getUserEmail);
  resalePropertyController.setDependencies(createLog, createNotification, getAdminEmails, sendNewProjectNotification, sendStatusUpdateNotification, getUserEmail);
  reportController.setDependencies(createLog);

  // --- Authentication API ---

  // Signup
  /**
   * @swagger
   * /api/auth/signup:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - password
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [admin, employee, team_leader]
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Invalid input or user already exists
   */
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    return res.status(403).json({ 
      error: "Public registration is disabled. Accounts can only be created by an administrator." 
    });
  });

  // Login Attempts Tracking
  const loginAttempts = new Map<string, { count: number, lockedUntil: number }>();
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  // Login
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Log in to the application
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   *       429:
   *         description: Too many failed attempts
   */
  app.post("/api/auth/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      const attemptInfo = loginAttempts.get(email);
      if (attemptInfo && attemptInfo.lockedUntil > Date.now()) {
        const minutesLeft = Math.ceil((attemptInfo.lockedUntil - Date.now()) / 60000);
        return res.status(429).json({ error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.` });
      }

      const db = getDb();
      const user = db?.users.find((u: any) => u.email === email || u.username === email || u.phoneNumber === email);
      
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        const currentAttempts = attemptInfo ? attemptInfo.count + 1 : 1;
        if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
          loginAttempts.set(email, { count: currentAttempts, lockedUntil: Date.now() + LOCKOUT_DURATION_MS });
          await createLog('LOGIN_FAILED', email, `Account locked due to multiple failed login attempts.`);
          return res.status(429).json({ error: `Account locked due to too many failed attempts. Try again in 15 minutes.` });
        } else {
          loginAttempts.set(email, { count: currentAttempts, lockedUntil: 0 });
          return res.status(401).json({ error: `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - currentAttempts} attempts remaining.` });
        }
      }

      loginAttempts.delete(email);

      // Check account approval status
      if (user.status === 'Pending Approval' || user.status === 'Pending') {
        return res.status(403).json({ 
          error: "Your account registration is currently pending administrator approval. Please wait for an admin to approve and activate your account." 
        });
      }

      if (user.status === 'Rejected') {
        return res.status(403).json({ 
          error: "Your account registration request was declined by the administrator." 
        });
      }

      // Session concurrency check: prevents multiple active sessions for restricted roles
      if (user.role === 'admin' || user.role === 'employee') {
        const now = new Date();
        const twoMinutesAgo = new Date(now.getTime() - 120000); 
        const activeSession = db.users.find((u: any) => 
          u.role === user.role && 
          u.id !== user.id && 
          u.lastActive && new Date(u.lastActive) >= twoMinutesAgo
        );
        
        if (activeSession) {
          return res.status(403).json({ 
            error: `Another ${user.role} is currently active in the system. To maintain integrity, only one active ${user.role} session is allowed at a time.` 
          });
        }
      }

      user.lastActive = new Date().toISOString();
      saveDb(db);
      
      await createLog('LOGIN', user.name, `User logged in: ${user.email}`, user.id);

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (err: any) {
      next(err);
    }
  });

  // Logout
  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Log out from the application
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   */
  app.post("/api/auth/logout", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userName = req.headers['x-user-name'] as string || 'User';
      const userId = req.headers['x-user-id'] as string;
      const db = getDb();
      if (db && userId) {
        const user = db.users.find((u: any) => u.id === userId);
        if (user) {
          user.lastActive = null;
          saveDb(db);
          await createLog('LOGOUT', user.name, `User logged out: ${user.email}`, user.id);
        } else {
          await createLog('LOGOUT', userName, `User logged out`, userId);
        }
      } else {
        await createLog('LOGOUT', userName, `User logged out`, userId);
      }
      res.json({ success: true, message: "Logged out successfully" });
    } catch (err: any) {
      next(err);
    }
  });

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const db = getDb();
      const user = db?.users.find((u: any) => u.email === email);
      
      const isMockMode = !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS;

      if (!user) {
        if (isMockMode) {
          return res.json({
            message: "Account not found with email: \"" + email + "\". For testing, please use registered email: \"admin@pysync.local\", \"employee@pysync.local\", or \"leader@pysync.local\".",
            isError: true
          });
        }
        return res.json({ message: "If an account exists with that email, a password reset link has been sent." });
      }
      
      // Generate a secure, unique reset token
      const token = crypto.randomBytes(32).toString('hex');
      
      passwordResetTokens.set(token, {
        email,
        expires: Date.now() + 3600000 // 1 hour
      });
      
      const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      const resetLink = `${origin}/?token=${token}`;
      
      await createLog('PASSWORD_RESET_REQUEST', user.name, "Password reset link requested for: " + email, user.id);
      
      // Send actual email (or mock)
      await sendPasswordResetEmail(email, resetLink);
      
      console.log("\n--- SIMULATED EMAIL ---");
      console.log("To: " + email);
      console.log("Subject: Password Reset Request - pySync");
      console.log("Link: " + resetLink);
      console.log("-----------------------\n");

      if (isMockMode) {
        return res.json({ 
          message: "A password reset link has been sent to your email.",
          debugResetLink: resetLink 
        });
      }

      res.json({ message: "If an account exists with that email, a password reset link has been sent." });
    } catch (err: any) {
      next(err);
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;
      const resetInfo = passwordResetTokens.get(token);

      if (!resetInfo || resetInfo.expires < Date.now()) {
        return res.status(400).json({ error: "Invalid or expired password reset link" });
      }

      const db = getDb();
      const user = db?.users.find((u: any) => u.email === resetInfo.email);
      if (!user) return res.status(400).json({ error: "User not found" });

      const passwordError = validatePassword(newPassword);
      if (passwordError) return res.status(400).json({ error: passwordError });

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.updatedAt = new Date().toISOString();
      saveDb(db);
      
      passwordResetTokens.delete(token);

      await createLog('PASSWORD_RESET_SUCCESS', user.name, `Password successfully reset for: ${user.email}`, user.id);
      res.json({ message: "Password has been reset successfully." });
    } catch (err: any) {
      next(err);
    }
  });

  // --- SSE Endpoint ---
  app.get("/api/stream", (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).end();
    }
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).end();
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(': connected\n\n');
    clients.push(res);
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);
    req.on('close', () => {
      clearInterval(heartbeat);
      clients = clients.filter(client => client !== res);
    });
  });

  // --- Background Tasks ---
  const checkProjectStatusUpdates = async () => {
    try {
      const db = getDb();
      if (!db) return;
      const now = new Date();
      let updatedCount = 0;
      
      for (const project of db.projects) {
        if (project.possessionStatus === 'New Launch' && project.launchDate) {
          const launchDate = new Date(project.launchDate);
          const diffMonths = (now.getFullYear() - launchDate.getFullYear()) * 12 + (now.getMonth() - launchDate.getMonth());
          
          if (diffMonths >= 3) {
            project.possessionStatus = 'Under Construction';
            project.updatedAt = now.toISOString();
            updatedCount++;
            await createNotification(null, 'Project Status Updated', `Project "${project.title}" is now Under Construction.`, 'info');
          }
        }
      }

      if (updatedCount > 0) {
        saveDb(db);
        broadcastEvent({ type: 'PROJECTS_UPDATED' });
      }
    } catch (error: any) {
      console.error("Error in background task checkProjectStatusUpdates:", error);
    }
  };

  setInterval(checkProjectStatusUpdates, 3600000);
  setTimeout(checkProjectStatusUpdates, 5000);

  // --- API Routes ---

  /**
   * @swagger
   * /api/batch-data:
   *   get:
   *     summary: Fetch all dashboard data in a single batch
   *     description: Returns projects, resale properties, stats, users, notifications, and logs based on user permissions.
   *     tags: [Data]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Batch data retrieved successfully
   */
  app.get("/api/batch-data", requireAuth, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not initialized" });
      }
      const userId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;
      const permissions = ROLE_PERMISSIONS[userRole] || [];

      const result: any = {};

      // 1. Stats
      if (permissions.includes('VIEW_STATS')) {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 300000);
        const liveUsers = (db.users || []).filter((u: any) => u.lastActive && new Date(u.lastActive) >= fiveMinutesAgo).length;

        const currentUserObj = db.users?.find((u: any) => u.id === userId);

        const filterByUser = (items: any[], type?: string) => {
          if (userRole === 'admin') return items;
          if (type === 'projects' || type === 'resale') return items;
          if (currentUserObj?.showAllProjects && type === 'projects') return items;
          return items.filter((item: any) => item.createdByUserId === userId);
        };

        const myProjects = filterByUser(db.projects || [], 'projects');
        const myResale = filterByUser(db.resaleProperties || [], 'resale');
        const myApprovals = filterByUser(db.approvals || [], 'approvals');
        const myLogs = filterByUser(db.logs || [], 'logs');

        result.stats = {
          total: myProjects.length,
          active: myProjects.filter((p: any) => p.status === 'Active').length,
          pending: myApprovals.filter((a: any) => a.status === 'Pending').length,
          folders: myProjects.length,
          liveUsers,
          totalProperties: myProjects.length + myResale.length,
          totalLogs: myLogs.length,
          teamLeaders: (db.users || []).filter((u: any) => u.role === 'team_leader').length
        };
      } else {
        result.stats = null;
      }

      // 2. Projects
      if (permissions.includes('VIEW_PROJECTS')) {
        const allProjects = db.projects || [];
        const sortedProjects = [...allProjects].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        result.projects = sortedProjects;
      } else {
        result.projects = [];
      }

      // 3. Resale Properties
      if (permissions.includes('VIEW_RESALE')) {
        const allResales = db.resaleProperties || [];
        const sortedResales = [...allResales].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        result.resaleProperties = sortedResales;
      } else {
        result.resaleProperties = [];
      }

      // 4. Reports
      if (permissions.includes('VIEW_REPORTS')) {
        const allReports = db.reports || [];
        result.reports = userRole === 'admin' ? allReports : allReports.filter((r: any) => r.createdByUserId === userId);
      } else {
        result.reports = [];
      }

      // 5. Approvals
      if (permissions.includes('VIEW_PROJECTS')) {
        const allApprovals = db.approvals || [];
        result.approvals = userRole === 'admin' ? allApprovals : allApprovals.filter((a: any) => a.createdByUserId === userId);
      } else {
        result.approvals = [];
      }

      // 6. Notifications
      const allNotifications = db.notifications || [];
      result.notifications = userRole === 'admin' ? allNotifications : allNotifications.filter((n: any) => n.userId === userId);

      // 7. Users
      if (
        permissions.includes('MANAGE_USERS') ||
        permissions.includes('MANAGE_TEAM') ||
        permissions.includes('ADD_PROJECTS') ||
        permissions.includes('EDIT_PROJECTS')
      ) {
        const allUsers = db.users || [];
        let filteredUsers = [];
        if (userRole === 'team_leader') {
          filteredUsers = allUsers.filter((u: any) => u.teamLeaderId === userId || u.id === userId || (u.role === 'employee' && !u.teamLeaderId));
        } else {
          filteredUsers = allUsers;
        }
        result.users = filteredUsers.map(({ passwordHash: _, ...u }: any) => u);
      } else {
        result.users = [];
      }

      // 8. Logs
      if (permissions.includes('VIEW_LOGS') || permissions.includes('VIEW_REPORTS')) {
        const allLogs = db.logs || [];
        let filteredLogs = userRole === 'admin' ? allLogs : allLogs.filter((l: any) => l.createdByUserId === userId);
        result.logs = [...filteredLogs].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5000);
      } else {
        result.logs = [];
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * @swagger
   * /api/stats:
   *   get:
   *     summary: Get dashboard statistics
   *     tags: [Stats]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dashboard statistics retrieved successfully
   */
  app.get("/api/stats", checkPermission('VIEW_STATS'), async (req: Request, res: Response) => {
    const db = getDb();
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;

    const callerName = (req.headers['x-user-name'] || 'Admin') as string;
    
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 300000);
    const liveUsers = db.users.filter((u: any) => u.lastActive && new Date(u.lastActive) >= fiveMinutesAgo).length;

    const currentUserObj = db.users?.find((u: any) => u.id === userId);

    const filterByUser = (items: any[], type?: string) => {
      if (userRole === 'admin') return items;
      if (type === 'projects' || type === 'resale') return items;
      if (currentUserObj?.showAllProjects && type === 'projects') return items;
      return items.filter((item: any) => item.createdByUserId === userId);
    };

    const myProjects = filterByUser(db.projects, 'projects');
    const myResale = filterByUser(db.resaleProperties, 'resale');
    const myApprovals = filterByUser(db.approvals, 'approvals');
    const myLogs = filterByUser(db.logs, 'logs');

    res.json({
      total: myProjects.length,
      active: myProjects.filter((p: any) => p.status === 'Active').length,
      pending: myApprovals.filter((a: any) => a.status === 'Pending').length,
      folders: myProjects.length,
      liveUsers,
      totalProperties: myProjects.length + myResale.length,
      totalLogs: myLogs.length,
      teamLeaders: db.users.filter((u: any) => u.role === 'team_leader').length
    });
  });

  /**
   * @swagger
   * /api/logs:
   *   get:
   *     summary: Get system logs
   *     tags: [Utility]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: System logs retrieved successfully
   */
  app.get("/api/logs", checkPermission('VIEW_REPORTS'), async (req: Request, res: Response) => {
    const db = getDb();
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    
    let logs = db?.logs || [];
    if (userRole !== 'admin') {
      logs = logs.filter((l: any) => l.createdByUserId === userId);
    }
    
    res.json(logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5000));
  });

  app.delete("/api/logs", checkPermission('VIEW_REPORTS'), async (req: Request, res: Response) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    db.logs = [];
    saveDb(db);
    broadcastEvent({ type: 'LOGS_CLEARED' });
    res.json({ success: true, message: "All audit logs cleared from database." });
  });

  app.get("/api/projects", checkPermission('VIEW_PROJECTS'), projectController.getAll);
  app.post("/api/projects", checkPermission('ADD_PROJECTS'), projectController.create);
  app.put("/api/projects/:id", checkPermission('EDIT_PROJECTS'), projectController.update);
  
  app.patch("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role, userName } = req.query as { role?: string; userName?: string };
      const db = getDb();
      
      const projIndex = db.projects.findIndex((p: any) => p.id === id);
      if (projIndex === -1) return res.status(404).json({ error: "Project not found" });
      const oldProj = db.projects[projIndex];
      
      const activeUser = (userName || req.headers['x-user-name'] || 'User') as string;
      const userId = req.headers['x-user-id'] as string;
      const userRole = (role || req.headers['x-user-role'] || '') as string;
      
      // Allow patching if user has EDIT_PROJECTS, ADD_PROJECTS, or is the creator of the project
      const permissions = ROLE_PERMISSIONS[userRole] || [];
      const hasPermission = permissions.includes('EDIT_PROJECTS') || permissions.includes('ADD_PROJECTS') || oldProj.createdByUserId === userId || userRole === 'admin';
      
      if (!hasPermission) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions to modify project" });
      }

      const updateData = { ...req.body };
      
      if (updateData.images && Array.isArray(updateData.images)) {
        updateData.images = await Promise.all(
          updateData.images.map(async (img: any, idx: number) => {
            if (img && img.data && img.data.startsWith('data:')) {
              const uploadedUrl = await uploadFileToCdn(img.data, img.name || `image_${idx}`);
              return { ...img, data: uploadedUrl };
            }
            return img;
          })
        );
      }
      
      if (updateData.pdfs && Array.isArray(updateData.pdfs)) {
        updateData.pdfs = await Promise.all(
          updateData.pdfs.map(async (pdf: any, idx: number) => {
            if (pdf && pdf.data && pdf.data.startsWith('data:')) {
              const uploadedUrl = await uploadFileToCdn(pdf.data, pdf.name || `pdf_${idx}`);
              return { ...pdf, data: uploadedUrl };
            }
            return pdf;
          })
        );
      }

      const updatedProj = {
        ...oldProj,
        ...updateData,
        id // prevent id overwrite
      };

      db.projects[projIndex] = updatedProj;
      saveDb(db);

      await createLog('UPDATE', activeUser, `Uploaded/patched media for project: ${updatedProj.title}`, userId);
      res.json(updatedProj);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role, userName } = req.query as { role?: string, userName?: string };
    const db = getDb();
    const proj = db.projects.find((p: any) => p.id === id);
    if (!proj) return res.status(404).json({ error: "Project not found" });

    const activeUser = (userName || req.headers['x-user-name'] || 'Admin') as string;
    const userId = req.headers['x-user-id'] as string;

    const permissions = ROLE_PERMISSIONS[role || ''] || [];
    if (permissions.includes('DELETE_PROJECTS')) {
      db.projects = db.projects.filter((p: any) => p.id !== id);
      db.approvals = db.approvals.filter((a: any) => a.projectId !== id);
      saveDb(db);
      await createLog('DELETE', activeUser, `Permanently deleted project: ${proj.title}`, userId);
      res.json({ success: true, deleted: true });
    } else if (permissions.includes('REQUEST_DELETION')) {
      proj.status = 'PENDING_DELETE';
      const approvalReq = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: id,
        projectTitle: proj.title,
        requestedBy: activeUser,
        requestedAt: new Date().toISOString(),
        status: 'Pending',
        createdByUserId: userId
      };
      db.approvals.push(approvalReq);
      saveDb(db);
      await createLog('DELETE_REQ', activeUser, `Requested deletion for project: ${proj.title}`, userId);
      
      // Send email notification to admins
      const adminEmails = getAdminEmails();
      if (adminEmails.length > 0) {
        await sendApprovalRequestNotification('Project Deletion', activeUser, adminEmails);
      }
      
      res.json({ success: true, pending: true });
    } else {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
  });

  app.post("/api/projects/:id/edit-request", requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { details, userName } = req.body;
    const db = getDb();
    
    const proj = db.projects.find((p: any) => p.id === id);
    if (!proj) return res.status(404).json({ error: "Project not found" });

    const activeUser = (userName || req.headers['x-user-name'] || 'User') as string;
    const userId = req.headers['x-user-id'] as string;

    const approvalReq = {
      id: Math.random().toString(36).substr(2, 9),
      projectId: id,
      projectTitle: proj.title,
      requestedBy: activeUser,
      requestedAt: new Date().toISOString(),
      status: 'Pending',
      type: 'Edit Request',
      details: details,
      createdByUserId: userId
    };
    
    db.approvals.push(approvalReq);
    saveDb(db);
    
    await createLog('EDIT_REQ', activeUser, `Requested edit for project: ${proj.title} (Mistake details: ${details})`, userId);
    
    await createNotification(null, 'New Edit Request', `${activeUser} submitted an edit request for ${proj.title}.`, 'info', userId);
    
    const adminEmails = getAdminEmails();
    if (adminEmails.length > 0) {
      await sendApprovalRequestNotification('Project Edit Suggestion', activeUser, adminEmails);
    }
    
    res.json({ success: true });
  });

  app.get("/api/resale-properties", checkPermission('VIEW_RESALE'), resalePropertyController.getAll);
  app.post("/api/resale-properties", checkPermission('ADD_RESALE'), resalePropertyController.create);
  app.put("/api/resale-properties/:id", checkPermission('EDIT_RESALE'), resalePropertyController.update);
  app.delete("/api/resale-properties/:id", checkPermission('DELETE_RESALE'), resalePropertyController.delete);

  app.get("/api/reports", checkPermission('VIEW_REPORTS'), reportController.getAll);
  app.get("/api/reports/:id", checkPermission('VIEW_REPORTS'), reportController.getById);
  app.post("/api/reports", checkPermission('ADD_REPORTS'), reportController.create);
  app.put("/api/reports/:id", checkPermission('EDIT_REPORTS'), reportController.update);
  app.delete("/api/reports/:id", checkPermission('DELETE_REPORTS'), reportController.delete);

  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     summary: Get user notifications
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User notifications retrieved successfully
   */
  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const userName = req.headers['x-user-name'] as string;
    const userRole = req.headers['x-user-role'] as string;
    
    if (!userName) return res.status(400).json({ error: "Missing x-user-name header" });
    const db = getDb();
    let notifications = db.notifications || [];
    
    // Filter by target user OR if it's sent to everyone (userId === null)
    notifications = notifications.filter((n: any) => n.userId === null || n.userId === userName);
    
    // Additional filtering: non-admins only see notifications generated in their context
    if (userRole !== 'admin') {
      notifications = notifications.filter((n: any) => n.createdByUserId === userId || n.createdByUserId === 'system');
    }

    const userNotifs = notifications.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);
    res.json(userNotifs);
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userName = req.headers['x-user-name'] as string;
    const db = getDb();
    const notifications = db.notifications || [];
    const notif = notifications.find((n: any) => n.id === id);
    if (notif && !notif.readBy.includes(userName)) {
      notif.readBy.push(userName);
      saveDb(db);
    }
    res.json({ success: true });
  });

  app.post("/api/notifications/read-all", requireAuth, async (req: Request, res: Response) => {
    const userName = req.headers['x-user-name'] as string;
    const db = getDb();
    const notifications = db.notifications || [];
    notifications.forEach((n: any) => {
      if ((n.userId === null || n.userId === userName) && !n.readBy.includes(userName)) {
        n.readBy.push(userName);
      }
    });
    saveDb(db);
    res.json({ success: true });
  });

  app.delete("/api/notifications/:id", requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = getDb();
    if (db.notifications) {
      db.notifications = db.notifications.filter((n: any) => n.id !== id);
      saveDb(db);
    }
    res.json({ success: true });
  });

  /**
   * @swagger
   * /api/approvals:
   *   get:
   *     summary: Get all approval requests
   *     tags: [Approvals]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Approval requests retrieved successfully
   */
  app.get("/api/approvals", checkPermission('VIEW_PROJECTS'), async (req: Request, res: Response) => {
    const db = getDb();
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    
    let approvals = db.approvals || [];
    if (userRole !== 'admin') {
      if (userRole === 'team_leader') {
        approvals = approvals.filter((a: any) => a.type === 'New Project Approval' || a.createdByUserId === userId);
      } else {
        approvals = approvals.filter((a: any) => a.createdByUserId === userId);
      }
    }
    
    res.json(approvals.sort((a: any, b: any) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
  });

  app.post("/api/approvals/:id/action", requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, userName } = req.body;
    const db = getDb();
    const userRole = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;

    const approval = db.approvals.find((a: any) => a.id === id);
    if (!approval) return res.status(404).json({ error: "Approval request not found" });

    // Permissions check
    const isProjectApproval = approval.type === 'New Project Approval';
    const isUserApproval = approval.type === 'User Registration Approval' || approval.type === 'New User Registration' || approval.type === 'User Registration';

    let canApprove = false;
    if (userRole === 'admin') {
      canApprove = true;
    } else if (userRole === 'team_leader' && isProjectApproval) {
      canApprove = true;
    } else if (!isUserApproval) {
      const u = db.users.find((u: any) => u.id === userId);
      const permissions = u?.permissions || ROLE_PERMISSIONS[userRole] || [];
      if (permissions.includes('APPROVE_DELETIONS')) {
        canApprove = true;
      }
    }

    if (!canApprove) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to perform this action." });
    }

    if (action === 'approve') {
      if (approval.type === 'User Registration Approval' || approval.type === 'New User Registration' || approval.type === 'User Registration') {
        const userToApprove = db.users.find((u: any) => u.id === approval.userId || u.email === approval.userEmail);
        if (userToApprove) {
          userToApprove.status = 'Active';
          userToApprove.updatedAt = new Date().toISOString();
        }
        await createLog('APPROVE_USER', userName || 'Admin', `Approved user registration: ${approval.userName || approval.userEmail} [${approval.userRole || 'employee'}]`, userId);
        await createNotification(approval.requestedBy, 'Account Approved', `Your pySync account registration has been approved. You can now log in.`, 'success', approval.userId);
        
        const requesterEmail = approval.userEmail || getUserEmail(approval.requestedBy);
        if (requesterEmail) {
          await sendStatusUpdateNotification('Account Registration', approval.userName || 'Account', 'Approved & Activated', requesterEmail);
        }
      } else if (approval.type === 'Edit Request') {
        await createLog('APPROVE_EDIT', userName || 'Admin', `Approved edit request for: ${approval.projectTitle}`, userId);
        await createNotification(approval.requestedBy, 'Edit Request Approved', `Your edit suggestion for ${approval.projectTitle} was approved and marked as resolved.`, 'success');
        
        const requesterEmail = getUserEmail(approval.requestedBy);
        if (requesterEmail) {
          await sendStatusUpdateNotification('Project Edit Suggestion', approval.projectTitle, 'Approved & Resolved', requesterEmail);
        }
      } else if (approval.type === 'New Project Approval') {
        const proj = db.projects.find((p: any) => p.id === approval.projectId);
        if (proj) proj.status = 'Active';
        await createLog('APPROVE_PROJECT', userName || 'Admin', `Approved active status for project: ${approval.projectTitle}`, userId);
        await createNotification(approval.requestedBy, 'Project Entry Approved', `Your listed project ${approval.projectTitle} has been approved and is now Active.`, 'success');
        
        const requesterEmail = getUserEmail(approval.requestedBy);
        if (requesterEmail) {
          await sendStatusUpdateNotification('Project', approval.projectTitle, 'Active', requesterEmail);
        }
      } else {
        db.projects = db.projects.filter((p: any) => p.id !== approval.projectId);
        await createLog('APPROVE', userName || 'Admin', `Approved deletion: ${approval.projectTitle}`, userId);
        await createNotification(approval.requestedBy, 'Deletion Approved', `Your request to delete ${approval.projectTitle} was approved.`, 'success');
        
        const requesterEmail = getUserEmail(approval.requestedBy);
        if (requesterEmail) {
          await sendStatusUpdateNotification('Project', approval.projectTitle, 'Deleted', requesterEmail);
        }
      }
    } else {
      if (approval.type === 'User Registration Approval' || approval.type === 'New User Registration' || approval.type === 'User Registration') {
        const userToReject = db.users.find((u: any) => u.id === approval.userId || u.email === approval.userEmail);
        if (userToReject) {
          userToReject.status = 'Rejected';
          userToReject.updatedAt = new Date().toISOString();
        }
        await createLog('REJECT_USER', userName || 'Admin', `Rejected user registration: ${approval.userName || approval.userEmail}`, userId);
        await createNotification(approval.requestedBy, 'Account Registration Rejected', `Your pySync account registration request was not approved.`, 'warning', approval.userId);
        
        const requesterEmail = approval.userEmail || getUserEmail(approval.requestedBy);
        if (requesterEmail) {
          await sendStatusUpdateNotification('Account Registration', approval.userName || 'Account', 'Rejected', requesterEmail);
        }
      } else if (approval.type === 'Edit Request') {
        await createLog('REJECT_EDIT', userName || 'Admin', `Rejected edit request for: ${approval.projectTitle}`, userId);
        await createNotification(approval.requestedBy, 'Edit Request Rejected', `Your edit suggestion for ${approval.projectTitle} was rejected.`, 'warning');
        
        const requesterEmail = getUserEmail(approval.requestedBy);
        if (requesterEmail) {
          await sendStatusUpdateNotification('Project Edit Suggestion', approval.projectTitle, 'Rejected', requesterEmail);
        }
      } else if (approval.type === 'New Project Approval') {
        const proj = db.projects.find((p: any) => p.id === approval.projectId);
        if (proj) proj.status = 'Rejected';
        await createLog('REJECT_PROJECT', userName || 'Admin', `Rejected project listing: ${approval.projectTitle}`, userId);
        await createNotification(approval.requestedBy, 'Project Entry Rejected', `Your listed project ${approval.projectTitle} was rejected.`, 'warning');
        
        const requesterEmail = getUserEmail(approval.requestedBy);
        if (requesterEmail) {
          await sendStatusUpdateNotification('Project', approval.projectTitle, 'Rejected', requesterEmail);
        }
      } else {
        const proj = db.projects.find((p: any) => p.id === approval.projectId);
        if (proj) proj.status = 'Active';
        await createLog('REJECT', userName || 'Admin', `Rejected deletion: ${approval.projectTitle}`, userId);
        await createNotification(approval.requestedBy, 'Deletion Rejected', `Your request to delete ${approval.projectTitle} was rejected.`, 'warning');
        
        const requesterEmail = getUserEmail(approval.requestedBy);
        if (requesterEmail) {
          await sendStatusUpdateNotification('Project', approval.projectTitle, 'Active (Deletion Rejected)', requesterEmail);
        }
      }
    }
    approval.status = action === 'approve' ? 'Approved' : 'Rejected';
    saveDb(db);
    broadcastEvent({ type: 'APPROVAL_UPDATED', approval });
    broadcastEvent({ type: 'USER_UPDATED', userId: approval.userId });
    res.json({ success: true });
  });

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Get all users
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: A list of users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   */
  app.get("/api/users", requireAuth, async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const db = getDb();
    const user = db.users.find((u: any) => u.id === userId);
    const permissions = (user?.permissions || ROLE_PERMISSIONS[userRole || ''] || []);
    if (!permissions.includes('MANAGE_USERS') && !permissions.includes('MANAGE_TEAM') && !permissions.includes('ADD_PROJECTS') && !permissions.includes('EDIT_PROJECTS')) return res.status(403).json({ error: "Forbidden" });

    let users = db.users;
    if (userRole === 'team_leader') {
      users = db.users.filter((u: any) => u.teamLeaderId === userId || u.id === userId || (u.role === 'employee' && !u.teamLeaderId));
    }
    const callerName = (req.headers['x-user-name'] || user?.name || 'User') as string;
    if (userId) {
      await createLog('READ_USERS', callerName, 'Viewed user directory', userId);
    }
    res.json(users.map(({ passwordHash: _, ...u }: any) => u));
  });

  app.post("/api/users/:id/permissions", checkPermission('MANAGE_PERMISSIONS'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { permissions, adminName } = req.body;
    const db = getDb();
    const user = db.users.find((u: any) => u.id === id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.permissions = permissions;
    user.updatedAt = new Date().toISOString();
    saveDb(db);
    const callerName = (adminName || req.headers['x-user-name'] || 'Admin') as string;
    const userId = req.headers['x-user-id'] as string;
    await createLog('PERMISSIONS_UPDATED', callerName, `Updated permissions for ${user.email}`, userId);
    res.json(user);
  });

  app.post("/api/users/:id/assign-team", checkPermission('MANAGE_TEAM'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { teamLeaderId, leaderName } = req.body;
    const db = getDb();
    const user = db.users.find((u: any) => u.id === id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.teamLeaderId = teamLeaderId;
    user.updatedAt = new Date().toISOString();
    saveDb(db);
    const callerName = (leaderName || req.headers['x-user-name'] || 'Team Leader') as string;
    const userId = req.headers['x-user-id'] as string;
    await createLog('TEAM_ASSIGNMENT', callerName, `Assigned user ${user.email} to team leader`, userId);
    res.json(user);
  });

  app.post("/api/users/bulk-assign-team", checkPermission('MANAGE_TEAM'), async (req: Request, res: Response) => {
    const { userIds, teamLeaderId, leaderName } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "Invalid userIds array" });
    }
    const db = getDb();
    let assignedCount = 0;
    for (const id of userIds) {
      const user = db.users.find((u: any) => u.id === id);
      if (user) {
        user.teamLeaderId = teamLeaderId;
        user.updatedAt = new Date().toISOString();
        assignedCount++;
      }
    }
    if (assignedCount > 0) {
      saveDb(db);
      const callerName = (leaderName || req.headers['x-user-name'] || 'Team Leader') as string;
      const userId = req.headers['x-user-id'] as string;
      await createLog('TEAM_ASSIGNMENT', callerName, `Bulk assigned ${assignedCount} users to team leader`, userId);
    }
    res.json({ success: true, assignedCount });
  });

  app.post("/api/users", checkPermission('MANAGE_USERS'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, role, adminName, phoneNumber } = req.body;
      const db = getDb();
      if (db.users.find((u: any) => u.email === email)) return res.status(400).json({ error: "Email exists" });
      const username = await generateUsername(name);
      const password = generatePassword();
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name, email, username, role, phoneNumber,
        permissions: ROLE_PERMISSIONS[role] || ['VIEW_PROJECTS', 'VIEW_RESALE'],
        passwordHash: await bcrypt.hash(password, 10),
        mustResetPassword: true,
        showAllProjects: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      db.users.push(newUser);
      saveDb(db);
      broadcastEvent({ type: 'USER_CREATED', user: { ...newUser, passwordHash: undefined } });
      const currentAdmin = (adminName || req.headers['x-user-name'] || 'Admin') as string;
      const userId = req.headers['x-user-id'] as string;
      await createLog('USER_CREATED', currentAdmin, `Created user: ${name} (${email}) | Username: ${username} | Password: ${password}`, userId);

      // Generate application login link with user prefilled
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const origin = req.headers.origin || `${protocol}://${host}`;
      const loginLink = `${origin}/?welcome=true&user=${encodeURIComponent(username)}`;

      // Send welcome email containing generated credentials & login redirect link
      try {
        await sendUserWelcomeInvitationEmail(email, name, username, password, loginLink);
      } catch (mailErr) {
        console.error("Error sending user creation invitation email:", mailErr);
      }

      res.status(201).json({ ...newUser, password, loginLink, email, name });
    } catch (err: any) { next(err); }
  });

  app.delete("/api/users/:id", checkPermission('MANAGE_USERS'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = getDb();
    const userToDelete = db.users.find((u: any) => u.id === id);
    if (!userToDelete) return res.status(404).json({ error: "User not found" });
    db.users = db.users.filter((u: any) => u.id !== id);
    saveDb(db);
    broadcastEvent({ type: 'USER_DELETED', userId: id });
    const adminName = (req.headers['x-user-name'] || 'Admin') as string;
    const adminId = req.headers['x-user-id'] as string;
    await createLog('DELETE_USER', adminName, `Deleted user: ${userToDelete.name}`, adminId);
    res.json({ success: true });
  });

  app.post("/api/users/:id/reset-credentials", checkPermission('MANAGE_USERS'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const db = getDb();
      const user = db.users.find((u: any) => u.id === id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const tempPassword = crypto.randomBytes(8).toString('hex') + "A1!";
      const passHash = await bcrypt.hash(tempPassword, 10);
      user.passwordHash = passHash;
      user.mustResetPassword = true;
      user.updatedAt = new Date().toISOString();
      saveDb(db);
      
      const adminName = (req.headers['x-user-name'] || 'Admin') as string;
      const adminId = req.headers['x-user-id'] as string;
      await createLog('SECURITY_UPDATE', adminName, `Reset credentials for user ${user.email} | Username: ${user.username} | Password: ${tempPassword}`, adminId);

      res.json({ message: "Credentials reset successfully", credentials: { username: user.username, password: tempPassword } });
    } catch (err: any) { next(err); }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, email, role, requesterId, profilePicture, favorites, phoneNumber } = req.body;
      const db = getDb();
      const user = db.users.find((u: any) => u.id === id);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (name) user.name = name;
      if (email) user.email = email;
      if (role) user.role = role;
      if (profilePicture !== undefined) user.profilePicture = profilePicture;
      if (favorites !== undefined) user.favorites = favorites;
      if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
      user.updatedAt = new Date().toISOString();
      saveDb(db);
      broadcastEvent({ type: 'USER_UPDATED', user: { ...user, passwordHash: undefined } });

      const caller = (req.headers['x-user-name'] || user.name || 'Admin') as string;
      const callerId = req.headers['x-user-id'] as string;
      await createLog('UPDATE_USER', caller, `Updated profile for user: ${user.name} (${user.email})`, callerId);

      res.json(user);
    } catch (err: any) { next(err); }
  });

  app.get("/api/database", checkPermission('MANAGE_USERS'), async (req: Request, res: Response) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: "Database not found" });
    
    // Ensure public API key exists
    if (!db.config) db.config = {};
    if (!db.config.publicApiKey) {
      db.config.publicApiKey = crypto.randomBytes(32).toString('hex');
      saveDb(db);
    }

    const caller = (req.headers['x-user-name'] || 'Admin') as string;
    const userId = req.headers['x-user-id'] as string;
    await createLog('READ_DATABASE', caller, 'Accessed and downloaded raw database snapshot', userId);

    res.json({
      ...db,
      publicApiKey: db.config.publicApiKey
    });
  });

  app.post("/api/database/regenerate-key", checkPermission('MANAGE_USERS'), async (req: Request, res: Response) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: "Database not found" });
    
    if (!db.config) db.config = {};
    db.config.publicApiKey = crypto.randomBytes(32).toString('hex');
    saveDb(db);
    
    const caller = (req.headers['x-user-name'] || 'Admin') as string;
    const userId = req.headers['x-user-id'] as string;
    await createLog('SECURITY_UPDATE', caller, 'Regenerated global developer public API Key', userId);

    res.json({ success: true, key: db.config.publicApiKey });
  });

  // SMTP Config Management API
  app.get("/api/smtp/config", checkPermission('MANAGE_USERS'), async (req: Request, res: Response) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: "Database not found" });
    
    // Return SMTP config, but obscure the password for security
    const config = db.smtp_config || {
      host: process.env.SMTP_HOST || "",
      port: process.env.SMTP_PORT || "587",
      user: process.env.SMTP_USER || "",
      pass: "",
      from: process.env.EMAIL_FROM || '"pySync Notifications" <noreply@pysync.local>'
    };

    const obscuredConfig = {
      ...config,
      pass: config.pass ? "••••••••" : ""
    };

    res.json(obscuredConfig);
  });

  app.post("/api/smtp/config", checkPermission('MANAGE_USERS'), async (req: Request, res: Response) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: "Database not found" });

    const { host, port, user, pass, from } = req.body;
    
    if (!host || !port || !user || !from) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const currentConfig = db.smtp_config || {};
    const finalPass = (pass === "••••••••" || !pass) ? (currentConfig.pass || process.env.SMTP_PASS || "") : pass;

    db.smtp_config = {
      host,
      port,
      user,
      pass: finalPass,
      from
    };

    saveDb(db);

    const caller = (req.headers['x-user-name'] || 'Admin') as string;
    const userId = req.headers['x-user-id'] as string;
    await createLog('SECURITY_UPDATE', caller, 'Updated SMTP credentials settings', userId);

    res.json({ success: true, message: "SMTP configuration updated successfully." });
  });

  app.post("/api/smtp/test", checkPermission('MANAGE_USERS'), async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required for testing." });
    }

    const testSubject = "SMTP Connection Test - pySync";
    const testHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #f59e0b; margin-top: 0; text-align: center;">SMTP Test Successful</h2>
        <p>Congratulations! Your SMTP credentials on the pySync Real Estate Data Platform are correctly configured.</p>
        <p>This is a test notification confirming that the platform can now send active notification emails.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 10px; text-align: center;">pySync Real Estate Data Platform</p>
      </div>
    `;

    try {
      const db = getDb();
      const dbSmtp = db?.smtp_config;

      const host = (dbSmtp?.host || process.env.SMTP_HOST || '').trim();
      const portStr = (dbSmtp?.port || process.env.SMTP_PORT || '587').toString().trim();
      const user = (dbSmtp?.user || process.env.SMTP_USER || '').trim();
      let pass = (dbSmtp?.pass || process.env.SMTP_PASS || '').trim();
      const from = dbSmtp?.from || process.env.EMAIL_FROM || '"pySync Notifications" <noreply@pysync.local>';

      pass = sanitizeSmtpCredentials(host, pass);

      if (!host || !user || !pass) {
        return res.status(400).json({ error: "SMTP is not fully configured yet. Please provide Host, User, and Password." });
      }

      const port = parseInt(portStr, 10) || 587;
      const isSecure = port === 465;

      const transport = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: { user, pass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transport.sendMail({
        from,
        to: email,
        subject: testSubject,
        html: testHtml
      });

      res.json({ success: true, message: `Test email sent successfully! Message ID: ${info.messageId}` });
    } catch (err: any) {
      console.error("Test SMTP error:", err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('535') || errMsg.includes('Invalid login') || errMsg.includes('Username and Password not accepted')) {
        return res.status(400).json({
          error: "Gmail/SMTP authentication failed (535 Invalid Login). If using Gmail, you must generate a 16-character Google App Password in your Google Account Security settings (https://myaccount.google.com/apppasswords) and enter it as your SMTP password."
        });
      }
      res.status(500).json({ error: errMsg || "Failed to send test email. Please check your SMTP configuration." });
    }
  });

  // --- NGINX + PM2 + Certbot Stack Configurations ---
  app.get("/api/stack/config", checkPermission('MANAGE_USERS'), async (req: Request, res: Response) => {
    const db = getDb();
    const config = db?.stack_config || {
      domain: "pysync.yourdomain.com",
      email: "admin@yourdomain.com",
      port: 3000,
      instances: "max"
    };
    res.json(config);
  });

  app.post("/api/stack/save", checkPermission('MANAGE_USERS'), async (req: Request, res: Response) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: "Database not found" });

    const { domain, email, port, instances } = req.body;
    if (!domain || !email || !port || !instances) {
      return res.status(400).json({ error: "Missing required fields for Stack Configuration" });
    }

    db.stack_config = { domain, email, port: Number(port), instances };
    saveDb(db);

    // Dynamic generation and writing of ecosystem.config.cjs
    const ecosystemContent = `/**
 * PM2 Process Manager Configuration for pySync CRM
 * Generated automatically by PySync Stack Manager
 */
module.exports = {
  apps: [
    {
      name: 'pysync-crm',
      script: './dist/server.cjs',
      instances: '${instances}',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: ${port}
      },
      env_file: '.env',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
`;

    // Dynamic generation and writing of nginx.conf
    const nginxContent = `# Nginx Server Block Virtual Host configuration for pySync CRM
# Generated automatically by PySync Stack Manager

server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    # Redirect all HTTP traffic to secure HTTPS
    location / {
        return 301 https://$host$request_uri;
    }

    # Certbot ACME challenge validation path
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

    # SSL Certificates managed by Certbot Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;

    # Secure SSL Protocols and Ciphers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_comp_level 5;

    # Backend API / Reverse Proxy configuration
    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Max body upload limits (useful for larger document transfers)
        client_max_body_size 500M;
    }

    # Static Assets Long-term Caching
    location /assets/ {
        proxy_pass http://127.0.0.1:${port};
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
`;

    // Dynamic generation and writing of deploy.sh
    const deployContent = `#!/bin/bash
# pySync CRM Automated Deployment Script (Ubuntu/Debian)
# NGINX + PM2 + Certbot Stack Setup
# Generated automatically by PySync Stack Manager

# Exit on any error
set -e

DOMAIN="${domain}"
EMAIL="${email}"
PORT="${port}"

echo "================================================="
echo "🚀 Starting pySync CRM Stack Deployment on Host"
echo "Target Domain: \\\$DOMAIN"
echo "Internal Port: \\\$PORT"
echo "Alert SSL Email: \\\$EMAIL"
echo "================================================="

# 1. Update Package repositories
echo "Updating apt packages..."
sudo apt update -y

# 2. Install curl and git if missing
sudo apt install -y curl git gnupg

# 3. Install Node.js (v20 LTS)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js already installed: \$(node -v)"
fi

# 4. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    sudo npm install -y pm2 -g
else
    echo "PM2 already installed: \$(pm2 -v)"
fi

# 5. Install NGINX
if ! command -v nginx &> /dev/null; then
    echo "Installing NGINX..."
    sudo apt install -y nginx
else
    echo "NGINX already installed."
fi

# 6. Install Certbot
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
else
    echo "Certbot already installed."
fi

# 7. Configure Temporary HTTP Server block for ACME challenge
echo "Creating HTTP Nginx configuration..."
sudo tee /etc/nginx/sites-available/pysync.conf > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name \\\${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:\\\${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\${http_upgrade};
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\${host};
        proxy_cache_bypass \\\${http_upgrade};
    }

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
EOF

# Link configuration
sudo ln -sf /etc/nginx/sites-available/pysync.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test & reload
sudo nginx -t
sudo systemctl reload nginx

# 8. Request SSL Certificate
echo "Requesting SSL certificates..."
sudo certbot --nginx --non-interactive --agree-tos --email "\\\${EMAIL}" -d "\\\${DOMAIN}" --redirect

# 9. Overwrite with full production secure SSL server block
echo "Applying final secure HTTPS configuration..."
sudo tee /etc/nginx/sites-available/pysync.conf > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name \\\${DOMAIN};
    return 301 https://\\\${host}\\\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name \\\${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/\\\${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/\\\${DOMAIN}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location / {
        proxy_pass http://127.0.0.1:\\\${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\${http_upgrade};
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\${host};
        proxy_cache_bypass \\\${http_upgrade};
        proxy_set_header X-Real-IP \\\${remote_addr};
        proxy_set_header X-Forwarded-For \\\${proxy_add_x_forwarded_for};
        proxy_set_header X-Forwarded-Proto \\\${scheme};
        client_max_body_size 500M;
    }
}
EOF

# Test & reload final configuration
sudo nginx -t
sudo systemctl reload nginx

# 10. Install production dependencies and boot up PM2
echo "Installing production dependencies..."
npm install --omit=dev --legacy-peer-deps || npm install --legacy-peer-deps

echo "Building production bundles..."
npm run build

echo "Starting/Reloading process with PM2..."
if pm2 show pysync-crm &> /dev/null; then
    pm2 reload ecosystem.config.cjs
else
    pm2 start ecosystem.config.cjs
fi

sudo env PATH=\\\${PATH}:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u \\\${USER} --hp \\\${HOME}
pm2 save

echo "================================================="
echo "🎉 pySync CRM stack deployment complete!"
echo "Check your site at: https://$DOMAIN"
echo "================================================="
`;

    try {
      fs.writeFileSync(path.join(process.cwd(), "ecosystem.config.cjs"), ecosystemContent);
      fs.writeFileSync(path.join(process.cwd(), "nginx.conf"), nginxContent);
      fs.writeFileSync(path.join(process.cwd(), "deploy.sh"), deployContent);
      // set executable permission on deploy.sh
      fs.chmodSync(path.join(process.cwd(), "deploy.sh"), "755");
    } catch (fsErr: any) {
      console.error("Failed to write physical stack config files:", fsErr);
      return res.status(500).json({ error: "Failed to write config files to disk: " + fsErr.message });
    }

    const caller = (req.headers['x-user-name'] || 'Admin') as string;
    const userId = req.headers['x-user-id'] as string;
    await createLog('SYSTEM_UPDATE', caller, `Updated NGINX+PM2+Certbot Stack configurations for ${domain}`, userId);

    res.json({
      success: true,
      message: "Server stack configurations saved and deployment files generated successfully!",
      files: {
        ecosystem: ecosystemContent,
        nginx: nginxContent,
        deploy: deployContent
      }
    });
  });

  // Public External API
  app.get("/api/external/data", publicCors, async (req: Request, res: Response) => {
    const apiKey = req.headers['x-api-key'] as string;
    const db = getDb();
    
    if (!db || !db.config || db.config.publicApiKey !== apiKey) {
      return res.status(401).json({ error: "Invalid or missing API Key" });
    }

    await createLog('EXTERNAL_API_ACCESS', 'External API Client', `Accessed public real estate inventory via developer API Key ending in ...${apiKey.substring(apiKey.length - 6)}`, 'system');

    // Return sanitized data for external use
    res.json({
      projects: db.projects.map((p: any) => ({
        id: p.id,
        title: p.title,
        location: p.location,
        price: p.price,
        type: p.type,
        status: p.status,
        area: p.area
      })),
      resaleProperties: db.resaleProperties.map((p: any) => ({
        id: p.id,
        societyName: p.societyName,
        location: p.location,
        price: p.price,
        bhk: p.bhk,
        status: p.status
      }))
    });
  });

  // Health Check
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Utility]
   *     responses:
   *       200:
   *         description: Server is healthy
   */
  app.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`[Error] ${req.method} ${req.url} - ${status}: ${message}`);
    if (process.env.NODE_ENV !== "production") {
      console.error(err.stack);
    }
    
    res.status(status).json({ 
      error: message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Frontend build not found. Please run npm run build.');
        }
      });
    } else {
      app.get('*', (req: Request, res: Response) => {
        res.status(404).send('Dist directory not found. Please run npm run build.');
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`pySync Server running on http://localhost:${PORT}`);
  });
}

startServer();
