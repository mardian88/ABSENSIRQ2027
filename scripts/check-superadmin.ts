import "dotenv/config";
import { db } from "../src/db";
import { user } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../src/lib/auth";

async function main() {
  const email = "superadmin@rumahquran.com";
  try {
    const existingUser = await db.select().from(user).where(eq(user.email, email));
    console.log("Found superadmin in DB:", existingUser);
  } catch (error) {
    console.error("Error checking DB:", error);
  }
}
main();
