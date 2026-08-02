"use client";

import { useState, useEffect } from 'react';

export default function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isClient, setIsClient] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isClient) return null; // Hydration safe

  if (isExpired) {
    return (
      <div className="flex items-center justify-center mb-8 mt-4 animate-in fade-in zoom-in duration-500">
        <div className="px-8 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm text-center">
          <span className="text-2xl md:text-3xl font-extrabold text-emerald-700 tracking-tight">
            Pendaftaran sedang Berlangsung
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-8 mt-4">
      <div className="flex flex-col items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm min-w-[70px]">
        <span className="text-2xl md:text-3xl font-bold text-emerald-600">{timeLeft.days}</span>
        <span className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">Hari</span>
      </div>
      <div className="text-2xl font-bold text-slate-300">:</div>
      <div className="flex flex-col items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm min-w-[70px]">
        <span className="text-2xl md:text-3xl font-bold text-emerald-600">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">Jam</span>
      </div>
      <div className="text-2xl font-bold text-slate-300">:</div>
      <div className="flex flex-col items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm min-w-[70px]">
        <span className="text-2xl md:text-3xl font-bold text-emerald-600">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">Menit</span>
      </div>
      <div className="text-2xl font-bold text-slate-300">:</div>
      <div className="flex flex-col items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm min-w-[70px]">
        <span className="text-2xl md:text-3xl font-bold text-emerald-600 animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">Detik</span>
      </div>
    </div>
  );
}
