import { Report } from '../models/Report';
import { IReportRepository } from './IReportRepository';
import { getDb, saveDb } from '../../lib/db';

export class ReportRepository implements IReportRepository {
  async findAll(): Promise<Report[]> {
    const db = getDb();
    return db?.reports || [];
  }

  async findById(id: string): Promise<Report | undefined> {
    const db = getDb();
    return db?.reports.find((r: Report) => r.id === id);
  }

  async save(report: Report): Promise<Report> {
    const db = getDb();
    if (!db.reports) db.reports = [];
    db.reports.push(report);
    saveDb(db);
    return report;
  }

  async update(id: string, reportData: Partial<Report>): Promise<Report | undefined> {
    const db = getDb();
    const index = db.reports.findIndex((r: Report) => r.id === id);
    if (index === -1) return undefined;
    
    db.reports[index] = { ...db.reports[index], ...reportData, updatedAt: new Date().toISOString() };
    saveDb(db);
    return db.reports[index];
  }

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const initialLength = db.reports.length;
    db.reports = db.reports.filter((r: Report) => r.id !== id);
    if (db.reports.length === initialLength) return false;
    saveDb(db);
    return true;
  }
}
