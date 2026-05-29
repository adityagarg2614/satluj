"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarRange,
  Check,
  Clock3,
  ShieldAlert,
} from "lucide-react";

import { updateWorkerAttendanceDayAction } from "@/app/admin/actions";
import { useAdminToast } from "@/components/admin-toast";
import { formatDateLabel } from "@/lib/format";

type AttendanceStatus = "present" | "half" | "absent";

type AttendanceDay = {
  dateKey: string;
  dayNumber: number;
  weekdayLabel: string;
  isEditable: boolean;
  isJoined: boolean;
  status: AttendanceStatus;
};

type WorkerMonthlyAttendanceEditorProps = {
  workerId: string;
  workerName: string;
  role: string;
  monthLabel: string;
  summaryHref: string;
  days: AttendanceDay[];
};

type PendingChange = {
  dateKey: string;
  nextStatus: AttendanceStatus;
  currentStatus: AttendanceStatus;
};

const statusCycle: Record<AttendanceStatus, AttendanceStatus> = {
  absent: "present",
  present: "half",
  half: "absent",
};

const weekdayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusStyles: Record<
  AttendanceStatus,
  {
    tile: string;
    badge: string;
    label: string;
    accent: string;
    helper: string;
  }
> = {
  present: {
    tile:
      "border-emerald-400/30 bg-[linear-gradient(145deg,rgba(6,78,59,0.42),rgba(8,28,24,0.92))] text-emerald-50 shadow-[0_14px_30px_-22px_rgba(16,185,129,0.75)]",
    badge:
      "border border-emerald-400/30 bg-emerald-400/14 text-emerald-50",
    label: "Present",
    accent: "bg-emerald-300",
    helper: "Tap to change",
  },
  half: {
    tile:
      "border-amber-400/30 bg-[linear-gradient(145deg,rgba(120,53,15,0.4),rgba(28,20,8,0.92))] text-amber-50 shadow-[0_14px_30px_-22px_rgba(245,158,11,0.72)]",
    badge:
      "border border-amber-400/30 bg-amber-400/14 text-amber-50",
    label: "Half Day",
    accent: "bg-amber-300",
    helper: "Tap to change",
  },
  absent: {
    tile:
      "border-rose-400/28 bg-[linear-gradient(145deg,rgba(127,29,29,0.34),rgba(24,14,20,0.94))] text-rose-50 shadow-[0_14px_30px_-24px_rgba(244,63,94,0.68)]",
    badge:
      "border border-rose-400/26 bg-rose-400/12 text-rose-50",
    label: "Absent",
    accent: "bg-rose-300",
    helper: "Tap to change",
  },
};

export function WorkerMonthlyAttendanceEditor({
  workerId,
  workerName,
  role,
  monthLabel,
  summaryHref,
  days: initialDays,
}: WorkerMonthlyAttendanceEditorProps) {
  const { pushToast } = useAdminToast();
  const [days, setDays] = useState(initialDays);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    return days.reduce(
      (acc, day) => {
        if (!day.isJoined) {
          return acc;
        }

        if (day.status === "present") {
          acc.present += 1;
        } else if (day.status === "half") {
          acc.half += 1;
        } else {
          acc.absent += 1;
        }

        return acc;
      },
      { present: 0, half: 0, absent: 0 },
    );
  }, [days]);

  const calendarCells = useMemo(() => {
    if (days.length === 0) {
      return [];
    }

    const firstDate = new Date(`${days[0].dateKey}T00:00:00`);
    const jsDay = firstDate.getDay();
    const offset = (jsDay + 6) % 7;

    return [
      ...Array.from({ length: offset }, (_, index) => ({
        id: `empty-${index}`,
        empty: true as const,
      })),
      ...days.map((day) => ({
        id: day.dateKey,
        empty: false as const,
        day,
      })),
    ];
  }, [days]);

  const openChangeConfirmation = (day: AttendanceDay) => {
    if (!day.isEditable || isPending) {
      return;
    }

    setPendingChange({
      dateKey: day.dateKey,
      currentStatus: day.status,
      nextStatus: statusCycle[day.status],
    });
  };

  const confirmChange = () => {
    if (!pendingChange) {
      return;
    }

    startTransition(async () => {
      const result = await updateWorkerAttendanceDayAction({
        workerId,
        dateKey: pendingChange.dateKey,
        status: pendingChange.nextStatus,
      });

      if (!result.ok) {
        pushToast({
          tone: "error",
          title: result.message,
        });
        return;
      }

      setDays((currentDays) =>
        currentDays.map((day) =>
          day.dateKey === pendingChange.dateKey
            ? { ...day, status: pendingChange.nextStatus }
            : day,
        ),
      );
      pushToast({
        tone: "success",
        title: result.message,
      });
      setPendingChange(null);
    });
  };

  const pendingDay = pendingChange
    ? days.find((day) => day.dateKey === pendingChange.dateKey) ?? null
    : null;

  return (
    <>
      <section className="glass-panel rounded-4xl p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200">
              Monthly Attendance Editor
            </p>
            <h1 className="mt-5 font-display text-5xl text-white">{workerName}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Edit monthly attendance in a larger view. Each tile cycles through
              present, half day, and absent after confirmation.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              <span>{role}</span>
              <span>{monthLabel}</span>
              <a
                href={summaryHref}
                className="font-semibold text-amber-200 transition hover:text-amber-100"
              >
                Back to summary
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          {
            label: "Present",
            value: stats.present,
            tone: "border-emerald-300/18 bg-emerald-300/8 text-emerald-100",
          },
          {
            label: "Half Day",
            value: stats.half,
            tone: "border-amber-300/18 bg-amber-300/8 text-amber-100",
          },
          {
            label: "Absent",
            value: stats.absent,
            tone: "border-rose-300/18 bg-rose-300/8 text-rose-100",
          },
        ].map((item) => (
          <div key={item.label} className={`glass-panel rounded-[1.75rem] border p-6 ${item.tone}`}>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-sm text-slate-300">{monthLabel}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 glass-panel rounded-4xl p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Attendance Heatmap</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Tap any joined day to edit attendance. Pre-joining days stay locked.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["present", "half", "absent"] as AttendanceStatus[]).map((status) => (
              <span
                key={status}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${statusStyles[status].badge}`}
              >
                <span className={`size-2.5 rounded-full ${statusStyles[status].accent}`} />
                {statusStyles[status].label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-3">
          {weekdayHeaders.map((label) => (
            <div
              key={label}
              className="rounded-2xl border border-white/8 bg-white/3 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-400"
            >
              {label}
            </div>
          ))}

          {calendarCells.map((cell) =>
            cell.empty ? (
              <div key={cell.id} className="aspect-square rounded-3xl border border-transparent" />
            ) : (
              <button
                key={cell.id}
                type="button"
                onClick={() => openChangeConfirmation(cell.day)}
                disabled={!cell.day.isEditable || isPending}
                className={`aspect-square rounded-3xl border p-3 text-left transition ${
                  cell.day.isJoined
                    ? statusStyles[cell.day.status].tile
                    : "border-white/8 bg-[linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] text-slate-500"
                } ${cell.day.isEditable ? "hover:scale-[1.02] hover:border-white/35 hover:-translate-y-0.5" : "cursor-not-allowed opacity-60"}`}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-lg font-semibold text-white">{cell.day.dayNumber}</span>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-slate-300/90">
                      {cell.day.weekdayLabel}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      {cell.day.isJoined ? (
                        <span
                          className={`size-2 rounded-full ${statusStyles[cell.day.status].accent}`}
                        />
                      ) : null}
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                        {cell.day.isJoined ? statusStyles[cell.day.status].label : "Pre-Join"}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-200/80">
                      {cell.day.isEditable
                        ? statusStyles[cell.day.status].helper
                        : cell.day.isJoined
                          ? "Locked"
                          : "Not active"}
                    </p>
                  </div>
                </div>
              </button>
            ),
          )}
        </div>
      </section>

      {pendingChange && pendingDay ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
            onClick={() => setPendingChange(null)}
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl border border-white/12 bg-[linear-gradient(145deg,rgba(10,14,21,0.98),rgba(19,24,35,0.98))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300/12 text-amber-100">
                <ShieldAlert className="size-6" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">
                  Confirm Attendance Change
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  Change {workerName}&apos;s attendance?
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {formatDateLabel(pendingChange.dateKey)} will change from{" "}
                  <span className="font-semibold text-white">
                    {statusStyles[pendingChange.currentStatus].label}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-white">
                    {statusStyles[pendingChange.nextStatus].label}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-slate-300">
              <div className="flex items-center gap-2 text-amber-100">
                <CalendarRange className="size-4" />
                <span className="font-medium">
                  This update will immediately recalculate the monthly summary.
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingChange(null)}
                className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmChange}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? (
                  <>
                    <Clock3 className="mr-2 size-4 animate-pulse" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 size-4" />
                    Change Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
