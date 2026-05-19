import { CalendarDays, CheckCircle2, Clock3, PhoneCall, Users, XCircle } from "lucide-react";
import Link from "next/link";

import { saveAttendanceAction } from "@/app/admin/actions";
import { AttendanceDateNavigator } from "@/components/admin-route-controls";
import { AttendanceManager } from "@/components/attendance-manager";
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

  const serializedWorkers = workers.map((worker) => ({
    _id: worker._id.toString(),
    name: worker.name,
    role: worker.role,
    phoneNumber: worker.phoneNumber,
    joiningDate: worker.joiningDate instanceof Date ? worker.joiningDate.toISOString() : new Date(worker.joiningDate).toISOString(),
  }));

  const serializedAttendance = attendance.map((record) => ({
    workerId: record.workerId.toString(),
    status: record.status as "present" | "half" | "absent",
  }));

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

        {serializedWorkers.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
            No workers added yet. Go to the worker management page first.
          </div>
        ) : (
          <form action={saveAttendanceAction} className="mt-6">
            <input type="hidden" name="date" value={selectedDate} />

            <AttendanceManager
              workers={serializedWorkers}
              initialAttendance={serializedAttendance}
              selectedDate={selectedDate}
            />

            <SubmitButton
              label="Save Attendance"
              pendingLabel="Saving attendance..."
              className="mt-6 inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            />
          </form>
        )}
      </section>
    </main>
  );
}
