import { Request, Response } from 'express';
import { ResalePropertyRepository } from '../repositories/ResalePropertyRepository';
import { ResaleProperty } from '../models/ResaleProperty';
import { uploadFileToCdn } from '../services/minioService';

async function processResaleFiles(property: any) {
  if (property.images && Array.isArray(property.images)) {
    property.images = await Promise.all(
      property.images.map(async (img: any, idx: number) => {
        if (img && img.data && img.data.startsWith('data:')) {
          const uploadedUrl = await uploadFileToCdn(img.data, img.name || `image_${idx}`);
          return { ...img, data: uploadedUrl };
        }
        return img;
      })
    );
  }
  if (property.floorPlan && Array.isArray(property.floorPlan)) {
    property.floorPlan = await Promise.all(
      property.floorPlan.map(async (pdf: any, idx: number) => {
        if (pdf && pdf.data && pdf.data.startsWith('data:')) {
          const uploadedUrl = await uploadFileToCdn(pdf.data, pdf.name || `floorplan_${idx}`);
          return { ...pdf, data: uploadedUrl };
        }
        return pdf;
      })
    );
  }
  if (property.bhkDetails && typeof property.bhkDetails === 'object') {
    const updatedBhkDetails: Record<string, any> = {};
    for (const bhk of Object.keys(property.bhkDetails)) {
      const bhkVal = property.bhkDetails[bhk];
      if (bhkVal && Array.isArray(bhkVal.floorPlan)) {
        const updatedFloorPlans = await Promise.all(
          bhkVal.floorPlan.map(async (img: any, idx: number) => {
            if (img && img.data && img.data.startsWith('data:')) {
              const uploadedUrl = await uploadFileToCdn(img.data, img.name || `bhk_${bhk}_floorplan_${idx}`);
              return { ...img, data: uploadedUrl };
            }
            return img;
          })
        );
        updatedBhkDetails[bhk] = {
          ...bhkVal,
          floorPlan: updatedFloorPlans
        };
      } else {
        updatedBhkDetails[bhk] = bhkVal;
      }
    }
    property.bhkDetails = updatedBhkDetails;
  }
}

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

  /**
   * @swagger
   * /api/resale-properties:
   *   get:
   *     summary: Get all resale properties
   *     tags: [Resale Properties]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: A list of resale properties
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ResaleProperty'
   */
  getAll = async (req: Request, res: Response) => {
    const caller = (req.headers['x-user-name'] || req.query.userName || req.body.userName || 'Admin') as string;
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;

    if (this.createLog) await this.createLog('READ_RESALE', caller, 'Viewed resale properties list', userId);
    
    let properties = await this.resalePropertyRepository.findAll();
    
    res.json(properties);
  };

  /**
   * @swagger
   * /api/resale-properties:
   *   post:
   *     summary: List a new resale property
   *     tags: [Resale Properties]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ResaleProperty'
   *     responses:
   *       201:
   *         description: Resale property created successfully
   *       400:
   *         description: Property already exists or invalid input
   */
  create = async (req: Request, res: Response) => {
    try {
      const { 
        propertyHolderName, societyName, location, builderName, 
        propertyType, sizeSqft, bhk, bathrooms, price, isNegotiable, 
        floorNumber, propertyAge, floorPlan, images, brokeragePercentage, userName,
        constructionYear, contactNumber, reraNumber, coordinates
      } = req.body;
      
      const posterName = (userName || req.headers['x-user-name'] || 'Admin') as string;
      const userId = req.headers['x-user-id'] as string;
      
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

      const newProperty: any = {
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
        createdAt: new Date().toISOString(),
        createdByUserId: userId
      };
      
      await processResaleFiles(newProperty);
      await this.resalePropertyRepository.save(newProperty);
      if (this.createLog) await this.createLog('CREATE', posterName, `Created resale property: ${societyName} by ${propertyHolderName}`, userId);
      if (this.createNotification) await this.createNotification(null, 'New Resale Property Listed', `${societyName} in ${location} was just listed.`, 'info', userId);
      
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

  /**
   * @swagger
   * /api/resale-properties/{id}:
   *   put:
   *     summary: Update an existing resale property
   *     tags: [Resale Properties]
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
   *             $ref: '#/components/schemas/ResaleProperty'
   *     responses:
   *       200:
   *         description: Resale property updated successfully
   *       404:
   *         description: Resale property not found
   */
  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName, ...updateData } = req.body;
      const oldProperty = await this.resalePropertyRepository.findById(id);
      
      const editorName = (userName || req.headers['x-user-name'] || 'Admin') as string;
      const userId = req.headers['x-user-id'] as string;
      
      await processResaleFiles(updateData);
      const updated = await this.resalePropertyRepository.update(id, updateData);
      if (!updated) return res.status(404).json({ error: "Resale property not found" });
      if (this.createLog) await this.createLog('UPDATE', editorName, `Updated resale property: ${oldProperty?.societyName}`, userId);
      
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

  /**
   * @swagger
   * /api/resale-properties/{id}:
   *   delete:
   *     summary: Delete a resale property
   *     tags: [Resale Properties]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Resale property deleted successfully
   *       404:
   *         description: Resale property not found
   */
  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName } = req.query as { userName?: string };
      const oldProperty = await this.resalePropertyRepository.findById(id);
      if (!oldProperty) return res.status(404).json({ error: "Resale property not found" });

      const deletorName = (userName || req.headers['x-user-name'] || 'Admin') as string;
      const userId = req.headers['x-user-id'] as string;

      await this.resalePropertyRepository.delete(id);
      if (this.createLog) await this.createLog('DELETE', deletorName, `Deleted resale property: ${oldProperty.societyName}`, userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
