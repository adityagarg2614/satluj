import { AttendanceMonthNavigator } from "@/components/admin-route-controls";
import { buildMonthlyAttendanceSummary } from "@/lib/attendance-summary";
import { connectToDatabase } from "@/lib/db";
import { formatDate, formatMonthLabel, normalizeMonthKey } from "@/lib/format";
import { AttendanceModel } from "@/models/attendance";
import { WorkerModel } from "@/models/worker";

export const dynamic = "force-dynamic";

type AttendanceSummaryPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

export default async function AttendanceSummaryPage({
  searchParams,
}: AttendanceSummaryPageProps) {
  await connectToDatabase();

  const params = await searchParams;
  const selectedMonth = normalizeMonthKey(params.month);

  const [workers, monthlyAttendance] = await Promise.all([
    WorkerModel.find().sort({ createdAt: -1 }).lean(),
    AttendanceModel.find({
      dateKey: {
        $regex: `^${selectedMonth}`,
      },
    }).lean(),
  ]);

  const monthlySummary = buildMonthlyAttendanceSummary(workers, monthlyAttendance, selectedMonth);

  return (
    <main className="mx-auto max-w-7xl">
      <section className="glass-panel rounded-4xl p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200">
              Monthly Summary
            </p>
            <h1 className="mt-5 font-display text-5xl text-white">
              All workers together, month by month.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Review attendance for the full team in one clean view. This page is built
              for fast monthly review, including previous months and the pre-joining
              absent rule you requested.
            </p>
          </div>

          <AttendanceMonthNavigator month={selectedMonth} />
        </div>
      </section>

      <section className="mt-8 glass-panel rounded-4xl p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {formatMonthLabel(selectedMonth)} Attendance Table
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Each worker shows present, half day, and absent counts for the selected
              month. Days before joining are treated as absent in this report.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-300/15 bg-amber-300/8 px-4 py-3 text-sm text-slate-200">
            Month days tracked: {monthlySummary.dateKeys.length}
          </div>
        </div>

        {workers.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
            No workers added yet. Start from the worker management page first.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-3xl border border-white/8 bg-white/3">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/8">
                <thead className="bg-slate-950/40">
                  <tr className="text-left text-xs uppercase tracking-[0.22em] text-slate-400">
                    <th className="px-5 py-4 font-medium">Worker</th>
                    <th className="px-5 py-4 font-medium">Role</th>
                    <th className="px-5 py-4 font-medium">Joined</th>
                    <th className="px-5 py-4 font-medium">Present</th>
                    <th className="px-5 py-4 font-medium">Half Day</th>
                    <th className="px-5 py-4 font-medium">Absent</th>
                    <th className="px-5 py-4 font-medium">Month Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {monthlySummary.summaries.map((worker) => (
                    <tr key={worker.workerId} className="text-sm text-slate-200">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-white">{worker.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{worker.phoneNumber}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">{worker.role}</td>
                      <td className="px-5 py-4">{formatDate(worker.joiningDate)}</td>
                      <td className="px-5 py-4 text-emerald-200">{worker.present}</td>
                      <td className="px-5 py-4 text-amber-200">{worker.half}</td>
                      <td className="px-5 py-4 text-rose-200">{worker.absent}</td>
                      <td className="px-5 py-4">{worker.trackedDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
