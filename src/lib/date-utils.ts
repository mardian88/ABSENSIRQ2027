/**
 * Helper formatter tanggal dan waktu sesuai aturan GEMINI.md:
 * 1. Zona waktu wajib Asia/Jakarta (WIB GMT+7).
 * 2. Format tanggal wajib menggunakan pemisah titik dua (:) -> DD:MM:YYYY (contoh: 28:03:2026).
 * 3. Format jam wajib 24 Jam -> HH:mm (contoh: 14:30).
 */

export function formatDateWIB(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const parts = formatter.formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value ?? "00";
  const month = parts.find((p) => p.type === "month")?.value ?? "00";
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";

  return `${day}:${month}:${year}`;
}

export function formatTimeWIB(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";

  return `${hour}:${minute}`;
}

export function formatDateTimeWIB(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return `${formatDateWIB(d)} ${formatTimeWIB(d)} WIB`;
}
