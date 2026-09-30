"use client";

import { Button } from "@/components/ui/button";
import { generateTagihanBulanan } from "./actions";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, PlusCircle } from "lucide-react";

export default function GenerateTagihanButton({ bulan, tahun, namaBulan }: { bulan: number, tahun: number, namaBulan: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!confirm(`Generate tagihan privat bulan ${namaBulan} ${tahun}?`)) return;
    
    setLoading(true);
    const res = await generateTagihanBulanan(bulan, tahun);
    setLoading(false);
    
    if (res.success) {
      toast({ title: "Berhasil", description: res.message });
    } else {
      toast({ title: "Gagal", description: res.message, variant: "destructive" });
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
      Generate Tagihan
    </Button>
  );
}
