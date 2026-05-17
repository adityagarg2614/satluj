import { CalendarDays, CheckCircle2, Clock3, PhoneCall, Users, XCircle } from "lucide-react";
import Link from "next/link";

import { saveAttendanceAction } from "@/app/admin/actions";
import { AttendanceDateNavigator } from "@/components/admin-route-controls";
import { AdminStatusToast } from "@/components/admin-toast";
import { SubmitButton } from "@/components/submit-button";
import { connectToDatabase } from "@/lib/db";
import { formatDate, formatDateLabel, normalizeDateKey } from "@/lib/format";
import { AttendanceModel } from "@/models/attendance";
import { WorkerModel } from "@/models/worker";


export const dynamic = "force-dynamic";

type AttendancePageProps = {
  searchParams: Promise<{
    date?: string;
    error?: string;
    success?: string;
  }>;
};

const successMessages: Record<string, string> = {
  "attendance-saved": "Attendance saved successfully.",
};

const errorMessages: Record<string, string> = {
  "no-workers": "Add workers first before recording attendance.",
};

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  await connectToDatabase();

  const params = await searchParams;
  const selectedDate = normalizeDateKey(params.date);

  const [workers, attendance] = await Promise.all([
    WorkerModel.find().sort({ createdAt: -1 }).lean(),
    AttendanceModel.find({ dateKey: selectedDate }).lean(),
  ]);

  const attendanceMap = new Map(
    attendance.map((record) => [record.workerId.toString(), record]),
  );

  const totals = workers.reduce(
    (acc, worker) => {
      const current = attendanceMap.get(worker._id.toString());
      const status = current?.status ?? "absent";

      if (status === "present") {
        acc.present += 1;
      } else if (status === "half") {
        acc.half += 1;
      } else {
        acc.absent += 1;
      }

      return acc;
    },
    {
      present: 0,
      half: 0,
      absent: 0,
    },
  );

  const successMessage = params.success ? successMessages[params.success] : null;
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const selectedDateLabel = formatDateLabel(selectedDate);

  return (
    <main className="mx-auto max-w-7xl">
      <AdminStatusToast successMessage={successMessage} errorMessage={errorMessage} />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: Users,
            label: "Total Workers",
            value: String(workers.length).padStart(2, "0"),
            detail: "Available in the attendance register",
          },
          {
            icon: CheckCircle2,
            label: "Present Today",
            value: String(totals.present).padStart(2, "0"),
            detail: selectedDate,
          },
          {
            icon: Clock3,
            label: "Half Day Today",
            value: String(totals.half).padStart(2, "0"),
            detail: "Saved against the selected date",
          },
          {
            icon: XCircle,
            label: "Absent Today",
            value: String(totals.absent).padStart(2, "0"),
            detail: "Workers not marked present or half day",
          },
        ].map((metric) => (
          <div key={metric.label} className="glass-panel rounded-[1.75rem] p-6">
            <metric.icon className="size-5 text-amber-200" />
            <p className="mt-5 text-xs uppercase tracking-[0.28em] text-slate-400">
              {metric.label}
            </p>
            <p className="mt-3 text-4xl font-semibold text-white">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 glass-panel rounded-4xl p-7">
        <div className="flex items-center gap-3">
          <CalendarDays className="size-5 text-amber-200" />
          <h1 className="text-xl font-semibold text-white">Daily Attendance Register</h1>
        </div>

        <div className="mt-6 grid gap-5 rounded-[1.75rem] border border-white/8 bg-white/3 p-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <div className="rounded-3xl border border-white/8 bg-slate-950/18 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">
              Quick Snapshot
            </p>
            <p className="mt-3 text-lg font-semibold text-white">{selectedDateLabel}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Present",
                  value: totals.present,
                  tone: "border-emerald-300/16 bg-emerald-300/8 text-emerald-100",
                },
                {
                  label: "Half Day",
                  value: totals.half,
                  tone: "border-amber-300/16 bg-amber-300/8 text-amber-100",
                },
                {
                  label: "Absent",
                  value: totals.absent,
                  tone: "border-rose-300/16 bg-rose-300/8 text-rose-100",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-3xl border px-4 py-4 ${item.tone}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <Link
              href="/admin/attendance-summary"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 transition hover:text-amber-100"
            >
              Open monthly attendance summary
            </Link>
          </div>

          <div className="rounded-3xl border border-white/8 bg-slate-950/18 p-5 lg:justify-self-end">
            <AttendanceDateNavigator date={selectedDate} />
          </div>
        </div>

        {workers.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
            No workers added yet. Go to the worker management page first.
          </div>
        ) : (
          <form action={saveAttendanceAction} className="mt-6">
            <input type="hidden" name="date" value={selectedDate} />

            <div className="space-y-4">
              {workers.map((worker) => {
                const record = attendanceMap.get(worker._id.toString());
                const currentStatus = record?.status ?? "absent";

                return (
                  <div
                    key={worker._id.toString()}
                    className="rounded-3xl border border-white/8 bg-white/3 p-5"
                  >
                    <input type="hidden" name="workerIds" value={worker._id.toString()} />

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-300/12 text-sm font-semibold text-amber-100">
                          {worker.name
                            .split(" ")
                            .map((part: string) => part[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">{worker.name}</p>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                            <span>{worker.role}</span>
                            <span className="inline-flex items-center gap-2">
                              <PhoneCall className="size-4 text-amber-200" />
                              {worker.phoneNumber}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-400">
                            Joined {formatDate(worker.joiningDate)}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-44">
                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                            Attendance Status
                          </span>
                          <select
                            name={`status-${worker._id.toString()}`}
                            defaultValue={currentStatus}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-amber-300/40"
                          >
                            <option value="present">Present</option>
                            <option value="half">Half Day</option>
                            <option value="absent">Absent</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <SubmitButton
              label="Save Attendance"
              pendingLabel="Saving attendance..."
              className="mt-6 inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        )}
      </section>
    </main>
  );
}
