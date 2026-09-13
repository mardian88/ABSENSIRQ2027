const fs = require('fs');

const codeToAppend = `
export const funds = sqliteTable('funds', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('manual'), // 'system' (for Infaq & Kas) or 'manual'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const expenseCategories = sqliteTable('expense_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const incomes = sqliteTable('incomes', {
  id: text('id').primaryKey(),
  fundId: text('fund_id').notNull().references(() => funds.id),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  fundId: text('fund_id').notNull().references(() => funds.id),
  categoryId: text('category_id').notNull().references(() => expenseCategories.id),
  title: text('title').notNull(),
  description: text('description'),
  amount: integer('amount').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
`;

fs.appendFileSync('src/db/schema.ts', codeToAppend);
console.log('Appended to schema.ts');

let taskContent = fs.readFileSync('C:\\Users\\hp\\.gemini\\antigravity\\brain\\fc4be36e-2d4d-4484-a0e1-ad35fb661551\\task.md', 'utf8');
taskContent = taskContent.replace('- [ ] Verifikasi tabel keuangan', '- [x] Verifikasi tabel keuangan');
taskContent = taskContent.replace('- [ ] Modifikasi tabel `adminUsers`', '- [x] Modifikasi tabel `adminUsers`');
fs.writeFileSync('C:\\Users\\hp\\.gemini\\antigravity\\brain\\fc4be36e-2d4d-4484-a0e1-ad35fb661551\\task.md', taskContent);
console.log('Task updated');
