import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  IndianRupee,
  ReceiptText,
  Trash2,
  WalletCards,
} from "lucide-react";

import { deleteWorkerAction } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { connectToDatabase } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";
import { buildWorkerSalaryLedger, WORKER_PAYMENT_CATEGORIES } from "@/lib/salary";
import { AttendanceModel } from "@/models/attendance";
import { DaybookEntryModel } from "@/models/daybook-entry";
import { WorkerModel } from "@/models/worker";

export const dynamic = "force-dynamic";

type WorkerSalaryPageProps = {
  params: Promise<{
    workerId: string;
  }>;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function WorkerSalaryPage({ params }: WorkerSalaryPageProps) {
  await connectToDatabase();

  const { workerId } = await params;
  const worker = await WorkerModel.findById(workerId).lean();

  if (!worker) {
    notFound();
  }

  const [attendanceRecords, paymentEntries] = await Promise.all([
    AttendanceModel.find({ workerId: worker._id }).sort({ dateKey: 1 }).lean(),
    DaybookEntryModel.find({
      type: "payment_given",
      category: { $in: [...WORKER_PAYMENT_CATEGORIES] },
      $or: [
        { workerId: worker._id },
        { partyName: new RegExp(`^${escapeRegExp(worker.name)}$`, "i") },
      ],
    })
      .sort({ entryDateKey: -1, createdAt: -1 })
      .lean(),
  ]);

  const ledger = buildWorkerSalaryLedger(worker, attendanceRecords, paymentEntries);

  return (
    <main className="mx-auto max-w-7xl">
      <section className="glass-panel rounded-4xl p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <Link
              href="/admin/attendance-summary"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200 transition hover:text-amber-100"
            >
              <ArrowLeft className="size-4" />
              Back to monthly summary
            </Link>

            <p className="mt-5 text-xs uppercase tracking-[0.32em] text-amber-200">
              Worker Salary Record
            </p>
            <h1 className="mt-4 font-display text-5xl text-white">{worker.name}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Salary, attendance-earned amount, advances, and payment history for this
              worker stay together here so admin can review the full record clearly.
            </p>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              <span>{worker.role}</span>
              <span>Joined {formatDate(worker.joiningDate)}</span>
              <span>{worker.phoneNumber}</span>
            </div>
          </div>

          <form action={deleteWorkerAction} className="shrink-0">
            <input type="hidden" name="workerId" value={worker._id.toString()} />
            <input type="hidden" name="returnTo" value="/admin/attendance-summary" />
            <ConfirmSubmitButton
              label={
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="size-4" />
                  Delete Worker
                </span>
              }
              pendingLabel="Deleting worker..."
              confirmMessage="Delete this worker? Their attendance records will also be removed."
              className="inline-flex items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: IndianRupee,
            label: "Monthly Salary",
            value: `Rs. ${formatNumber(worker.salary ?? 0)}`,
            detail: `Daily rate Rs. ${formatNumber(ledger.currentDailyRate)}`,
          },
          {
            icon: CalendarRange,
            label: "Worked Days",
            value: formatNumber(ledger.totalWorkedUnits),
            detail: `${ledger.totalPresent} present • ${ledger.totalHalf} half day`,
          },
          {
            icon: WalletCards,
            label: "Earned Till Date",
            value: `Rs. ${formatNumber(ledger.totalEarnedAmount)}`,
            detail: `${ledger.totalAbsent} absent counted across saved months`,
          },
          {
            icon: ReceiptText,
            label: "Current Balance",
            value: `Rs. ${formatNumber(ledger.outstandingAmount)}`,
            detail: `Paid Rs. ${formatNumber(ledger.totalPaidAmount)} including advances`,
          },
        ].map((metric) => (
          <div key={metric.label} className="glass-panel rounded-[1.75rem] p-6">
            <metric.icon className="size-5 text-amber-200" />
            <p className="mt-5 text-xs uppercase tracking-[0.28em] text-slate-400">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-4xl p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Month-by-Month Salary View</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Earned amount updates automatically from attendance. Payments and advances
                reduce the running balance month by month.
              </p>
            </div>
          </div>

          {ledger.monthlyRecords.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
              No attendance or salary records found for this worker yet.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-white/8 bg-white/3">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/8">
                  <thead className="bg-slate-950/40">
                    <tr className="text-left text-xs uppercase tracking-[0.22em] text-slate-400">
                      <th className="px-5 py-4 font-medium">Month</th>
                      <th className="px-5 py-4 font-medium">Present</th>
                      <th className="px-5 py-4 font-medium">Half</th>
                      <th className="px-5 py-4 font-medium">Absent</th>
                      <th className="px-5 py-4 font-medium">Earned</th>
                      <th className="px-5 py-4 font-medium">Paid</th>
                      <th className="px-5 py-4 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {ledger.monthlyRecords.map((record) => (
                      <tr key={record.monthKey} className="text-sm text-slate-200">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-white">{record.monthLabel}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Daily rate Rs. {formatNumber(record.dailyRate)}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-emerald-200">{record.present}</td>
                        <td className="px-5 py-4 text-amber-200">{record.half}</td>
                        <td className="px-5 py-4 text-rose-200">{record.absent}</td>
                        <td className="px-5 py-4">Rs. {formatNumber(record.earnedAmount)}</td>
                        <td className="px-5 py-4">
                          <div>
                            <p>Rs. {formatNumber(record.paidAmount)}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Salary {formatNumber(record.salaryAmount)} • Advance{" "}
                              {formatNumber(record.advanceAmount)}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-white">
                          Rs. {formatNumber(record.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel rounded-4xl p-7">
          <h2 className="text-xl font-semibold text-white">Payment History</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Every salary or advance entry from the daybook is listed here with the date
            it was recorded.
          </p>

          {ledger.paymentHistory.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
              No salary or advance payment entries have been saved for this worker yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {ledger.paymentHistory.map((payment) => (
                <article
                  key={payment.id}
                  className="rounded-3xl border border-white/8 bg-white/3 p-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-amber-100">
                          {payment.category}
                        </span>
                      </div>
                      <p className="mt-3 text-lg font-semibold text-white">
                        Rs. {formatNumber(payment.amount)}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">{payment.dateKey}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                      {payment.createdAtLabel}
                    </div>
                  </div>

                  {payment.note ? (
                    <p className="mt-4 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm leading-6 text-slate-300">
                      {payment.note}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
