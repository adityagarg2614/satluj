import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AttendanceMonthNavigator } from "@/components/admin-route-controls";
import { buildWorkerSalaryLedger, DIHADI_PAYMENT_CATEGORIES } from "@/lib/salary";
import { connectToDatabase } from "@/lib/db";
import { formatMonthLabel, formatNumber, normalizeMonthKey } from "@/lib/format";
import {
  DAILY_WAGE_RECORDS_LABEL,
  groupDihadiWorkersByName,
  getWorkerRoleLabel,
  hasDisplayPhoneNumber,
  normalizeWorkerIdentityName,
  resolveWorkerType,
} from "@/lib/worker-utils";
import { AttendanceModel } from "@/models/attendance";
import { DaybookEntryModel } from "@/models/daybook-entry";
import { WorkerModel } from "@/models/worker";

export const dynamic = "force-dynamic";

type DihadiRecordsPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

function getStatusPriority(status: "present" | "half" | "absent") {
  if (status === "present") {
    return 2;
  }

  if (status === "half") {
    return 1;
  }

  return 0;
}

function buildCanonicalAttendanceRecords(
  attendanceRecords: Array<{
    workerId: { toString(): string };
    dateKey: string;
    status: "present" | "half" | "absent";
    dayValue?: number;
  }>,
  canonicalWorkerIdByWorkerId: Map<string, string>,
) {
  const groupedRecords = new Map<
    string,
    {
      workerId: { toString(): string };
      dateKey: string;
      status: "present" | "half" | "absent";
      dayValue?: number;
    }
  >();

  attendanceRecords.forEach((record) => {
    const canonicalWorkerId = canonicalWorkerIdByWorkerId.get(record.workerId.toString());

    if (!canonicalWorkerId) {
      return;
    }

    const key = `${canonicalWorkerId}:${record.dateKey}`;
    const existingRecord = groupedRecords.get(key);

    if (
      !existingRecord ||
      getStatusPriority(record.status) > getStatusPriority(existingRecord.status)
    ) {
      groupedRecords.set(key, {
        workerId: {
          toString() {
            return canonicalWorkerId;
          },
        },
        dateKey: record.dateKey,
        status: record.status,
        dayValue: record.dayValue,
      });
    }
  });

  return Array.from(groupedRecords.values());
}

function buildCanonicalPaymentEntries(
  paymentEntries: Array<{
    _id: { toString(): string };
    workerId?: { toString(): string } | null;
    entryDateKey: string;
    partyName: string;
    category: string;
    amount?: number | null;
    note?: string;
    createdAt?: Date | string;
  }>,
  canonicalWorkerIdByWorkerId: Map<string, string>,
  canonicalWorkerIdByName: Map<string, string>,
  canonicalWorkerNameById: Map<string, string>,
) {
  const transformedEntries = new Map<
    string,
    {
      _id: { toString(): string };
      workerId?: { toString(): string } | null;
      entryDateKey: string;
      partyName: string;
      category: string;
      amount?: number | null;
      note?: string;
      createdAt?: Date | string;
    }
  >();

  paymentEntries.forEach((entry) => {
    const canonicalWorkerId =
      (entry.workerId?.toString()
        ? canonicalWorkerIdByWorkerId.get(entry.workerId.toString())
        : undefined) ??
      canonicalWorkerIdByName.get(normalizeWorkerIdentityName(entry.partyName));

    if (!canonicalWorkerId) {
      return;
    }

    transformedEntries.set(entry._id.toString(), {
      _id: {
        toString() {
          return entry._id.toString();
        },
      },
      workerId: {
        toString() {
          return canonicalWorkerId;
        },
      },
      entryDateKey: entry.entryDateKey,
      partyName: canonicalWorkerNameById.get(canonicalWorkerId) ?? entry.partyName,
      category: entry.category,
      amount: entry.amount,
      note: entry.note,
      createdAt: entry.createdAt,
    });
  });

  return Array.from(transformedEntries.values());
}

export default async function DihadiRecordsPage({
  searchParams,
}: DihadiRecordsPageProps) {
  await connectToDatabase();

  const params = await searchParams;
  const selectedMonth = normalizeMonthKey(params.month);

  const workers = (await WorkerModel.find().lean()).filter(
    (worker) => resolveWorkerType(worker) === "dihadi",
  );
  const workerIds = workers.map((worker) => worker._id);
  const workerNames = workers.map((worker) => worker.name);

  const [allAttendance, paymentEntries] = await Promise.all([
    AttendanceModel.find({ workerId: { $in: workerIds } }).lean(),
    DaybookEntryModel.find({
      type: "payment_given",
      category: { $in: [...DIHADI_PAYMENT_CATEGORIES] },
      $or: [{ workerId: { $in: workerIds } }, { partyName: { $in: workerNames } }],
    }).lean(),
  ]);

  const dihadiGroups = groupDihadiWorkersByName(workers);
  const canonicalWorkerIdByWorkerId = new Map<string, string>();
  const canonicalWorkerIdByName = new Map<string, string>();
  const canonicalWorkerNameById = new Map<string, string>();

  const canonicalWorkers = dihadiGroups.map((group) => {
    const canonicalWorkerId = group.canonicalWorker._id!.toString();
    const latestMember = group.members[group.members.length - 1] ?? group.canonicalWorker;

    canonicalWorkerIdByName.set(group.normalizedName, canonicalWorkerId);
    canonicalWorkerNameById.set(canonicalWorkerId, group.canonicalWorker.name);

    group.workerIds.forEach((workerId) => {
      canonicalWorkerIdByWorkerId.set(workerId, canonicalWorkerId);
    });

    return {
      ...group.canonicalWorker,
      salary: Number(latestMember.salary ?? group.canonicalWorker.salary ?? 0),
      phoneNumber:
        group.members
          .map((worker) => worker.phoneNumber)
          .find((phoneNumber) => hasDisplayPhoneNumber(phoneNumber)) ??
        group.canonicalWorker.phoneNumber,
    };
  });

  const canonicalAttendance = buildCanonicalAttendanceRecords(
    allAttendance,
    canonicalWorkerIdByWorkerId,
  );
  const canonicalPaymentEntries = buildCanonicalPaymentEntries(
    paymentEntries,
    canonicalWorkerIdByWorkerId,
    canonicalWorkerIdByName,
    canonicalWorkerNameById,
  );

  const ledgerByWorker = new Map(
    canonicalWorkers.map((worker) => [
      worker._id.toString(),
      buildWorkerSalaryLedger(worker, canonicalAttendance, canonicalPaymentEntries),
    ]),
  );

  const monthRows = canonicalWorkers.map((worker) => {
    const ledger = ledgerByWorker.get(worker._id.toString())!;
    const monthRecord = ledger.monthlyRecords.find((record) => record.monthKey === selectedMonth);

    return {
      workerId: worker._id.toString(),
      name: worker.name,
      role: worker.role,
      phoneNumber: worker.phoneNumber,
      dailySalary: Number(worker.salary ?? 0),
      workedUnits: monthRecord?.workedUnits ?? 0,
      present: monthRecord?.present ?? 0,
      half: monthRecord?.half ?? 0,
      earnedAmount: monthRecord?.earnedAmount ?? 0,
      paidAmount: monthRecord?.paidAmount ?? 0,
      balance: monthRecord ? monthRecord.earnedAmount - monthRecord.paidAmount : 0,
      totalOutstanding: ledger.outstandingAmount,
    };
  });

  const totals = monthRows.reduce(
    (acc, row) => {
      acc.workedUnits += row.workedUnits;
      acc.earnedAmount += row.earnedAmount;
      acc.paidAmount += row.paidAmount;
      acc.balance += row.balance;
      return acc;
    },
    {
      workedUnits: 0,
      earnedAmount: 0,
      paidAmount: 0,
      balance: 0,
    },
  );

  return (
    <main className="mx-auto max-w-7xl">
      <section className="glass-panel rounded-4xl p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200">
              {DAILY_WAGE_RECORDS_LABEL}
            </p>
            <h1 className="mt-5 font-display text-5xl text-white">
              Daily wage worker attendance and payout view.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Review all daily wage workers separately from permanent staff, including days
              worked, daily rate, earned amount, and salary paid through the daybook.
            </p>
          </div>

          <AttendanceMonthNavigator month={selectedMonth} />
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Unique Workers",
            value: String(canonicalWorkers.length).padStart(2, "0"),
          },
          {
            label: "Worked Units",
            value: formatNumber(totals.workedUnits),
          },
          {
            label: "Earned This Month",
            value: `Rs. ${formatNumber(totals.earnedAmount)}`,
          },
          {
            label: "Paid This Month",
            value: `Rs. ${formatNumber(totals.paidAmount)}`,
          },
          {
            label: totals.balance < 0 ? "Overpaid This Month" : "Pending This Month",
            value: `Rs. ${formatNumber(Math.abs(totals.balance))}`,
          },
        ].map((metric) => (
          <div key={metric.label} className="glass-panel rounded-[1.75rem] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
            <p className="mt-2 text-sm text-slate-300">{formatMonthLabel(selectedMonth)}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 glass-panel rounded-4xl p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {formatMonthLabel(selectedMonth)} Daily Wage Table
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              This table shows only daily-basis workers. It tracks actual days worked and
              payments entered in the daybook. Duplicate same-name daily wage entries are
              merged into one record automatically.
            </p>
          </div>
        </div>

        {canonicalWorkers.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
            No daily wage workers have been saved yet.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-3xl border border-white/8 bg-white/3">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/8">
                <thead className="bg-slate-950/40">
                  <tr className="text-left text-xs uppercase tracking-[0.22em] text-slate-400">
                    <th className="px-5 py-4 font-medium">Worker</th>
                    <th className="px-5 py-4 font-medium">Role</th>
                    <th className="px-5 py-4 font-medium">Daily Rate</th>
                    <th className="px-5 py-4 font-medium">Worked Units</th>
                    <th className="px-5 py-4 font-medium">Earned</th>
                    <th className="px-5 py-4 font-medium">Paid</th>
                    <th className="px-5 py-4 font-medium">Month Balance</th>
                    <th className="px-5 py-4 font-medium">Overall Pending</th>
                    <th className="px-5 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {monthRows.map((worker) => (
                    <tr key={worker.workerId} className="text-sm text-slate-200">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-white">{worker.name}</p>
                          {hasDisplayPhoneNumber(worker.phoneNumber) ? (
                            <p className="mt-1 text-xs text-slate-400">{worker.phoneNumber}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4">{getWorkerRoleLabel(worker)}</td>
                      <td className="px-5 py-4">Rs. {formatNumber(worker.dailySalary)}</td>
                      <td className="px-5 py-4">
                        <div>
                          <p>{formatNumber(worker.workedUnits)}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {worker.present} present • {worker.half} half
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">Rs. {formatNumber(worker.earnedAmount)}</td>
                      <td className="px-5 py-4">Rs. {formatNumber(worker.paidAmount)}</td>
                      <td
                        className={`px-5 py-4 font-semibold ${
                          worker.balance < 0
                            ? "text-rose-200"
                            : worker.balance > 0
                              ? "text-amber-200"
                              : "text-emerald-200"
                        }`}
                      >
                        Rs. {formatNumber(worker.balance)}
                      </td>
                      <td
                        className={`px-5 py-4 font-semibold ${
                          worker.totalOutstanding < 0
                            ? "text-rose-200"
                            : worker.totalOutstanding > 0
                              ? "text-amber-200"
                              : "text-emerald-200"
                        }`}
                      >
                        Rs. {formatNumber(worker.totalOutstanding)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/workers/${worker.workerId}`}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-300/35 hover:text-amber-200"
                        >
                          View Record
                          <ArrowRight className="size-4" />
                        </Link>
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
