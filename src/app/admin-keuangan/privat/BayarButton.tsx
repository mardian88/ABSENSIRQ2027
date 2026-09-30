"use client";

import { Button } from "@/components/ui/button";
import { bayarTagihan, batalkanPembayaran } from "./actions";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function BayarButton({ idTagihan, status }: { idTagihan: string, status: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleBayar = async () => {
    if (!confirm("Tandai tagihan ini sebagai Lunas?")) return;
    
    setLoading(true);
    const res = await bayarTagihan(idTagihan);
    setLoading(false);
    
    if (res.success) {
      toast({ title: "Berhasil", description: res.message });
    } else {
      toast({ title: "Gagal", description: res.message, variant: "destructive" });
    }
  };

  const handleBatal = async () => {
    if (!confirm("Batalkan pelunasan tagihan ini?")) return;
    
    setLoading(true);
    const res = await batalkanPembayaran(idTagihan);
    setLoading(false);
    
    if (res.success) {
      toast({ title: "Berhasil", description: res.message });
    } else {
      toast({ title: "Gagal", description: res.message, variant: "destructive" });
    }
  };

  if (status === 'lunas') {
    return (
      <Button variant="outline" size="sm" onClick={handleBatal} disabled={loading} className="text-destructive hover:text-destructive hover:bg-destructive/10">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
        Batal Lunas
      </Button>
    );
  }

  return (
    <Button variant="default" size="sm" onClick={handleBayar} disabled={loading} className="bg-green-600 hover:bg-green-700">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
      Lunaskan
    </Button>
  );
}
