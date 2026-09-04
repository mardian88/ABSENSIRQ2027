"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Home, Users, UserCheck, AlertTriangle, Wallet, Megaphone, Settings, 
  X, BookOpen, LogOut, GraduationCap, ClipboardList, FileText, Briefcase, 
  Coins, ChevronDown, ChevronRight, UserMinus, CheckCircle2, RefreshCw, Heart 
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { getPengaturanProfil } from "@/app/pengaturan/actions";
import { getPsbCounts } from "@/app/admin-psb/actions";
import { getPendingTopupCount } from "@/app/admin-keuangan/top-up/actions";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  const navGroups = [
    {
      title: "Main",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: Home },
      ]
    },
    {
      title: "KIOSK",
      icon: UserCheck,
      items: [
        // { name: "Pindai Wajah", href: "/pindai-wajah", icon: UserCheck }, // Sementara dinonaktifkan
        { name: "Pindai QR", href: "/pindai-qr", icon: UserCheck },
        { name: "Absensi Manual", href: "/absensi/manual", icon: UserCheck },
      ]
    },
    {
      title: "Database",
      icon: Users,
      items: [
        { name: "Hasil PSB", href: "/admin-psb", icon: Users },
        { name: "Database Santri", href: "/santri", icon: Users },
        { name: "Database Alumni", href: "/alumni", icon: GraduationCap },
        { name: "Data Pengurus/Guru", href: "/admin-guru", icon: Briefcase },
      ]
    },
    {
      title: "Halaqah",
      items: [
        { name: "Board Halaqah", href: "/halaqoh", icon: BookOpen },
      ]
    },
    {
      title: "Laporan",
      icon: ClipboardList,
      items: [
        { name: "Laporan Hadir", href: "/laporan-absensi", icon: ClipboardList, exact: true },
        { name: "History Belum Hadir", href: "/laporan-absensi/belum-hadir", icon: UserMinus },
        { name: "Laporan Perizinan", href: "/laporan-absensi/perizinan", icon: FileText, exact: true },
        { name: "Laporan Alpa", href: "/laporan-absensi/alpa", icon: FileText, exact: true },
        { name: "Laporan Kafalah", href: "/admin-penggajian", icon: Coins },
        { name: "Poin Santri", href: "/poin", icon: AlertTriangle },
      ]
    },
    {
      title: "Mutabaah",
      icon: BookOpen,
      items: [
        { name: "Riwayat Mutabaah", href: "/dashboard/mutabaah", icon: BookOpen },
        { name: "Progress Mutabaah", href: "/dashboard/mutabaah-progress", icon: CheckCircle2 },
      ]
    },
    {
      title: "Keuangan",
      icon: Wallet,
      items: [
        { name: "Monitoring Pembayaran", href: "/admin-keuangan/monitoring", icon: ClipboardList },
        { name: "Pembayaran (Kas/Iuran)", href: "/admin-keuangan/pembayaran", icon: Coins },
        { name: "Buku Kas Umum", href: "/admin-keuangan/buku-kas", icon: FileText },
        { name: "Top-Up Saldo", href: "/admin-keuangan/top-up", icon: CheckCircle2 },
        { name: "Tabungan Santri", href: "/admin-keuangan/tabungan", icon: UserCheck },
        { name: "Kebutuhan Santri", href: "/admin-keuangan/katalog", icon: BookOpen },
        { name: "Wakaf", href: "/admin-keuangan/donasi", icon: Heart },
      ]
    },
    {
      title: "System",
      items: [
        { name: "Pengaturan", href: "/pengaturan", icon: Settings },
      ]
    }
  ];

  const [profil, setProfil] = useState({ namaRumahQuran: "Rumah Qur'an", urlLogo: "" });
  const [psbCounts, setPsbCounts] = useState({ unread: 0, read: 0 });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "KIOSK": false,
    "Database": false,
    "Laporan": false,
    "Mutabaah": false,
    "Keuangan": false,
  });

  // Auto-expand group if current route is inside it
  useEffect(() => {
    const newExpanded = { ...expandedGroups };
    navGroups.forEach(group => {
      if (group.title && group.items.length > 1) {
        const isChildActive = group.items.some(item => {
          const isExactMatch = pathname === item.href;
          const isPrefixMatch = item.href !== "/" && pathname.startsWith(item.href + '/');
          return (item as any).exact ? isExactMatch : (isExactMatch || isPrefixMatch);
        });
        if (isChildActive) {
          newExpanded[group.title] = true;
        } else {
          newExpanded[group.title] = false;
        }
      }
    });
    setExpandedGroups(newExpanded);
  }, [pathname]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
      const isCurrentlyOpen = prev[title];
      const newExpanded = { ...prev };
      Object.keys(newExpanded).forEach(key => newExpanded[key] = false);
      newExpanded[title] = !isCurrentlyOpen;
      return newExpanded;
    });
  };

  const [pendingTopup, setPendingTopup] = useState(0);

  useEffect(() => {
    getPengaturanProfil().then(res => {
      if(res) setProfil({ namaRumahQuran: res.namaRumahQuran, urlLogo: res.urlLogo || "" });
    }).catch(console.error);

    getPsbCounts().then(res => {
      if(res) setPsbCounts(res);
    }).catch(console.error);

    getPendingTopupCount().then(res => {
      setPendingTopup(res);
    }).catch(console.error);
  }, [pathname]);

  return (
    <div className="flex h-full w-64 sm:w-72 md:w-64 flex-col bg-slate-950 text-white shadow-2xl md:shadow-xl flex-shrink-0">
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
           {profil.urlLogo && <img src={profil.urlLogo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />}
           <span className="text-xl font-bold truncate max-w-[150px]">{profil.namaRumahQuran}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.location.reload()} 
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Refresh Aplikasi"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="md:hidden p-1 -mr-2 text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
      <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
        {navGroups.map((group, idx) => {
          const isExpandable = group.items.length > 1 && group.title !== "Main" && group.title !== "Halaqah" && group.title !== "System";
          
          if (!isExpandable) {
            // Render single items directly without group header
            return (
              <div key={idx} className="space-y-1.5">
                {group.items.map((item) => {
                  const isExactMatch = pathname === item.href;
                  const isPrefixMatch = item.href !== "/" && pathname.startsWith(item.href + '/');
                  const isActive = (item as any).exact ? isExactMatch : (isExactMatch || isPrefixMatch);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-between rounded-lg px-3 py-3 md:py-2 transition-colors ${
                        isActive ? "bg-orange-500 text-white font-semibold shadow-md shadow-orange-500/20" : "text-slate-400 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium md:font-normal">{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          }

          const isExpanded = expandedGroups[group.title];
          const GroupIcon = group.icon || Home;
          
          return (
            <div key={group.title} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GroupIcon className="h-5 w-5 text-slate-400" />
                  <span className="font-medium text-sm">{group.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {group.title === "Keuangan" && pendingTopup > 0 && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {pendingTopup}
                    </span>
                  )}
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </div>
              </button>
              
              {isExpanded && (
                <div className="pl-9 space-y-1 relative">
                  <div className="absolute left-5 top-0 bottom-2 w-px bg-slate-800" />
                  {group.items.map((item) => {
                    const isExactMatch = pathname === item.href;
                    const isPrefixMatch = item.href !== "/" && pathname.startsWith(item.href + '/');
                    const isActive = (item as any).exact ? isExactMatch : (isExactMatch || isPrefixMatch);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors text-sm ${
                          isActive ? "bg-orange-500/10 text-orange-400 font-semibold relative after:absolute after:left-[-16px] after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-1 after:rounded-full after:bg-orange-500" : "text-slate-400 hover:text-white hover:bg-slate-900 relative after:absolute after:left-[-16px] after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-1 after:rounded-full after:bg-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 opacity-70" />
                          <span>{item.name}</span>
                        </div>
                        
                        {item.name === "Hasil PSB" && (psbCounts.unread > 0 || psbCounts.read > 0) && (
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            {psbCounts.unread > 0 && (
                              <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{psbCounts.unread}</span>
                            )}
                            {psbCounts.read > 0 && (
                              <span className="bg-slate-500 text-white px-1.5 py-0.5 rounded-full">{psbCounts.read}</span>
                            )}
                          </div>
                        )}
                        {item.name === "Top-Up Saldo" && pendingTopup > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{pendingTopup}</span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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
 
