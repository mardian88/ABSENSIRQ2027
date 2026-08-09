"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FileQuestion, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  const router = useRouter();

  return (
    <section className="flex-1 flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-8 rounded-full mb-6 ring-8 ring-emerald-50/50">
        <FileQuestion className="w-20 h-20 text-emerald-600 dark:text-emerald-400" />
      </div>
      
      <h1 className="text-6xl md:text-7xl font-black text-slate-800 dark:text-slate-100 mb-4 tracking-tight">
        404
      </h1>
      
      <h3 className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-200 mb-3">
        Afwan, Halaman yang Anda akses
      </h3>
      
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto text-lg">
        sepertinya mengalami ERROR atau tidak tersedia. Silakan kembali ke Beranda.
      </p>

      <Button
        onClick={() => router.push("/home")}
        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
      >
        <ArrowLeft className="w-5 h-5" />
        Kembali ke Beranda
      </Button>
    </section>
  );
}
