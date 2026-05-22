import { Project } from '../models/Project';
import { IProjectRepository } from './IProjectRepository';
import { getDb, saveDb } from '../../lib/db';

export class ProjectRepository implements IProjectRepository {
  async findAll(): Promise<Project[]> {
    const db = getDb();
    return (db?.projects || []).sort((a: Project, b: Project) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findById(id: string): Promise<Project | undefined> {
    const db = getDb();
    return db?.projects.find((p: Project) => p.id === id);
  }

  async save(project: Project): Promise<void> {
    const db = getDb();
    if (!db) return;

    const now = new Date().toISOString();
    const newProject = {
      ...project,
      createdAt: project.createdAt || now,
      updatedAt: now,
      pdfs: project.pdfs || [],
      images: project.images || []
    };

    db.projects.push(newProject);
    saveDb(db);
  }

  async update(id: string, project: Partial<Project>): Promise<Project | undefined> {
    const db = getDb();
    if (!db) return undefined;

    const index = db.projects.findIndex((p: Project) => p.id === id);
    if (index === -1) return undefined;

    const updated = {
      ...db.projects[index],
      ...project,
      updatedAt: new Date().toISOString()
    };

    db.projects[index] = updated;
    saveDb(db);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    if (!db) return;

    db.projects = db.projects.filter((p: Project) => p.id !== id);
    saveDb(db);
  }
}
