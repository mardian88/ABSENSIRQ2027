import HalaqahBoard from "./HalaqahClient";

export const metadata = {
  title: "Pengaturan Halaqoh | ABSENSIRQ2027",
};

export default function PengaturanHalaqohPage() {
  return (
    <div className="flex-1 w-full flex flex-col">
      <HalaqahBoard />
    </div>
  );
}
