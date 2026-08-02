"use client";

import { useState } from "react";
import { showError } from "@/lib/sweetalert";
import { Send, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { submitPendaftaran } from "./actions";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PEKERJAAN_OPTIONS = [
  "PNS/TNI/Polri",
  "Pegawai Swasta",
  "Wiraswasta / Pengusaha",
  "Guru / Dosen",
  "Buruh / Pekerja Harian",
  "Petani / Peternak",
  "Pedagang",
  "Ibu Rumah Tangga",
  "Tenaga Medis",
  "Pegawai BUMN/BUMD",
  "Pensiunan",
  "Lainnya"
];

export default function PSBPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // State form
  const [formData, setFormData] = useState({
    // A. Calon Santri
    namaLengkap: "",
    tempatLahir: "Garut",
    tanggalLahir: "",
    jenisKelamin: "Laki-laki",
    alamatLengkap: "",
    isAlamatDomisiliSama: true,
    alamatDomisili: "",
    jenjangSekolah: "",
    jenjangSekolahLainnya: "",
    namaSekolah: "",
    kelasSekolah: "",
    ikutLes: false,
    hariLes: "",
    jamLesMulai: "",
    jamLesSelesai: "",
    
    // B. Orang Tua
    namaAyah: "",
    pekerjaanAyah: "",
    pekerjaanAyahLainnya: "",
    instansiAyah: "",
    namaIbu: "",
    pekerjaanIbu: "",
    pekerjaanIbuLainnya: "",
    instansiIbu: "",
    kontakOrtu: "",

    // C & D. Capaian
    sudahMengaji: false,
    bukuMengaji: "Iqro",
    capaianMengaji: "",
    sudahMenghafal: false,
    capaianHafalan: "",

    // E. Sumber Info
    sumberInfo: ""
  });

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(s => Math.min(s + 1, 5));
    window.scrollTo(0, 0);
  };

  const handlePrev = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo(0, 0);
  };

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const setCustomInvalid = (e: any, message: string) => {
    e.target.setCustomValidity(message);
  };

  const clearCustomInvalid = (e: any) => {
    e.target.setCustomValidity('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitPendaftaran(formData);
      setSuccess(true);
      window.scrollTo(0,0);
    } catch (error) {
      console.error(error);
      showError("Gagal", "Terjadi kesalahan saat mengirim pendaftaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tanggal max 5 tahun lalu
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 5);
  const maxDateString = maxDate.toISOString().split('T')[0];

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-6 animate-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Terima Kasih!</h1>
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm leading-relaxed border border-emerald-100">
            <p className="font-medium">
              Semua data pendaftaran sudah kami rekap dengan baik. Mohon ditunggu informasi update melalui WhatsApp yang dikirim dari Admin kami di nomor <strong>0813-9494-0401</strong>.
            </p>
            <p className="mt-2 text-xs opacity-80">
              Mohon di save nomor tersebut untuk menghindari pesan terdeteksi sebagai Spam.
            </p>
          </div>
          <div className="space-y-3 mt-8">
            <button 
              onClick={() => { setSuccess(false); setStep(1); setFormData({...formData, namaLengkap: ''}); }}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Daftarkan Anak Lain
            </button>
            <Link 
              href="/"
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors flex justify-center items-center"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-emerald-600 p-6 md:p-8 text-white">
          <h1 className="text-2xl md:text-3xl font-bold">Formulir Pendaftaran</h1>
          <p className="text-emerald-100 mt-2">Lengkapi data calon santri dengan benar dan akurat.</p>
          
          {/* Stepper Indicator */}
          <div className="flex items-center mt-6 gap-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-white' : 'bg-emerald-800/50'}`} />
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Step 1: Identitas Calon Santri */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">A. Identitas Calon Santri</h2>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap Calon Santri *</label>
                <input type="text" required 
                  onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Nama Lengkap')}
                  onInput={clearCustomInvalid}
                  value={formData.namaLengkap} 
                  onChange={e => updateForm('namaLengkap', e.target.value)} 
                  className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tempat Lahir *</label>
                  <input type="text" required 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Tempat Lahir')}
                    onInput={clearCustomInvalid}
                    value={formData.tempatLahir} 
                    onChange={e => updateForm('tempatLahir', e.target.value)} 
                    className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Lahir *</label>
                  <DatePicker
                    selected={formData.tanggalLahir ? new Date(formData.tanggalLahir) : null}
                    onChange={(date: Date | null) => {
                      if (date) {
                        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                        updateForm('tanggalLahir', localDate.toISOString().split('T')[0]);
                      } else {
                        updateForm('tanggalLahir', '');
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    maxDate={maxDate}
                    className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                    placeholderText="DD/MM/YYYY"
                    required
                  />
                  <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                    Minimal Usia Ananda 5 Tahun atau Lebih
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Kelamin *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" name="jk" checked={formData.jenisKelamin === 'Laki-laki'} onChange={() => updateForm('jenisKelamin', 'Laki-laki')} className="text-emerald-600" /> Laki-laki</label>
                  <label className="flex items-center gap-2"><input type="radio" name="jk" checked={formData.jenisKelamin === 'Perempuan'} onChange={() => updateForm('jenisKelamin', 'Perempuan')} className="text-emerald-600" /> Perempuan</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Lengkap *</label>
                <textarea required rows={3} 
                  onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Alamat Lengkap')}
                  onInput={clearCustomInvalid}
                  value={formData.alamatLengkap} 
                  onChange={e => updateForm('alamatLengkap', e.target.value)} 
                  className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={formData.isAlamatDomisiliSama} onChange={e => updateForm('isAlamatDomisiliSama', e.target.checked)} className="rounded text-emerald-600" />
                  Alamat Domisili sama dengan Alamat Lengkap
                </label>
              </div>

              {!formData.isAlamatDomisiliSama && (
                <div className="animate-in fade-in">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Domisili *</label>
                  <textarea required rows={3} 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Alamat Domisili')}
                    onInput={clearCustomInvalid}
                    value={formData.alamatDomisili} 
                    onChange={e => updateForm('alamatDomisili', e.target.value)} 
                    className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
              )}

              <button type="submit" className="w-full py-4 mt-4 bg-slate-900 text-white font-bold rounded-xl flex justify-center items-center gap-2">Lanjut <ChevronRight className="w-5 h-5"/></button>
            </form>
          )}

          {/* Step 2: Sekolah & Kegiatan Lain */}
          {step === 2 && (
            <form onSubmit={handleNextStep} className="space-y-5 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">A. Pendidikan & Kegiatan</h2>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Jenjang Sekolah *</label>
                <select required 
                  onInvalid={(e) => setCustomInvalid(e, 'Mohon pilih bagian kolom Jenjang Sekolah')}
                  onInput={clearCustomInvalid}
                  value={formData.jenjangSekolah} 
                  onChange={e => updateForm('jenjangSekolah', e.target.value)} 
                  className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Jenjang --</option>
                  <option value="TK">TK</option>
                  <option value="SD/MI">SD/MI</option>
                  <option value="SMP/MTs">SMP/MTs</option>
                  <option value="SMA/MA">SMA/MA</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {formData.jenjangSekolah === 'Lainnya' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Sebutkan Jenjang Lainnya *</label>
                  <input type="text" required 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Jenjang Sekolah Lainnya')}
                    onInput={clearCustomInvalid}
                    value={formData.jenjangSekolahLainnya} 
                    onChange={e => updateForm('jenjangSekolahLainnya', e.target.value)} 
                    className="w-full p-3 bg-slate-50 border rounded-xl" 
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Sekolah *</label>
                  <input type="text" required 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Nama Sekolah')}
                    onInput={clearCustomInvalid}
                    value={formData.namaSekolah} 
                    onChange={e => updateForm('namaSekolah', e.target.value)} 
                    className="w-full p-3 bg-slate-50 border rounded-xl" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Kelas *</label>
                  <input type="text" required 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Kelas')}
                    onInput={clearCustomInvalid}
                    value={formData.kelasSekolah} 
                    onChange={e => updateForm('kelasSekolah', e.target.value)} 
                    className="w-full p-3 bg-slate-50 border rounded-xl" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Kegiatan Lain *</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2"><input type="radio" name="les" checked={formData.ikutLes} onChange={() => updateForm('ikutLes', true)} className="text-emerald-600" /> Ikut Les/Bimbel</label>
                  <label className="flex items-center gap-2"><input type="radio" name="les" checked={!formData.ikutLes} onChange={() => updateForm('ikutLes', false)} className="text-emerald-600" /> Tidak Ikut Les/Bimbel Apapun</label>
                </div>
              </div>

              {formData.ikutLes && (
                <div className="p-4 bg-emerald-50 rounded-xl space-y-4 border border-emerald-100">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Hari Les *</label>
                    <input type="text" required 
                      onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Hari Les')}
                      onInput={clearCustomInvalid}
                      value={formData.hariLes} 
                      onChange={e => updateForm('hariLes', e.target.value)} 
                      className="w-full p-3 bg-white border rounded-xl" 
                      placeholder="Contoh: Senin & Rabu"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Jam Mulai *</label>
                      <input type="time" required 
                        onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Jam Mulai')}
                        onInput={clearCustomInvalid}
                        value={formData.jamLesMulai} 
                        onChange={e => updateForm('jamLesMulai', e.target.value)} 
                        className="w-full p-3 bg-white border rounded-xl" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Jam Selesai *</label>
                      <input type="time" required 
                        onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Jam Selesai')}
                        onInput={clearCustomInvalid}
                        value={formData.jamLesSelesai} 
                        onChange={e => updateForm('jamLesSelesai', e.target.value)} 
                        className="w-full p-3 bg-white border rounded-xl" 
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={handlePrev} className="px-4 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl"><ChevronLeft className="w-5 h-5"/></button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-xl flex justify-center items-center gap-2">Lanjut <ChevronRight className="w-5 h-5"/></button>
              </div>
            </form>
          )}

          {/* Step 3: Identitas Orang Tua */}
          {step === 3 && (
            <form onSubmit={handleNextStep} className="space-y-5 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">B. Identitas Orang Tua / Wali</h2>
              
              <div className="space-y-4">
                <h3 className="font-bold text-emerald-700">Data Ayah</h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Ayah *</label>
                  <input type="text" required 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Nama Ayah')}
                    onInput={clearCustomInvalid}
                    value={formData.namaAyah} 
                    onChange={e => updateForm('namaAyah', e.target.value)} 
                    className="w-full p-3 bg-slate-50 border rounded-xl" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pekerjaan Ayah *</label>
                  <select required 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon pilih bagian kolom Pekerjaan Ayah')}
                    onInput={clearCustomInvalid}
                    value={formData.pekerjaanAyah} 
                    onChange={e => updateForm('pekerjaanAyah', e.target.value)} 
                    className="w-full p-3 bg-slate-50 border rounded-xl"
                  >
                    <option value="">-- Pilih Pekerjaan --</option>
                    {PEKERJAAN_OPTIONS.filter(p => p !== 'Ibu Rumah Tangga').map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {formData.pekerjaanAyah === 'Lainnya' && (
                  <div className="animate-in fade-in">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sebutkan Pekerjaan Ayah Lainnya *</label>
                    <input type="text" required 
                      onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Pekerjaan Ayah Lainnya')}
                      onInput={clearCustomInvalid}
                      value={formData.pekerjaanAyahLainnya} 
                      onChange={e => updateForm('pekerjaanAyahLainnya', e.target.value)} 
                      className="w-full p-3 bg-slate-50 border rounded-xl" 
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Perusahaan/Instansi Tempat Bekerja *</label>
                  <input type="text" required 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Nama Perusahaan/Instansi Ayah')}
                    onInput={clearCustomInvalid}
                    value={formData.instansiAyah} 
                    onChange={e => updateForm('instansiAyah', e.target.value)} 
                    className="w-full p-3 bg-slate-50 border rounded-xl" 
                    placeholder="Wajib diisi" 
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-bold text-emerald-700">Data Ibu</h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Ibu *</label>
                  <input type="text" required 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Nama Ibu')}
                    onInput={clearCustomInvalid}
                    value={formData.namaIbu} 
                    onChange={e => updateForm('namaIbu', e.target.value)} 
                    className="w-full p-3 bg-slate-50 border rounded-xl" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pekerjaan Ibu *</label>
                  <select required 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon pilih bagian kolom Pekerjaan Ibu')}
                    onInput={clearCustomInvalid}
                    value={formData.pekerjaanIbu} 
                    onChange={e => updateForm('pekerjaanIbu', e.target.value)} 
                    className="w-full p-3 bg-slate-50 border rounded-xl"
                  >
                    <option value="">-- Pilih Pekerjaan --</option>
                    {PEKERJAAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {formData.pekerjaanIbu === 'Lainnya' && (
                  <div className="animate-in fade-in">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sebutkan Pekerjaan Ibu Lainnya *</label>
                    <input type="text" required 
                      onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Pekerjaan Ibu Lainnya')}
                      onInput={clearCustomInvalid}
                      value={formData.pekerjaanIbuLainnya} 
                      onChange={e => updateForm('pekerjaanIbuLainnya', e.target.value)} 
                      className="w-full p-3 bg-slate-50 border rounded-xl" 
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Perusahaan/Instansi Tempat Bekerja *</label>
                  <input type="text" required 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Nama Perusahaan/Instansi Ibu')}
                    onInput={clearCustomInvalid}
                    value={formData.instansiIbu} 
                    onChange={e => updateForm('instansiIbu', e.target.value)} 
                    className="w-full p-3 bg-slate-50 border rounded-xl" 
                    placeholder="Wajib diisi" 
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor WhatsApp (Aktif) *</label>
                  <input type="tel" required 
                    onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Nomor WhatsApp')}
                    onInput={clearCustomInvalid}
                    pattern="\d+"
                    maxLength={14}
                    value={formData.kontakOrtu} 
                    onChange={e => updateForm('kontakOrtu', e.target.value.replace(/\D/g, '').slice(0,14))} 
                    className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-emerald-500" 
                    placeholder="Contoh: 081234567890" 
                  />
                  <p className="text-xs text-slate-500 mt-1">Nomor ini akan dihubungi oleh Admin kami.</p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={handlePrev} className="px-4 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl"><ChevronLeft className="w-5 h-5"/></button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-xl flex justify-center items-center gap-2">Lanjut <ChevronRight className="w-5 h-5"/></button>
              </div>
            </form>
          )}

          {/* Step 4: Capaian */}
          {step === 4 && (
            <form onSubmit={handleNextStep} className="space-y-5 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">C & D. Capaian Belajar</h2>
              
              <div className="space-y-4">
                <h3 className="font-bold text-emerald-700">Capaian Mengaji</h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Sudah Mengaji Sebelumnya? *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2"><input type="radio" name="mengaji" checked={formData.sudahMengaji} onChange={() => updateForm('sudahMengaji', true)} className="text-emerald-600" /> Sudah</label>
                    <label className="flex items-center gap-2"><input type="radio" name="mengaji" checked={!formData.sudahMengaji} onChange={() => updateForm('sudahMengaji', false)} className="text-emerald-600" /> Belum</label>
                  </div>
                </div>

                {formData.sudahMengaji && (
                  <div className="p-4 bg-emerald-50 rounded-xl space-y-4 border border-emerald-100">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Mengaji Iqro atau Qur'an? *</label>
                      <select required 
                        onInvalid={(e) => setCustomInvalid(e, 'Mohon pilih bagian kolom Buku Mengaji')}
                        onInput={clearCustomInvalid}
                        value={formData.bukuMengaji} 
                        onChange={e => updateForm('bukuMengaji', e.target.value)} 
                        className="w-full p-3 bg-white border rounded-xl"
                      >
                        <option value="Iqro">Iqro</option>
                        <option value="Qur'an">Qur'an</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Mengajinya sampai mana? *</label>
                      <input type="text" required 
                        onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Capaian Mengaji')}
                        onInput={clearCustomInvalid}
                        value={formData.capaianMengaji} 
                        onChange={e => updateForm('capaianMengaji', e.target.value)} 
                        className="w-full p-3 bg-white border rounded-xl" 
                        placeholder="Contoh: Iqro Jilid 4, Halaman 12"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-bold text-emerald-700">Capaian Hafalan</h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Sudah Menghafal Sebelumnya? *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2"><input type="radio" name="hafal" checked={formData.sudahMenghafal} onChange={() => updateForm('sudahMenghafal', true)} className="text-emerald-600" /> Sudah</label>
                    <label className="flex items-center gap-2"><input type="radio" name="hafal" checked={!formData.sudahMenghafal} onChange={() => updateForm('sudahMenghafal', false)} className="text-emerald-600" /> Belum</label>
                  </div>
                </div>

                {formData.sudahMenghafal && (
                  <div className="p-4 bg-emerald-50 rounded-xl space-y-4 border border-emerald-100">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Menghafal Juz Berapa & Surah Apa? *</label>
                      <input type="text" required 
                        onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Capaian Hafalan')}
                        onInput={clearCustomInvalid}
                        value={formData.capaianHafalan} 
                        onChange={e => updateForm('capaianHafalan', e.target.value)} 
                        className="w-full p-3 bg-white border rounded-xl" 
                        placeholder="Contoh: Juz 30, Surah An-Naba"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={handlePrev} className="px-4 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl"><ChevronLeft className="w-5 h-5"/></button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-xl flex justify-center items-center gap-2">Lanjut <ChevronRight className="w-5 h-5"/></button>
              </div>
            </form>
          )}

          {/* Step 5: Sumber Informasi & Submit */}
          {step === 5 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">E. Sumber Informasi</h2>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mengetahui Rumah Qur'an Muharrik dari mana/siapa? *</label>
                <textarea required rows={3} 
                  onInvalid={(e) => setCustomInvalid(e, 'Mohon isi dan Lengkapi bagian kolom Sumber Informasi')}
                  onInput={clearCustomInvalid}
                  value={formData.sumberInfo} 
                  onChange={e => updateForm('sumberInfo', e.target.value)} 
                  className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-emerald-500" 
                  placeholder="Mohon isi dengan spesifik, misal: Dari Instagram, atau dari Bapak Ahmad tetangga saya" 
                />
              </div>

              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mt-6">
                <p className="text-sm text-yellow-800 font-medium">
                  Dengan mengirimkan formulir ini, saya menyatakan bahwa seluruh data yang diisi adalah benar.
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={handlePrev} className="px-4 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl"><ChevronLeft className="w-5 h-5"/></button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5"/> {isSubmitting ? 'Mengirim Data...' : 'Kirim Pendaftaran'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
