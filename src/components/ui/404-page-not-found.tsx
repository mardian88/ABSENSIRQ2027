"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function NotFoundPage() {
  const router = useRouter();

  return (
    <section className="bg-white font-serif min-h-screen flex items-center justify-center">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="w-full sm:w-10/12 md:w-8/12 text-center">
            <div
              className="bg-[url('https://images.unsplash.com/photo-1594322436404-5a0526db4d13?auto=format&fit=crop&w=800&q=80')] h-[250px] sm:h-[350px] md:h-[400px] bg-center bg-no-repeat bg-contain"
              aria-hidden="true"
            >
              <h1 className="text-center text-black text-6xl sm:text-7xl md:text-8xl pt-6 sm:pt-8">
                404
              </h1>
            </div>

            <div className="mt-[-50px]">
              <h3 className="text-2xl text-black sm:text-3xl font-bold mb-4">
                Afwan, Halaman yang anda Akses
              </h3>
              <p className="mb-6 text-black sm:mb-5">
                sepertinya mengalami ERROR, silakan kembali ke Beranda
              </p>

              <Button
                variant="default"
                onClick={() => router.push("/home")}
                className="my-5 bg-green-600 hover:bg-green-700 "
              >
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
