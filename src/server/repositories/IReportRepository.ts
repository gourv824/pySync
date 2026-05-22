import { Report } from '../models/Report';

export interface IReportRepository {
  findAll(): Promise<Report[]>;
  findById(id: string): Promise<Report | undefined>;
  save(report: Report): Promise<Report>;
  update(id: string, report: Partial<Report>): Promise<Report | undefined>;
  delete(id: string): Promise<boolean>;
}
