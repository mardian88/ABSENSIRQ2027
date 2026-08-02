"use client";

import { useState } from "react";
import { Send, Users, AlertCircle } from "lucide-react";

export default function PengumumanPage() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSend = async () => {
    if (!message) return;
    setIsSending(true);
    // Simulasi pengiriman broadcast
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setMessage("");
      setTimeout(() => setSendSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Kirim Pengumuman (Broadcast)</h2>
        <p className="text-slate-500 text-sm mt-1">
          Pesan ini akan dikirimkan via WhatsApp ke seluruh orang tua santri yang aktif.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">
          <strong>Perhatian:</strong> Gunakan fitur broadcast ini dengan bijak. Terlalu sering mengirim pesan massal dapat menyebabkan nomor WhatsApp Anda terblokir oleh sistem anti-spam WhatsApp.
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Isi Pesan Pengumuman
          </label>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Ketik pesan pengumuman di sini..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
          />
          <p className="text-xs text-slate-400 mt-2 flex justify-between">
            <span>Tips: Gunakan sapaan yang sopan.</span>
            <span>{message.length} karakter</span>
          </p>
        </div>

        <div className="pt-2">
          <button 
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 font-bold transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSending ? "Mengirim Pesan..." : "Kirim Pengumuman"}
          </button>
        </div>

        {sendSuccess && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium animate-in fade-in">
            Pengumuman berhasil dikirim ke seluruh kontak orang tua santri!
          </div>
        )}
      </div>
    </div>
  );
}
