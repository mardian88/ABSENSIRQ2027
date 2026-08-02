const Database = require('better-sqlite3');
const db = new Database('sqlite.db');
db.exec(`
  ALTER TABLE pelanggaran RENAME TO poin_santri;
  ALTER TABLE poin_santri ADD COLUMN jenis_catatan text NOT NULL DEFAULT 'punishment';
`);
console.log('Migration successful');
