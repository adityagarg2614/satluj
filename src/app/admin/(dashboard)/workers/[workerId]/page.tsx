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
import {
  buildWorkerSalaryLedger,
  DIHADI_PAYMENT_CATEGORIES,
  getWorkerPaymentCategoryLabel,
  PERMANENT_PAYMENT_CATEGORIES,
} from "@/lib/salary";
import {
  groupDihadiWorkersByName,
  getWorkerRoleLabel,
  hasDisplayPhoneNumber,
  resolveWorkerType,
  DAILY_WAGE_RECORDS_LABEL,
} from "@/lib/worker-utils";
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

function getStatusPriority(status: "present" | "half" | "absent") {
  if (status === "present") {
    return 2;
  }

  if (status === "half") {
    return 1;
  }

  return 0;
}

export default async function WorkerSalaryPage({ params }: WorkerSalaryPageProps) {
  await connectToDatabase();

  const { workerId } = await params;
  const worker = await WorkerModel.findById(workerId).lean();

  if (!worker) {
    notFound();
  }

  const workerType = resolveWorkerType(worker);
  const paymentCategories =
    workerType === "dihadi" ? DIHADI_PAYMENT_CATEGORIES : PERMANENT_PAYMENT_CATEGORIES;
  const backHref = workerType === "dihadi" ? "/admin/dihadi-records" : "/admin/attendance-summary";
  let ledgerWorker = worker;

  const [attendanceRecords, paymentEntries, relatedDihadiWorkers] = await Promise.all(
    workerType === "dihadi"
      ? [
          AttendanceModel.find({}).sort({ dateKey: 1 }).lean(),
          DaybookEntryModel.find({
            type: "payment_given",
            category: { $in: [...paymentCategories] },
            partyName: new RegExp(`^${escapeRegExp(worker.name)}$`, "i"),
          })
            .sort({ entryDateKey: -1, createdAt: -1 })
            .lean(),
          WorkerModel.find({
            name: new RegExp(`^${escapeRegExp(worker.name)}$`, "i"),
          }).lean(),
        ]
      : [
          AttendanceModel.find({ workerId: worker._id }).sort({ dateKey: 1 }).lean(),
          DaybookEntryModel.find({
            type: "payment_given",
            category: { $in: [...paymentCategories] },
            $or: [
              { workerId: worker._id },
              { partyName: new RegExp(`^${escapeRegExp(worker.name)}$`, "i") },
            ],
          })
            .sort({ entryDateKey: -1, createdAt: -1 })
            .lean(),
          Promise.resolve([]),
        ],
  );

  const finalAttendanceRecords =
    workerType === "dihadi"
      ? (() => {
          const nameMatchedWorkers = relatedDihadiWorkers.filter(
            (candidate) => resolveWorkerType(candidate) === "dihadi",
          );
          const groups = groupDihadiWorkersByName(nameMatchedWorkers);
          const group = groups[0];

          if (!group) {
            return attendanceRecords;
          }

          const canonicalId = group.canonicalWorker._id!.toString();
          const canonicalWorkerIds = new Set(group.workerIds);
          const mergedAttendance = new Map<
            string,
            {
              workerId: { toString(): string };
              dateKey: string;
              status: "present" | "half" | "absent";
              dayValue?: number;
            }
          >();

          ledgerWorker = {
            ...group.canonicalWorker,
            salary: Number(
              (group.members[group.members.length - 1] ?? group.canonicalWorker).salary ??
                group.canonicalWorker.salary ??
                0,
            ),
            phoneNumber:
              group.members
                .map((member) => member.phoneNumber)
                .find((phoneNumber) => hasDisplayPhoneNumber(phoneNumber)) ??
              group.canonicalWorker.phoneNumber,
          };

          attendanceRecords.forEach((record) => {
            if (!canonicalWorkerIds.has(record.workerId.toString())) {
              return;
            }

            const existingRecord = mergedAttendance.get(record.dateKey);

            if (
              !existingRecord ||
              getStatusPriority(record.status) > getStatusPriority(existingRecord.status)
            ) {
              mergedAttendance.set(record.dateKey, {
                workerId: {
                  toString() {
                    return canonicalId;
                  },
                },
                dateKey: record.dateKey,
                status: record.status,
                dayValue: record.dayValue,
              });
            }
          });

          return Array.from(mergedAttendance.values());
        })()
      : attendanceRecords;

  const finalPaymentEntries =
    workerType === "dihadi"
      ? paymentEntries.map((entry) => ({
          _id: entry._id,
          workerId: ledgerWorker._id,
          entryDateKey: entry.entryDateKey,
          partyName: ledgerWorker.name,
          category: entry.category,
          amount: entry.amount,
          note: entry.note,
          createdAt: entry.createdAt,
        }))
      : paymentEntries;

  const ledger = buildWorkerSalaryLedger(ledgerWorker, finalAttendanceRecords, finalPaymentEntries);

  return (
    <main className="mx-auto max-w-7xl">
      <section className="glass-panel rounded-4xl p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200 transition hover:text-amber-100"
            >
              <ArrowLeft className="size-4" />
              Back to {workerType === "dihadi" ? DAILY_WAGE_RECORDS_LABEL.toLowerCase() : "monthly summary"}
            </Link>

            <p className="mt-5 text-xs uppercase tracking-[0.32em] text-amber-200">
              {workerType === "dihadi" ? "Daily Wage Payment Record" : "Worker Salary Record"}
            </p>
            <h1 className="mt-4 font-display text-5xl text-white">{ledgerWorker.name}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              {workerType === "dihadi"
                ? "Daily-rate earnings, worked days, and paid payments stay together here for a clear daily wage record."
                : "Salary, attendance-earned amount, and payment history for this worker stay together here so admin can review the full record clearly."}
            </p>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              <span>{getWorkerRoleLabel(ledgerWorker)}</span>
              <span>Joined {formatDate(ledgerWorker.joiningDate)}</span>
              {hasDisplayPhoneNumber(ledgerWorker.phoneNumber) ? (
                <span>{ledgerWorker.phoneNumber}</span>
              ) : null}
            </div>
          </div>

          <form action={deleteWorkerAction} className="shrink-0">
            <input type="hidden" name="workerId" value={worker._id.toString()} />
            <input type="hidden" name="returnTo" value={backHref} />
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
            label: workerType === "dihadi" ? "Daily Rate" : "Monthly Salary",
            value: `Rs. ${formatNumber(ledgerWorker.salary ?? 0)}`,
            detail:
              workerType === "dihadi"
                ? "Saved per-day wage"
                : `Daily rate Rs. ${formatNumber(ledger.currentDailyRate)}`,
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
            detail:
              workerType === "dihadi"
                ? `${formatNumber(ledger.totalWorkedUnits)} worked units saved`
                : `${ledger.totalAbsent} absent counted across saved months`,
          },
          {
            icon: ReceiptText,
            label: "Current Balance",
            value: `Rs. ${formatNumber(ledger.outstandingAmount)}`,
            detail: `Paid Rs. ${formatNumber(ledger.totalPaidAmount)} so far`,
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
              <h2 className="text-xl font-semibold text-white">
                {workerType === "dihadi" ? "Month-by-Month Daily Wage View" : "Month-by-Month Salary View"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Earned amount updates automatically from attendance. Payments reduce the
                running balance month by month.
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
                              Paid {formatNumber(record.salaryAmount)}
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
            Every salary payment from the daybook is listed here with the date it was
            recorded.
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
                          {getWorkerPaymentCategoryLabel(payment.category)}
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
