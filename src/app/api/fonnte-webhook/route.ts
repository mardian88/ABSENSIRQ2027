import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { logPesanManual, santri, keluarga } from "@/db/schema";
import { eq, like } from "drizzle-orm";
import { sendFonnteMessage } from "@/lib/fonnte";

const SYSTEM_PROMPT = `Nama kamu adalah Asisten Muharrik, Customer Service resmi dari Rumah Qur'an Muharrik. Gaya bahasamu santun, Islami (awali sapaan dengan Assalamualaikum), profesional, ramah, dan selalu menggunakan sapaan Bapak/Ibu.
Jika kamu tidak tahu jawabannya, arahkan mereka untuk menghubungi Admin di WA 0813-9494-0401.

[Profil Lembaga]
- Nama: Rumah Qur'an Muharrik (Lokasi: Garut).
- Visi: Mencetak generasi yang Berakhlak, Berdisiplin, serta mahir membaca & menghafal Al-Qur'an.
- 3 Pilar: Adab, Kedisiplinan, Kognitif.

[Kegiatan KBM]
- Materi: Muroja'ah, Ziyadah, Tilawah, Ilmu Tajwid, Akhlak, Ilmu Fikih.
- Waktu: Dibagi kelas Siang, Sore, Malam.
- Alur: Absensi, Wudhu, Shalat sunnah, KBM inti, Jamaah, Kepulangan.

[Pendaftaran Santri Baru (PSB)]
- Biaya Pendaftaran: Rp 150.000.
- Infaq Bulanan: Rp 100.000 / bulan.
- Kas Wajib: Rp 10.000 / bulan.
- Batas Waktu: Pendaftaran dibuka selama kuota masih tersedia. Cek ketersediaan di website secara realtime.
- Cara Daftar: Silakan mengisi biodata calon santri secara lengkap di: https://absensirq-2027.vercel.app/psb

[Wali Santri Aktif]
- Izin: Jika anak tidak hadir, silakan isi form izin dan lampirkan surat di portal: https://absensirq-2027.vercel.app/portal-ortu
`;

async function getAIResponse(userMessage: string, senderContext: string): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return "Mohon maaf, sistem AI Customer Service saat ini sedang dalam pemeliharaan (Token belum di-set). Silakan hubungi Admin di 0813-9494-0401.";
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://absensirq-2027.vercel.app", 
        "X-Title": "Absensi RQ Muharrik"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + "\n\nKonteks Pengirim Saat Ini:\n" + senderContext },
          { role: "user", content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[AI ERROR]", err);
      return "Maaf, sistem sedang sibuk. Mohon tunggu beberapa saat lagi atau hubungi Admin.";
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("[AI FETCH ERROR]", error);
    return "Terjadi kendala jaringan pada server AI. Silakan hubungi Admin.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const textData = await req.text();
    let body: any = {};
    
    try {
      body = JSON.parse(textData);
    } catch {
      return NextResponse.json({ success: true, reason: "ignoring non-json" });
    }
    
    console.log("[FONNTE WEBHOOK]", body);

    const sender = body.sender;
    const message = body.message || body.text;

    // Pastikan ini adalah chat masuk dari personal (bukan group dan bukan status update)
    if (sender && message && !sender.includes("-") && !body.status) {
      
      let senderContext = "Pengirim ini belum terdaftar di database (Kemungkinan Calon Wali Santri). Arahkan mereka untuk mendaftar jika bertanya tentang pendaftaran.";
      
      const parentMatch = await db.select().from(keluarga)
        .where(like(keluarga.nomorWhatsapp, `%${sender.substring(2)}%`))
        .limit(1).then(res => res[0]);
      
      if (parentMatch) {
         senderContext = `Pengirim ini adalah Orang Tua/Wali Santri aktif bernama "${parentMatch.namaWali}". Layani mereka sebagai wali santri. Jangan suruh mendaftar lagi kecuali mereka bertanya untuk mendaftarkan anak lain.`;
      }

      console.log(`[AI CS] Processing message from ${sender}...`);
      const aiReply = await getAIResponse(message, senderContext);

      // Gunakan fungsi Fonnte bawaan sistem yang otomatis pakai token aktif dari DB
      await sendFonnteMessage(sender, aiReply);

      return NextResponse.json({ success: true });
    }

    // Jika ini adalah Fonnte Status Update (Message Delivered/Read)
    if (body.id && body.status) {
       await db.update(logPesanManual)
         .set({ status: body.status })
         .where(eq(logPesanManual.fonnteId, body.id.toString()));
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[WEBHOOK ERROR]", err);
    return NextResponse.json({ success: true }); // Fonnte butuh respon cepat 200 OK
  }
}
