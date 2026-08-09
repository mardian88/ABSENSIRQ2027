import { ReactNode } from "react";
import { SidebarOrtu } from "../SidebarOrtu";
import { getOrtuSession } from "../actions";
import { redirect } from "next/navigation";
import MobileSidebarWrapper from "../MobileSidebarWrapper";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profil = await getOrtuSession();
  
  if (!profil) {
    redirect("/portal-ortu/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <SidebarOrtu profil={profil} />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebarWrapper profil={profil}>
        {children}
      </MobileSidebarWrapper>
    </div>
  );
}
