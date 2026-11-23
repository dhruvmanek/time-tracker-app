export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/** 0 -> "12 AM", 13 -> "1 PM" */
export function formatHour(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  const suffix = hh < 12 ? 'AM' : 'PM';
  const twelve = hh % 12 === 0 ? 12 : hh % 12;
  return `${twelve} ${suffix}`;
}

export function formatRange(start: number, end: number): string {
  return `${formatHour(start)}–${formatHour(end)}`;
}

export function shortWeekday(d: Date): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}
