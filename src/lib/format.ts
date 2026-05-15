export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getTodayDateKey() {
  const now = new Date();
  return getDateKeyFromDate(now);
}

export function getDateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getCurrentMonthKey() {
  return getTodayDateKey().slice(0, 7);
}

export function normalizeDateKey(input?: string) {
  if (!input) {
    return getTodayDateKey();
  }

  const trimmed = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return getTodayDateKey();
  }

  return trimmed;
}

export function normalizeMonthKey(input?: string) {
  if (!input) {
    return getCurrentMonthKey();
  }

  const trimmed = input.trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) {
    return getCurrentMonthKey();
  }

  return trimmed;
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function formatDateLabel(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateKey}T00:00:00`));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function getMonthDateKeys(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const currentMonthKey = getCurrentMonthKey();
  const todayKey = getTodayDateKey();
  const lastDay =
    monthKey === currentMonthKey
      ? Number(todayKey.slice(8, 10))
      : new Date(year, month, 0).getDate();

  return Array.from({ length: lastDay }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${monthKey}-${day}`;
  });
}
