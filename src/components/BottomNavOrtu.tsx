"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, FileText, User, BookOpen, ShoppingBag, HeartHandshake, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/app/portal-ortu/(dashboard)/ThemeProvider";

export function BottomNavOrtu() {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { theme } = useTheme();

  const isRecipeTheme = theme === "default";

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
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${isRecipeTheme ? 'pb-4 px-4' : 'bg-[var(--bg-surface)] border-t border-[var(--border-line)]'}`}>
      <div className={`max-w-md mx-auto relative ${isRecipeTheme ? 'bg-[var(--primary-accent)] rounded-[9999px] shadow-[0_10px_30px_rgba(41,62,43,0.3)]' : ''}`}>
        
        {/* Visual cue that it's scrollable */}
        {!isRecipeTheme && canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-start bg-gradient-to-r from-[var(--bg-surface)] to-transparent pointer-events-none z-10 pl-1">
            <ChevronLeft className="w-4 h-4 text-[var(--primary-accent)] opacity-60 animate-pulse" />
          </div>
        )}
        
        {!isRecipeTheme && canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-end bg-gradient-to-l from-[var(--bg-surface)] to-transparent pointer-events-none z-10 pr-1">
            <ChevronRight className="w-4 h-4 text-[var(--primary-accent)] opacity-60 animate-pulse" />
          </div>
        )}
        
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className={`flex items-center h-16 overflow-x-auto no-scrollbar snap-x snap-mandatory relative ${isRecipeTheme ? 'px-4' : 'px-2'}`}
        >
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname?.startsWith(item.href);

            if (isRecipeTheme) {
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-[64px] h-full space-y-1 transition-all snap-center relative ${
                    isActive ? "text-[#f2c146]" : "text-white/60 hover:text-white"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
                  {isActive && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#f2c146]" />
                  )}
                </Link>
              );
            }

            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-full space-y-1 transition-colors snap-center ${
                  isActive ? "text-[var(--primary-accent)]" : "text-[var(--text-ash)] hover:text-[var(--text-mute)]"
                }`}
              >
                <div className={`p-1.5 rounded-full ${isActive ? "bg-[var(--primary-accent)]/10" : ""}`}>
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
