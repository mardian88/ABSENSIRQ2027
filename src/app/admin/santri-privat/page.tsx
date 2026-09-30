import { Metadata } from "next";
import { getSantriPrivatList } from "./actions";
import { SantriPrivatClient } from "./SantriPrivatClient";

export const metadata: Metadata = {
  title: "Manajemen Santri Privat | Sistem Absensi Rumah Qur'an",
  description: "Kelola data santri privat untuk kelas tahfidz dan mengaji",
};

export const dynamic = "force-dynamic";

export default async function SantriPrivatPage() {
  const santriList = await getSantriPrivatList();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <SantriPrivatClient initialData={santriList} />
    </div>
  );
}
