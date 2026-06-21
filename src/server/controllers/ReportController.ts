import { Request, Response } from 'express';
import { ReportRepository } from '../repositories/ReportRepository';
import { Report } from '../models/Report';

export class ReportController {
  private reportRepository = new ReportRepository();
  private createLog: any;

  setDependencies(createLog: any) {
    this.createLog = createLog;
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const caller = (req.headers['x-user-name'] || req.query.userName || req.body.userName || 'Admin') as string;
      const userId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;

      if (this.createLog) await this.createLog('READ_REPORTS', caller, 'Viewed reports list', userId);
      
      let reports = await this.reportRepository.findAll();
      if (userRole !== 'admin') {
        reports = reports.filter(r => (r as any).createdByUserId === userId);
      }
      
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const caller = (req.headers['x-user-name'] || req.query.userName || req.body.userName || 'Admin') as string;
      const userId = req.headers['x-user-id'] as string;
      const report = await this.reportRepository.findById(req.params.id);
      if (!report) return res.status(404).json({ error: "Report not found" });
      if (this.createLog) await this.createLog('READ_REPORT', caller, `Viewed report details: ${report.title}`, userId);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { title, content, assignedTo, status, userName } = req.body;
      const userId = req.headers['x-user-id'] as string;

      const newReport: any = {
        id: Math.random().toString(36).substr(2, 9),
        title: title || 'Untitled Report',
        content: content || '',
        assignedTo: assignedTo || 'Unassigned',
        status: status || 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUserId: userId
      };
      
      await this.reportRepository.save(newReport);
      if (this.createLog) await this.createLog('REPORT_CREATE', userName || 'System', `Created report: ${newReport.title}`, userId);
      res.status(201).json(newReport);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName, ...updateData } = req.body;
      const userId = req.headers['x-user-id'] as string;
      const updated = await this.reportRepository.update(id, updateData);
      if (!updated) return res.status(404).json({ error: "Report not found" });
      
      if (this.createLog) await this.createLog('REPORT_UPDATE', userName || 'System', `Updated report: ${updated.title}`, userId);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName } = req.query as { userName?: string };
      const userId = req.headers['x-user-id'] as string;
      const report = await this.reportRepository.findById(id);
      if (!report) return res.status(404).json({ error: "Report not found" });
      
      await this.reportRepository.delete(id);
      if (this.createLog) await this.createLog('REPORT_DELETE', userName || 'System', `Deleted report: ${report.title}`, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
