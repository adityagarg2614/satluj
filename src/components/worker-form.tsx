"use client";

import { useMemo, useState } from "react";

import { addWorkerAction } from "@/app/admin/actions";
import { SubmitButton } from "@/components/submit-button";

const todayDateKey = new Date().toISOString().slice(0, 10);

export function WorkerForm() {
  const [workerType, setWorkerType] = useState<"permanent" | "dihadi">("permanent");
  const isDihadi = workerType === "dihadi";
  const salaryCopy = useMemo(
    () =>
      isDihadi
        ? {
            label: "Per-Day Salary",
            placeholder: "Enter per-day salary",
            helper: "Daily wage for this daily wage worker.",
          }
        : {
            label: "Monthly Salary",
            placeholder: "Enter monthly salary",
            helper: "Monthly salary for this permanent worker.",
          },
    [isDihadi],
  );

  return (
    <form action={addWorkerAction} className="mt-6 grid gap-4">
      {isDihadi ? (
        <>
          <input type="hidden" name="joiningDate" value={todayDateKey} />
          <input type="hidden" name="role" value="Daily Wage" />
        </>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-200">Worker Name</span>
        <input
          type="text"
          name="name"
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
          placeholder="Enter worker name"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-200">Worker Type</span>
          <select
            name="workerType"
            value={workerType}
            onChange={(event) =>
              setWorkerType(event.target.value as "permanent" | "dihadi")
            }
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
          >
            <option value="permanent">Permanent Worker</option>
            <option value="dihadi">Daily Wage Worker</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">{salaryCopy.label}</span>
          <input
            type="number"
            name="salary"
            min="0"
            step="0.01"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
            placeholder={salaryCopy.placeholder}
          />
          <p className="mt-2 text-xs text-slate-400">{salaryCopy.helper}</p>
        </label>
      </div>

      {!isDihadi ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Role</span>
            <input
              type="text"
              name="role"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
              placeholder="Crusher operator, helper, loader..."
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Joining Date</span>
            <input
              type="date"
              name="joiningDate"
              required
              defaultValue={todayDateKey}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-slate-200">Phone Number</span>
            <input
              type="tel"
              name="phoneNumber"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
              placeholder="+91-98XXXXXXXX"
            />
          </label>
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-200">Photo URL (optional)</span>
        <input
          type="url"
          name="photoUrl"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
          placeholder="https://example.com/photo.jpg"
        />
      </label>

      <SubmitButton
        label="Save Worker"
        pendingLabel="Saving worker..."
        className="mt-2 inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </form>
  );
}
