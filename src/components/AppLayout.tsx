"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Jangan tampilkan sidebar di rute publik seperti PSB, Login, atau Mode Kiosk
  const isKioskRoute = pathname === "/pindai-wajah" || pathname === "/pindai-qr" || pathname === "/absensi/manual" || pathname === "/akses-absen";
  const isPublicRoute = pathname === "/" || pathname.startsWith("/psb") || pathname.startsWith("/admin-psb/cetak") || pathname.startsWith("/login") || pathname.startsWith("/izin") || pathname.startsWith("/portal-guru") || pathname.startsWith("/portal-ortu") || pathname.startsWith("/mutabaah") || isKioskRoute;

  if (isPublicRoute) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between bg-slate-950 text-white p-4 h-16 flex-shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1 -ml-1 text-slate-300 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Menu</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
