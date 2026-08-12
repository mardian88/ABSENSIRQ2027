import 'dotenv/config';
import { db } from '../src/db';
import { pengaturanHumas } from '../src/db/schema';

async function run() {
  const humas = await db.query.pengaturanHumas.findFirst();
  if (!humas?.tokenFonnte) {
    console.log("No fonnte token found");
    return;
  }
  
  const token = humas.tokenFonnte;
  console.log("Testing token:", token.substring(0, 5) + '...');
  
  try {
    const response = await fetch("https://api.fonnte.com/device", {
      method: "POST",
      headers: {
        Authorization: token,
      },
    });
    
    const data = await response.json();
    console.log("Device info:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching device info:", err);
  }
}

run();
