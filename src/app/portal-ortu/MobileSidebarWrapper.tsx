"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { SidebarOrtu } from "./SidebarOrtu";

export default function MobileSidebarWrapper({ 
  children, 
  profil 
}: { 
  children: React.ReactNode; 
  profil: any 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Mobile Header */}
      <header className="md:hidden bg-emerald-900 text-white h-16 px-4 flex items-center justify-between shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Portal Wali</span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-sm flex">
            <SidebarOrtu onClose={() => setMobileMenuOpen(false)} profil={profil} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full relative h-full">
        <div className="w-full max-w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
