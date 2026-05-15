"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { getCurrentMonthKey, getDateKeyFromDate, getTodayDateKey } from "@/lib/format";

type DateNavigatorProps = {
  date: string;
  basePath?: string;
};

type MonthNavigatorProps = {
  month: string;
};

function shiftDate(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return getDateKeyFromDate(date);
}

function shiftMonth(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function AttendanceDateNavigator({
  date,
  basePath = "/admin/attendance",
}: DateNavigatorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateDate = (nextDate: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", nextDate);

    startTransition(() => {
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    });
  };

  const today = getTodayDateKey();

  return (
    <div className="flex flex-col gap-3 lg:items-end">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateDate(shiftDate(date, -1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white transition hover:border-amber-300/35 hover:text-amber-200"
          aria-label="Previous day"
        >
          <ChevronLeft className="size-4" />
        </button>

        <label className="relative block">
          <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(event) => updateDate(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-3 pl-10 pr-4 text-white outline-none transition focus:border-amber-300/40"
          />
        </label>

        <button
          type="button"
          onClick={() => updateDate(shiftDate(date, 1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white transition hover:border-amber-300/35 hover:text-amber-200"
          aria-label="Next day"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateDate(today)}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
            date === today
              ? "bg-amber-300 text-slate-950"
              : "border border-white/10 bg-white/4 text-slate-200 hover:border-amber-300/35 hover:text-white"
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => updateDate(shiftDate(today, -1))}
          className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-amber-300/35 hover:text-white"
        >
          Yesterday
        </button>
      </div>

      {isPending ? (
        <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Updating...</p>
      ) : null}
    </div>
  );
}

export function AttendanceMonthNavigator({ month }: MonthNavigatorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateMonth = (nextMonth: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextMonth);

    startTransition(() => {
      router.replace(`/admin/attendance-summary?${params.toString()}`, { scroll: false });
    });
  };

  const currentMonth = getCurrentMonthKey();

  return (
    <div className="flex flex-col gap-3 lg:items-end">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateMonth(shiftMonth(month, -1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white transition hover:border-amber-300/35 hover:text-amber-200"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>

        <label className="relative block">
          <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="month"
            value={month}
            onChange={(event) => updateMonth(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-3 pl-10 pr-4 text-white outline-none transition focus:border-amber-300/40"
          />
        </label>

        <button
          type="button"
          onClick={() => updateMonth(shiftMonth(month, 1))}
          disabled={month >= currentMonth}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white transition hover:border-amber-300/35 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateMonth(currentMonth)}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
            month === currentMonth
              ? "bg-amber-300 text-slate-950"
              : "border border-white/10 bg-white/4 text-slate-200 hover:border-amber-300/35 hover:text-white"
          }`}
        >
          Current Month
        </button>
        <button
          type="button"
          onClick={() => updateMonth(shiftMonth(currentMonth, -1))}
          className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-amber-300/35 hover:text-white"
        >
          Previous Month
        </button>
      </div>

      {isPending ? (
        <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Updating...</p>
      ) : null}
    </div>
  );
}
