import { Project } from '../models/Project';

export interface IProjectRepository {
  findAll(): Promise<Project[]>;
  findById(id: string): Promise<Project | undefined>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
  update(id: string, project: Partial<Project>): Promise<Project | undefined>;
}
