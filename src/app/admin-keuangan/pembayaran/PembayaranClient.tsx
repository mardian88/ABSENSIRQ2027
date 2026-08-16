"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ChevronDown, Search, ArrowLeft, Loader2, Coins, Wallet } from "lucide-react";
import Link from "next/link";
import { searchSantriForPayment, getSantriByKeluarga, prosesPembayaran, getPengaturanTagihan, getAllSantriForPayment } from "./actions";
import { showSuccess, showError } from "@/lib/sweetalert";
import Select from "react-select";

export function PembayaranClient() {
  const [activeTab, setActiveTab] = useState<'satu' | 'masal'>('satu');
  
  // Data Master
  const [tagihanOptions, setTagihanOptions] = useState<any[]>([]);
  
  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSantri, setSelectedSantri] = useState<any | null>(null);

  // Masal State
  const [allSantri, setAllSantri] = useState<any[]>([]);
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  const [masalSearchQuery, setMasalSearchQuery] = useState("");
  
  const [selectedTagihanId, setSelectedTagihanId] = useState<string>("");
  const [metodeBayar, setMetodeBayar] = useState<'potong_saldo' | 'tunai' | 'transfer' | 'qris'>('potong_saldo');
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [bulan, setBulan] = useState(currentMonth);
  const [tahun, setTahun] = useState(currentYear);
  const [nominal, setNominal] = useState<number>(0);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load master tagihan & santri
  useEffect(() => {
    getPengaturanTagihan().then(res => {
      setTagihanOptions(res);
      if (res.length > 0) {
        setSelectedTagihanId(res[0].id);
      }
    });
    getAllSantriForPayment().then(res => {
      setAllSantri(res);
    });
  }, []);

  // Update Nominal if Tagihan or Santri changes
  useEffect(() => {
    if (!selectedTagihanId) return;
    const t = tagihanOptions.find(x => x.id === selectedTagihanId);
    if (!t) return;

    if (activeTab === 'satu') {
      if (selectedSantri) {
        if (selectedSantri.idKeluarga) {
          setNominal(t.nominalSaudara);
        } else {
          setNominal(t.nominalDefault);
        }
      } else {
        setNominal(t.nominalDefault);
      }
    } else {
      setNominal(0);
    }
  }, [selectedTagihanId, selectedSantri, activeTab, tagihanOptions]);

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        searchSantriForPayment(searchQuery).then(res => {
          setSearchResults(res);
          setIsSearching(false);
        });
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectSantri = async (santri: any) => {
    setSelectedSantri(santri);
    setSearchQuery("");
    setSearchResults([]);
    
    // Jika santri ini punya keluarga, tawarkan bayar sekalian?
    // User requirement: if sibling, auto split. The nominal calculation is already handled in useEffect.
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka);
  };

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val) {
      setNominal(parseInt(val, 10));
    } else {
      setNominal(0);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const filteredIds = allSantri
        .filter(s => s.namaLengkap.toLowerCase().includes(masalSearchQuery.toLowerCase()) || s.nomorInduk.toLowerCase().includes(masalSearchQuery.toLowerCase()))
        .map(s => s.id);
      // Merge with existing avoiding duplicates
      setSelectedSantriIds(Array.from(new Set([...selectedSantriIds, ...filteredIds])));
    } else {
      const filteredIds = allSantri
        .filter(s => s.namaLengkap.toLowerCase().includes(masalSearchQuery.toLowerCase()) || s.nomorInduk.toLowerCase().includes(masalSearchQuery.toLowerCase()))
        .map(s => s.id);
      setSelectedSantriIds(selectedSantriIds.filter(id => !filteredIds.includes(id)));
    }
  };

  const handleToggleSantri = (id: string) => {
    if (selectedSantriIds.includes(id)) {
      setSelectedSantriIds(selectedSantriIds.filter(x => x !== id));
    } else {
      setSelectedSantriIds([...selectedSantriIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'satu') {
      if (!selectedSantri) {
        showError("Gagal", "Silakan pilih santri terlebih dahulu.");
        return;
      }
      if (!nominal || nominal <= 0) {
        showError("Gagal", "Nominal pembayaran tidak valid.");
        return;
      }
    } else {
      if (selectedSantriIds.length === 0) {
        showError("Gagal", "Silakan pilih minimal 1 santri.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let santriIds = activeTab === 'satu' ? [selectedSantri.id] : selectedSantriIds;
      const nominalPerSantri = activeTab === 'satu' ? nominal : 0;

      await prosesPembayaran({
        santriIds,
        idTagihan: selectedTagihanId,
        metodeBayar,
        bulan,
        tahun,
        nominalPerSantri
      });

      showSuccess("Pembayaran Berhasil", "Pembayaran telah dicatat dalam sistem.");
      
      // Reset form
      if (activeTab === 'satu') {
        setSelectedSantri(null);
        setSearchQuery("");
      } else {
        setSelectedSantriIds([]);
      }
    } catch (error: any) {
      showError("Pembayaran Gagal", error.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
        <div className="p-8">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-6 h-6 text-orange-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Pembayaran Kas & Infaq</h1>
          <p className="text-sm text-slate-500 mb-8">Catat pembayaran bulanan atau iuran santri</p>

          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button 
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-xl transition-all ${activeTab === 'satu' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('satu')}
            >
              Satu Santri
            </button>
            <button 
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-xl transition-all ${activeTab === 'masal' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('masal')}
            >
              Banyak Santri (Masal)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Search Santri (Satu) */}
            {activeTab === 'satu' && (
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-slate-700 block">Pencarian Nama / Scan NFC / NIS</label>
                {selectedSantri ? (
                  <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-emerald-900">{selectedSantri.namaLengkap}</p>
                        {selectedSantri.idKeluarga && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Saudara</span>}
                      </div>
                      <p className="text-xs text-emerald-700 mt-1">{selectedSantri.nomorInduk} • Saldo: Rp {formatRupiah(selectedSantri.saldoTabungan || 0)}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedSantri(null)} className="text-emerald-700 hover:bg-emerald-100 p-1.5 rounded-lg">
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      placeholder="Ketik Nama atau NIS / Scan NFC..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    
                    {/* Dropdown Results */}
                    {searchQuery.length >= 2 && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                        {isSearching ? (
                          <div className="p-4 text-center text-sm text-slate-500">Mencari...</div>
                        ) : searchResults.length > 0 ? (
                          <ul className="py-2">
                            {searchResults.map(s => (
                              <li 
                                key={s.id} 
                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                onClick={() => handleSelectSantri(s)}
                              >
                                <div>
                                  <div className="font-medium text-slate-800 text-sm">{s.namaLengkap}</div>
                                  <div className="text-xs text-slate-500">{s.nomorInduk}</div>
                                </div>
                                {s.idKeluarga && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Saudara</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-sm text-slate-500">Santri tidak ditemukan.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* List Masal */}
            {activeTab === 'masal' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-700 block">Pilih Santri ({selectedSantriIds.length} terpilih)</label>
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-2 cursor-pointer hover:text-emerald-700">
                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" onChange={handleSelectAll} />
                    Pilih Semua di Hasil Pencarian
                  </label>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="Cari nama atau NIS untuk filter list..."
                    value={masalSearchQuery}
                    onChange={(e) => setMasalSearchQuery(e.target.value)}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
                </div>
                <div className="border border-slate-200 rounded-xl max-h-64 overflow-y-auto bg-slate-50 p-2 space-y-1">
                  {allSantri
                    .filter(s => s.namaLengkap.toLowerCase().includes(masalSearchQuery.toLowerCase()) || s.nomorInduk.toLowerCase().includes(masalSearchQuery.toLowerCase()))
                    .map(s => (
                      <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${selectedSantriIds.includes(s.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-transparent hover:border-slate-200'}`}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={selectedSantriIds.includes(s.id)}
                          onChange={() => handleToggleSantri(s.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-800">{s.namaLengkap}</span>
                            {s.idKeluarga && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Saudara</span>}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{s.nomorInduk} • Saldo: Rp {formatRupiah(s.saldoTabungan || 0)}</div>
                        </div>
                      </label>
                  ))}
                  {allSantri.filter(s => s.namaLengkap.toLowerCase().includes(masalSearchQuery.toLowerCase()) || s.nomorInduk.toLowerCase().includes(masalSearchQuery.toLowerCase())).length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-500">Tidak ada data santri.</div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Jenis Tagihan */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">Jenis Tagihan</label>
                {tagihanOptions.length <= 2 ? (
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {tagihanOptions.map(t => (
                      <button 
                        key={t.id}
                        type="button"
                        className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${selectedTagihanId === t.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setSelectedTagihanId(t.id)}
                      >
                        {t.namaPembayaran}
                      </button>
                    ))}
                  </div>
                ) : (
                  <select 
                    value={selectedTagihanId}
                    onChange={(e) => setSelectedTagihanId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {tagihanOptions.map(t => (
                      <option key={t.id} value={t.id}>{t.namaPembayaran}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Metode Bayar */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">Metode Bayar</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      type="button"
                      className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-medium rounded-lg transition-all ${metodeBayar === 'potong_saldo' ? 'bg-emerald-700 shadow text-white' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setMetodeBayar('potong_saldo')}
                    >
                      Potong Saldo
                    </button>
                    <button 
                      type="button"
                      className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-medium rounded-lg transition-all ${metodeBayar === 'tunai' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setMetodeBayar('tunai')}
                    >
                      Tunai
                    </button>
                    <button 
                      type="button"
                      className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-medium rounded-lg transition-all ${metodeBayar === 'transfer' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setMetodeBayar('transfer')}
                    >
                      Transfer
                    </button>
                    <button 
                      type="button"
                      className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-medium rounded-lg transition-all ${metodeBayar === 'qris' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setMetodeBayar('qris')}
                    >
                      QRIS
                    </button>
                  </div>
              </div>
            </div>

            {/* Periode */}
            <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">Mulai Bulan</label>
                <select 
                  value={bulan}
                  onChange={(e) => setBulan(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({length: 12}).map((_, i) => (
                    <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', {month: 'long'})}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">Tahun</label>
                <select 
                  value={tahun}
                  onChange={(e) => setTahun(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">Nominal Pembayaran (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-500 font-medium">Rp</span>
                  <input 
                    type="text" 
                    className={`w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all ${activeTab === 'masal' ? 'text-slate-400 bg-slate-50 italic' : 'text-slate-800'}`}
                    value={activeTab === 'masal' ? "Otomatis Disesuaikan (Reguler/Saudara)" : formatRupiah(nominal)}
                    onChange={handleNominalChange}
                    placeholder="Contoh: 110.000"
                    disabled={activeTab === 'masal'}
                  />
                </div>
                {activeTab === 'masal' && (
                  <p className="text-xs text-slate-500 mt-1">
                    *Sistem akan menghitung tagihan tiap anak sesuai status Keluarganya.
                  </p>
                )}
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting || (activeTab === 'masal' && selectedSantriIds.length === 0) || (activeTab === 'satu' && !selectedSantri)}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-emerald-900/10"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Konfirmasi Pembayaran"}
                </button>
              </div>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
