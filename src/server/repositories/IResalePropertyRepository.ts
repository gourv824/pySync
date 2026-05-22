import { ResaleProperty } from '../models/ResaleProperty';

export interface IResalePropertyRepository {
  findAll(): Promise<ResaleProperty[]>;
  findById(id: string): Promise<ResaleProperty | undefined>;
  save(property: ResaleProperty): Promise<void>;
  delete(id: string): Promise<void>;
  update(id: string, property: Partial<ResaleProperty>): Promise<ResaleProperty | undefined>;
}
