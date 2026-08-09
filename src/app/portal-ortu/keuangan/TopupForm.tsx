"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitTopup } from "./actions";

export function TopupForm({ santriId, santriName, santriNis }: { santriId: string, santriName: string, santriNis: string }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<'tabungan' | 'utama'>('tabungan');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount.replace(/\D/g, ''));
    if (!numericAmount || numericAmount <= 0) return;
    
    setLoading(true);
    try {
      await submitTopup(santriId, numericAmount, type);
      setAmount("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          Berhasil diajukan! Pengajuan Anda sedang menunggu verifikasi Admin.
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Nama Santri</Label>
          <Input value={santriName} disabled className="bg-slate-50/50 text-slate-500 text-sm h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">NIS</Label>
          <Input value={santriNis} disabled className="bg-slate-50/50 text-slate-500 text-sm h-9 font-mono" />
        </div>
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Tujuan Pengisian Saldo</Label>
        <select 
          className="w-full flex h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={type}
          onChange={(e) => setType(e.target.value as 'tabungan' | 'utama')}
        >
          <option value="tabungan">Saldo Tabungan Pokok</option>
          <option value="utama">Saldo Utama (Dompet Jajan)</option>
        </select>
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Jumlah Top Up (Rp)</Label>
        <Input 
          type="text" 
          inputMode="numeric"
          placeholder="Contoh: 50.000" 
          value={amount}
          onChange={(e) => {
            const rawValue = e.target.value.replace(/\D/g, '');
            if (rawValue) {
              setAmount(new Intl.NumberFormat('id-ID').format(Number(rawValue)));
            } else {
              setAmount('');
            }
          }}
          required
          className="text-lg font-bold h-12"
        />
      </div>
      
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? "Mengirim..." : "Ajukan Top Up via WA"}
      </Button>
    </form>
  );
}
