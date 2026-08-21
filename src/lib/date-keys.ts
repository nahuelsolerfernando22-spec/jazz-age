export function todayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function yesterdayKey(of: string): string {
  const [y, m, d] = of.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}

export function isoWeekKey(d: Date = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((t.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function prevIsoWeekKey(of: string): string {
  const [y, w] = of.split("-W").map(Number);

  const jan4 = new Date(Date.UTC(y, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1Mon = new Date(jan4.getTime() - jan4Day * 86400000);
  const thisMon = new Date(week1Mon.getTime() + (w - 1) * 7 * 86400000);
  const prev = new Date(thisMon.getTime() - 7 * 86400000);
  return isoWeekKey(prev);
}

export function dayIndex(d: Date = new Date()): number {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const cur = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((cur - start) / 86400000);
}
