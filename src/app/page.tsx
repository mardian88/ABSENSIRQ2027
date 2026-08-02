import Link from "next/link";
import { BookOpen, LogIn, Monitor, ArrowRight, Camera, MessageCircle, Heart, UserPlus, CheckCircle2, Clock, CalendarDays, BookMarked, Users, Award, ShieldCheck, MapPin } from "lucide-react";
import { db } from "@/db";
import { pengaturanProfil } from "@/db/schema";
import CountdownTimer from "@/components/CountdownTimer";

export default async function LandingPage() {
  const [profil] = await db.select().from(pengaturanProfil).limit(1);
  const isPsbAktif = profil?.isPsbAktif ?? true;
  const isCountdownAktif = profil?.isCountdownAktif ?? false;
  const batasWaktuPsb = profil?.batasWaktuPsb;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-emerald-500 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Rumah Qur'an Muharrik</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#visi" className="hover:text-emerald-600 transition-colors">Visi & Nilai</a>
            <a href="#kbm" className="hover:text-emerald-600 transition-colors">Kegiatan</a>
            <a href="#proses" className="hover:text-emerald-600 transition-colors">Alur KBM</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
              <LogIn className="w-4 h-4" /> Pengurus
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-6 md:pt-40 md:pb-28 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-white to-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100/[0.5] bg-[size:20px_20px]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${isPsbAktif ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'} text-sm font-medium mb-6 border shadow-sm`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPsbAktif ? 'bg-emerald-400' : 'bg-rose-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isPsbAktif ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            {isPsbAktif ? 'Pendaftaran Santri Baru Dibuka' : 'Pendaftaran Santri Baru Belum di Buka'}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Membentuk Generasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Qur'ani</span>, <br className="hidden md:block" /> Berakhlak & Berdisiplin.
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-4 max-w-2xl mx-auto leading-relaxed">
            Tempat belajar menjadi santri yang Berakhlak, Berdisiplin serta bisa membaca & menghafal Al-Qur'an. Berlokasi di Tarogong Kidul, Garut.
          </p>
          {!isPsbAktif && (
            <p className="text-md text-rose-600 mb-8 max-w-2xl mx-auto font-medium">
              Untuk ikut waiting list (daftar tunggu) silakan menghubungi WhatsApp admin.
            </p>
          )}
          
          {isPsbAktif && isCountdownAktif && batasWaktuPsb && (
            <div className="mt-8 mb-4">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Sisa Waktu Pendaftaran</p>
              <CountdownTimer targetDate={batasWaktuPsb} />
            </div>
          )}

          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${isPsbAktif && !(isCountdownAktif && batasWaktuPsb) ? 'mt-10' : ''}`}>
            {isPsbAktif ? (
              <Link href="/psb" className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" /> Daftar Sekarang
              </Link>
            ) : (
              <a href="https://wa.me/6281394940401" target="_blank" rel="noreferrer" className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" /> Hubungi Admin
              </a>
            )}
            <Link href="/akses-absen" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2">
              <Monitor className="w-5 h-5" /> Kiosk Absensi
            </Link>
          </div>
        </div>
      </section>

      {/* Core Values / Visi */}
      <section id="visi" className="py-20 px-4 md:px-6 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tiga Pilar Utama</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Kami berkomitmen membangun karakter santri melalui pendekatan yang komprehensif.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Adab */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Adab & Akhlaq</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Komitmen menerapkan adab & akhlakul karimah sebelum ilmu. Setiap guru pembimbing menjadi role model, dan kami terapkan <em>Reward & Punishment</em> bagi santri yang konsisten menjaga akhlaknya.
              </p>
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 italic">
                "Sesungguhnya aku hanyalah diutus untuk menyempurnakan akhlak yang baik." (HR. Bukhari)
              </div>
            </div>

            {/* Disiplin */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Kedisiplinan</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Kami menerapkan sistem kedisiplinan yang terstruktur bagi para santri agar terbiasa dengan keteraturan dalam menjalani kegiatan sehari-hari.
              </p>
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 italic">
                "Kebenaran yang tidak terorganisir dapat dikalahkan oleh kebatilan yang terorganisir." (Ali bin Abi Thalib)
              </div>
            </div>

            {/* Kognitif */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookMarked className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Kognitif</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Penerapan kemampuan membaca dan menghafal bagi para santri secara terstruktur dan sistematis, mencetak generasi Qur'ani yang cerdas.
              </p>
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 italic">
                "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya." (HR. Bukhari)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jadwal & Perlengkapan */}
      <section id="kbm" className="py-20 px-4 md:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Kegiatan Belajar Mengajar</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Informasi jadwal, perlengkapan, dan seragam santri.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Kelas Siang */}
            <div className="bg-amber-400 rounded-3xl p-8 shadow-xl shadow-amber-900/10 text-amber-950 overflow-hidden relative">
              <div className="absolute -right-10 -top-10 opacity-10">
                <Clock className="w-48 h-48" />
              </div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Clock className="w-6 h-6" /> Kelas Siang
              </h3>
              <p className="font-semibold text-lg mb-8 opacity-80">Pukul 12:30 - 14:30</p>
              
              <div className="space-y-6">
                <div className="bg-white/40 p-4 rounded-xl backdrop-blur-sm">
                  <h4 className="font-bold mb-2">Perlengkapan:</h4>
                  <p className="text-sm leading-relaxed">Iqra'/Qur'an, Buku Mutaba'ah, Kartu Absen, Tumbler Minum, Bekal Makan.</p>
                </div>
                <div className="bg-white/40 p-4 rounded-xl backdrop-blur-sm">
                  <h4 className="font-bold mb-2">Seragam (Senin-Rabu):</h4>
                  <ul className="text-sm space-y-1">
                    <li><strong>Putra:</strong> Berkopyah Hitam Polos, Seragam RQM, Celana Hitam</li>
                    <li><strong>Putri:</strong> Kerudung Hitam Panjang, Seragam RQM, Rok Hitam</li>
                  </ul>
                </div>
                <div className="bg-white/40 p-4 rounded-xl backdrop-blur-sm">
                  <h4 className="font-bold mb-2">Seragam (Kamis-Jum'at):</h4>
                  <ul className="text-sm space-y-1">
                    <li><strong>Putra:</strong> Kopyah Hitam, Baju Muslim Bebas, Celana Panjang</li>
                    <li><strong>Putri:</strong> Baju Muslim Panjang (tidak mencolok), Kerudung Panjang</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Kelas Sore */}
            <div className="bg-teal-700 rounded-3xl p-8 shadow-xl shadow-teal-900/10 text-white overflow-hidden relative">
              <div className="absolute -right-10 -top-10 opacity-10">
                <CalendarDays className="w-48 h-48" />
              </div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <CalendarDays className="w-6 h-6" /> Kelas Sore
              </h3>
              <p className="font-medium text-teal-200 text-lg mb-8">Pukul 14:30 - 18:30</p>
              
              <div className="space-y-6">
                <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm">
                  <h4 className="font-bold mb-2 text-teal-100">Perlengkapan:</h4>
                  <p className="text-sm leading-relaxed text-teal-50">Iqra'/Qur'an, Buku Mutaba'ah, Buku Dzikir/Al-ma'tsurat, Kartu Absen, Tumbler, Bekal Makan.</p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm">
                  <h4 className="font-bold mb-2 text-teal-100">Seragam (Senin-Rabu):</h4>
                  <ul className="text-sm space-y-1 text-teal-50">
                    <li><strong>Putra:</strong> Berkopyah Hitam Polos, Seragam RQM, Celana Hitam</li>
                    <li><strong>Putri:</strong> Kerudung Hitam Panjang, Seragam RQM, Rok Hitam</li>
                  </ul>
                </div>
                <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm">
                  <h4 className="font-bold mb-2 text-teal-100">Seragam (Kamis-Jum'at):</h4>
                  <ul className="text-sm space-y-1 text-teal-50">
                    <li><strong>Putra:</strong> Kopyah Hitam, Baju Muslim Bebas, Celana Panjang</li>
                    <li><strong>Putri:</strong> Baju Muslim Panjang (tidak mencolok), Kerudung Panjang</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Kelas Malam */}
            <div className="bg-indigo-900 rounded-3xl p-8 shadow-xl shadow-indigo-900/10 text-white overflow-hidden relative">
              <div className="absolute -right-10 -top-10 opacity-10">
                <Clock className="w-48 h-48" />
              </div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Clock className="w-6 h-6" /> Kelas Malam
              </h3>
              <p className="font-medium text-indigo-200 text-lg mb-8">Pukul 18:00 - 20:30 WIB</p>
              
              <div className="space-y-6">
                <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm">
                  <h4 className="font-bold mb-2 text-indigo-100">Perlengkapan:</h4>
                  <p className="text-sm leading-relaxed text-indigo-50">Iqra'/Qur'an, Buku Mutaba'ah, Buku Dzikir/Al-ma'tsurat, Kartu Absen, Tumbler, Bekal Makan.</p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm">
                  <h4 className="font-bold mb-2 text-indigo-100">Seragam (Senin-Rabu):</h4>
                  <ul className="text-sm space-y-1 text-indigo-50">
                    <li><strong>Putra:</strong> Berkopyah Hitam Polos, Seragam RQM, Celana Hitam</li>
                    <li><strong>Putri:</strong> Kerudung Hitam Panjang, Seragam RQM, Rok Hitam</li>
                  </ul>
                </div>
                <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm">
                  <h4 className="font-bold mb-2 text-indigo-100">Seragam (Kamis-Jum'at):</h4>
                  <ul className="text-sm space-y-1 text-indigo-50">
                    <li><strong>Putra:</strong> Kopyah Hitam, Baju Muslim Bebas, Celana Panjang</li>
                    <li><strong>Putri:</strong> Baju Muslim Panjang (tidak mencolok), Kerudung Panjang</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Materi Pembelajaran */}
      <section id="materi" className="py-20 px-4 md:px-6 bg-emerald-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Materi Pembelajaran</h2>
            <p className="text-emerald-200 max-w-2xl mx-auto">Kurikulum dan fokus materi yang diajarkan pada setiap kelas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Materi Siang */}
            <div className="bg-emerald-800/50 border border-emerald-700/50 rounded-3xl p-8 hover:bg-emerald-800 transition-colors shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-amber-400">
                <BookOpen className="w-6 h-6" /> Kelas Siang
              </h3>
              <ul className="space-y-4 text-emerald-50 leading-relaxed">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Tahsin Dasar Mengaji Iqra dan Hafalan</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Kaidah Tajwid Dasar: Makhroj Huruf, Sifatul Huruf, Panjang Pendek</span>
                </li>
              </ul>
            </div>

            {/* Materi Sore */}
            <div className="bg-emerald-800/50 border border-emerald-700/50 rounded-3xl p-8 hover:bg-emerald-800 transition-colors shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-teal-300">
                <BookOpen className="w-6 h-6" /> Kelas Sore
              </h3>
              <ul className="space-y-4 text-emerald-50 leading-relaxed">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Mengaji Iqra/Qur'an dan Hafalan</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Materi Tajwid Dasar dan Menengah</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Pembiasaan Shalat Berjamaah dan Dzikir Sore Bersama</span>
                </li>
              </ul>
            </div>

            {/* Materi Malam */}
            <div className="bg-emerald-800/50 border border-emerald-700/50 rounded-3xl p-8 hover:bg-emerald-800 transition-colors shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-indigo-300">
                <BookOpen className="w-6 h-6" /> Kelas Malam
              </h3>
              <ul className="space-y-4 text-emerald-50 leading-relaxed">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Bacaan dan Hafalan Qur'an dengan Materi Tajwid Tingkat Atas</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Materi Fiqih Terapan & Fiqih Kontemporer</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Pembiasaan Akhlak</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Pembiasaan Memimpin Sholat Berjamaah & Dzikir Setelah Sholat</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Latihan Kedisiplinan dan Kepemimpinan</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section id="proses" className="py-20 px-4 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Alur Proses KBM</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Kegiatan harian santri dari kedatangan hingga kepulangan.</p>
          </div>

          <div className="relative">
             <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 hidden md:block -translate-x-1/2"></div>
             <div className="space-y-12">
                {/* Step 1 */}
                <div className="flex flex-col md:flex-row items-center md:justify-between w-full relative">
                  <div className="md:w-5/12 flex justify-end md:text-right mb-4 md:mb-0">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full hover:border-emerald-500 transition-colors shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 mb-2">Kedatangan & Persiapan</h4>
                        <p className="text-sm text-slate-600">
                           Maksimal 10 menit sebelum jadwal, meletakkan alas kaki dengan rapi, mengucapkan salam, menyiapkan perlengkapan KBM (Murojaah Mandiri).
                        </p>
                     </div>
                  </div>
                  <div className="hidden md:flex w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow flex-shrink-0 items-center justify-center text-white font-bold z-10">
                     1
                  </div>
                  <div className="md:w-5/12 hidden md:block"></div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col md:flex-row items-center md:justify-between w-full relative">
                  <div className="md:w-5/12 hidden md:block"></div>
                  <div className="hidden md:flex w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow flex-shrink-0 items-center justify-center text-white font-bold z-10">
                     2
                  </div>
                  <div className="md:w-5/12 flex justify-start mb-4 md:mb-0">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full hover:border-emerald-500 transition-colors shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 mb-2">Absensi Kehadiran</h4>
                        <p className="text-sm text-slate-600">
                           Menyiapkan kartu absensi, mengantri dengan tertib, dan memastikan absen terekap dengan baik di sistem Kiosk.
                        </p>
                     </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col md:flex-row items-center md:justify-between w-full relative">
                  <div className="md:w-5/12 flex justify-end md:text-right mb-4 md:mb-0">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full hover:border-emerald-500 transition-colors shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 mb-2">Pembiasaan Shalat Berjamaah</h4>
                        <p className="text-sm text-slate-600">
                           Muroja'ah sebelum shalat, Berjamaah Shalat Ashar, Dzikir Setelah Sholat, dan membaca Dzikir Sore Bersama.
                        </p>
                     </div>
                  </div>
                  <div className="hidden md:flex w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow flex-shrink-0 items-center justify-center text-white font-bold z-10">
                     3
                  </div>
                  <div className="md:w-5/12 hidden md:block"></div>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col md:flex-row items-center md:justify-between w-full relative">
                  <div className="md:w-5/12 hidden md:block"></div>
                  <div className="hidden md:flex w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow flex-shrink-0 items-center justify-center text-white font-bold z-10">
                     4
                  </div>
                  <div className="md:w-5/12 flex justify-start mb-4 md:mb-0">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full hover:border-emerald-500 transition-colors shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 mb-2">KBM (Kegiatan Inti)</h4>
                        <p className="text-sm text-slate-600">
                           Muroja'ah & Ziyadah Hafalan, Tilawah Qur'an, disertai Ilmu Tajwid (Dasar, Menengah & Atas), Pembiasaan Akhlak Materi (Akhlak lil Baniin wal Banaat), Ilmu Fikih Dasar.
                        </p>
                     </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex flex-col md:flex-row items-center md:justify-between w-full relative">
                  <div className="md:w-5/12 flex justify-end md:text-right mb-4 md:mb-0">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full hover:border-emerald-500 transition-colors shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 mb-2">Istirahat</h4>
                        <p className="text-sm text-slate-600">
                           5-10 menit sebelum pulang untuk saling berbagi bekal dengan sesama santri.
                        </p>
                     </div>
                  </div>
                  <div className="hidden md:flex w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow flex-shrink-0 items-center justify-center text-white font-bold z-10">
                     5
                  </div>
                  <div className="md:w-5/12 hidden md:block"></div>
                </div>

                {/* Step 6 */}
                <div className="flex flex-col md:flex-row items-center md:justify-between w-full relative">
                  <div className="md:w-5/12 hidden md:block"></div>
                  <div className="hidden md:flex w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow flex-shrink-0 items-center justify-center text-white font-bold z-10">
                     6
                  </div>
                  <div className="md:w-5/12 flex justify-start mb-4 md:mb-0">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full hover:border-emerald-500 transition-colors shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 mb-2">Pembiasaan Shalat Maghrib</h4>
                        <p className="text-sm text-slate-600">
                           Persiapan & Berjamaah Shalat Maghrib, Latihan Memimpin Shalat Maghrib (untuk Santri Kelas Malam), Dzikir Ba'da shalat.
                        </p>
                     </div>
                  </div>
                </div>

                {/* Step 7 */}
                <div className="flex flex-col md:flex-row items-center md:justify-between w-full relative">
                  <div className="md:w-5/12 flex justify-end md:text-right mb-4 md:mb-0">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full hover:border-emerald-500 transition-colors shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 mb-2">Kepulangan</h4>
                        <p className="text-sm text-slate-600">
                           Merapihkan diri dengan shaf yang rapi dan tertib, dilanjutkan dengan melakukan Absensi Kepulangan.
                        </p>
                     </div>
                  </div>
                  <div className="hidden md:flex w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow flex-shrink-0 items-center justify-center text-white font-bold z-10">
                     7
                  </div>
                  <div className="md:w-5/12 hidden md:block"></div>
                </div>

                {/* Step 8 */}
                <div className="flex flex-col md:flex-row items-center md:justify-between w-full relative">
                  <div className="md:w-5/12 hidden md:block"></div>
                  <div className="hidden md:flex w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow flex-shrink-0 items-center justify-center text-white font-bold z-10">
                     8
                  </div>
                  <div className="md:w-5/12 flex justify-start mb-4 md:mb-0">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full hover:border-emerald-500 transition-colors shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 mb-2">Evaluasi di Rumah</h4>
                        <p className="text-sm text-slate-600">
                           Muroja'ah capaian dengan Orang Tua di rumah (terpantau melalui buku mutaba'ah).
                        </p>
                     </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA Footer & Socials */}
      <footer className="bg-slate-950 text-white pt-20 pb-10 border-t-4 border-emerald-500">
         <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 mb-16">
               <div>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-7 h-7" />
                     </div>
                     <h2 className="text-2xl font-bold">Rumah Qur'an Muharrik</h2>
                  </div>
                  <p className="text-slate-400 mb-6 leading-relaxed max-w-sm">
                     Mencetak generasi yang Berakhlak, Berdisiplin, serta mahir dalam membaca & menghafal Al-Qur'an.
                  </p>
                  <div className="flex items-center gap-3">
                     <a href="https://api.whatsapp.com/send?phone=6281394940401" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 transition-colors text-slate-300 hover:text-white">
                        <MessageCircle className="w-5 h-5" />
                     </a>
                     <a href="https://instagram.com/rumahquranmuharrik" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 transition-colors text-slate-300 hover:text-white">
                        <Camera className="w-5 h-5" />
                     </a>
                     <a href="https://tiktok.com/@rumahquranmuharrik" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 transition-colors text-slate-300 hover:text-white">
                        <Monitor className="w-5 h-5" /> {/* TikTok placeholder */}
                     </a>
                     <a href="https://www.threads.com/threads.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 transition-colors text-slate-300 hover:text-white">
                        <Users className="w-5 h-5" />
                     </a>
                  </div>
               </div>
               
               <div className="flex flex-col md:items-end justify-center">
                  <div className="space-y-4 w-full md:w-auto">
                     <Link href="/login" className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-emerald-500 transition-colors group">
                        <span className="font-medium text-slate-300 group-hover:text-white">Login Pengurus / Dashboard</span>
                        <ArrowRight className="w-5 h-5 text-emerald-500" />
                     </Link>
                     {isPsbAktif ? (
                       <Link href="/psb" className="flex items-center justify-between gap-4 px-6 py-4 bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors">
                          <span className="font-semibold text-white">Pendaftaran Santri (PSB)</span>
                          <ArrowRight className="w-5 h-5 text-white" />
                       </Link>
                     ) : (
                       <a href="https://wa.me/6281394940401" target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 px-6 py-4 bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors">
                          <span className="font-semibold text-white flex items-center gap-2">Hubungi Admin</span>
                          <MessageCircle className="w-5 h-5 text-white" />
                       </a>
                     )}
                  </div>
               </div>
            </div>
            
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
               <p>&copy; {new Date().getFullYear()} Rumah Qur'an Muharrik. All rights reserved.</p>
               <p className="mt-2 md:mt-0 flex items-center gap-1">
                 Dibuat dengan <Heart className="w-4 h-4 text-emerald-500" /> di Garut
               </p>
            </div>
         </div>
      </footer>
    </div>
  );
}
