"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitAbsensiPrivat } from "./actions";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

type SantriPrivat = {
  id: string;
  namaLengkap: string;
};

export default function FormAbsensiPrivat({ daftarSantri }: { daftarSantri: SantriPrivat[] }) {
  const [loading, setLoading] = useState(false);
  
  const [idSantri, setIdSantri] = useState<string>("");
  const [status, setStatus] = useState<string>("hadir");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!idSantri) {
      toast.error("Pilih santri terlebih dahulu.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("idSantriPrivat", idSantri);
    formData.append("statusKehadiran", status);
    
    const res = await submitAbsensiPrivat(formData);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      const form = e.target as HTMLFormElement;
      form.reset();
      setIdSantri("");
    } else {
      toast.error(res.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Santri Privat</Label>
        <Select value={idSantri} onValueChange={setIdSantri}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih Santri..." />
          </SelectTrigger>
          <SelectContent>
            {daftarSantri.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.namaLengkap}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Status Kehadiran</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hadir">Hadir</SelectItem>
            <SelectItem value="izin">Izin / Sakit</SelectItem>
            <SelectItem value="alpa">Alpa / Tanpa Keterangan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Capaian Hafalan / Jilid (Opsional)</Label>
        <Textarea 
          name="capaianHafalan" 
          placeholder="Cth: Surah Al-Mulk ayat 1-10, Tajwid membaik..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Simpan Kehadiran
      </Button>
    </form>
  );
}
