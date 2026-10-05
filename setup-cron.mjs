import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_KEY = "Yhe4RtTQDYew8WXy0Vngeia2Amz8WHztu8p43+9PCB0=";

async function createCronJob(title, url, cronSecret, jam, menit) {
  const payload = {
    job: {
      url: url,
      enabled: true,
      saveResponses: true,
      title: title,
      schedule: {
        timezone: "Asia/Jakarta",
        expiresAt: 0,
        hours: [jam],
        minutes: [menit],
        mdays: [-1],
        months: [-1],
        wdays: [-1]
      },
      requestMethod: 0, // GET
      extendedData: {
        headers: {
          "Authorization": `Bearer ${cronSecret}`
        }
      }
    }
  };

  try {
    const response = await fetch('https://api.cron-job.org/jobs', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Berhasil membuat job: ${title} (ID: ${data.jobId})`);
    } else {
      const errorText = await response.text();
      console.error(`❌ Gagal membuat job ${title}: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`❌ Error sistem saat membuat job ${title}:`, error);
  }
}

async function run() {
  console.log("=== SETUP CRON-JOB.ORG OTOMATIS ===\n");
  
  rl.question("Masukkan URL domain aplikasi Anda (contoh: https://absensi.vercel.app): ", async (domain) => {
    // Bersihkan trailing slash jika ada
    const cleanDomain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
    
    rl.question("Masukkan CRON_SECRET Anda: ", async (cronSecret) => {
      console.log("\nMemproses pembuatan cron job ke cron-job.org...\n");
      
      const urlMasuk = `${cleanDomain}/api/cron/auto-hadir-guru?jenis=masuk`;
      const urlPulang = `${cleanDomain}/api/cron/auto-hadir-guru?jenis=pulang`;

      await createCronJob("Auto-Hadir Guru (Masuk 10:00)", urlMasuk, cronSecret, 10, 0);
      await createCronJob("Auto-Hadir Guru (Pulang 22:30)", urlPulang, cronSecret, 22, 30);

      console.log("\nSelesai!");
      rl.close();
    });
  });
}

run();
