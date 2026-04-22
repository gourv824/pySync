import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import cors from "cors";
import { ProjectController } from "./src/server/controllers/ProjectController";
import { ResalePropertyController } from "./src/server/controllers/ResalePropertyController";
import { ReportController } from "./src/server/controllers/ReportController";
import { sendNewProjectNotification, sendApprovalRequestNotification, sendStatusUpdateNotification, sendPasswordResetEmail } from "./src/server/services/emailService";
import { getDb, saveDb, sqlite_db } from "./src/lib/db";
import { serverConfig, isProduction } from "./src/server/infrastructure/config";
import { registerHttpMiddleware } from "./src/server/infrastructure/httpMiddleware";
import { registerHealthRoutes } from "./src/server/infrastructure/healthRoutes";
import { globalErrorHandler } from "./src/server/infrastructure/errorHandler";
import { registerServerLifecycle } from "./src/server/infrastructure/serverLifecycle";
import { ROLE_PERMISSIONS } from "./src/server/infrastructure/permissions";
import { logger } from "./src/server/infrastructure/logger";
import { getStorageProvider } from './src/server/infrastructure/StorageService';

const projectController = new ProjectController();
const resalePropertyController = new ResalePropertyController();
const reportController = new ReportController();

async function startServer() {
  const app = express();

  // Serve uploads folder as static
  app.use('/api/media', express.static(path.join(process.cwd(), 'uploads')));

  app.use(cors());
  registerHttpMiddleware(app);
  registerHealthRoutes(app);

  // Quiet common browser auto-requests that otherwise show as 404 noise.
  app.get("/favicon.ico", (_req: Request, res: Response) => {
    res.status(204).end();
  });

  // --- Database Explorer API ---
  app.get('/api/database/tables', (req, res) => {
    const db = getDb();
    if (!db) {
       res.status(500).json({ error: "Database not initialized" });
       return;
    }
    const tables = Object.keys(db).filter(k => Array.isArray(db[k]));
    res.json(tables);
  });

  app.get('/api/database/tables/:table', (req, res) => {
    const db = getDb();
    if (!db) {
       res.status(500).json({ error: "Database not initialized" });
       return;
    }
    const table = req.params.table;
    if (db[table] && Array.isArray(db[table])) {
       res.json(db[table]);
    } else {
       res.status(404).json({ error: "Table not found" });
    }
  });

  // Enable CORS for public API
  const publicCors = cors({
    origin: serverConfig.publicApiCorsOrigin,
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
    if (!db || db.projects.length > 0) return;

    console.log("Seeding initial projects...");
    
    const projectData = [
      // DLF (5)
      { title: 'DLF The Arbour', builder: 'DLF', location: 'Sector 63, Gurgaon', type: 'Apartment', config: '4 BHK', price: 75000000, area: '3956 sqft', images: [{ name: 'DLF_Arbour_Main.jpg', size: 1500000, data: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1920&q=80' }] },
      { title: 'DLF The Ultima', builder: 'DLF', location: 'Sector 81, Gurgaon', type: 'Apartment', config: '3 BHK', price: 25000000, area: '2100 sqft' },
      { title: 'DLF The Crest', builder: 'DLF', location: 'Sector 54, Gurgaon', type: 'Apartment', config: '4 BHK', price: 85000000, area: '3500 sqft', images: [{ name: 'DLF_The_Crest_Main.jpg', size: 1800000, data: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1920&q=80' }] },
      { title: 'DLF Camellias', builder: 'DLF', location: 'Sector 42, Gurgaon', type: 'Apartment', config: '5 BHK', price: 450000000, area: '7400 sqft' },
      { title: 'DLF Cyber City', builder: 'DLF', location: 'DLF Phase 2, Gurgaon', type: 'Commercial', config: 'Office Space', price: 120000000, area: '15000 sqft' },
      
      // Signature Global (3)
      { title: 'Signature Global City 37D', builder: 'Signature Global', location: 'Sector 37D, Gurgaon', type: 'Apartment', config: '3 BHK', price: 12000000, area: '1450 sqft' },
      { title: 'Signature Global Park 4 & 5', builder: 'Signature Global', location: 'Sector 81, Gurgaon', type: 'Apartment', config: '2 BHK', price: 8500000, area: '1080 sqft' },
      { title: 'Signature Global Prime', builder: 'Signature Global', location: 'Sector 63A, Gurgaon', type: 'Apartment', config: '2 BHK', price: 7500000, area: '950 sqft', images: [{ name: 'Signature_Global_Prime_Aerial.jpg', size: 2100000, data: 'https://images.unsplash.com/photo-1590608897129-79da98d15969?auto=format&fit=crop&w=1920&q=80' }] },
      
      // M3M (4)
      { title: 'M3M Golfestate', builder: 'M3M', location: 'Sector 65, Gurgaon', type: 'Apartment', config: '4 BHK', price: 65000000, area: '3800 sqft' },
      { title: 'M3M Merlin', builder: 'M3M', location: 'Sector 67, Gurgaon', type: 'Apartment', config: '3 BHK', price: 28000000, area: '2400 sqft' },
      { title: 'M3M Woodshire', builder: 'M3M', location: 'Sector 107, Gurgaon', type: 'Apartment', config: '3 BHK', price: 18000000, area: '1900 sqft' },
      { title: 'M3M Marina', builder: 'M3M', location: 'Sector 68, Gurgaon', type: 'Apartment', config: '2 BHK', price: 14000000, area: '1300 sqft' },
      
      // Godrej Properties (2)
      { title: 'Godrej Aria', builder: 'Godrej Properties', location: 'Sector 79, Gurgaon', type: 'Apartment', config: '3 BHK', price: 22000000, area: '2200 sqft' },
      { title: 'Godrej Frontier', builder: 'Godrej Properties', location: 'Sector 80, Gurgaon', type: 'Apartment', config: '4 BHK', price: 32000000, area: '3100 sqft' }
    ];

    const initialProjects: any[] = projectData.map((p, idx) => ({
      id: `p${idx + 1}`,
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
      pdfs: [],
      images: (p as any).images || [],
      createdAt: new Date().toISOString(),
      assignedTo: 'Super Admin'
    }));

    db.projects.push(...initialProjects);
    db.lastProjectSerial = initialProjects.length;
    saveDb(db);
    console.log(`${initialProjects.length} projects seeded.`);
  };

  await seedUsers();
  await seedProjects();

  // --- Utilities ---
  const getISTTimestamp = () => {
    return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

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
    
    // Fill the rest to 12 characters
    for (let i = 0; i < 8; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 12) return "Password must be at least 12 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/\d/.test(password)) return "Password must contain at least one digit";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character";
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

  const createNotification = async (userId: string | null, title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const db = getDb();
    if (!db) return;
    
    const notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      type,
      read: false,
      timestamp: getISTTimestamp()
    };

    if (type === 'success' || type === 'warning' || title.includes('Approval')) {
      db.notifications.unshift(notification);
      // Keep only last 50 notifications
      if (db.notifications.length > 50) db.notifications.pop();
      saveDb(db, 'notifications');
    }
    
    broadcastEvent({ type: 'NEW_NOTIFICATION', notification });
  };

  const createLog = async (action: string, user: string, summary: string) => {
    const db = getDb();
    if (!db) return;

    const log = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      user,
      summary,
      timestamp: getISTTimestamp()
    };
    
    // Save to in-memory for frontend
    db.logs.push(log);
    
    // Save to SQLite with structured columns for Prisma Studio
    try {
      const stmt = sqlite_db.prepare(`INSERT OR REPLACE INTO logs (id, action, user, summary, timestamp, data) VALUES (?, ?, ?, ?, ?, ?)`);
      stmt.run(log.id, log.action, log.user, log.summary, log.timestamp, JSON.stringify(log));
    } catch (err) {
      console.error("Error writing structured log:", err);
    }
    
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

  projectController.setDependencies(createLog, createNotification, getAdminEmails, sendNewProjectNotification, sendStatusUpdateNotification, getUserEmail, broadcastEvent);
  resalePropertyController.setDependencies(createLog, createNotification, getAdminEmails, sendNewProjectNotification, sendStatusUpdateNotification, getUserEmail, broadcastEvent);
  reportController.setDependencies(createLog, broadcastEvent);

  // --- Authentication API ---

  // Signup
  app.post("/api/auth/signup", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role = 'employee' } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
      
      const passwordError = validatePassword(password);
      if (passwordError) return res.status(400).json({ error: passwordError });
      
      const validRoles = ['admin', 'employee', 'team_leader'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role: '${role}'. Allowed roles are: ${validRoles.join(', ')}` });
      }

      const db = getDb();
      const existingUser = db?.users.find((u: any) => u.email === email);
      if (existingUser) return res.status(400).json({ error: "An account with this email already exists" });

      const username = await generateUsername(name);

      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        username,
        role,
        permissions: ROLE_PERMISSIONS[role] || ['VIEW_PROJECTS', 'VIEW_RESALE'],
        passwordHash: await bcrypt.hash(password, 10),
        mustResetPassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      
      db.users.push(newUser);
      saveDb(db, 'users');
      
      await createLog('SIGNUP', name, `User signed up: ${email}`);

      res.status(201).json({ id: newUser.id, name, email, role });
    } catch (err: any) {
      next(err);
    }
  });

  // Login Attempts Tracking
  const loginAttempts = new Map<string, { count: number, lockedUntil: number }>();
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      const attemptInfo = loginAttempts.get(email);
      if (attemptInfo && attemptInfo.lockedUntil > Date.now()) {
        const minutesLeft = Math.ceil((attemptInfo.lockedUntil - Date.now()) / 60000);
        return res.status(429).json({ error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.` });
      }

      const db = getDb();
      const user = db?.users.find((u: any) => u.email === email || u.username === email);
      
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

      if (user.role === 'admin') {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        const activeAdmin = db.users.find((u: any) => 
          u.role === 'admin' && 
          u.id !== user.id && 
          u.lastActive && new Date(u.lastActive) >= oneMinuteAgo
        );
        
        if (activeAdmin) {
          return res.status(403).json({ error: "Another administrator is currently logged in. Only one active admin session is allowed globally." });
        }
      }

      user.lastActive = new Date().toISOString();

      // Always merge stored custom permissions with the latest role-based permissions
      // so new default permissions are picked up without a manual DB migration
      const roleDefaults = ROLE_PERMISSIONS[user.role] || [];
      const customPerms = (user.permissions || []).filter((p: string) => !roleDefaults.includes(p));
      user.permissions = [...roleDefaults, ...customPerms];

      saveDb(db, 'users');
      
      await createLog('LOGIN', user.name, `User logged in: ${user.email}`);

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      next(err);
    }
  });

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const db = getDb();
      const user = db?.users.find((u: any) => u.email === email);
      
      if (user) {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        passwordResetTokens.set(token, {
          email,
          expires: Date.now() + 3600000 // 1 hour
        });
        
        const resetLink = `${req.protocol}://${req.get('host')}?token=${token}`;
        await createLog('PASSWORD_RESET_REQUEST', user.name, `Password reset requested for: ${email}. Token: ${token}`);
        
        // Send actual email (or mock)
        await sendPasswordResetEmail(email, resetLink);
        
        console.log(`\n--- SIMULATED EMAIL ---`);
        console.log(`To: ${email}`);
        console.log(`Subject: Password Reset Request`);
        console.log(`Link: ${resetLink}`);
        console.log(`-----------------------\n`);
      }

      res.json({ message: "If an account exists with that email, a reset link has been sent." });
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
        return res.status(400).json({ error: "Invalid or expired reset token" });
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

      await createLog('PASSWORD_RESET_SUCCESS', user.name, `Password successfully reset for: ${user.email}`);
      res.json({ message: "Password has been reset successfully." });
    } catch (err: any) {
      next(err);
    }
  });

  // --- SSE Endpoint ---
  app.get("/api/stream", (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(': connected\n\n');
    clients.push(res);
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);
    req.on('close', () => {
      clearInterval(heartbeat);
      clients = clients.filter(client => client !== res);
    });
  });

  // --- Middleware ---
  const checkPermission = (permission: string) => async (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req.headers['x-user-role'] || req.query.role || req.body.role) as string;
    const userId = (req.headers['x-user-id'] || req.query.userId || req.body.userId) as string;
    
    if (!userRole) return res.status(401).json({ error: "Unauthorized: No user role provided" });

    const db = getDb();
    if (userId) {
      const u = db?.users.find((u: any) => u.id === userId);
      if (u) {
        const now = new Date();
        const lastUpdate = u.lastActive ? new Date(u.lastActive) : new Date(0);
        // Throttle database updates for lastActive to once every 5 minutes
        if (now.getTime() - lastUpdate.getTime() > 300000) {
          u.lastActive = now.toISOString();
          saveDb(db, 'users');
        } else {
          // Update in-memory only
          u.lastActive = now.toISOString();
        }
        if (u.permissions && u.permissions.includes(permission)) return next();
      }
    }

    const permissions = ROLE_PERMISSIONS[userRole] || [];
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: `Forbidden: Role '${userRole}' does not have '${permission}' permission.` });
    }
    next();
  };

  // --- Background Tasks ---
  const checkProjectStatusUpdates = async () => {
    try {
      const db = getDb();
      if (!db) return;
      const now = new Date();
      let updatedCount = 0;
      
      db.projects.forEach(async (project: any) => {
        if (project.possessionStatus === 'New Launch' && project.launchDate) {
          const launchDate = new Date(project.launchDate);
          const diffMonths = (now.getFullYear() - launchDate.getFullYear()) * 12 + (now.getMonth() - launchDate.getMonth());
          
          if (diffMonths >= 3) {
            project.possessionStatus = 'Under Construction';
            project.updatedAt = now.toISOString();
            updatedCount++;
            await createLog('AUTO_UPDATE', 'System', `Project "${project.title}" status automatically changed from New Launch to Under Construction.`);
            await createNotification(null, 'Project Status Updated', `Project "${project.title}" is now Under Construction.`, 'info');
          }
        }
      });

      if (updatedCount > 0) {
        saveDb(db, 'projects');
        broadcastEvent({ type: 'PROJECTS_UPDATED' });
      }
    } catch (error: any) {
      console.error("Error in background task checkProjectStatusUpdates:", error);
    }
  };

  setInterval(checkProjectStatusUpdates, 3600000);
  setTimeout(checkProjectStatusUpdates, 5000);

  // --- API Routes ---

  app.get("/api/stats", checkPermission('VIEW_STATS'), async (req: Request, res: Response) => {
    const db = getDb();
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 300000);
    const liveUsers = db.users.filter((u: any) => u.lastActive && new Date(u.lastActive) >= fiveMinutesAgo).length;

    res.json({
      total: db.projects.length,
      active: db.projects.filter((p: any) => p.status === 'Active').length,
      pending: db.approvals.filter((a: any) => a.status === 'Pending').length,
      folders: db.projects.length,
      liveUsers,
      totalProperties: db.projects.length + db.resaleProperties.length,
      totalLogs: db.logs.length,
      teamLeaders: db.users.filter((u: any) => u.role === 'team_leader').length
    });
  });

  app.get("/api/logs", checkPermission('VIEW_REPORTS'), async (req: Request, res: Response) => {
    const db = getDb();
    res.json((db?.logs || []).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100));
  });

  app.get("/api/projects", checkPermission('VIEW_PROJECTS'), projectController.getAll);
  app.post("/api/projects", checkPermission('ADD_PROJECTS'), projectController.create);
  app.put("/api/projects/:id", checkPermission('EDIT_PROJECTS'), projectController.update);
  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role, userName } = req.query as { role?: string, userName?: string };
    const db = getDb();
    const proj = db.projects.find((p: any) => p.id === id);
    if (!proj) return res.status(404).json({ error: "Project not found" });

    const permissions = ROLE_PERMISSIONS[role || ''] || [];
    if (permissions.includes('DELETE_PROJECTS')) {
      db.projects = db.projects.filter((p: any) => p.id !== id);
      db.approvals = db.approvals.filter((a: any) => a.projectId !== id);
      saveDb(db, ['projects', 'approvals']);
      await createLog('DELETE', userName || 'Admin', `Permanently deleted project: ${proj.title}`);
      broadcastEvent({ type: 'PROJECTS_UPDATED' });
      broadcastEvent({ type: 'APPROVALS_UPDATED' });
      res.json({ success: true, deleted: true });
    } else if (permissions.includes('REQUEST_DELETION')) {
      // Prevent duplicate pending requests
      const existingPending = db.approvals.find((a: any) => a.projectId === id && a.status === 'Pending');
      if (existingPending) {
        return res.json({ success: true, pending: true, message: "A deletion request is already pending for this project." });
      }

      proj.status = 'PENDING_DELETE';
      const approvalReq = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: id,
        projectTitle: proj.title,
        requestedBy: userName || 'Employee',
        requestedAt: new Date().toISOString(),
        status: 'Pending'
      };
      db.approvals.push(approvalReq);
      saveDb(db, ['projects', 'approvals']);
      await createLog('DELETE_REQ', userName || 'Employee', `Requested deletion for project: ${proj.title}`);
      
      // Send email notification to admins
      const adminEmails = getAdminEmails();
      if (adminEmails.length > 0) {
        await sendApprovalRequestNotification('Project Deletion', userName || 'Employee', adminEmails);
      }
      
      broadcastEvent({ type: 'PROJECTS_UPDATED' });
      broadcastEvent({ type: 'APPROVALS_UPDATED' });
      res.json({ success: true, pending: true });
    } else {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
  });

  app.get("/api/resale-properties", checkPermission('VIEW_RESALE'), resalePropertyController.getAll);
  app.post("/api/resale-properties", checkPermission('ADD_RESALE'), resalePropertyController.create);
  app.put("/api/resale-properties/:id", checkPermission('EDIT_RESALE'), resalePropertyController.update);
  app.delete("/api/resale-properties/:id", checkPermission('DELETE_RESALE'), resalePropertyController.delete);

  app.get("/api/reports", checkPermission('VIEW_REPORTS'), reportController.getAll);
  app.get("/api/reports/:id", checkPermission('VIEW_REPORTS'), reportController.getById);
  app.post("/api/reports", checkPermission('ADD_REPORTS'), async (req: Request, res: Response) => {
    try {
      const { title, content, assignedTo, status, userName } = req.body;
      const db = getDb();
      const newReport = {
        id: Math.random().toString(36).substr(2, 9),
        title: title || 'Untitled Report',
        content: content || '',
        assignedTo: assignedTo || 'Unassigned',
        status: status || 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.reports.push(newReport);
      saveDb(db, 'reports');
      
      await createLog('REPORT_CREATE', userName || 'System', `Created report: ${newReport.title}`);
      broadcastEvent({ type: 'REPORT_CREATED', report : newReport });
      res.status(201).json(newReport);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  app.put("/api/reports/:id", checkPermission('EDIT_REPORTS'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName, ...updateData } = req.body;
      const db = getDb();
      const index = db.reports.findIndex((r: any) => r.id === id);
      if (index === -1) return res.status(404).json({ error: "Report not found" });
      
      db.reports[index] = { ...db.reports[index], ...updateData, updatedAt: new Date().toISOString() };
      saveDb(db, 'reports');
      
      const updated = db.reports[index];
      await createLog('REPORT_UPDATE', userName || 'System', `Updated report: ${updated.title}`);
      broadcastEvent({ type: 'REPORT_UPDATED', report: updated });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  app.delete("/api/reports/:id", checkPermission('DELETE_REPORTS'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName } = req.query as { userName?: string };
      const db = getDb();
      const report = db.reports.find((r: any) => r.id === id);
      if (!report) return res.status(404).json({ error: "Report not found" });
      
      db.reports = db.reports.filter((r: any) => r.id !== id);
      saveDb(db, 'reports');
      
      await createLog('REPORT_DELETE', userName || 'System', `Deleted report: ${report.title}`);
      broadcastEvent({ type: 'REPORT_DELETED', reportId: id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/notifications", async (req: Request, res: Response) => {
    const userName = req.headers['x-user-name'] as string;
    if (!userName) return res.status(400).json({ error: "Missing x-user-name header" });
    const db = getDb();
    const notifications = db.notifications || [];
    const userNotifs = notifications.filter((n: any) => n.userId === null || n.userId === userName)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);
    res.json(userNotifs);
  });

  app.post("/api/notifications/:id/read", async (req: Request, res: Response) => {
    const { id } = req.params;
    const userName = req.headers['x-user-name'] as string;
    const db = getDb();
    const notifications = db.notifications || [];
    const notif = notifications.find((n: any) => n.id === id);
    if (notif && !notif.readBy.includes(userName)) {
      notif.readBy.push(userName);
      saveDb(db, 'notifications');
    }
    res.json({ success: true });
  });

  app.post("/api/notifications/read-all", async (req: Request, res: Response) => {
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

  app.get("/api/approvals", checkPermission('VIEW_PROJECTS'), async (req: Request, res: Response) => {
    const db = getDb();
    res.json(db.approvals.filter((a: any) => a.status === 'Pending').sort((a: any, b: any) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
  });

  app.post("/api/approvals/:id/action", checkPermission('APPROVE_DELETIONS'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, userName } = req.body;
    const db = getDb();
    const approval = db.approvals.find((a: any) => a.id === id);
    if (!approval) return res.status(404).json({ error: "Approval request not found" });

    if (action === 'approve') {
      db.projects = db.projects.filter((p: any) => p.id !== approval.projectId);
      await createLog('APPROVE', userName || 'Admin', `Approved deletion: ${approval.projectTitle}`);
      await createNotification(approval.requestedBy, 'Deletion Approved', `Your request to delete ${approval.projectTitle} was approved.`, 'success');
      
      const requesterEmail = getUserEmail(approval.requestedBy);
      if (requesterEmail) {
        await sendStatusUpdateNotification('Project', approval.projectTitle, 'Deleted', requesterEmail);
      }

      // Mark all other pending requests for the same project as Approved/Cleaned
      db.approvals.forEach((a: any) => {
        if (a.projectId === approval.projectId && a.status === 'Pending' && a.id !== id) {
          a.status = 'Approved';
        }
      });
    } else {
      const proj = db.projects.find((p: any) => p.id === approval.projectId);
      if (proj) proj.status = 'Active';
      await createLog('REJECT', userName || 'Admin', `Rejected deletion: ${approval.projectTitle}`);
      await createNotification(approval.requestedBy, 'Deletion Rejected', `Your request to delete ${approval.projectTitle} was rejected.`, 'warning');
      
      const requesterEmail = getUserEmail(approval.requestedBy);
      if (requesterEmail) {
        await sendStatusUpdateNotification('Project', approval.projectTitle, 'Active (Deletion Rejected)', requesterEmail);
      }

      // Mark all other pending requests for the same project as Rejected
      db.approvals.forEach((a: any) => {
        if (a.projectId === approval.projectId && a.status === 'Pending' && a.id !== id) {
          a.status = 'Rejected';
        }
      });
    }
    approval.status = action === 'approve' ? 'Approved' : 'Rejected';
    saveDb(db, ['approvals', 'projects']);
    broadcastEvent({ type: 'PROJECTS_UPDATED' });
    broadcastEvent({ type: 'APPROVALS_UPDATED' });
    res.json({ success: true });
  });

  app.get("/api/users", async (req: Request, res: Response) => {
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
    await createLog('PERMISSIONS_UPDATED', adminName || 'Admin', `Updated permissions for ${user.email}`);
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
    await createLog('TEAM_ASSIGNMENT', leaderName || 'Team Leader', `Assigned user ${user.email} to team leader`);
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
      await createLog('TEAM_ASSIGNMENT', leaderName || 'Team Leader', `Bulk assigned ${assignedCount} users to team leader`);
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      db.users.push(newUser);
      saveDb(db);
      broadcastEvent({ type: 'USER_CREATED', user: { ...newUser, passwordHash: undefined } });
      res.status(201).json({ ...newUser, password });
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
    await createLog('DELETE_USER', 'Admin', `Deleted user: ${userToDelete.name}`);
    res.json({ success: true });
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
    
    res.json({ success: true, key: db.config.publicApiKey });
  });

  // Public External API
  app.get("/api/external/data", publicCors, async (req: Request, res: Response) => {
    const apiKey = req.headers['x-api-key'] as string;
    const db = getDb();
    
    if (!db || !db.config || db.config.publicApiKey !== apiKey) {
      return res.status(401).json({ error: "Invalid or missing API Key" });
    }

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

  app.use(globalErrorHandler);

  // Vite middleware for development
  if (!isProduction) {
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

  const server = createServer(app);
  registerServerLifecycle(server);

  server.listen(serverConfig.port, serverConfig.host, () => {
    logger.info("server_started", {
      appName: serverConfig.appName,
      host: serverConfig.host,
      port: serverConfig.port,
      env: serverConfig.nodeEnv,
    });
  });
}

startServer();
