import { getPengaturanHalamanSukses } from "../../pengaturan/actions";
import Link from "next/link";
import { CheckCircle, Home } from "lucide-react";

export default async function SuksesIzinPage() {
  const data = await getPengaturanHalamanSukses();

  return (
    <div className="flex flex-col h-full bg-emerald-600 text-white">
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 text-center animate-in zoom-in duration-500">
        
        {data.urlLogo && (
          <div className="mb-8 p-4 bg-white rounded-2xl shadow-lg inline-block">
            <img src={data.urlLogo} alt="Logo" className="object-contain w-20 h-20" />
          </div>
        )}
        
        {!data.urlLogo && (
          <div className="mb-8">
            <CheckCircle className="w-24 h-24 text-emerald-300" />
          </div>
        )}

        <div 
          className="prose prose-invert prose-emerald max-w-none w-full"
          dangerouslySetInnerHTML={{ __html: data.pesanHtml }}
        />

      </div>

      <div className="p-6">
        <Link 
          href="/izin/dashboard"
          className="flex items-center justify-center w-full h-14 bg-white text-emerald-700 font-bold text-lg rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          <Home className="w-5 h-5 mr-2" />
          Kembali ke Dasbor
        </Link>
      </div>
    </div>
  );
}
