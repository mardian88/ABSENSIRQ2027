"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCheck, QrCode, Keyboard, ArrowLeft } from "lucide-react";

export function KioskNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Wajah", href: "/pindai-wajah", icon: UserCheck },
    { name: "QR Code", href: "/pindai-qr", icon: QrCode },
    { name: "Manual", href: "/absensi/manual", icon: Keyboard },
  ];

  return (
    <div className="fixed top-0 left-0 w-full p-4 z-50 flex items-center justify-between pointer-events-none">
      <Link href="/" className="pointer-events-auto flex items-center justify-center p-3 bg-slate-800 text-white rounded-full md:rounded-lg md:px-4 md:py-2 hover:bg-slate-700 font-semibold shadow-md transition-colors">
        <ArrowLeft className="w-5 h-5 md:mr-2" />
        <span className="hidden md:inline">Tutup Kiosk</span>
      </Link>

      <div className="pointer-events-auto bg-slate-800 p-1 rounded-full shadow-lg flex gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center p-3 rounded-full transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              title={item.name}
            >
              <Icon className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline text-sm font-medium pr-2">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  );
}
