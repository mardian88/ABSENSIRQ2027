import { cookies } from "next/headers";
import { signToken, verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { santriPrivat } from "@/db/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "session_privat";

export async function getSantriPrivatSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || !payload.id) return null;

  // Validate fully to database to avoid infinite loop / stale sessions
  const [user] = await db.select({
    id: santriPrivat.id,
    namaLengkap: santriPrivat.namaLengkap,
    kontakOrtu: santriPrivat.kontakOrtu,
    statusSantri: santriPrivat.statusSantri,
  }).from(santriPrivat).where(eq(santriPrivat.id, payload.id as string));

  if (!user || user.statusSantri !== "aktif") return null;

  return user;
}

export async function setSantriPrivatSession(id: string) {
  const token = await signToken({ id, role: "santri_privat" });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearSantriPrivatSession() {
  (await cookies()).delete(COOKIE_NAME);
}
