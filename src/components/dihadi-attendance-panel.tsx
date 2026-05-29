"use client";

import { useMemo, useState } from "react";
import { Coins, Plus, UserPlus, Wallet } from "lucide-react";

import { addDihadiWorkerForDayAction } from "@/app/admin/actions";
import { SubmitButton } from "@/components/submit-button";
import { formatNumber } from "@/lib/format";

type DihadiAttendanceRecord = {
  workerId: string;
  name: string;
  salary: number;
  paidToday: number;
};

type DihadiSuggestion = {
  id: string;
  name: string;
  salary: number;
};

type DihadiAttendancePanelProps = {
  selectedDate: string;
  records: DihadiAttendanceRecord[];
  suggestions: DihadiSuggestion[];
};

export function DihadiAttendancePanel({
  selectedDate,
  records,
  suggestions,
}: DihadiAttendancePanelProps) {
  const [open, setOpen] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const suggestedWorker = useMemo(
    () =>
      suggestions.find(
        (worker) =>
          worker.name.trim().toLowerCase() === workerName.trim().toLowerCase(),
      ) ?? null,
    [suggestions, workerName],
  );

  return (
    <section className="mt-6 rounded-4xl border border-white/8 bg-white/3 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
            Daily Wage Workers
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">Daily-basis worker record</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Add only the daily wage workers who came on {selectedDate}. Permanent workers stay
            in the main attendance register below.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          <Plus className="size-4" />
          Add Daily Wage Worker
        </button>
      </div>

      {records.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-white/12 bg-slate-950/18 p-5 text-sm leading-6 text-slate-300">
          No daily wage worker added for this date yet.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {records.map((record) => (
            <article
              key={record.workerId}
              className="rounded-3xl border border-white/8 bg-slate-950/18 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{record.name}</p>
                  <p className="mt-1 text-sm text-amber-200">Daily-basis worker</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                  Daily Wage
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Daily Rate: Rs. {formatNumber(record.salary)}</p>
                <p>Paid Today: Rs. {formatNumber(record.paidToday)}</p>
              </div>

              <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-slate-200">
                {record.paidToday >= record.salary ? (
                  <span className="inline-flex items-center gap-2 text-emerald-200">
                    <Wallet className="size-4" />
                    Salary paid for today
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-amber-200">
                    <Coins className="size-4" />
                    Pending today: Rs. {formatNumber(record.salary - record.paidToday)}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(10,14,21,0.98),rgba(19,24,35,0.98))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300/12 text-amber-100">
                <UserPlus className="size-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">
                  Add Daily Wage Worker
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  Save a same-day worker for {selectedDate}
                </h3>
              </div>
            </div>

            <form action={addDihadiWorkerForDayAction} className="mt-6 grid gap-4">
              <input type="hidden" name="date" value={selectedDate} />

              <label className="block">
                <span className="text-sm font-medium text-slate-200">Worker Name</span>
                <input
                  type="text"
                  name="name"
                  required
                  list="saved-dihadi-workers"
                  value={workerName}
                  onChange={(event) => setWorkerName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                  placeholder="Select or type worker name"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-200">Per-Day Salary</span>
                <input
                  key={suggestedWorker?.id ?? "custom-dihadi-rate"}
                  type="number"
                  name="salary"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={suggestedWorker ? String(suggestedWorker.salary) : ""}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                  placeholder="500"
                />
              </label>

              {suggestions.length > 0 ? (
                <datalist id="saved-dihadi-workers">
                  {suggestions.map((worker) => (
                    <option key={worker.id} value={worker.name} />
                  ))}
                </datalist>
              ) : null}

              <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
                <SubmitButton
                  label="Save Daily Wage Worker"
                  pendingLabel="Saving..."
                  className="inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
