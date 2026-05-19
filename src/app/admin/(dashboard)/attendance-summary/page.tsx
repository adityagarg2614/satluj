import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";

import { deleteWorkerAction } from "@/app/admin/actions";
import { AttendanceMonthNavigator } from "@/components/admin-route-controls";
import { AdminStatusToast } from "@/components/admin-toast";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { buildMonthlyAttendanceSummary } from "@/lib/attendance-summary";
import { connectToDatabase } from "@/lib/db";
import { formatDate, formatMonthLabel, formatNumber, normalizeMonthKey } from "@/lib/format";
import { buildWorkerSalaryLedger, WORKER_PAYMENT_CATEGORIES } from "@/lib/salary";
import { AttendanceModel } from "@/models/attendance";
import { DaybookEntryModel } from "@/models/daybook-entry";
import { WorkerModel } from "@/models/worker";

export const dynamic = "force-dynamic";

type AttendanceSummaryPageProps = {
  searchParams: Promise<{
    month?: string;
    error?: string;
    success?: string;
  }>;
};

const successMessages: Record<string, string> = {
  "worker-deleted": "Worker deleted successfully.",
};

const errorMessages: Record<string, string> = {
  "worker-delete-missing": "Unable to delete worker because the worker id was missing.",
};

export default async function AttendanceSummaryPage({
  searchParams,
}: AttendanceSummaryPageProps) {
  await connectToDatabase();

  const params = await searchParams;
  const selectedMonth = normalizeMonthKey(params.month);

  const workers = await WorkerModel.find().sort({ createdAt: -1 }).lean();
  const workerIds = workers.map((w) => w._id);
  const workerNames = workers.map((w) => w.name);

  const [monthlyAttendance, allAttendance, paymentEntries] = await Promise.all([
    AttendanceModel.find({
      dateKey: {
        $regex: `^${selectedMonth}`,
      },
    }).lean(),
    AttendanceModel.find({
      workerId: { $in: workerIds },
    }).lean(),
    DaybookEntryModel.find({
      type: "payment_given",
      category: {
        $in: [...WORKER_PAYMENT_CATEGORIES],
      },
      $or: [
        { workerId: { $in: workerIds } },
        { partyName: { $in: workerNames } },
      ],
    }).lean(),
  ]);

  const monthlySummary = buildMonthlyAttendanceSummary(workers, monthlyAttendance, selectedMonth);
  const salaryLedgers = new Map(
    workers.map((worker) => [
      worker._id.toString(),
      buildWorkerSalaryLedger(worker, allAttendance, paymentEntries),
    ]),
  );
  const successMessage = params.success ? successMessages[params.success] : null;
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const totalEarnedThisMonth = monthlySummary.summaries.reduce(
    (sum, worker) => sum + worker.earnedAmount,
    0,
  );
  const totalOutstanding = monthlySummary.summaries.reduce((sum, worker) => {
    return sum + (salaryLedgers.get(worker.workerId)?.outstandingAmount ?? 0);
  }, 0);

  return (
    <main className="mx-auto max-w-7xl">
      <AdminStatusToast successMessage={successMessage} errorMessage={errorMessage} />

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
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-amber-300/15 bg-amber-300/8 px-4 py-3 text-sm text-slate-200">
              Month days tracked: {monthlySummary.dateKeys.length}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-slate-200">
              Earned this month: Rs. {formatNumber(totalEarnedThisMonth)}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-slate-200">
              Current pending balance: Rs. {formatNumber(totalOutstanding)}
            </div>
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
                    <th className="px-5 py-4 font-medium">Salary</th>
                    <th className="px-5 py-4 font-medium">Present</th>
                    <th className="px-5 py-4 font-medium">Half Day</th>
                    <th className="px-5 py-4 font-medium">Absent</th>
                    <th className="px-5 py-4 font-medium">Earned</th>
                    <th className="px-5 py-4 font-medium">Pending</th>
                    <th className="px-5 py-4 font-medium">Actions</th>
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
                      <td className="px-5 py-4">
                        <div>
                          <p>Rs. {formatNumber(worker.salary)}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Day rate Rs. {formatNumber(worker.dailyRate)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-emerald-200">{worker.present}</td>
                      <td className="px-5 py-4 text-amber-200">{worker.half}</td>
                      <td className="px-5 py-4 text-rose-200">{worker.absent}</td>
                      <td className="px-5 py-4">Rs. {formatNumber(worker.earnedAmount)}</td>
                      <td className="px-5 py-4">
                        Rs.{" "}
                        {formatNumber(
                          salaryLedgers.get(worker.workerId)?.outstandingAmount ?? 0,
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={`/admin/workers/${worker.workerId}`}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-300/35 hover:text-amber-200"
                          >
                            Salary Record
                            <ArrowRight className="size-4" />
                          </Link>

                          <form action={deleteWorkerAction}>
                            <input type="hidden" name="workerId" value={worker.workerId} />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={`/admin/attendance-summary?month=${selectedMonth}`}
                            />
                            <ConfirmSubmitButton
                              label={
                                <span className="inline-flex items-center gap-2">
                                  <Trash2 className="size-4" />
                                  Delete
                                </span>
                              }
                              pendingLabel="Deleting..."
                              confirmMessage="Delete this worker? Their attendance records will also be removed."
                              className="inline-flex items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
                            />
                          </form>
                        </div>
                      </td>
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
