"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Printer, X, GripVertical, 
  Save, ArrowDownAZ, ArrowUpZA, Clock, FileDown,
  MoreVertical, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getHalaqahBoardData, 
  updateSantriHalaqoh, 
  createHalaqoh, 
  renameHalaqoh, 
  deleteHalaqoh 
} from './actions';

type SantriItem = {
  id: string;
  content: string;
  nis: string;
};

type HalaqahColumn = {
  id: string;
  title: string;
  isProtected: boolean;
  items: SantriItem[];
};

const HalaqahBoard = () => {
  const [columns, setColumns] = useState<HalaqahColumn[]>([]);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnText, setEditColumnText] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [activeSortMenu, setActiveSortMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Native Drag and Drop States
  const [draggedInfo, setDraggedInfo] = useState<{ type: string; colId: string; item?: SantriItem; index: number } | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const fetchBoardData = async () => {
    setIsLoading(true);
    try {
      const res = await getHalaqahBoardData();
      if (res.success && res.columns) {
        setColumns(res.columns);
      } else {
        toast.error(res.message || "Gagal mengambil data");
      }
    } catch (error: any) {
      toast.error('Error fetching data:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, []);

  const handleItemDragStart = (e: React.DragEvent, colId: string, item: SantriItem, index: number) => {
    e.stopPropagation(); 
    setDraggedInfo({ type: 'item', colId, item, index });
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => { if (e.target instanceof HTMLElement) e.target.classList.add('opacity-50', 'scale-95'); }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedInfo(null);
    setDragOverColId(null);
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('opacity-50', 'scale-95', 'opacity-40', 'border-indigo-400', 'border-dashed');
    }
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDrop = async (e: React.DragEvent, destColId: string) => {
    e.preventDefault();
    setDragOverColId(null);

    if (!draggedInfo) return;

    if (draggedInfo.type === 'item') {
      const { colId: sourceColId, item: movedItem } = draggedInfo;
      if (sourceColId === destColId || !movedItem) return;

      // Optimistic Update UI
      const newColumns = JSON.parse(JSON.stringify(columns));
      const sourceColIndex = newColumns.findIndex((col: HalaqahColumn) => col.id === sourceColId);
      const destColIndex = newColumns.findIndex((col: HalaqahColumn) => col.id === destColId);

      if (sourceColIndex !== -1 && destColIndex !== -1) {
        newColumns[sourceColIndex].items = newColumns[sourceColIndex].items.filter((i: SantriItem) => i.id !== movedItem.id);
        newColumns[destColIndex].items.push(movedItem);
        setColumns(newColumns);
        
        // Update to DB
        setIsSaving(true);
        const res = await updateSantriHalaqoh(movedItem.id, destColId);
        setIsSaving(false);
        if (!res.success) {
           toast.error(res.message || "Gagal memindahkan santri");
           fetchBoardData(); // Revert on fail
        }
      }
    }
    setDraggedInfo(null);
  };

  const handleAddHalaqah = async () => {
    const halaqahCount = columns.length; 
    const title = `Halaqah ${halaqahCount}`;
    
    setIsSaving(true);
    const res = await createHalaqoh(title);
    setIsSaving(false);

    if (res.success && res.id) {
       setColumns([...columns, {
         id: res.id,
         title: title,
         isProtected: false,
         items: []
       }]);
       toast.success("Halaqah baru ditambahkan");
    } else {
       toast.error(res.message || "Gagal membuat halaqah");
    }
  };

  const handleRemoveItemFromHalaqah = async (colId: string, item: SantriItem) => {
    if (colId === 'unassigned') return; // Cannot remove from unassigned

    // Move back to unassigned in UI
    const newColumns = [...columns];
    const colIndex = newColumns.findIndex(col => col.id === colId);
    const unassignedColIndex = newColumns.findIndex(col => col.id === 'unassigned');
    
    newColumns[colIndex].items = newColumns[colIndex].items.filter(i => i.id !== item.id);
    if (unassignedColIndex !== -1) {
       newColumns[unassignedColIndex].items.push(item);
    }
    setColumns(newColumns);

    setIsSaving(true);
    const res = await updateSantriHalaqoh(item.id, null);
    setIsSaving(false);

    if (!res.success) {
       toast.error("Gagal melepaskan santri dari halaqah");
       fetchBoardData();
    }
  };

  const handleDeleteColumn = async (colId: string) => {
    const colToDelete = columns.find(col => col.id === colId);
    if (!colToDelete || colToDelete.isProtected) return;
    
    if (colToDelete.items.length > 0 && !confirm(`Halaqah ini masih memiliki ${colToDelete.items.length} santri. Anda yakin ingin menghapusnya? Santri akan dikembalikan ke status "Belum ada halaqah".`)) {
       return;
    }

    // Optimistic UI
    const newColumns = columns.filter(col => col.id !== colId);
    if (colToDelete.items.length > 0) {
      const unassignedColIndex = newColumns.findIndex(col => col.id === 'unassigned');
      if (unassignedColIndex !== -1) {
        newColumns[unassignedColIndex].items = [...newColumns[unassignedColIndex].items, ...colToDelete.items];
      }
    }
    setColumns(newColumns);

    setIsSaving(true);
    const res = await deleteHalaqoh(colId);
    setIsSaving(false);
    
    if (!res.success) {
       toast.error("Gagal menghapus halaqah");
       fetchBoardData();
    } else {
       toast.success("Halaqah berhasil dihapus");
    }
  };

  const saveColumnEdit = async () => {
    if (!editColumnText.trim() || !editingColumnId) return;
    
    const colIndex = columns.findIndex(col => col.id === editingColumnId);
    if (columns[colIndex].title === editColumnText.trim()) {
       setEditingColumnId(null);
       return; // No change
    }

    const newColumns = [...columns];
    if (colIndex !== -1) {
      newColumns[colIndex].title = editColumnText.trim();
      setColumns(newColumns);
    }
    
    setIsSaving(true);
    const res = await renameHalaqoh(editingColumnId, editColumnText.trim());
    setIsSaving(false);
    
    if (!res.success) {
       toast.error("Gagal mengubah nama halaqah");
       fetchBoardData();
    }
    setEditingColumnId(null);
  };

  const handleSort = (colId: string, sortType: string) => {
    const newColumns = [...columns];
    const colIndex = newColumns.findIndex(col => col.id === colId);
    if (colIndex === -1) return;

    const items = [...newColumns[colIndex].items];

    if (sortType === 'asc') {
      items.sort((a, b) => a.content.localeCompare(b.content));
    } else if (sortType === 'desc') {
      items.sort((a, b) => b.content.localeCompare(a.content));
    } else if (sortType === 'recent') {
      items.sort((a, b) => b.id.localeCompare(a.id)); // Fallback sorting for recent
    }

    newColumns[colIndex].items = items;
    setColumns(newColumns);
    setActiveSortMenu(null);
  };

  const ensureXLSXLoaded = async () => {
    if ((window as any).XLSX) return (window as any).XLSX;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
      script.onload = () => resolve((window as any).XLSX);
      script.onerror = () => reject(new Error('Gagal memuat library Excel'));
      document.body.appendChild(script);
    });
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const XLSX: any = await ensureXLSXLoaded();
      
      let maxItemsCount = 0;
      columns.forEach(col => {
        if (col.items.length > maxItemsCount) maxItemsCount = col.items.length;
      });

      const exportDataRows = [];
      // Row 1: Headers
      exportDataRows.push(columns.map(c => c.title));

      // Row n: Items
      for (let i = 0; i < maxItemsCount; i++) {
        const row = columns.map(col => col.items[i] ? col.items[i].content : "");
        exportDataRows.push(row);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(exportDataRows);
      
      const wscols = columns.map(() => ({ wch: 25 })); 
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Halaqah");
      XLSX.writeFile(workbook, `Rekap_Halaqah_${new Date().toLocaleDateString('id-ID')}.xlsx`);

    } catch (error) {
      console.error("Error exporting Excel file:", error);
      toast.error("Gagal mengekspor file Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && columns.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px] w-full bg-slate-50">
        <p className="text-lg font-semibold text-slate-600 animate-pulse">Memuat Papan Halaqah...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-slate-50 p-4 md:p-6 font-sans border border-slate-200 rounded-xl">
      {/* HEADER SECTION */}
      <div className="mb-6 print:hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            Board Penentuan Halaqah
            {isSaving && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full animate-pulse flex items-center"><Save className="w-3 h-3 mr-1" /> Menyimpan</span>}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Kelola pembagian kelompok belajar santri dengan fitur geser/tarik.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <button onClick={handleAddHalaqah} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
            <Plus className="w-4 h-4" /> Halaqah Baru
          </button>
          
          <button onClick={handleExportExcel} disabled={isExporting} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm disabled:opacity-50">
            <FileDown className="w-4 h-4" /> {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>

          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
            <Printer className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* ACTION BAR: SEARCH ONLY */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 print:hidden justify-end">
        {/* SEARCH BOX */}
        <div className="flex gap-2 max-w-sm w-full md:w-72 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 transition-all focus-within:ring-2 ring-indigo-100">
          <Search className="w-4 h-4 text-slate-400 mt-1.5 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama santri..."
            className="flex-1 px-1 py-1.5 outline-none text-slate-700 text-sm w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-rose-500 mr-2 mt-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* BOARD AREA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 xl:gap-5 items-start print:grid-cols-3">
        {columns.map((column, index) => (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col rounded-xl overflow-hidden print:bg-white print:border print:border-slate-300 print:break-inside-avoid
              ${dragOverColId === column.id ? 'bg-teal-50 ring-2 ring-teal-400' : 'bg-slate-100 border border-slate-200 shadow-sm'}
              transition-all duration-200 print:shadow-none print:h-auto
            `}
          >
            {/* COLUMN HEADER */}
            <div className={`p-3 flex justify-between items-center border-b relative group ${column.isProtected ? 'bg-slate-200 border-slate-300 print:bg-slate-100' : 'bg-white border-slate-200 print:border-b-2 print:border-slate-800'}`}>
              
              <div className="flex items-center gap-2 flex-1 w-full overflow-hidden">
                {editingColumnId === column.id ? (
                  <input
                    autoFocus
                    value={editColumnText}
                    onChange={(e) => setEditColumnText(e.target.value)}
                    onBlur={saveColumnEdit}
                    onKeyDown={(e) => e.key === 'Enter' && saveColumnEdit()}
                    className="w-full px-1 py-0.5 border border-indigo-300 rounded font-bold text-slate-700 outline-none text-sm"
                  />
                ) : (
                  <h3 
                    className={`font-bold text-slate-800 truncate text-sm flex-1 ${!column.isProtected && 'cursor-pointer hover:text-indigo-600 print:text-black'}`}
                    onClick={() => !column.isProtected && setEditingColumnId(column.id) || setEditColumnText(column.title)}
                  >
                    {column.title}
                  </h3>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="bg-slate-300/80 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full print:bg-transparent print:text-black">
                  {column.items.length}
                </span>

                {/* Header Action Menu */}
                <div className="relative print:hidden">
                  <button 
                    onClick={() => setActiveSortMenu(activeSortMenu === column.id ? null : column.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                    title="Opsi & Urutkan Data"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {activeSortMenu === column.id && (
                    <>
                      {/* Invisible overlay untuk menutup menu saat klik di luar */}
                      <div className="fixed inset-0 z-10 cursor-default" onClick={(e) => { e.stopPropagation(); setActiveSortMenu(null); }}></div>
                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 shadow-lg rounded-lg z-20 py-1 w-36 overflow-hidden">
                        <button onClick={() => handleSort(column.id, 'asc')} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 relative z-30">
                          <ArrowDownAZ className="w-3.5 h-3.5" /> Sort A - Z
                        </button>
                        <button onClick={() => handleSort(column.id, 'desc')} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 relative z-30">
                          <ArrowUpZA className="w-3.5 h-3.5" /> Sort Z - A
                        </button>
                        {!column.isProtected && (
                          <div className="border-t border-slate-100 mt-1 pt-1">
                            <button onClick={() => handleDeleteColumn(column.id)} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 relative z-30">
                              <Trash2 className="w-3.5 h-3.5" /> Hapus Halaqah
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN ITEMS LIST */}
            <div className="flex-1 p-2 overflow-y-auto min-h-[150px] max-h-[350px] print:max-h-none print:overflow-visible space-y-1.5 custom-scrollbar">
              {column.items.filter(item => item.content.toLowerCase().includes(searchQuery.toLowerCase())).map((item, index) => (
                <div
                  key={item.id}
                  draggable="true"
                  onDragStart={(e) => handleItemDragStart(e, column.id, item, index)}
                  onDragEnd={handleDragEnd}
                  className={`group flex items-center justify-between bg-white py-1.5 px-2 rounded-md text-sm border cursor-grab active:cursor-grabbing
                    ${draggedInfo?.type === 'item' && draggedInfo.item?.id === item.id ? 'shadow-md border-indigo-400' : 'border-slate-200 hover:border-indigo-200 shadow-sm print:border-slate-300 print:shadow-none'}
                  `}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="text-slate-300 group-hover:text-slate-400 print:hidden shrink-0">
                      <GripVertical className="w-3 h-3" />
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <span className="text-slate-800 font-semibold truncate text-xs print:text-black">
                        {item.content}
                      </span>
                      <span className="text-slate-400 text-[10px] truncate">
                        NIS: {item.nis}
                      </span>
                    </div>
                  </div>

                  {!column.isProtected && (
                     <button 
                       onClick={() => handleRemoveItemFromHalaqah(column.id, item)}
                       className="text-slate-300 hover:text-amber-600 opacity-0 group-hover:opacity-100 print:hidden transition-opacity p-1 shrink-0 ml-1"
                       title="Lepas dari halaqah ini"
                     >
                       <X className="w-3 h-3" />
                     </button>
                  )}
                </div>
              ))}
              
              {column.items.filter(item => item.content.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && searchQuery && (
                <div className="text-center py-4 text-slate-400 text-xs italic print:hidden">
                  "{searchQuery}" tidak ditemukan
                </div>
              )}
              
              {column.items.length === 0 && !searchQuery && (
                <div className="text-center py-6 text-slate-400 text-xs italic print:hidden border-2 border-dashed border-slate-200 rounded-lg">
                  {column.isProtected ? 'Semua santri telah kebagian halaqah' : 'Tarik nama santri ke sini'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
};

export default HalaqahBoard;
