import { getSantriPrivatSession } from "@/lib/session-privat";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { logoutPrivat } from "../actions";

export default async function PortalPrivatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSantriPrivatSession();

  if (!user) {
    redirect("/portal-privat/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-emerald-600">Portal Privat</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                <User className="w-4 h-4 text-emerald-600" />
                {user.namaLengkap}
              </div>
              <form action={logoutPrivat}>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full border border-rose-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
