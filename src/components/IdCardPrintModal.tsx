"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, AlertTriangle } from "lucide-react";
import { getActiveIdCardTemplate } from "@/app/pengaturan/actions";
import { QRCodeSVG } from "qrcode.react";

interface IdCardPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: any[]; // Array of santri or guru
  tipe: "santri" | "guru";
}

export function IdCardPrintModal({ isOpen, onClose, people, tipe }: IdCardPrintModalProps) {
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplate();
    }
  }, [isOpen, tipe]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const activeTemplate = await getActiveIdCardTemplate(tipe);
      setTemplate(activeTemplate);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    
    // We will use standard browser print, hiding everything else
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Set body to just the print content temporarily
    document.body.innerHTML = printContent;
    window.print();
    
    // Restore
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React state cleanly
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cetak ID Card {tipe === "santri" ? "Siswa" : "Guru"} ({people.length} orang)</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 rounded-md">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
              <p className="text-slate-500">Memuat template ID Card...</p>
            </div>
          ) : !template ? (
            <div className="flex flex-col items-center justify-center py-12 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="font-semibold text-lg mb-2">Template Belum Diset!</h3>
              <p className="text-sm text-center max-w-md">
                Anda belum menentukan desain ID Card yang aktif untuk {tipe === "santri" ? "Siswa" : "Guru"}.<br/>
                Silakan masuk ke menu <b>Pengaturan &gt; ID Card</b> untuk mengunggah dan mengaktifkan template terlebih dahulu.
              </p>
            </div>
          ) : (
            <div className="print-area-container flex flex-col items-center">
              <div 
                ref={printRef} 
                className="grid gap-[15px] pb-8 print:block print:pb-0 print:gap-0"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(204px, 1fr))",
                  width: "100%", 
                  maxWidth: "800px"
                }}
              >
                {/* 
                  Standard ID card size is CR80: 2.125" x 3.375" (54mm x 86mm).
                  At 96 DPI, this is approx 204px x 324px.
                  We'll use standard CSS mm for print accuracy.
                */}
                <style dangerouslySetInnerHTML={{__html: `
                  @media print {
                    @page { size: A4; margin: 10mm; }
                    body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-card-wrapper { 
                      display: inline-block; 
                      margin: 5px; 
                      page-break-inside: avoid;
                    }
                  }
                `}} />

                {people.map((p, i) => (
                  <div 
                    key={p.id || i}
                    className="print-card-wrapper relative overflow-hidden bg-white shadow-md mx-auto"
                    style={{
                      width: "54mm", 
                      height: "86mm",
                      backgroundImage: `url(${template.backgroundUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-[10mm]">
                      
                      {/* Name & ID Text */}
                      <div className="text-center bg-white/80 backdrop-blur-sm w-full py-2 mb-3 border-y border-white/50 shadow-sm">
                        <h2 className="font-bold text-[13px] leading-tight text-slate-900 px-1 truncate w-full uppercase">
                          {p.namaLengkap || p.namaGuru}
                        </h2>
                        <p className="text-[10px] font-semibold text-slate-700 mt-0.5">
                          {p.nomorInduk || p.nip || p.kodeQr || "-"}
                        </p>
                      </div>

                      {/* QR Code */}
                      <div className="bg-white p-1 rounded-md shadow-sm border border-slate-100">
                        <QRCodeSVG 
                          value={p.kodeQr || p.nomorInduk || p.nip || p.id} 
                          size={55} 
                          level="H" 
                        />
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t mt-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button 
            disabled={loading || !template || people.length === 0} 
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            Mulai Cetak ({people.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
