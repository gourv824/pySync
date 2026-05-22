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
      const reports = await this.reportRepository.findAll();
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const report = await this.reportRepository.findById(req.params.id);
      if (!report) return res.status(404).json({ error: "Report not found" });
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { title, content, assignedTo, status, userName } = req.body;
      const newReport: Report = {
        id: Math.random().toString(36).substr(2, 9),
        title: title || 'Untitled Report',
        content: content || '',
        assignedTo: assignedTo || 'Unassigned',
        status: status || 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await this.reportRepository.save(newReport);
      if (this.createLog) await this.createLog('REPORT_CREATE', userName || 'System', `Created report: ${newReport.title}`);
      res.status(201).json(newReport);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName, ...updateData } = req.body;
      const updated = await this.reportRepository.update(id, updateData);
      if (!updated) return res.status(404).json({ error: "Report not found" });
      
      if (this.createLog) await this.createLog('REPORT_UPDATE', userName || 'System', `Updated report: ${updated.title}`);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userName } = req.query as { userName?: string };
      const report = await this.reportRepository.findById(id);
      if (!report) return res.status(404).json({ error: "Report not found" });
      
      await this.reportRepository.delete(id);
      if (this.createLog) await this.createLog('REPORT_DELETE', userName || 'System', `Deleted report: ${report.title}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
