const fs = require('fs');
const code = `
import { pengumumanPortal } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function getPengumumanPortal() {
  return await db.select().from(pengumumanPortal).orderBy(desc(pengumumanPortal.tanggal));
}

export async function tambahPengumuman(judul: string, isi: string, isAktif: boolean) {
  const admin = await requireAdmin();
  await db.insert(pengumumanPortal).values({
    id: uuidv4(),
    judul,
    isi,
    tanggal: new Date(),
    isAktif,
    idAdmin: admin.id
  });
  revalidatePath('/pengaturan');
  revalidatePath('/portal-ortu');
}

export async function updatePengumuman(id: string, judul: string, isi: string, isAktif: boolean) {
  await requireAdmin();
  await db.update(pengumumanPortal).set({ judul, isi, isAktif }).where(eq(pengumumanPortal.id, id));
  revalidatePath('/pengaturan');
  revalidatePath('/portal-ortu');
}

export async function hapusPengumuman(id: string) {
  await requireAdmin();
  await db.delete(pengumumanPortal).where(eq(pengumumanPortal.id, id));
  revalidatePath('/pengaturan');
  revalidatePath('/portal-ortu');
}
`;
fs.appendFileSync('src/app/pengaturan/actions.ts', code);
console.log("Appended to actions.ts");
