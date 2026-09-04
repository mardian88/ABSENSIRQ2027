"use client"

import { useState, useEffect } from "react";
import { getHalaqohOptions, getRekapBulananData, updateGender, updateAbsensiManual, RekapSantriRow } from "./actions";
import { Download, Search, Loader2, Calendar, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

export function RekapBulananClient() {
  const [halaqohOptions, setHalaqohOptions] = useState<{id: string, namaHalaqoh: string}[]>([]);
  
  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());
  const [selectedHalaqoh, setSelectedHalaqoh] = useState("");
  
  const [data, setData] = useState<RekapSantriRow[]>([]);
  const [holidays, setHolidays] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const months = [
    { value: 1, label: "Januari" }, { value: 2, label: "Februari" }, { value: 3, label: "Maret" },
    { value: 4, label: "April" }, { value: 5, label: "Mei" }, { value: 6, label: "Juni" },
    { value: 7, label: "Juli" }, { value: 8, label: "Agustus" }, { value: 9, label: "September" },
    { value: 10, label: "Oktober" }, { value: 11, label: "November" }, { value: 12, label: "Desember" }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    const fetchHalaqoh = async () => {
      const res = await getHalaqohOptions();
      if (res.success && res.data) {
        setHalaqohOptions(res.data);
      }
    };
    fetchHalaqoh();
  }, []);

  const handleTampilkan = async () => {
    if (!selectedHalaqoh) {
      toast.error("Pilih halaqah terlebih dahulu");
      return;
    }
    
    setIsLoading(true);
    const res = await getRekapBulananData(selectedBulan, selectedTahun, selectedHalaqoh);
    if (res.success && res.data) {
      setData(res.data);
      setHolidays(res.holidays || {});
      setHasSearched(true);
    } else {
      toast.error(res.message || "Gagal memuat data");
    }
    setIsLoading(false);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedBulan, selectedTahun);
  const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const handleGenderChange = async (idSantri: string, newGender: string) => {
    // Update local state first for instant feedback
    setData(prev => prev.map(row => 
      row.id === idSantri ? { ...row, jenisKelamin: newGender } : row
    ));
    
    const res = await updateGender(idSantri, newGender);
    if (!res.success) {
      toast.error("Gagal mengubah jenis kelamin di database");
    }
  };

  const handleAbsensiChange = async (idSantri: string, day: number, newStatus: string) => {
    // Update local state
    setData(prev => prev.map(row => {
      if (row.id !== idSantri) return row;
      
      const newKehadiran = { ...row.kehadiran, [day]: newStatus };
      if (!newStatus) delete newKehadiran[day];

      // Recalculate totals
      let h = 0, i = 0, s = 0, a = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const stat = newKehadiran[d];
        if (stat === 'hadir' || stat === 'terlambat') h++;
        else if (stat === 'izin') i++;
        else if (stat === 'sakit') s++;
        else if (stat === 'alpa') a++;
      }

      return {
        ...row,
        kehadiran: newKehadiran,
        total: { hadir: h, izin: i, sakit: s, alpa: a }
      };
    }));

    // Update database
    const dateStr = `${selectedTahun}-${String(selectedBulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const res = await updateAbsensiManual(idSantri, dateStr, newStatus);
    if (!res.success) {
      toast.error("Gagal menyimpan perubahan ke database");
    }
  };



  const handleExport = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk di-export");
      return;
    }

    const halaqohName = halaqohOptions.find(h => h.id === selectedHalaqoh)?.namaHalaqoh || 'Semua';
    const monthName = months.find(m => m.value === selectedBulan)?.label;

    const exportData = data.map((row, index) => {
      const rowData: any = {
        "URT": index + 1,
        "DP (NIS)": row.nomorInduk,
        "NAMA SISWA": row.namaLengkap,
        "L/P": row.jenisKelamin,
      };

      for (let day = 1; day <= daysInMonth; day++) {
        let val = "";
        const stat = row.kehadiran[day];
        if (stat === 'hadir' || stat === 'terlambat') val = "H";
        else if (stat === 'izin') val = "I";
        else if (stat === 'sakit') val = "S";
        else if (stat === 'alpa') val = "A";
        rowData[day.toString()] = val;
      }

      rowData["TOTAL H"] = row.total.hadir;
      rowData["TOTAL I"] = row.total.izin;
      rowData["TOTAL S"] = row.total.sakit;
      rowData["TOTAL A"] = row.total.alpa;

      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Auto fit columns
    const colWidths = [
      { wch: 5 }, // URT
      { wch: 10 }, // NIS
      { wch: 30 }, // NAMA
      { wch: 5 }, // L/P
      ...Array(daysInMonth).fill({ wch: 4 }), // Dates
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 } // Totals
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Bulanan");
    XLSX.writeFile(workbook, `Rekap_Bulanan_${halaqohName}_${monthName}_${selectedTahun}.xlsx`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" /> Rekap Kehadiran Bulanan
          </h1>
          <p className="text-slate-500 mt-1">Laporan rekapitulasi kehadiran santri per bulan</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Bulan</label>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Tahun</label>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Halaqah</label>
            <select
              value={selectedHalaqoh}
              onChange={(e) => setSelectedHalaqoh(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Pilih Halaqah --</option>
              {halaqohOptions.map(h => (
                <option key={h.id} value={h.id}>{h.namaHalaqoh}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTampilkan}
              disabled={isLoading || !selectedHalaqoh}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Tampilkan
            </button>
            <button
              onClick={handleExport}
              disabled={data.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              title="Export ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {hasSearched && data.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-max text-sm">
              <thead>
                <tr className="bg-indigo-50 border-b border-slate-200 text-indigo-900">
                  <th className="px-3 py-3 font-semibold text-center border-r border-slate-200">NO</th>
                  <th className="px-4 py-3 font-semibold text-left border-r border-slate-200 sticky left-0 z-10 bg-indigo-50">NAMA SISWA</th>
                  <th className="px-2 py-3 font-semibold text-center border-r border-slate-200">L/P</th>
                  {daysArray.map(day => (
                    <th 
                      key={day} 
                      title={holidays[day] || undefined}
                      className={`px-1.5 py-3 font-semibold text-center border-r border-slate-200 min-w-[30px] ${holidays[day] ? 'bg-orange-100 text-orange-800' : ''}`}
                    >
                      {day}
                    </th>
                  ))}
                  <th className="px-2 py-3 font-semibold text-center border-r border-slate-200 bg-emerald-50 text-emerald-800">H</th>
                  <th className="px-2 py-3 font-semibold text-center border-r border-slate-200 bg-amber-50 text-amber-800">I</th>
                  <th className="px-2 py-3 font-semibold text-center border-r border-slate-200 bg-blue-50 text-blue-800">S</th>
                  <th className="px-2 py-3 font-semibold text-center bg-rose-50 text-rose-800">A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 text-center text-slate-500 border-r border-slate-200">{index + 1}</td>
                    <td className="px-4 py-2 font-medium text-slate-800 border-r border-slate-200 sticky left-0 z-10 bg-white">
                      {row.namaLengkap}
                    </td>
                    <td className="px-0 py-0 border-r border-slate-200 bg-white">
                      <select
                        value={row.jenisKelamin}
                        onChange={(e) => handleGenderChange(row.id, e.target.value)}
                        className="w-full h-full py-2 bg-transparent text-center text-slate-600 outline-none cursor-pointer hover:bg-slate-100 appearance-none font-medium"
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="L">L</option>
                        <option value="P">P</option>
                      </select>
                    </td>
                    {daysArray.map(day => {
                      const stat = row.kehadiran[day] || "";
                      let textColor = "text-slate-400";
                      if (stat === 'hadir' || stat === 'terlambat') textColor = "text-emerald-600";
                      else if (stat === 'izin') textColor = "text-amber-500";
                      else if (stat === 'sakit') textColor = "text-blue-500";
                      else if (stat === 'alpa') textColor = "text-rose-500";
                      
                      return (
                        <td 
                          key={day}
                          title={holidays[day] || undefined}
                          className={`px-0 py-0 text-center border-r border-slate-200 ${holidays[day] ? 'bg-orange-50/50' : 'bg-white'}`}
                        >
                          <select
                            value={stat === 'terlambat' ? 'hadir' : stat}
                            onChange={(e) => handleAbsensiChange(row.id, day, e.target.value)}
                            className={`w-full h-full py-2 bg-transparent text-center font-bold outline-none cursor-pointer hover:bg-slate-100 appearance-none ${textColor}`}
                            style={{ textAlignLast: 'center' }}
                          >
                            <option value=""></option>
                            <option value="hadir" className="text-emerald-600">H</option>
                            <option value="izin" className="text-amber-500">I</option>
                            <option value="sakit" className="text-blue-500">S</option>
                            <option value="alpa" className="text-rose-500">A</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center font-bold text-emerald-600 border-r border-slate-200 bg-emerald-50/30">{row.total.hadir || ""}</td>
                    <td className="px-2 py-2 text-center font-bold text-amber-500 border-r border-slate-200 bg-amber-50/30">{row.total.izin || ""}</td>
                    <td className="px-2 py-2 text-center font-bold text-blue-500 border-r border-slate-200 bg-blue-50/30">{row.total.sakit || ""}</td>
                    <td className="px-2 py-2 text-center font-bold text-rose-500 bg-rose-50/30">{row.total.alpa || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasSearched && data.length === 0 && (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Data Tidak Ditemukan</h3>
          <p className="text-slate-500">Tidak ada santri aktif atau data kehadiran untuk halaqah ini.</p>
        </div>
      )}
    </div>
  );
}
