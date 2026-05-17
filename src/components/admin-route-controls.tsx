"use client";

import { useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Sparkles,
} from "lucide-react";

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
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const updateDate = (nextDate: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", nextDate);

    startTransition(() => {
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    });
  };

  const today = getTodayDateKey();
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(`${date}T00:00:00`)),
    [date],
  );
  const compactDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
      }).format(new Date(`${date}T00:00:00`)),
    [date],
  );

  const openDatePicker = () => {
    const input = dateInputRef.current;

    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <button
          type="button"
          onClick={() => updateDate(shiftDate(date, -1))}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white transition hover:border-amber-300/35 hover:text-amber-200"
          aria-label="Previous day"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="relative flex-1">
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            onChange={(event) => updateDate(event.target.value)}
            className="pointer-events-none absolute inset-0 opacity-0"
            tabIndex={-1}
          />

          <button
            type="button"
            onClick={openDatePicker}
            className="group flex w-full items-center justify-between rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-5 py-4 text-left transition hover:border-amber-300/35 hover:bg-white/6"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300/12 text-amber-100">
                <CalendarDays className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Selected Date
                </p>
                <p className="mt-1 truncate text-base font-semibold text-white">
                  {formattedDate}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Tap here to open the calendar and pick any day quickly.
                </p>
              </div>
            </div>

            <div className="ml-4 hidden shrink-0 items-center gap-2 rounded-full border border-white/10 bg-slate-950/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 sm:inline-flex">
              <Sparkles className="size-3.5 text-amber-200" />
              {compactDate}
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={() => updateDate(shiftDate(date, 1))}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white transition hover:border-amber-300/35 hover:text-amber-200"
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
        <button
          type="button"
          onClick={openDatePicker}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-amber-300/35 hover:text-white"
        >
          <CalendarDays className="size-3.5 text-amber-200" />
          Open Calendar
        </button>
      </div>

      {isPending ? (
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-amber-200">
          <Clock3 className="size-3.5" />
          Updating date...
        </p>
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
