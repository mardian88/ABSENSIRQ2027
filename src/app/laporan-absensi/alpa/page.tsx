import LayoutDashboard from "@/components/LayoutDashboard";
import LaporanAlpaClient from "./LaporanAlpaClient";

export const metadata = {
  title: "Laporan Alpa - Rumah Qur'an Muharrik",
};

export default function LaporanAlpaPage() {
  return (
    <LayoutDashboard>
      <LaporanAlpaClient />
    </LayoutDashboard>
  );
}
