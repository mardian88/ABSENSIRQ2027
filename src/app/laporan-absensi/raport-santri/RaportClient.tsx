'use client'

import { useState, useMemo, useEffect } from "react"
import { toast } from "@/components/ui/toast"
import { ChevronRight, Filter, AlertCircle, Save, CheckCircle, Search, Zap, RefreshCw, FileText } from "lucide-react"
import { saveCapaianSurah } from "./actions"

export default function RaportClient({ data }: { data: any }) {
  const { activeSemester, allHalaqah, santriList, surahs, predicates } = data
  
  const [selectedHalaqah, setSelectedHalaqah] = useState<string>("")
  const [currentSantriIndex, setCurrentSantriIndex] = useState(0)
  const [juzFilter, setJuzFilter] = useState<number | null>(30)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Client-side state for Capaian data for the current santri
  // Structure: Record<idSurah, CapaianSurahData>
  const [capaianData, setCapaianData] = useState<Record<string, any>>({})

  const currentSantri = santriList[currentSantriIndex]

  // Filter surahs based on selected Juz and Search
  const filteredSurahs = useMemo(() => {
    return surahs.filter((s: any) => {
      const matchJuz = juzFilter ? s.juz === juzFilter : true;
      const matchSearch = s.namaSurah.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.nomorSurah.toString().includes(searchQuery)
      return matchJuz && matchSearch;
    })
  }, [surahs, juzFilter, searchQuery])

  // Get predicate automatically based on score
  const getPredicate = (type: 'KB' | 'KH', score: number) => {
    if (isNaN(score)) return ""
    const match = predicates.find((p: any) => p.jenis === type && score >= p.rentangMin && score <= p.rentangMax)
    return match ? match.predikat : ""
  }

  const handleScoreChange = (idSurah: string, type: 'KB' | 'KH', value: string) => {
    const numValue = parseInt(value, 10)
    const isValid = !isNaN(numValue)

    setCapaianData(prev => {
      const current = prev[idSurah] || {}
      const updated = { ...current }

      if (type === 'KB') {
        updated.nilaiKb = isValid ? numValue : null
        updated.predikatKb = isValid ? getPredicate('KB', numValue) : ""
      } else {
        updated.nilaiKh = isValid ? numValue : null
        updated.predikatKh = isValid ? getPredicate('KH', numValue) : ""
      }

      return { ...prev, [idSurah]: updated }
    })
  }

  const handleFieldChange = (idSurah: string, field: string, value: any) => {
    setCapaianData(prev => ({
      ...prev,
      [idSurah]: {
        ...(prev[idSurah] || {}),
        [field]: value
      }
    }))
  }

  const saveAll = async () => {
    if (!currentSantri || !activeSemester || !selectedHalaqah) {
      toast({
        title: "Gagal Menyimpan",
        description: "Pastikan Halaqah dan Santri terpilih, dan Semester aktif sudah diatur.",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      const capaianArray = Object.keys(capaianData).map(idSurah => ({
        idSurah,
        ...capaianData[idSurah]
      }))

      const { saveCapaianSurah } = await import('./actions')
      const res = await saveCapaianSurah(currentSantri.id, activeSemester.id, selectedHalaqah, capaianArray)
      if (res.success) {
        toast({
          title: "Berhasil",
          description: "Data capaian surah berhasil disimpan."
        })
      } else {
        throw new Error(res.error)
      }
    } catch (e: any) {
      toast({
        title: "Terjadi Kesalahan",
        description: e.message,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    async function loadData() {
      if (!currentSantri || !activeSemester) {
        setCapaianData({})
        return
      }
      try {
        const { getCapaianSantri } = await import('./actions')
        const { details } = await getCapaianSantri(currentSantri.id, activeSemester.id)
        const newData: Record<string, any> = {}
        details.forEach((d: any) => {
          newData[d.idSurah] = {
            statusSetoran: d.statusSetoran,
            nilaiKb: d.nilaiKb,
            predikatKb: d.predikatKb,
            catatanKb: d.catatanKb,
            nilaiKh: d.nilaiKh,
            predikatKh: d.predikatKh,
            catatanKh: d.catatanKh,
            tanggalUjian: d.tanggalUjian,
            isVerifikasi: d.isVerifikasi
          }
        })
        setCapaianData(newData)
      } catch (e) {
        console.error("Failed to load capaian:", e)
      }
    }
    loadData()
  }, [currentSantri?.id, activeSemester?.id])

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="px-8 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span>Laporan</span>
            <ChevronRight className="w-3 h-3" />
            <span>Raport Santri</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-emerald-700 font-bold">Capaian Surah (KB & KH)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded border shadow-sm font-medium">
              <span className="text-slate-500">Semester:</span>
              <strong className="text-slate-900">{activeSemester?.nama} {activeSemester?.tahunAjaran}</strong>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Capaian Surah & Matriks Penilaian Hafalan</h1>
            <p className="text-sm text-slate-500 mt-1">Manajemen nilai Kemampuan Bacaan (KB) dan Kemampuan Hafalan (KH) semester santri.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={saveAll}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Semua Capaian
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8 space-y-6 max-w-[1520px] mx-auto w-full">
        {/* Halaqah Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <label className="text-sm font-bold text-slate-700">Pilih Halaqah:</label>
          <select 
            value={selectedHalaqah} 
            onChange={e => {
              setSelectedHalaqah(e.target.value)
              setCurrentSantriIndex(0)
            }}
            className="border-slate-300 rounded-lg text-sm px-3 py-2 w-64"
          >
            <option value="">-- Pilih Halaqah --</option>
            {allHalaqah.map((h: any) => (
              <option key={h.id} value={h.id}>{h.nama} ({h.namaMusyrif})</option>
            ))}
          </select>

          {currentSantri && (
            <div className="ml-auto">
                <a href={`/laporan-absensi/raport-santri/cetak/${currentSantri.id}?semester=${activeSemester?.id}`} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-all">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Cetak Raport Santri Ini
                </a>
            </div>
          )}
        </div>

        {selectedHalaqah && santriList.length > 0 ? (
          <>
            {/* Quick Stats / Santri Nav */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Santri Aktif Dievaluasi</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-bold text-lg">
                      {currentSantri.namaLengkap.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{currentSantri.namaLengkap}</h3>
                      <div className="text-xs text-slate-500 mt-1">NIS: {currentSantri.nis}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                  <button 
                    disabled={currentSantriIndex === 0}
                    onClick={() => setCurrentSantriIndex(i => i - 1)}
                    className="text-slate-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                  >
                    &larr; Sebelumnya
                  </button>
                  <span className="text-slate-400 text-xs">Santri {currentSantriIndex + 1} dari {santriList.length}</span>
                  <button 
                    disabled={currentSantriIndex === santriList.length - 1}
                    onClick={() => setCurrentSantriIndex(i => i + 1)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold disabled:opacity-50"
                  >
                    Selanjutnya &rarr;
                  </button>
                </div>
              </div>

              <div className="xl:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-l-4 border-l-emerald-600">
                  <span className="text-slate-500 text-xs font-bold">Total Surah Diinput</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{Object.keys(capaianData).length}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-l-4 border-l-teal-600">
                  <span className="text-slate-500 text-xs font-bold">Juz Aktif</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">Juz {juzFilter || 'Semua'}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-l-4 border-l-amber-500">
                  <span className="text-slate-500 text-xs font-bold">Peringatan</span>
                  <div className="text-sm font-medium text-slate-700 mt-2">
                    Gunakan Auto-Save berkala
                  </div>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button onClick={() => setJuzFilter(30)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${juzFilter === 30 ? 'bg-emerald-100 text-emerald-800' : 'bg-white border text-slate-600'}`}>Juz 30</button>
                  <button onClick={() => setJuzFilter(29)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${juzFilter === 29 ? 'bg-emerald-100 text-emerald-800' : 'bg-white border text-slate-600'}`}>Juz 29</button>
                  <button onClick={() => setJuzFilter(28)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${juzFilter === 28 ? 'bg-emerald-100 text-emerald-800' : 'bg-white border text-slate-600'}`}>Juz 28</button>
                  <button onClick={() => setJuzFilter(null)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${juzFilter === null ? 'bg-emerald-100 text-emerald-800' : 'bg-white border text-slate-600'}`}>Semua Surah</button>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari surah..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-sm border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4 w-64">Surah</th>
                      <th className="py-3 px-3 w-40">Status Setoran</th>
                      <th className="py-3 px-4">Kemampuan Bacaan (KB)</th>
                      <th className="py-3 px-4">Kemampuan Hafalan (KH)</th>
                      <th className="py-3 px-3 w-32">Tgl Ujian</th>
                      <th className="py-3 px-3 w-24 text-center">Verif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredSurahs.map((s: any) => {
                      const data = capaianData[s.id] || {}
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 flex items-center justify-center bg-slate-100 border border-slate-200 rounded-md text-xs font-bold text-slate-600">
                                {s.nomorSurah}
                              </span>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  {s.namaSurah} 
                                  <span className="text-emerald-800 text-lg font-arabic">{s.namaArab}</span>
                                </div>
                                <div className="text-[11px] text-slate-500">{s.jumlahAyat} Ayat • {s.tipe}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <select 
                              value={data.statusSetoran || ""}
                              onChange={e => handleFieldChange(s.id, 'statusSetoran', e.target.value)}
                              className="text-xs border-slate-300 rounded p-1 w-full"
                            >
                              <option value="">- Pilih -</option>
                              <option value="Khatam Mutqin">Khatam Mutqin</option>
                              <option value="Dalam Muroja'ah">Dalam Muroja'ah</option>
                              <option value="Belum Setor">Belum Setor</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number" 
                                  min="0" max="100"
                                  placeholder="Nilai"
                                  value={data.nilaiKb ?? ""}
                                  onChange={e => handleScoreChange(s.id, 'KB', e.target.value)}
                                  className="w-16 p-1 text-sm border-slate-300 rounded text-center font-bold"
                                />
                                <input 
                                  type="text" 
                                  readOnly 
                                  placeholder="Predikat Otomatis"
                                  value={data.predikatKb || ""}
                                  className="w-32 p-1 text-xs border-slate-200 bg-slate-50 rounded text-slate-600"
                                />
                              </div>
                              <input 
                                type="text"
                                placeholder="Catatan Tajwid..."
                                value={data.catatanKb || ""}
                                onChange={e => handleFieldChange(s.id, 'catatanKb', e.target.value)}
                                className="w-full p-1 text-xs border-slate-300 rounded"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number" 
                                  min="0" max="100"
                                  placeholder="Nilai"
                                  value={data.nilaiKh ?? ""}
                                  onChange={e => handleScoreChange(s.id, 'KH', e.target.value)}
                                  className="w-16 p-1 text-sm border-slate-300 rounded text-center font-bold"
                                />
                                <input 
                                  type="text" 
                                  readOnly 
                                  placeholder="Predikat Otomatis"
                                  value={data.predikatKh || ""}
                                  className="w-32 p-1 text-xs border-slate-200 bg-slate-50 rounded text-slate-600"
                                />
                              </div>
                              <input 
                                type="text"
                                placeholder="Catatan Hafalan..."
                                value={data.catatanKh || ""}
                                onChange={e => handleFieldChange(s.id, 'catatanKh', e.target.value)}
                                className="w-full p-1 text-xs border-slate-300 rounded"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <input 
                              type="date"
                              value={data.tanggalUjian || ""}
                              onChange={e => handleFieldChange(s.id, 'tanggalUjian', e.target.value)}
                              className="text-xs border-slate-300 rounded p-1 w-full"
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input 
                              type="checkbox"
                              checked={data.isVerifikasi || false}
                              onChange={e => handleFieldChange(s.id, 'isVerifikasi', e.target.checked)}
                              className="rounded text-emerald-600 w-5 h-5 cursor-pointer"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-500">
            <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
            <p>Silakan pilih Halaqah yang memiliki santri aktif untuk mulai menginput nilai.</p>
          </div>
        )}
      </div>
    </div>
  )
}
