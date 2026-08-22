import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistem Absensi Rumah Qur'an",
  description: "Manajemen satu pintu (All-in-One) bagi Rumah Qur'an",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="antialiased">
      <body className={inter.className}>
        <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: '#334155', color: '#fff' } }} />
        <AppLayout>{children}</AppLayout>
        <Analytics />
      </body>
    </html>
  );
}
