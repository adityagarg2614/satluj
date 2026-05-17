import { getDateKeyFromDate, getMonthDateKeys } from "@/lib/format";
import { calculateWorkerDailyRate } from "@/lib/salary";
import type { AttendanceStatus } from "@/models/attendance";

type WorkerSummaryInput = {
  _id: {
    toString(): string;
  };
  name: string;
  role: string;
  joiningDate: Date | string;
  salary?: number;
  phoneNumber: string;
  photoUrl?: string;
};

type AttendanceSummaryInput = {
  workerId: {
    toString(): string;
  };
  dateKey: string;
  status: AttendanceStatus;
};

export type MonthlyWorkerAttendanceSummary = {
  workerId: string;
  name: string;
  role: string;
  joiningDate: Date | string;
  salary: number;
  phoneNumber: string;
  photoUrl?: string;
  present: number;
  half: number;
  absent: number;
  trackedDays: number;
  workedUnits: number;
  dailyRate: number;
  earnedAmount: number;
};

export function buildMonthlyAttendanceSummary(
  workers: WorkerSummaryInput[],
  attendanceRecords: AttendanceSummaryInput[],
  monthKey: string,
) {
  const dateKeys = getMonthDateKeys(monthKey);
  const attendanceByWorker = new Map<string, Map<string, AttendanceStatus>>();

  attendanceRecords.forEach((record) => {
    const workerId = record.workerId.toString();
    const workerMap = attendanceByWorker.get(workerId) ?? new Map<string, AttendanceStatus>();

    workerMap.set(record.dateKey, record.status);
    attendanceByWorker.set(workerId, workerMap);
  });

  const summaries = workers.map((worker) => {
    const workerId = worker._id.toString();
    const joinDateKey = getDateKeyFromDate(new Date(worker.joiningDate));
    const workerAttendance = attendanceByWorker.get(workerId) ?? new Map<string, AttendanceStatus>();
    const salary = Number(worker.salary ?? 0);
    const dailyRate = calculateWorkerDailyRate(salary, monthKey);

    const counts = dateKeys.reduce(
      (acc, dateKey) => {
        if (dateKey < joinDateKey) {
          acc.absent += 1;
          return acc;
        }

        const status = workerAttendance.get(dateKey) ?? "absent";

        if (status === "present") {
          acc.present += 1;
          acc.workedUnits += 1;
        } else if (status === "half") {
          acc.half += 1;
          acc.workedUnits += 0.5;
        } else {
          acc.absent += 1;
        }

        return acc;
      },
      {
        present: 0,
        half: 0,
        absent: 0,
        workedUnits: 0,
      },
    );

    return {
      workerId,
      name: worker.name,
      role: worker.role,
      joiningDate: worker.joiningDate,
      salary,
      phoneNumber: worker.phoneNumber,
      photoUrl: worker.photoUrl,
      present: counts.present,
      half: counts.half,
      absent: counts.absent,
      trackedDays: dateKeys.length,
      workedUnits: counts.workedUnits,
      dailyRate,
      earnedAmount: counts.workedUnits * dailyRate,
    };
  });

  const totals = summaries.reduce(
    (acc, worker) => {
      acc.present += worker.present;
      acc.half += worker.half;
      acc.absent += worker.absent;
      return acc;
    },
    {
      present: 0,
      half: 0,
      absent: 0,
    },
  );

  return {
    dateKeys,
    summaries,
    totals,
  };
}
