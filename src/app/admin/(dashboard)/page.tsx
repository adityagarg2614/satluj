import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buildMonthlyAttendanceSummary } from "@/lib/attendance-summary";
import { connectToDatabase } from "@/lib/db";
import { formatDate, formatMonthLabel, getCurrentMonthKey } from "@/lib/format";
import {
  getWorkerTypeBadgeLabel,
  getWorkerRoleLabel,
  hasDisplayPhoneNumber,
  resolveWorkerType,
  sortWorkersForAdmin,
} from "@/lib/worker-utils";
import { AttendanceModel } from "@/models/attendance";
import { WorkerModel } from "@/models/worker";

export const dynamic = "force-dynamic";

export default async function AdminDashboardHomePage() {
  await connectToDatabase();

  const currentMonthKey = getCurrentMonthKey();
  const [workers, monthlyAttendance] = await Promise.all([
    WorkerModel.find().lean(),
    AttendanceModel.find({
      dateKey: {
        $regex: `^${currentMonthKey}`,
      },
    }).lean(),
  ]);

  const sortedWorkers = sortWorkersForAdmin(workers);
  const permanentWorkers = sortedWorkers.filter(
    (worker) => resolveWorkerType(worker) === "permanent",
  );
  const monthlySummary = buildMonthlyAttendanceSummary(
    permanentWorkers,
    monthlyAttendance,
    currentMonthKey,
  );
  const recentWorkers = sortedWorkers.slice(0, 5);

  return (
    <main className="mx-auto max-w-7xl">
      <section className="glass-panel rounded-4xl p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-200">Overview</p>
        <h1 className="mt-5 font-display text-5xl text-white">Admin home for every key business detail.</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
          This page stays your main control room. As we add more modules, this dashboard
          will keep surfacing the most important business numbers, staff activity, and
          quick management actions.
        </p>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel rounded-4xl p-7">
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The sidebar management section opens these dedicated work areas.
          </p>

          <div className="mt-6 grid gap-4">
            {[
              {
                title: "Add and manage workers",
                href: "/admin/workers",
                description:
                  "Create the worker registry with names, roles, joining date, phone number, and optional photo.",
              },
              {
                title: "Mark present, half day, or absent",
                href: "/admin/attendance",
                description:
                  "Open the daily attendance register with smoother date navigation and quick status marking.",
              },
              {
                title: "Review monthly attendance summary",
                href: "/admin/attendance-summary",
                description:
                  "See all workers together for the selected month with present, half day, and absent totals.",
              },
              {
                title: "Maintain the digital daybook",
                href: "/admin/daybook",
                description:
                  "Record purchases, sales, outgoing payments, and received payments for each working day.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-3xl border border-white/8 bg-white/3 p-5 transition hover:border-amber-300/25 hover:bg-white/5"
              >
                <p className="text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                  Open section
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-4xl p-7">
          <h2 className="text-xl font-semibold text-white">Staff Snapshot</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            A quick view of recent workers and this month&apos;s attendance record totals.
          </p>

          <div className="mt-6 rounded-3xl border border-amber-300/15 bg-amber-300/8 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              {formatMonthLabel(currentMonthKey)}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold text-white">{monthlySummary.totals.present}</p>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Present</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{monthlySummary.totals.half}</p>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Half Day</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{monthlySummary.totals.absent}</p>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Absent</p>
              </div>
            </div>
          </div>

          {recentWorkers.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
              No workers added yet. Start from the Management section in the sidebar.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {recentWorkers.map((worker) => (
                <div
                  key={worker._id.toString()}
                  className="rounded-3xl border border-white/8 bg-white/3 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">{worker.name}</p>
                      <p className="mt-1 text-sm text-amber-200">
                        {getWorkerRoleLabel(worker)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                      {getWorkerTypeBadgeLabel(resolveWorkerType(worker))}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    Joined {formatDate(worker.joiningDate)}
                    {hasDisplayPhoneNumber(worker.phoneNumber)
                      ? ` • ${worker.phoneNumber}`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
