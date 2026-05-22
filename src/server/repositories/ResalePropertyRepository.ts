import { ResaleProperty } from '../models/ResaleProperty';
import { IResalePropertyRepository } from './IResalePropertyRepository';
import { getDb, saveDb } from '../../lib/db';

export class ResalePropertyRepository implements IResalePropertyRepository {
  async findAll(): Promise<ResaleProperty[]> {
    const db = getDb();
    return (db?.resaleProperties || []).sort((a: ResaleProperty, b: ResaleProperty) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findById(id: string): Promise<ResaleProperty | undefined> {
    const db = getDb();
    return db?.resaleProperties.find((p: ResaleProperty) => p.id === id);
  }

  async save(property: ResaleProperty): Promise<void> {
    const db = getDb();
    if (!db) return;

    const now = new Date().toISOString();
    const newProperty = {
      ...property,
      createdAt: property.createdAt || now,
      updatedAt: now,
      floorPlan: property.floorPlan || [],
      images: property.images || []
    };

    db.resaleProperties.push(newProperty);
    saveDb(db);
  }

  async update(id: string, property: Partial<ResaleProperty>): Promise<ResaleProperty | undefined> {
    const db = getDb();
    if (!db) return undefined;

    const index = db.resaleProperties.findIndex((p: ResaleProperty) => p.id === id);
    if (index === -1) return undefined;

    const updated = {
      ...db.resaleProperties[index],
      ...property,
      updatedAt: new Date().toISOString()
    };

    db.resaleProperties[index] = updated;
    saveDb(db);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    if (!db) return;

    db.resaleProperties = db.resaleProperties.filter((p: ResaleProperty) => p.id !== id);
    saveDb(db);
  }
}
