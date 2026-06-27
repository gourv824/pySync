import { Request, Response } from 'express';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { Project } from '../models/Project';
import { uploadFileToCdn } from '../services/minioService';
import { getDb, saveDb } from '../../lib/db';

async function processProjectFiles(project: any) {
  if (project.images && Array.isArray(project.images)) {
    project.images = await Promise.all(
      project.images.map(async (img: any, idx: number) => {
        if (img && img.data && img.data.startsWith('data:')) {
          const uploadedUrl = await uploadFileToCdn(img.data, img.name || `image_${idx}`);
          return { ...img, data: uploadedUrl };
        }
        return img;
      })
    );
  }
  if (project.pdfs && Array.isArray(project.pdfs)) {
    project.pdfs = await Promise.all(
      project.pdfs.map(async (pdf: any, idx: number) => {
        if (pdf && pdf.data && pdf.data.startsWith('data:')) {
          const uploadedUrl = await uploadFileToCdn(pdf.data, pdf.name || `pdf_${idx}`);
          return { ...pdf, data: uploadedUrl };
        }
        return pdf;
      })
    );
  }
}

export class ProjectController {
  private projectRepository = new ProjectRepository();

  private createLog: any;
  private createNotification: any;
  private getAdminEmails: any;
  private sendNewProjectNotification: any;
  private sendStatusUpdateNotification: any;
  private getUserEmail: any;

  setDependencies(createLog: any, createNotification: any, getAdminEmails?: any, sendNewProjectNotification?: any, sendStatusUpdateNotification?: any, getUserEmail?: any) {
    this.createLog = createLog;
    this.createNotification = createNotification;
    this.getAdminEmails = getAdminEmails;
    this.sendNewProjectNotification = sendNewProjectNotification;
    this.sendStatusUpdateNotification = sendStatusUpdateNotification;
    this.getUserEmail = getUserEmail;
  }

  /**
   * @swagger
   * /api/projects:
   *   get:
   *     summary: Get all projects
   *     tags: [Projects]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: A list of projects
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Project'
   */
  getAll = async (req: Request, res: Response) => {
    const caller = (req.headers['x-user-name'] || req.query.userName || req.body.userName || 'Admin') as string;
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;

    if (this.createLog) await this.createLog('READ_PROJECTS', caller, 'Viewed projects list', userId);
    
    let projects = await this.projectRepository.findAll();
    
    res.json(projects);
  };

  /**
   * @swagger
   * /api/projects:
   *   post:
   *     summary: Create a new project
   *     tags: [Projects]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Project'
   *     responses:
   *       201:
   *         description: Project created successfully
   *       400:
   *         description: Project already exists or invalid input
   */
  create = async (req: Request, res: Response) => {
    try {
      const { 
        title, builderName, projectType, subType, type, 
        configuration, possessionStatus, price, location, 
        area, bathrooms, pdfs, images, userName, assignedTo, reraNumber,
        launchDate, possessionDate, projectSize, towersAndFloors, noOfTowers, noOfFloors, totalUnits, sizeRange,
        coordinates, paymentPlans, sector, microMarket
      } = req.body;
      
      const posterName = (userName || req.headers['x-user-name'] || 'Admin') as string;
      const userId = req.headers['x-user-id'] as string;
      
      // Duplicate check
      const projects = await this.projectRepository.findAll();
      const existing = projects.find(p => 
        p.title.toLowerCase() === title.toLowerCase() && 
        p.builderName.toLowerCase() === builderName.toLowerCase() &&
        p.location.toLowerCase() === location.toLowerCase()
      );

      if (existing) {
        return res.status(400).json({ error: "A project with this title, builder, and location already exists." });
      }

      const newProject: any = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        builderName,
        projectType,
        subType,
        type,
        configuration,
        possessionStatus,
        launchDate: launchDate || (possessionStatus === 'New Launch' ? new Date().toISOString() : undefined),
        possessionDate,
        projectSize,
        towersAndFloors,
        noOfTowers,
        noOfFloors,
        totalUnits,
        sizeRange,
        price,
        location,
        sector,
        microMarket,
        area,
        bathrooms,
        reraNumber,
        coordinates,
        status: 'Pending Approval',
        createdAt: new Date().toISOString(),
        pdfs: pdfs || [],
        images: images || [],
        paymentPlans: paymentPlans || null,
        assignedTo,
        createdByUserId: userId
      };
      
      await processProjectFiles(newProject);
      await this.projectRepository.save(newProject);

      const db = getDb();
      if (db) {
        if (!db.approvals) db.approvals = [];
        const approvalReq = {
          id: Math.random().toString(36).substr(2, 9),
          projectId: newProject.id,
          projectTitle: newProject.title,
          requestedBy: posterName,
          requestedAt: new Date().toISOString(),
          status: 'Pending',
          type: 'New Project Approval',
          createdByUserId: userId
        };
        db.approvals.push(approvalReq);
        saveDb(db);
      }

      if (this.createLog) await this.createLog('CREATE', posterName, `Created project: ${title} (Pending Approval)`, userId);
      if (this.createNotification) await this.createNotification(null, 'New Project (Pending Approval)', `${title} by ${builderName} was listed and is pending approval.`, 'info', userId);
      
      if (this.sendNewProjectNotification && this.getAdminEmails) {
        const adminEmails = this.getAdminEmails();
        if (adminEmails && adminEmails.length > 0) {
          await this.sendNewProjectNotification(title, adminEmails);
        }
      }
      
      res.status(201).json(newProject);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * @swagger
   * /api/projects/{id}:
   *   put:
   *     summary: Update an existing project
   *     tags: [Projects]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Project'
   *     responses:
   *       200:
   *         description: Project updated successfully
   *       404:
   *         description: Project not found
   */
  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName, ...updateData } = req.body;
      const oldProject = await this.projectRepository.findById(id);
      
      const editorName = (userName || req.headers['x-user-name'] || 'Admin') as string;
      const userId = req.headers['x-user-id'] as string;
      
      // If status changes to New Launch, set launchDate
      if (updateData.possessionStatus === 'New Launch' && oldProject?.possessionStatus !== 'New Launch') {
        updateData.launchDate = new Date().toISOString();
      }

      await processProjectFiles(updateData);
      const updated = await this.projectRepository.update(id, updateData);
      if (!updated) return res.status(404).json({ error: "Project not found" });
      if (this.createLog) await this.createLog('UPDATE', editorName, `Updated project: ${oldProject?.title} -> ${updated.title}`, userId);
      
      if (oldProject?.status !== updated.status && this.sendStatusUpdateNotification && this.getUserEmail) {
        // Find who created it or just notify admins. For simplicity, notify admins.
        if (this.getAdminEmails) {
          const adminEmails = this.getAdminEmails();
          for (const email of adminEmails) {
             await this.sendStatusUpdateNotification('Project', updated.title, updated.status, email);
          }
        }
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
