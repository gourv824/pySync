const { getDb, saveDb } = require('./dist/lib/db.js');
console.log(getDb().logs.length);
