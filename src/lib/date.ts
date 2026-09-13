export function formatDateID(date: Date | string | number): string {
  if (!date) return '-';
  const d = new Date(date);
  // Options to ensure DD/MM/YYYY format explicitly
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  return formatter.format(d);
}

export function formatTimeID(date: Date | string | number): string {
  if (!date) return '-';
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(d);
}

export function formatDateTimeID(date: Date | string | number): string {
  return `${formatDateID(date)} ${formatTimeID(date)}`;
}
