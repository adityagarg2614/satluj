import { getDateKeyFromDate, getMonthDateKeys } from "@/lib/format";
import { resolveWorkerType } from "@/lib/worker-utils";
import type { AttendanceStatus } from "@/models/attendance";
import type { WorkerType } from "@/models/worker";

export const PERMANENT_PAYMENT_CATEGORIES = ["Worker Salary", "Worker Advance"] as const;
export const DAILY_WAGE_PAYMENT_CATEGORY = "Daily Wage Payment";
export const LEGACY_DAILY_WAGE_PAYMENT_CATEGORY = "Dihadi Salary";
export const DIHADI_PAYMENT_CATEGORIES = [
  DAILY_WAGE_PAYMENT_CATEGORY,
  LEGACY_DAILY_WAGE_PAYMENT_CATEGORY,
] as const;
export const WORKER_PAYMENT_CATEGORIES = [
  ...PERMANENT_PAYMENT_CATEGORIES,
  ...DIHADI_PAYMENT_CATEGORIES,
] as const;

export type WorkerPaymentCategory = (typeof WORKER_PAYMENT_CATEGORIES)[number];

type WorkerSalaryInput = {
  _id: {
    toString(): string;
  };
  name: string;
  role: string;
  workerType?: WorkerType;
  joiningDate: Date | string;
  salary?: number;
  phoneNumber: string;
  photoUrl?: string;
};

type AttendanceSalaryInput = {
  workerId: {
    toString(): string;
  };
  dateKey: string;
  status: AttendanceStatus;
  dayValue?: number;
};

type WorkerPaymentInput = {
  _id: {
    toString(): string;
  };
  workerId?: {
    toString(): string;
  } | null;
  entryDateKey: string;
  partyName: string;
  category: string;
  amount?: number | null;
  note?: string;
  createdAt?: Date | string;
};

export type WorkerMonthlySalaryRecord = {
  monthKey: string;
  monthLabel: string;
  present: number;
  half: number;
  absent: number;
  workedUnits: number;
  trackedDays: number;
  dailyRate: number;
  earnedAmount: number;
  paidAmount: number;
  advanceAmount: number;
  salaryAmount: number;
  runningBalance: number;
};

export type WorkerPaymentHistoryRecord = {
  id: string;
  dateKey: string;
  category: string;
  amount: number;
  note: string;
  createdAtLabel: string;
};

export function getWorkerPaymentCategoryLabel(category: string) {
  if (category === LEGACY_DAILY_WAGE_PAYMENT_CATEGORY) {
    return DAILY_WAGE_PAYMENT_CATEGORY;
  }

  return category;
}

function normalizePersonName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function getDaysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function formatTimestamp(date: Date | string | undefined) {
  const value = date ? new Date(date) : new Date();
  return value.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDayValue(status: AttendanceStatus, dayValue?: number) {
  if (typeof dayValue === "number") {
    return dayValue;
  }

  if (status === "present") {
    return 1;
  }

  if (status === "half") {
    return 0.5;
  }

  return 0;
}

function getMonthKeysBetween(startDate: Date, endDate: Date) {
  const keys: string[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= last) {
    keys.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
}

function getCategorySetForWorker(workerType: WorkerType | undefined) {
  return workerType === "dihadi"
    ? new Set<string>(DIHADI_PAYMENT_CATEGORIES)
    : new Set<string>(PERMANENT_PAYMENT_CATEGORIES);
}

function getMonthKeysFromRecords(
  attendanceRecords: AttendanceSalaryInput[],
  paymentEntries: WorkerPaymentInput[],
) {
  const keys = new Set<string>();

  attendanceRecords.forEach((record) => {
    keys.add(record.dateKey.slice(0, 7));
  });

  paymentEntries.forEach((entry) => {
    keys.add(entry.entryDateKey.slice(0, 7));
  });

  return Array.from(keys).sort((first, second) => first.localeCompare(second));
}

export function calculateWorkerDailyRate(monthlySalary: number, monthKey: string) {
  if (!monthlySalary) {
    return 0;
  }

  return monthlySalary / getDaysInMonth(monthKey);
}

export function getWorkerPaymentEntries(
  worker: WorkerSalaryInput,
  paymentEntries: WorkerPaymentInput[],
) {
  const workerId = worker._id.toString();
  const normalizedWorkerName = normalizePersonName(worker.name);
  const allowedCategories = getCategorySetForWorker(resolveWorkerType(worker));

  return paymentEntries
    .filter(
      (entry) =>
        allowedCategories.has(entry.category) &&
        (entry.workerId?.toString() === workerId ||
          normalizePersonName(entry.partyName) === normalizedWorkerName),
    )
    .sort((first, second) => {
      if (first.entryDateKey === second.entryDateKey) {
        return new Date(second.createdAt ?? 0).getTime() - new Date(first.createdAt ?? 0).getTime();
      }

      return second.entryDateKey.localeCompare(first.entryDateKey);
    });
}

export function buildWorkerSalaryLedger(
  worker: WorkerSalaryInput,
  attendanceRecords: AttendanceSalaryInput[],
  paymentEntries: WorkerPaymentInput[],
) {
  const workerId = worker._id.toString();
  const joiningDate = new Date(worker.joiningDate);
  const joiningDateKey = getDateKeyFromDate(joiningDate);
  const workerType = resolveWorkerType(worker);
  const salary = Number(worker.salary ?? 0);

  const workerAttendance = attendanceRecords.filter(
    (record) => record.workerId.toString() === workerId,
  );
  const attendanceMap = new Map(workerAttendance.map((record) => [record.dateKey, record]));
  const workerPayments = getWorkerPaymentEntries(worker, paymentEntries);
  const paymentMap = new Map<string, WorkerPaymentInput[]>();

  workerPayments.forEach((entry) => {
    const existing = paymentMap.get(entry.entryDateKey.slice(0, 7)) ?? [];
    existing.push(entry);
    paymentMap.set(entry.entryDateKey.slice(0, 7), existing);
  });

  const monthKeys =
    workerType === "dihadi"
      ? getMonthKeysFromRecords(workerAttendance, workerPayments)
      : (() => {
          const lastPaymentDateKey = workerPayments[0]?.entryDateKey;
          const paymentEndDate = lastPaymentDateKey
            ? new Date(`${lastPaymentDateKey}T00:00:00`)
            : null;
          const now = new Date();
          const endDate = paymentEndDate && paymentEndDate > now ? paymentEndDate : now;
          return getMonthKeysBetween(joiningDate, endDate);
        })();

  let totalPresent = 0;
  let totalHalf = 0;
  let totalAbsent = 0;
  let totalWorkedUnits = 0;
  let totalEarnedAmount = 0;
  let totalPaidAmount = 0;
  let totalAdvanceAmount = 0;
  let totalSalaryPayments = 0;
  let runningBalance = 0;

  const monthlyRecords = monthKeys
    .map((monthKey) => {
      const monthPayments = paymentMap.get(monthKey) ?? [];
      const paidAmount = monthPayments.reduce(
        (sum, entry) => sum + Number(entry.amount ?? 0),
        0,
      );
      const salaryAmount = monthPayments.reduce(
        (sum, entry) => sum + Number(entry.amount ?? 0),
        0,
      );
      const counts =
        workerType === "dihadi"
          ? workerAttendance
              .filter((record) => record.dateKey.startsWith(monthKey))
              .reduce(
                (acc, record) => {
                  const dayValue = getDayValue(record.status, record.dayValue);

                  if (record.status === "present") {
                    acc.present += 1;
                  } else if (record.status === "half") {
                    acc.half += 1;
                  } else {
                    acc.absent += 1;
                  }

                  acc.workedUnits += dayValue;
                  acc.earnedAmount += dayValue * salary;

                  return acc;
                },
                {
                  present: 0,
                  half: 0,
                  absent: 0,
                  workedUnits: 0,
                  earnedAmount: 0,
                  trackedDays: 0,
                },
              )
          : (() => {
              const dateKeys = getMonthDateKeys(monthKey);
              const dailyRate = calculateWorkerDailyRate(salary, monthKey);
              const reduced = dateKeys.reduce(
                (acc, dateKey) => {
                  if (dateKey < joiningDateKey) {
                    acc.absent += 1;
                    return acc;
                  }

                  const record = attendanceMap.get(dateKey);
                  const status = record?.status ?? "absent";
                  const dayValue = getDayValue(status, record?.dayValue);

                  if (status === "present") {
                    acc.present += 1;
                  } else if (status === "half") {
                    acc.half += 1;
                  } else {
                    acc.absent += 1;
                  }

                  acc.workedUnits += dayValue;
                  acc.earnedAmount += dayValue * dailyRate;

                  return acc;
                },
                {
                  present: 0,
                  half: 0,
                  absent: 0,
                  workedUnits: 0,
                  earnedAmount: 0,
                },
              );

              return {
                ...reduced,
                trackedDays: dateKeys.length,
              };
            })();
      const dailyRate = workerType === "dihadi" ? salary : calculateWorkerDailyRate(salary, monthKey);
      const trackedDays =
        workerType === "dihadi"
          ? counts.present + counts.half + counts.absent
          : counts.trackedDays;
      const advanceAmount =
        workerType === "permanent"
          ? monthPayments
              .filter((entry) => entry.category === "Worker Advance")
              .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0)
          : Math.max(paidAmount - counts.earnedAmount, 0);

      runningBalance += counts.earnedAmount - paidAmount;
      totalPresent += counts.present;
      totalHalf += counts.half;
      totalAbsent += counts.absent;
      totalWorkedUnits += counts.workedUnits;
      totalEarnedAmount += counts.earnedAmount;
      totalPaidAmount += paidAmount;
      totalAdvanceAmount += advanceAmount;
      totalSalaryPayments += salaryAmount;

      return {
        monthKey,
        monthLabel: getMonthLabel(monthKey),
        present: counts.present,
        half: counts.half,
        absent: counts.absent,
        workedUnits: counts.workedUnits,
        trackedDays,
        dailyRate,
        earnedAmount: counts.earnedAmount,
        paidAmount,
        advanceAmount,
        salaryAmount,
        runningBalance,
      };
    })
    .reverse();

  return {
    workerType,
    salary,
    totalPresent,
    totalHalf,
    totalAbsent,
    totalWorkedUnits,
    totalEarnedAmount,
    totalPaidAmount,
    totalAdvanceAmount,
    totalSalaryPayments,
    outstandingAmount: totalEarnedAmount - totalPaidAmount,
    currentDailyRate:
      workerType === "dihadi"
        ? salary
        : monthKeys.length > 0
          ? calculateWorkerDailyRate(salary, monthKeys[monthKeys.length - 1])
          : 0,
    paymentHistory: workerPayments.map((entry) => ({
      id: entry._id.toString(),
      dateKey: entry.entryDateKey,
      category: entry.category,
      amount: Number(entry.amount ?? 0),
      note: entry.note ?? "",
      createdAtLabel: formatTimestamp(entry.createdAt),
    })),
    monthlyRecords,
  };
}
