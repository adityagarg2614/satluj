import { CalendarDays, CheckCircle2, Clock3, Users, XCircle } from "lucide-react";
import Link from "next/link";

import { saveAttendanceAction } from "@/app/admin/actions";
import { AttendanceDateNavigator } from "@/components/admin-route-controls";
import { AttendanceManager } from "@/components/attendance-manager";
import { AdminStatusToast } from "@/components/admin-toast";
import { DihadiAttendancePanel } from "@/components/dihadi-attendance-panel";
import { SubmitButton } from "@/components/submit-button";
import { connectToDatabase } from "@/lib/db";
import { formatDateLabel, normalizeDateKey } from "@/lib/format";
import { DIHADI_PAYMENT_CATEGORIES } from "@/lib/salary";
import {
  groupDihadiWorkersByName,
  normalizeWorkerIdentityName,
  resolveWorkerType,
  sortWorkersForAdmin,
} from "@/lib/worker-utils";
import { AttendanceModel } from "@/models/attendance";
import { DaybookEntryModel } from "@/models/daybook-entry";
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
  "dihadi-added": "Daily wage worker added for this date.",
};

const errorMessages: Record<string, string> = {
  "no-workers": "Add workers first before recording attendance.",
  "dihadi-fields": "Please complete the daily wage worker details before saving.",
};

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  await connectToDatabase();

  const params = await searchParams;
  const selectedDate = normalizeDateKey(params.date);

  const [workers, attendance, dihadiSalaryEntries] = await Promise.all([
    WorkerModel.find().lean(),
    AttendanceModel.find({ dateKey: selectedDate }).lean(),
    DaybookEntryModel.find({
      entryDateKey: selectedDate,
      type: "payment_given",
      category: { $in: [...DIHADI_PAYMENT_CATEGORIES] },
    }).lean(),
  ]);

  const sortedWorkers = sortWorkersForAdmin(workers);
  const permanentWorkers = sortedWorkers.filter(
    (worker) => resolveWorkerType(worker) === "permanent",
  );
  const dihadiGroups = groupDihadiWorkersByName(sortedWorkers);
  const canonicalDihadiById = new Map(
    dihadiGroups.map((group) => [group.canonicalWorker._id!.toString(), group]),
  );
  const dihadiCanonicalIdByWorkerId = new Map<string, string>();
  const dihadiCanonicalIdByName = new Map<string, string>();

  dihadiGroups.forEach((group) => {
    const canonicalId = group.canonicalWorker._id!.toString();
    dihadiCanonicalIdByName.set(group.normalizedName, canonicalId);
    group.workerIds.forEach((workerId) => {
      dihadiCanonicalIdByWorkerId.set(workerId, canonicalId);
    });
  });

  const dihadiSuggestions = dihadiGroups.map((group) => {
    const latestMember = group.members[group.members.length - 1] ?? group.canonicalWorker;

    return {
      id: group.canonicalWorker._id!.toString(),
      name: group.canonicalWorker.name,
      salary: Number(latestMember.salary ?? group.canonicalWorker.salary ?? 0),
    };
  });

  const serializedWorkers = permanentWorkers.map((worker) => ({
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

  const paidTodayByWorker = new Map<string, number>();
  dihadiSalaryEntries.forEach((entry) => {
    const workerId =
      (entry.workerId?.toString()
        ? dihadiCanonicalIdByWorkerId.get(entry.workerId.toString())
        : undefined) ??
      dihadiCanonicalIdByName.get(normalizeWorkerIdentityName(entry.partyName));

    if (!workerId) {
      return;
    }

    paidTodayByWorker.set(
      workerId,
      (paidTodayByWorker.get(workerId) ?? 0) + Number(entry.amount ?? 0),
    );
  });

  const totals = permanentWorkers.reduce(
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
  const dailyWageTotals = attendance.reduce(
    (acc, record) => {
      const canonicalWorkerId = dihadiCanonicalIdByWorkerId.get(record.workerId.toString());

      if (!canonicalWorkerId) {
        return acc;
      }

      if (record.status === "present") {
        acc.present += 1;
      } else if (record.status === "half") {
        acc.half += 1;
      }

      return acc;
    },
    {
      present: 0,
      half: 0,
    },
  );
  const snapshotTotals = {
    present: totals.present + dailyWageTotals.present,
    half: totals.half + dailyWageTotals.half,
    absent: totals.absent,
  };

  const dihadiRecordMap = attendance.reduce<
    Map<
      string,
      {
        workerId: string;
        name: string;
        salary: number;
        paidToday: number;
        dayValue: number;
      }
    >
  >((acc, record) => {
      const canonicalWorkerId = dihadiCanonicalIdByWorkerId.get(record.workerId.toString());

      if (!canonicalWorkerId || record.status === "absent") {
        return acc;
      }

      const group = canonicalDihadiById.get(canonicalWorkerId);

      if (!group) {
        return acc;
      }

      const latestMember = group.members[group.members.length - 1] ?? group.canonicalWorker;
      const nextDayValue =
        record.status === "present" ? 1 : record.status === "half" ? 0.5 : 0;
      const existingRecord = acc.get(canonicalWorkerId);

      acc.set(canonicalWorkerId, {
        workerId: canonicalWorkerId,
        name: group.canonicalWorker.name,
        salary: Number(latestMember.salary ?? group.canonicalWorker.salary ?? 0),
        paidToday: paidTodayByWorker.get(canonicalWorkerId) ?? 0,
        dayValue: Math.max(existingRecord?.dayValue ?? 0, nextDayValue),
      });

      return acc;
    }, new Map());
  const dihadiRecords = Array.from(dihadiRecordMap.values());

  const successMessage = params.success ? successMessages[params.success] : null;
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const selectedDateLabel = formatDateLabel(selectedDate);

  return (
    <main className="mx-auto max-w-7xl">
      <AdminStatusToast successMessage={successMessage} errorMessage={errorMessage} />

      

      <section className=" glass-panel rounded-4xl p-7">
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
                  value: snapshotTotals.present,
                  tone: "border-emerald-300/16 bg-emerald-300/8 text-emerald-100",
                },
                {
                  label: "Half Day",
                  value: snapshotTotals.half,
                  tone: "border-amber-300/16 bg-amber-300/8 text-amber-100",
                },
                {
                  label: "Absent",
                  value: snapshotTotals.absent,
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

        <DihadiAttendancePanel
          selectedDate={selectedDate}
          records={dihadiRecords}
          suggestions={dihadiSuggestions}
        />

        {serializedWorkers.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
            No permanent workers added yet. Use the worker management page first if you
            want them in the main attendance register.
          </div>
        ) : (
          <form action={saveAttendanceAction} className="mt-6">
            <input type="hidden" name="date" value={selectedDate} />

            <AttendanceManager
              key={selectedDate}
              workers={serializedWorkers}
              initialAttendance={serializedAttendance}
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
