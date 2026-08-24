import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { logPesanManual } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Fonnte webhook structure (usually):
    // { "id": "174982730", "status": "read", ... } or maybe form-data
    
    // Sometimes Fonnte sends x-www-form-urlencoded or multipart
    console.log("[FONNTE WEBHOOK]", body);
    
    // Since Fonnte webhook payload can vary, we will try our best.
    const messageId = body.id || body.message_id;
    const status = body.status; // 'sent', 'read', 'delivered', 'failed'
    
    if (messageId && status) {
       // if we saved fonnte_id
       await db.update(logPesanManual)
         .set({ status: status }) // if Fonnte sends 'read' we might need to map it, but 'read' can map to green
         .where(eq(logPesanManual.fonnteId, messageId.toString()));
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    // maybe it's formdata
    return NextResponse.json({ success: true }); // Always return 200 for webhooks
  }
}
