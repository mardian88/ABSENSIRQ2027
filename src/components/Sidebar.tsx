"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Users, UserCheck, AlertTriangle, Wallet, Megaphone, Settings, X, BookOpen, LogOut, GraduationCap, ClipboardList, FileText } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Pindai Wajah", href: "/pindai-wajah", icon: UserCheck },
    { name: "Pindai QR", href: "/pindai-qr", icon: UserCheck },
    { name: "Absensi Manual", href: "/absensi/manual", icon: UserCheck },
    { name: "Database Santri", href: "/santri", icon: Users },
    { name: "Database Alumni", href: "/alumni", icon: GraduationCap },
    { name: "Board Halaqah", href: "/halaqoh", icon: BookOpen },
    { name: "Poin Santri", href: "/poin", icon: AlertTriangle },
    { name: "Laporan Hadir", href: "/laporan-absensi", icon: ClipboardList },
    { name: "Laporan Perizinan", href: "/laporan-absensi/perizinan", icon: FileText },
    // { name: "Keuangan (SIMKEU)", href: "https://muharrik-finance.vercel.app/", icon: Wallet },
    { name: "Hasil PSB", href: "/admin-psb", icon: Users },
    { name: "Pengaturan", href: "/pengaturan", icon: Settings },
  ];

  const [profil, setProfil] = useState({ namaRumahQuran: "Rumah Qur'an", urlLogo: "" });
  const [psbCounts, setPsbCounts] = useState({ unread: 0, read: 0 });

  useEffect(() => {
    // Import dinamis untuk menghindari dependency cycle atau error client
    import("@/app/pengaturan/actions").then(({ getPengaturanProfil }) => {
      getPengaturanProfil().then(res => {
        if(res) setProfil({ namaRumahQuran: res.namaRumahQuran, urlLogo: res.urlLogo || "" });
      });
    });
    import("@/app/admin-psb/actions").then(({ getPsbCounts }) => {
      getPsbCounts().then(res => {
        if(res) setPsbCounts(res);
      });
    });
  }, [pathname]);

  return (
    <div className="flex h-full w-64 sm:w-72 md:w-64 flex-col bg-slate-950 text-white shadow-2xl md:shadow-xl flex-shrink-0">
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
           {profil.urlLogo && <img src={profil.urlLogo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />}
           <span className="text-xl font-bold truncate max-w-[150px]">{profil.namaRumahQuran}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 -mr-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between rounded-lg px-3 py-3 md:py-2 transition-colors ${
                isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span className="font-medium md:font-normal">{item.name}</span>
              </div>
              
              {item.name === "Hasil PSB" && (psbCounts.unread > 0 || psbCounts.read > 0) && (
                <div className="flex items-center gap-1 text-xs font-bold">
                  {psbCounts.unread > 0 && (
                    <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{psbCounts.unread}</span>
                  )}
                  {psbCounts.read > 0 && (
                    <span className="bg-slate-500 text-white px-1.5 py-0.5 rounded-full">{psbCounts.read}</span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold flex-shrink-0">
            {profil.namaRumahQuran.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate">Admin {profil.namaRumahQuran}</span>
            <span className="text-xs text-slate-400 truncate">admin@rumahquran.com</span>
          </div>
          <button 
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/";
            }}
            className="ml-auto p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
            title="Keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
