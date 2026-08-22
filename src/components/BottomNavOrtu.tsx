"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, FileText, User, BookOpen, ShoppingBag, HeartHandshake, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function BottomNavOrtu() {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const navItems = [
    { name: "Beranda", href: "/portal-ortu", icon: Home, exact: true },
    { name: "Keuangan", href: "/portal-ortu/keuangan", icon: Wallet, exact: false },
    { name: "Perizinan", href: "/portal-ortu/izin", icon: FileText, exact: false },
    { name: "Mutaba'ah", href: "/portal-ortu/mutabaah", icon: BookOpen, exact: false },
    { name: "Kebutuhan", href: "/portal-ortu/kebutuhan", icon: ShoppingBag, exact: false },
    { name: "Wakaf", href: "/portal-ortu/donasi", icon: HeartHandshake, exact: false },
    { name: "Profil", href: "/portal-ortu/profil", icon: User, exact: false },
  ];

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
      <div className="max-w-md mx-auto relative">
        {/* Visual cue that it's scrollable */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-start bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none z-10 pl-1">
            <ChevronLeft className="w-4 h-4 text-emerald-600 opacity-60 animate-pulse" />
          </div>
        )}
        
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-end bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none z-10 pr-1">
            <ChevronRight className="w-4 h-4 text-emerald-600 opacity-60 animate-pulse" />
          </div>
        )}
        
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center h-16 overflow-x-auto no-scrollbar px-2 snap-x snap-mandatory relative"
        >
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname?.startsWith(item.href);

            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-full space-y-1 transition-colors snap-center ${
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
      
      {/* Hide scrollbar CSS */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
