import { notFound } from "next/navigation";

import { AttendanceMonthNavigator } from "@/components/admin-route-controls";
import { WorkerMonthlyAttendanceEditor } from "@/components/worker-monthly-attendance-editor";
import { connectToDatabase } from "@/lib/db";
import { formatMonthLabel, getMonthDateKeys, normalizeMonthKey } from "@/lib/format";
import { AttendanceModel } from "@/models/attendance";
import { WorkerModel } from "@/models/worker";

type WorkerAttendancePageProps = {
  params: Promise<{
    workerId: string;
  }>;
  searchParams: Promise<{
    month?: string;
  }>;
};

const weekdayFormatter = new Intl.DateTimeFormat("en-IN", { weekday: "short" });

export default async function WorkerAttendancePage({
  params,
  searchParams,
}: WorkerAttendancePageProps) {
  await connectToDatabase();

  const [{ workerId }, query] = await Promise.all([params, searchParams]);
  const selectedMonth = normalizeMonthKey(query.month);

  const worker = await WorkerModel.findById(workerId).lean();

  if (!worker) {
    notFound();
  }

  const monthDateKeys = getMonthDateKeys(selectedMonth);
  const attendanceRecords = await AttendanceModel.find({
    workerId: worker._id,
    dateKey: { $regex: `^${selectedMonth}` },
  }).lean();
  const attendanceByDate = new Map(
    attendanceRecords.map((record) => [record.dateKey, record.status]),
  );
  const joiningDate = new Date(worker.joiningDate);

  const days = monthDateKeys.map((dateKey) => {
    const date = new Date(`${dateKey}T00:00:00`);
    const isJoined = date >= new Date(joiningDate.getFullYear(), joiningDate.getMonth(), joiningDate.getDate());

    return {
      dateKey,
      dayNumber: Number(dateKey.slice(8, 10)),
      weekdayLabel: weekdayFormatter.format(date),
      isEditable: isJoined,
      isJoined,
      status: (attendanceByDate.get(dateKey) ?? "absent") as "present" | "half" | "absent",
    };
  });

  const summaryHref = `/admin/attendance-summary?month=${selectedMonth}`;
  const attendanceBasePath = `/admin/workers/${worker._id.toString()}/attendance`;

  return (
    <main className="mx-auto max-w-7xl">
      <section className="glass-panel rounded-4xl p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200">
              Worker Attendance
            </p>
            <h1 className="mt-5 font-display text-5xl text-white">
              {formatMonthLabel(selectedMonth)} larger attendance view.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Review one worker across the full month, then update any day with a
              cleaner visual grid instead of editing from the table row.
            </p>
          </div>

          <AttendanceMonthNavigator month={selectedMonth} basePath={attendanceBasePath} />
        </div>
      </section>

      <WorkerMonthlyAttendanceEditor
        workerId={worker._id.toString()}
        workerName={worker.name}
        role={worker.role}
        monthLabel={formatMonthLabel(selectedMonth)}
        summaryHref={summaryHref}
        days={days}
      />
    </main>
  );
}
