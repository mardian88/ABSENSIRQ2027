"use client"

import { useState, useEffect } from "react";
import { getHalaqohOptions, getRekapBulananData, RekapSantriRow } from "./actions";
import { Download, Search, Loader2, Calendar, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

export function RekapBulananClient() {
  const [halaqohOptions, setHalaqohOptions] = useState<{id: string, namaHalaqoh: string}[]>([]);
  
  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());
  const [selectedHalaqoh, setSelectedHalaqoh] = useState("");
  
  const [data, setData] = useState<RekapSantriRow[]>([]);
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
      setHasSearched(true);
    } else {
      toast.error(res.message || "Gagal memuat data");
    }
    setIsLoading(false);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const isWeekend = (day: number, month: number, year: number) => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday
  };

  const daysInMonth = getDaysInMonth(selectedBulan, selectedTahun);
  const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const renderStatus = (status?: string) => {
    if (!status) return "";
    switch(status) {
      case 'hadir':
      case 'terlambat': return <span className="text-emerald-600 font-bold">H</span>;
      case 'izin': return <span className="text-amber-500 font-bold">I</span>;
      case 'sakit': return <span className="text-blue-500 font-bold">S</span>;
      case 'alpa': return <span className="text-rose-500 font-bold">A</span>;
      default: return "";
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
    XLSX.writeFile(workbook, \Rekap_Bulanan_\_\_\.xlsx\);
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
                      className={\px-1.5 py-3 font-semibold text-center border-r border-slate-200 min-w-[30px] \\}
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
                    <td className="px-2 py-2 text-center text-slate-600 border-r border-slate-200">{row.jenisKelamin}</td>
                    {daysArray.map(day => (
                      <td 
                        key={day} 
                        className={\px-1.5 py-2 text-center border-r border-slate-200 \\}
                      >
                        {renderStatus(row.kehadiran[day])}
                      </td>
                    ))}
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
