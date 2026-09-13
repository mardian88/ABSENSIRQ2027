const fs = require('fs');
const code = `
export const pengumumanPortal = sqliteTable('pengumuman_portal', {
  id: text('id').primaryKey(),
  judul: text('judul').notNull(),
  isi: text('isi').notNull(),
  tanggal: integer('tanggal', { mode: 'timestamp' }).notNull(),
  isAktif: integer('is_aktif', { mode: 'boolean' }).notNull().default(true),
  idAdmin: text('id_admin').references(() => user.id)
});
`;
fs.appendFileSync('src/db/schema.ts', code);
console.log("Appended to schema.ts");
