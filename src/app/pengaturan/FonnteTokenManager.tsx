"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Plus, Edit2, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { showConfirm } from "@/lib/sweetalert";
import { getFonnteTokens, saveFonnteToken, deleteFonnteToken, checkFonnteQuota } from "./actions";

export function FonnteTokenManager() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", token: "", isActive: false });
  const [saving, setSaving] = useState(false);
  const [checkingQuotaId, setCheckingQuotaId] = useState<string | null>(null);
  const [quotas, setQuotas] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const data = await getFonnteTokens();
      setTokens(data);
      // Auto check quota for all tokens
      data.forEach(t => checkQuota(t.id, t.token));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkQuota = async (id: string, token: string) => {
    setCheckingQuotaId(id);
    try {
      const res = await checkFonnteQuota(token);
      if (res.status && res.quota !== undefined) {
        setQuotas(prev => ({ ...prev, [id]: `${res.quota} (Max: ${res.messages || '?'})` }));
      } else {
        setQuotas(prev => ({ ...prev, [id]: res.reason || 'Error' }));
      }
    } catch (e) {
      setQuotas(prev => ({ ...prev, [id]: 'Failed' }));
    } finally {
      setCheckingQuotaId(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.token) {
      toast.error("Nama dan Token wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await saveFonnteToken({
        id: editingId || undefined,
        name: formData.name,
        token: formData.token,
        isActive: formData.isActive
      });
      toast.success("Token berhasil disimpan!");
      setIsEditing(false);
      loadTokens();
    } catch (e) {
      toast.error("Gagal menyimpan token");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setFormData({ name: t.name, token: t.token, isActive: t.isActive });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm("Hapus Token?", "Apakah Anda yakin ingin menghapus token Fonnte ini?", "Hapus", true)) {
      await deleteFonnteToken(id);
      toast.success("Token berhasil dihapus");
      loadTokens();
    }
  };

  const handleToggleActive = async (t: any) => {
    await saveFonnteToken({
      id: t.id,
      name: t.name,
      token: t.token,
      isActive: true // Force active, this will deactivate others
    });
    toast.success(`${t.name} sekarang menjadi token utama`);
    loadTokens();
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-slate-800">Daftar Akun Fonnte (Auto-Switch)</h3>
          <p className="text-xs text-slate-500">Tambahkan beberapa token. Sistem akan otomatis beralih jika kuota token utama habis.</p>
        </div>
        {!isEditing && (
          <Button size="sm" onClick={() => {
            setEditingId(null);
            setFormData({ name: "", token: "", isActive: tokens.length === 0 });
            setIsEditing(true);
          }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Tambah Akun
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Akun (Misal: RQM ABSEN)</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama penanda" />
            </div>
            <div className="space-y-2">
              <Label>Token API</Label>
              <Input value={formData.token} onChange={e => setFormData({...formData, token: e.target.value})} placeholder="Token Fonnte" type="password" />
            </div>
          </div>
          <div className="flex items-center gap-2">
             <input 
                type="checkbox"
                id="tokenAktif"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <Label htmlFor="tokenAktif" className="font-medium text-sm">Jadikan Token Utama Saat Ini</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Batal</Button>
          </div>
        </div>
      )}

      {tokens.length === 0 && !isEditing ? (
        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed text-slate-500 text-sm">
          Belum ada token Fonnte yang ditambahkan.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {tokens.map(t => (
            <div key={t.id} className={`p-4 rounded-xl border ${t.isActive ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'} flex flex-col md:flex-row gap-4 justify-between items-start md:items-center`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {t.isActive ? 'UTAMA' : 'CADANGAN'}
                  </span>
                  {t.isExhausted && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> KUOTA HABIS
                    </span>
                  )}
                  <h4 className="font-bold text-slate-800 text-sm">{t.name}</h4>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <div className="font-mono bg-slate-100 px-2 py-1 rounded">
                    {t.token.substring(0, 4)}••••••••{t.token.substring(t.token.length - 4)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Sisa Kuota:</span>
                    {checkingQuotaId === t.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <strong className={quotas[t.id] === '0' || quotas[t.id]?.includes('exceeded') ? 'text-rose-600' : 'text-emerald-600'}>
                        {quotas[t.id] || '?'}
                      </strong>
                    )}
                    <button onClick={() => checkQuota(t.id, t.token)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-emerald-600 transition-colors ml-1" title="Cek Kuota Sekarang">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                {!t.isActive && (
                   <Button size="sm" variant="outline" onClick={() => handleToggleActive(t)} className="text-xs h-8">
                     Jadikan Utama
                   </Button>
                )}
                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(t)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
