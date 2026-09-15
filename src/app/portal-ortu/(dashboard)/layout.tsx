import { ReactNode } from "react";
import { getOrtuSession } from "../actions";
import { redirect } from "next/navigation";
import { BottomNavOrtu } from "@/components/BottomNavOrtu";
import { ThemeProvider } from "./ThemeProvider";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profil = await getOrtuSession();
  
  if (!profil) {
    redirect("/portal-ortu/login");
  }

  return (
    <ThemeProvider>
      <div className="bg-[var(--bg-canvas)] h-screen overflow-hidden transition-colors duration-200">
        <div className="max-w-md mx-auto bg-[var(--bg-canvas)] h-full relative shadow-2xl flex flex-col transition-colors duration-200">
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto w-full pb-20 relative">
            {children}
          </main>
          
          <BottomNavOrtu />
        </div>
      </div>
    </ThemeProvider>
  );
}
