const pad = (n: number) => String(n).padStart(2, '0');

// 3725 -> "01:02:05"
export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// 3.8213 -> "3.82"
export function formatDistance(km: number): string {
  return km.toFixed(2);
}

// 6.4333 -> "06:26" ; null/0 -> "--:--"
export function formatPace(minPerKm: number | null): string {
  if (!minPerKm || !isFinite(minPerKm)) return '--:--';
  let m = Math.floor(minPerKm);
  let s = Math.round((minPerKm - m) * 60);
  if (s === 60) {
    m += 1;
    s = 0;
  }
  return `${pad(m)}:${pad(s)}`;
}

// 4920 -> "4.920" (dấu chấm ngăn cách hàng nghìn theo kiểu Việt Nam)
export function formatInt(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
