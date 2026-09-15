"use client";

import { useTheme } from "./ThemeProvider";
import { Palette } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-[var(--bg-muted)] text-[var(--text-mute)] transition-colors"
        title="Ganti Tema"
      >
        <Palette className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-[var(--radius-card)] shadow-lg overflow-hidden z-50 p-1">
          <button 
            onClick={() => { setTheme("default"); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm rounded-[calc(var(--radius-card)-4px)] flex items-center gap-2 ${theme === "default" ? "bg-[var(--bg-muted)] font-bold text-[var(--text-ink)]" : "text-[var(--text-mute)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-ink)]"}`}
          >
            <div className="w-3 h-3 rounded-full bg-[#f4ece2] border border-gray-300 shadow-sm" />
            Recipe Theme (Default)
          </button>
          <button 
            onClick={() => { setTheme("supabase-light"); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm rounded-[calc(var(--radius-card)-4px)] flex items-center gap-2 mt-1 ${theme === "supabase-light" ? "bg-[var(--bg-muted)] font-medium text-[var(--text-ink)]" : "text-[var(--text-mute)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-ink)]"}`}
          >
            <div className="w-3 h-3 rounded-full bg-[#fafafa] border border-gray-200 shadow-sm" />
            Supabase Light
          </button>
          <button 
            onClick={() => { setTheme("supabase-dark"); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm rounded-[calc(var(--radius-card)-4px)] flex items-center gap-2 mt-1 ${theme === "supabase-dark" ? "bg-[var(--bg-muted)] font-medium text-[var(--text-ink)]" : "text-[var(--text-mute)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-ink)]"}`}
          >
            <div className="w-3 h-3 rounded-full bg-[#0f0f0f] border border-gray-700 shadow-sm" />
            Supabase Dark
          </button>
          <button 
            onClick={() => { setTheme("grove"); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm rounded-[calc(var(--radius-card)-4px)] flex items-center gap-2 mt-1 ${theme === "grove" ? "bg-[var(--bg-muted)] font-medium text-[var(--text-ink)]" : "text-[var(--text-mute)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-ink)]"}`}
          >
            <div className="w-3 h-3 rounded-full bg-[#faf8f5] border border-gray-200 shadow-sm" />
            Grove (Colorful)
          </button>
        </div>
      )}
    </div>
  );
}
