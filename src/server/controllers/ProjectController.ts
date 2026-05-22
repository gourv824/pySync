import { Request, Response } from 'express';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { Project } from '../models/Project';

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

  getAll = async (req: Request, res: Response) => {
    res.json(await this.projectRepository.findAll());
  };

  create = async (req: Request, res: Response) => {
    try {
      const { 
        title, builderName, projectType, subType, type, 
        configuration, possessionStatus, price, location, 
        area, bathrooms, pdfs, images, userName, assignedTo, reraNumber,
        coordinates
      } = req.body;
      
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

      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        builderName,
        projectType,
        subType,
        type,
        configuration,
        possessionStatus,
        launchDate: possessionStatus === 'New Launch' ? new Date().toISOString() : undefined,
        price,
        location,
        area,
        bathrooms,
        reraNumber,
        coordinates,
        status: 'Active',
        createdAt: new Date().toISOString(),
        pdfs: pdfs || [],
        images: images || [],
        assignedTo
      };
      
      await this.projectRepository.save(newProject);
      if (this.createLog) await this.createLog('CREATE', userName || 'Admin', `Created project: ${title}`);
      if (this.createNotification) await this.createNotification(null, 'New Project Listed', `${title} by ${builderName} was just listed.`, 'info');
      
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

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName, ...updateData } = req.body;
      const oldProject = await this.projectRepository.findById(id);
      
      // If status changes to New Launch, set launchDate
      if (updateData.possessionStatus === 'New Launch' && oldProject?.possessionStatus !== 'New Launch') {
        updateData.launchDate = new Date().toISOString();
      }

      const updated = await this.projectRepository.update(id, updateData);
      if (!updated) return res.status(404).json({ error: "Project not found" });
      if (this.createLog) await this.createLog('UPDATE', userName || 'Admin', `Updated project: ${oldProject?.title} -> ${updated.title}`);
      
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
