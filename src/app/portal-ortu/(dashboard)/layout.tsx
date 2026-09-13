import { ReactNode } from "react";
import { getOrtuSession } from "../actions";
import { redirect } from "next/navigation";
import { BottomNavOrtu } from "@/components/BottomNavOrtu";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profil = await getOrtuSession();
  
  if (!profil) {
    redirect("/portal-ortu/login");
  }

  return (
    <div className="bg-slate-200 h-screen overflow-hidden">
      <div className="max-w-md mx-auto bg-slate-50 h-full relative shadow-2xl flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full pb-20 relative">
          {children}
        </main>
        
        <BottomNavOrtu />
      </div>
    </div>
  );
}
