"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, AlertTriangle, Edit, Save, LayoutTemplate } from "lucide-react";
import { getActiveIdCardTemplate, updateIdCardLayout } from "@/app/pengaturan/actions";
import { QRCodeSVG } from "qrcode.react";
import { Rnd } from "react-rnd";
import { showSuccess, showError } from "@/lib/sweetalert";

interface IdCardPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: any[]; // Array of santri or guru
  tipe: "santri" | "guru";
}

const DEFAULT_LAYOUT = {
  name: { x: 0, y: 160, width: 204, height: 40, fontSize: 13, fontWeight: 'bold' },
  id: { x: 0, y: 200, width: 204, height: 20, fontSize: 10, fontWeight: '600' },
  qr: { x: 74, y: 240, width: 55, height: 55 }
};

export function IdCardPrintModal({ isOpen, onClose, people, tipe }: IdCardPrintModalProps) {
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplate();
      setIsEditMode(false);
    }
  }, [isOpen, tipe]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const activeTemplate = await getActiveIdCardTemplate(tipe);
      if (activeTemplate) {
        setTemplate(activeTemplate);
        if (activeTemplate.layout) {
          try {
            setLayout(JSON.parse(activeTemplate.layout));
          } catch (e) {
            console.error("Gagal parsing layout", e);
            setLayout(DEFAULT_LAYOUT);
          }
        } else {
          setLayout(DEFAULT_LAYOUT);
        }
      } else {
        setTemplate(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLayout = async () => {
    if (!template) return;
    setSaving(true);
    try {
      await updateIdCardLayout(template.id, JSON.stringify(layout));
      showSuccess("Layout berhasil disimpan!");
      setIsEditMode(false);
    } catch (e) {
      showError("Gagal menyimpan layout");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    
    // We will use standard browser print, hiding everything else
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent;
    window.print();
    
    document.body.innerHTML = originalContent;
    window.location.reload(); 
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Cetak ID Card {tipe === "santri" ? "Siswa" : "Guru"} ({people.length} orang)</span>
            
            {template && (
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                onClick={() => isEditMode ? handleSaveLayout() : setIsEditMode(true)}
                disabled={saving}
                className={isEditMode ? "bg-amber-500 hover:bg-amber-600 mr-8" : "mr-8"}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isEditMode ? (
                  <Save className="w-4 h-4 mr-2" />
                ) : (
                  <LayoutTemplate className="w-4 h-4 mr-2" />
                )}
                {isEditMode ? "Simpan Layout" : "Edit Layout"}
              </Button>
            )}
          </DialogTitle>
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
          ) : isEditMode ? (
            <div className="flex flex-col items-center">
              <div className="mb-4 text-center">
                <p className="text-sm text-amber-600 font-medium">Mode Edit Layout Aktif</p>
                <p className="text-xs text-slate-500">Geser (drag) atau ubah ukuran (resize) elemen di bawah ini.</p>
              </div>
              
              {people.length > 0 && (
                <div 
                  className="relative overflow-hidden bg-white shadow-xl mx-auto ring-2 ring-amber-400"
                  style={{
                    width: "204px", 
                    height: "324px",
                    backgroundImage: `url(${template.backgroundUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Name Rnd */}
                  <Rnd
                    size={{ width: layout.name.width, height: layout.name.height }}
                    position={{ x: layout.name.x, y: layout.name.y }}
                    onDragStop={(e, d) => setLayout(l => ({ ...l, name: { ...l.name, x: d.x, y: d.y } }))}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      setLayout(l => ({
                        ...l,
                        name: {
                          ...l.name,
                          width: parseInt(ref.style.width),
                          height: parseInt(ref.style.height),
                          ...position,
                        },
                      }));
                    }}
                    bounds="parent"
                    className="group"
                  >
                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-blue-400 bg-blue-400/10 cursor-move">
                      <span 
                        className="truncate px-1 text-center leading-tight w-full"
                        style={{ 
                          fontSize: `${layout.name.fontSize}px`, 
                          fontWeight: layout.name.fontWeight as any 
                        }}
                      >
                        {people[0].namaLengkap || people[0].namaGuru || "NAMA LENGKAP"}
                      </span>
                    </div>
                  </Rnd>

                  {/* ID Rnd */}
                  <Rnd
                    size={{ width: layout.id.width, height: layout.id.height }}
                    position={{ x: layout.id.x, y: layout.id.y }}
                    onDragStop={(e, d) => setLayout(l => ({ ...l, id: { ...l.id, x: d.x, y: d.y } }))}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      setLayout(l => ({
                        ...l,
                        id: {
                          ...l.id,
                          width: parseInt(ref.style.width),
                          height: parseInt(ref.style.height),
                          ...position,
                        },
                      }));
                    }}
                    bounds="parent"
                  >
                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-green-400 bg-green-400/10 cursor-move">
                      <span 
                        className="truncate px-1 text-center"
                        style={{ 
                          fontSize: `${layout.id.fontSize}px`, 
                          fontWeight: layout.id.fontWeight as any 
                        }}
                      >
                        {people[0].nomorInduk || people[0].nip || people[0].kodeQr || "ID-123456"}
                      </span>
                    </div>
                  </Rnd>

                  {/* QR Rnd */}
                  <Rnd
                    size={{ width: layout.qr.width, height: layout.qr.height }}
                    position={{ x: layout.qr.x, y: layout.qr.y }}
                    onDragStop={(e, d) => setLayout(l => ({ ...l, qr: { ...l.qr, x: d.x, y: d.y } }))}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      setLayout(l => ({
                        ...l,
                        qr: {
                          ...l.qr,
                          width: parseInt(ref.style.width),
                          height: parseInt(ref.style.height),
                          ...position,
                        },
                      }));
                    }}
                    bounds="parent"
                    lockAspectRatio={true}
                  >
                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-purple-400 bg-purple-400/10 cursor-move p-1 bg-white rounded-md">
                      <QRCodeSVG 
                        value={people[0].kodeQr || people[0].nomorInduk || people[0].nip || people[0].id || "SAMPLE"} 
                        width="100%"
                        height="100%" 
                        level="H" 
                      />
                    </div>
                  </Rnd>

                </div>
              )}
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
                      width: "204px", 
                      height: "324px",
                      backgroundImage: `url(${template.backgroundUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    {/* Name */}
                    <div 
                      className="absolute flex items-center justify-center"
                      style={{
                        left: layout.name.x,
                        top: layout.name.y,
                        width: layout.name.width,
                        height: layout.name.height,
                      }}
                    >
                      <span 
                        className="truncate px-1 text-center leading-tight w-full"
                        style={{ 
                          fontSize: `${layout.name.fontSize}px`, 
                          fontWeight: layout.name.fontWeight as any 
                        }}
                      >
                        {p.namaLengkap || p.namaGuru}
                      </span>
                    </div>

                    {/* ID */}
                    <div 
                      className="absolute flex items-center justify-center"
                      style={{
                        left: layout.id.x,
                        top: layout.id.y,
                        width: layout.id.width,
                        height: layout.id.height,
                      }}
                    >
                      <span 
                        className="truncate px-1 text-center"
                        style={{ 
                          fontSize: `${layout.id.fontSize}px`, 
                          fontWeight: layout.id.fontWeight as any 
                        }}
                      >
                        {p.nomorInduk || p.nip || p.kodeQr || "-"}
                      </span>
                    </div>

                    {/* QR Code */}
                    <div 
                      className="absolute flex items-center justify-center bg-white p-1 rounded-md shadow-sm"
                      style={{
                        left: layout.qr.x,
                        top: layout.qr.y,
                        width: layout.qr.width,
                        height: layout.qr.height,
                      }}
                    >
                      <QRCodeSVG 
                        value={p.kodeQr || p.nomorInduk || p.nip || p.id} 
                        width="100%"
                        height="100%"
                        level="H" 
                      />
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t mt-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          {!isEditMode && (
            <Button 
              disabled={loading || !template || people.length === 0} 
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Mulai Cetak ({people.length})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
