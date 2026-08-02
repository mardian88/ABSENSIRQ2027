import { ReactNode } from "react";

export default function IzinLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
        {children}
      </div>
    </div>
  );
}
