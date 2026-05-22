import { Request, Response } from 'express';
import { ResalePropertyRepository } from '../repositories/ResalePropertyRepository';
import { ResaleProperty } from '../models/ResaleProperty';

export class ResalePropertyController {
  private resalePropertyRepository = new ResalePropertyRepository();

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
    res.json(await this.resalePropertyRepository.findAll());
  };

  create = async (req: Request, res: Response) => {
    try {
      const { 
        propertyHolderName, societyName, location, builderName, 
        propertyType, sizeSqft, bhk, bathrooms, price, isNegotiable, 
        floorNumber, propertyAge, floorPlan, images, brokeragePercentage, userName,
        constructionYear, contactNumber, reraNumber, coordinates
      } = req.body;
      
      // Duplicate check
      const properties = await this.resalePropertyRepository.findAll();
      const existing = properties.find(p => 
        p.societyName.toLowerCase() === societyName.toLowerCase() && 
        p.bhk === bhk &&
        p.floorNumber.toLowerCase() === floorNumber.toLowerCase() &&
        p.location.toLowerCase() === location.toLowerCase()
      );

      if (existing) {
        return res.status(400).json({ error: "A property in this society with the same BHK and floor number already exists." });
      }

      const parsedSizeSqft = Number(sizeSqft);
      const parsedPrice = Number(price);
      const parsedBrokeragePercentage = Number(brokeragePercentage);

      if (isNaN(parsedSizeSqft) || isNaN(parsedPrice) || isNaN(parsedBrokeragePercentage)) {
        return res.status(400).json({ error: "Invalid numeric values provided for size, price, or brokerage." });
      }

      const newProperty: ResaleProperty = {
        id: Math.random().toString(36).substr(2, 9),
        propertyHolderName,
        societyName,
        location,
        builderName,
        propertyType,
        sizeSqft: parsedSizeSqft,
        bhk,
        bathrooms,
        price: parsedPrice,
        isNegotiable,
        floorNumber,
        propertyAge,
        constructionYear: constructionYear ? Number(constructionYear) : undefined,
        contactNumber,
        reraNumber,
        coordinates,
        floorPlan: floorPlan || [],
        images: images || [],
        brokeragePercentage: parsedBrokeragePercentage,
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      
      await this.resalePropertyRepository.save(newProperty);
      if (this.createLog) await this.createLog('CREATE', userName || 'Admin', `Created resale property: ${societyName} by ${propertyHolderName}`);
      if (this.createNotification) await this.createNotification(null, 'New Resale Property Listed', `${societyName} in ${location} was just listed.`, 'info');
      
      if (this.sendNewProjectNotification && this.getAdminEmails) {
        const adminEmails = this.getAdminEmails();
        if (adminEmails && adminEmails.length > 0) {
          await this.sendNewProjectNotification(`Resale: ${societyName}`, adminEmails);
        }
      }
      
      res.status(201).json(newProperty);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName, ...updateData } = req.body;
      const oldProperty = await this.resalePropertyRepository.findById(id);
      
      const updated = await this.resalePropertyRepository.update(id, updateData);
      if (!updated) return res.status(404).json({ error: "Resale property not found" });
      if (this.createLog) await this.createLog('UPDATE', userName || 'Admin', `Updated resale property: ${oldProperty?.societyName}`);
      
      if (oldProperty?.status !== updated.status && this.sendStatusUpdateNotification && this.getUserEmail) {
        if (this.getAdminEmails) {
          const adminEmails = this.getAdminEmails();
          for (const email of adminEmails) {
             await this.sendStatusUpdateNotification('Resale Property', updated.societyName, updated.status, email);
          }
        }
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName } = req.query;
      const oldProperty = await this.resalePropertyRepository.findById(id);
      if (!oldProperty) return res.status(404).json({ error: "Resale property not found" });

      await this.resalePropertyRepository.delete(id);
      if (this.createLog) await this.createLog('DELETE', (userName as string) || 'Admin', `Deleted resale property: ${oldProperty.societyName}`);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
