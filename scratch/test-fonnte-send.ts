import 'dotenv/config';
import { db } from '../src/db';
import { fonnteTokens } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const [tokenRecord] = await db.select().from(fonnteTokens).where(eq(fonnteTokens.isActive, true)).limit(1);
  if (!tokenRecord) {
    console.log("No active token");
    return;
  }
  
  const token = tokenRecord.token;
  console.log("Testing token:", token.substring(0, 5) + '...');
  
  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: new URLSearchParams({
        target: "081234567890", // fake number
        message: "Test message",
        countryCode: "62",
      })
    });
    
    const data = await response.json();
    console.log("Send info:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error sending:", err);
  }
}

run();
