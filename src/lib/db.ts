import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const DB_PATH = path.join(process.cwd(), 'database.db');
const JSON_PATH = path.join(process.cwd(), 'database.json');

// Initialize SQLite database
const sqlite_db = new Database(DB_PATH);

// Create tables for each collection
const collections = ['projects', 'resaleProperties', 'reports', 'users', 'logs', 'approvals', 'notifications'];

collections.forEach(col => {
  sqlite_db.exec(`CREATE TABLE IF NOT EXISTS ${col} (id TEXT PRIMARY KEY, data TEXT)`);
});

sqlite_db.exec(`CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT)`);

// Check if we need to migrate from JSON
try {
  const row = sqlite_db.prepare(`SELECT count(*) as count FROM projects`).get() as { count: number };
  if (fs.existsSync(JSON_PATH) && row && row.count === 0) {
    console.log("Migrating database.json to SQLite database.db...");
    try {
      const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
      
      collections.forEach(col => {
        const stmt = sqlite_db.prepare(`INSERT OR REPLACE INTO ${col} (id, data) VALUES (?, ?)`);
        if (data[col] && Array.isArray(data[col])) {
          sqlite_db.transaction(() => {
            for (const item of data[col]) {
              stmt.run(item.id || item._id || Math.random().toString(), JSON.stringify(item));
            }
          })();
        }
      });

      ['lastUserSerial', 'lastProjectSerial', 'lastResalePropertySerial'].forEach(key => {
         const stmt = sqlite_db.prepare(`INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)`);
         stmt.run(key, JSON.stringify(data[key] || 0));
      });
      
      // Keep JSON file intact as a backup, just to be safe
      console.log("Migration complete!");
    } catch (e) {
      console.error("Migration error:", e);
    }
  }
} catch (e) {
  console.error("Error checking SQLite DB state:", e);
}

// In-memory cache for fast read/writes to avoid blocking the thread too much
let inMemoryDb: any = null;

export const getDb = () => {
    if (inMemoryDb) return inMemoryDb;
    
    try {
      const data: any = {};
      collections.forEach(col => {
        const rows = sqlite_db.prepare(`SELECT data FROM ${col}`).all() as { data: string }[];
        data[col] = rows.map(r => JSON.parse(r.data));
      });

      ['lastUserSerial', 'lastProjectSerial', 'lastResalePropertySerial'].forEach(key => {
         const row = sqlite_db.prepare(`SELECT value FROM metadata WHERE key = ?`).get(key) as { value: string } | undefined;
         data[key] = row ? JSON.parse(row.value) : 0;
      });

      inMemoryDb = data;
      return data;
    } catch (error) {
      console.error("Error reading database.db:", error);
      return null;
    }
};

export const saveDb = (data: any) => {
    try {
      collections.forEach(col => {
        const stmt = sqlite_db.prepare(`INSERT OR REPLACE INTO ${col} (id, data) VALUES (?, ?)`);
        if (data[col] && Array.isArray(data[col])) {
           sqlite_db.transaction(() => {
             // naive clear and replace for syncing memory state to disk easily
             sqlite_db.exec(`DELETE FROM ${col}`); 
             for (const item of data[col]) {
               stmt.run(item.id || Math.random().toString(), JSON.stringify(item));
             }
           })();
        }
      });
      ['lastUserSerial', 'lastProjectSerial', 'lastResalePropertySerial'].forEach(key => {
         const stmt = sqlite_db.prepare(`INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)`);
         stmt.run(key, JSON.stringify(data[key] || 0));
      });
      inMemoryDb = data;
      return true;
    } catch (error) {
      console.error("Error writing to database.db:", error);
      return false;
    }
};
