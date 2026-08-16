"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, FileText, User } from "lucide-react";

export function BottomNavOrtu() {
  const pathname = usePathname();

  const navItems = [
    { name: "Beranda", href: "/portal-ortu", icon: Home, exact: true },
    { name: "Keuangan", href: "/portal-ortu/keuangan", icon: Wallet, exact: false },
    { name: "Perizinan", href: "/portal-ortu/izin", icon: FileText, exact: false },
    { name: "Profil", href: "/portal-ortu/profil", icon: User, exact: false },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname?.startsWith(item.href);

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? "bg-emerald-50" : ""}`}>
                <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
