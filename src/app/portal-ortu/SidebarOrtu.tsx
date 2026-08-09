"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, FileText, LogOut, X, User } from "lucide-react";
import { logoutOrtu } from "./actions";

export function SidebarOrtu({ 
  onClose, 
  profil 
}: { 
  onClose?: () => void;
  profil: { namaLengkap: string; nomorInduk: string; urlFotoWajah?: string | null };
}) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/portal-ortu", icon: Home, exact: true },
    { name: "Mutabaah Santri", href: "/portal-ortu/mutabaah", icon: BookOpen },
    { name: "Perizinan", href: "/portal-ortu/izin", icon: FileText },
  ];

  const handleLogout = async () => {
    await logoutOrtu();
    window.location.href = "/portal-ortu/login";
  };

  return (
    <div className="flex h-full w-64 flex-col bg-emerald-900 text-white shadow-2xl flex-shrink-0">
      <div className="flex h-16 items-center justify-between px-6 border-b border-emerald-800 flex-shrink-0">
        <div className="flex items-center gap-2">
           <span className="text-xl font-bold truncate">Portal Wali</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 -mr-2 text-emerald-300 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      
      {/* Profil Singkat */}
      <div className="p-4 border-b border-emerald-800 flex items-center gap-3 bg-emerald-800/30">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
          {profil.urlFotoWajah ? (
            <img src={profil.urlFotoWajah} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="overflow-hidden">
          <h3 className="font-bold text-sm truncate">{profil.namaLengkap}</h3>
          <p className="text-xs text-emerald-200">NIS: {profil.nomorInduk}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isExactMatch = pathname === item.href;
          const isPrefixMatch = item.href !== "/portal-ortu" && pathname.startsWith(item.href);
          const isActive = item.exact ? isExactMatch : (isExactMatch || isPrefixMatch);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between rounded-lg px-3 py-3 md:py-2 transition-colors ${
                isActive ? "bg-emerald-500 text-white font-semibold shadow-md" : "text-emerald-100 hover:bg-emerald-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span className="font-medium md:font-normal">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-emerald-800 flex-shrink-0">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white rounded-lg transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </div>
  );
}
