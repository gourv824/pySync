import { User } from '../models/User';
import { IUserRepository } from './IUserRepository';
import { getDb, saveDb } from '../../lib/db';

export class UserRepository implements IUserRepository {
  async findAll(): Promise<User[]> {
    const db = getDb();
    return db?.users || [];
  }

  async findById(id: string): Promise<User | undefined> {
    const db = getDb();
    return db?.users.find((u: User) => u.id === id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const db = getDb();
    return db?.users.find((u: User) => u.email === email);
  }

  async save(user: User): Promise<void> {
    const db = getDb();
    if (!db) return;

    const index = db.users.findIndex((u: User) => u.id === user.id);
    const now = new Date().toISOString();
    
    const userData = {
      ...user,
      updatedAt: now,
      createdAt: user.createdAt || now,
      lastActive: user.lastActive || now
    };

    if (index !== -1) {
      db.users[index] = userData;
    } else {
      db.users.push(userData);
    }
    
    saveDb(db);
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    if (!db) return;

    db.users = db.users.filter((u: User) => u.id !== id);
    saveDb(db);
  }
}
