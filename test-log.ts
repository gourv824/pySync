import { getDb, saveDb } from './src/lib/db.ts';

const db = getDb();
db.logs.push({ id: '123', action: 'TEST', user: 'admin', summary: 'test log', timestamp: new Date().toISOString(), createdByUserId: 'admin' });
saveDb(db);

const db2 = getDb();
console.log(db2.logs.length);
