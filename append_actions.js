const fs = require('fs');
let text = fs.readFileSync('src/app/pengaturan/actions.ts', 'utf-8');
text += `
import { idCardTemplates } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function getIdCardTemplates() {
  return await db.select().from(idCardTemplates).orderBy(desc(idCardTemplates.createdAt));
}

export async function saveIdCardTemplate(data: { id?: string, tipe: string, nama: string, backgroundUrl: string, isActive: boolean }) {
  if (data.isActive) {
    await db.update(idCardTemplates).set({ isActive: false }).where(eq(idCardTemplates.tipe, data.tipe));
  }
  
  if (data.id) {
    await db.update(idCardTemplates).set({
      nama: data.nama,
      backgroundUrl: data.backgroundUrl,
      isActive: data.isActive
    }).where(eq(idCardTemplates.id, data.id));
  } else {
    await db.insert(idCardTemplates).values({
      id: uuidv4(),
      tipe: data.tipe,
      nama: data.nama,
      backgroundUrl: data.backgroundUrl,
      isActive: data.isActive,
      createdAt: new Date()
    });
  }
}

export async function deleteIdCardTemplate(id: string) {
  await db.delete(idCardTemplates).where(eq(idCardTemplates.id, id));
}

export async function setActiveIdCardTemplate(id: string, tipe: string) {
  await db.update(idCardTemplates).set({ isActive: false }).where(eq(idCardTemplates.tipe, tipe));
  await db.update(idCardTemplates).set({ isActive: true }).where(eq(idCardTemplates.id, id));
}
`;
fs.writeFileSync('src/app/pengaturan/actions.ts', text, 'utf-8');
console.log('Done');
