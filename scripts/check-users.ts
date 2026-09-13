import "dotenv/config";
import { db } from "../src/db";
import { user } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const allUsers = await db.select().from(user);
    console.log("All users in DB:", allUsers);
  } catch (error) {
    console.error("Error checking DB:", error);
  }
}
main();
