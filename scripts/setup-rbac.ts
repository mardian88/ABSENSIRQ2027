import { db } from "../src/db";
import { user, cabang } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { auth } from "../src/lib/auth";

async function main() {
  try {
    console.log("Updating admin to superadmin...");
    await db.update(user).set({ role: "superadmin" }).where(eq(user.email, "admin@rumahquran.com"));

    console.log("Checking cabang Pusat...");
    let [pusat] = await db.select().from(cabang).where(eq(cabang.namaCabang, "Pusat"));
    if (!pusat) {
      const id = uuidv4();
      await db.insert(cabang).values({ id, namaCabang: "Pusat", alamat: "Kantor Pusat" });
      [pusat] = await db.select().from(cabang).where(eq(cabang.id, id));
      console.log("Cabang Pusat created.");
    }

    console.log("Creating user Pusat...");
    const existingPusat = await db.select().from(user).where(eq(user.email, "pusat@rumahquran.com"));
    if (existingPusat.length === 0) {
        await auth.api.signUpEmail({
            body: {
                email: "pusat@rumahquran.com",
                password: "bismillahpusat",
                name: "Admin Pusat",
            }
        });
        // Update idCabang for this user
        await db.update(user).set({ idCabang: pusat.id, role: "admin_cabang" }).where(eq(user.email, "pusat@rumahquran.com"));
        console.log("User Pusat created.");
    } else {
        console.log("User Pusat already exists.");
    }
    console.log("Done");
  } catch (e) {
    console.error(e);
  }
}

main();
