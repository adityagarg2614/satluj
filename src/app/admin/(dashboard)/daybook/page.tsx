import {
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingCart,
  Truck,
} from "lucide-react";

import { DaybookEntriesView } from "@/components/daybook-entries-view";
import { DaybookForm } from "@/components/daybook-form";
import { AttendanceDateNavigator } from "@/components/admin-route-controls";
import { connectToDatabase } from "@/lib/db";
import { formatDateLabel, normalizeDateKey } from "@/lib/format";
import { CompanyModel } from "@/models/company";
import { DaybookEntryModel } from "@/models/daybook-entry";
import { WorkerModel } from "@/models/worker";

export const dynamic = "force-dynamic";

type DaybookPageProps = {
  searchParams: Promise<{
    date?: string;
    error?: string;
    success?: string;
  }>;
};

const successMessages: Record<string, string> = {
  "entry-added": "Daybook entry saved successfully.",
};

const errorMessages: Record<string, string> = {
  "invalid-type": "Please select a valid daybook entry type.",
  "missing-party": "Please enter the related company, worker, or person name.",
  "missing-fields": "Please complete every required field for the selected entry type.",
};

export default async function DaybookPage({ searchParams }: DaybookPageProps) {
  await connectToDatabase();

  const params = await searchParams;
  const selectedDate = normalizeDateKey(params.date);

  const [entries, companies, workers] = await Promise.all([
    DaybookEntryModel.find({ entryDateKey: selectedDate }).sort({ createdAt: -1 }).lean(),
    CompanyModel.find().sort({ name: 1 }).lean(),
    WorkerModel.find().sort({ name: 1 }).lean(),
  ]);

  const typeTotals = entries.reduce(
    (acc, entry) => {
      acc[entry.type] += 1;
      return acc;
    },
    {
      purchase: 0,
      sale: 0,
      payment_given: 0,
      payment_received: 0,
    },
  );

  const successMessage = params.success ? successMessages[params.success] : null;
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const dateLabel = formatDateLabel(selectedDate);

  return (
    <main className="mx-auto max-w-7xl">
      {successMessage ? (
        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-sm text-emerald-100">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-3xl border border-rose-300/20 bg-rose-300/10 px-5 py-4 text-sm text-rose-100">
          {errorMessage}
        </div>
      ) : null}

      <section className={`${successMessage || errorMessage ? "mt-6" : ""} glass-panel rounded-4xl p-8`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200">Daybook</p>
            <h1 className="mt-5 font-display text-5xl text-white">
              Daily business entries in one digital register.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Record purchases, sales, payments given, and payments received for each day
              without relying on the physical notebook.
            </p>
          </div>

          <AttendanceDateNavigator date={selectedDate} basePath="/admin/daybook" />
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: ShoppingCart,
            label: "Purchases",
            value: String(typeTotals.purchase).padStart(2, "0"),
            detail: "Material inward entries",
          },
          {
            icon: Truck,
            label: "Sales",
            value: String(typeTotals.sale).padStart(2, "0"),
            detail: "Dispatch and outbound company entries",
          },
          {
            icon: ArrowUpCircle,
            label: "Payments Given",
            value: String(typeTotals.payment_given).padStart(2, "0"),
            detail: "Outgoing money records",
          },
          {
            icon: ArrowDownCircle,
            label: "Payments Received",
            value: String(typeTotals.payment_received).padStart(2, "0"),
            detail: "Incoming money records",
          },
        ].map((metric) => (
          <div key={metric.label} className="glass-panel rounded-[1.75rem] p-6">
            <metric.icon className="size-5 text-amber-200" />
            <p className="mt-5 text-xs uppercase tracking-[0.28em] text-slate-400">
              {metric.label}
            </p>
            <p className="mt-3 text-4xl font-semibold text-white">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <DaybookForm
          selectedDate={selectedDate}
          companyNames={companies.map((company) => company.name)}
          workerNames={workers.map((worker) => worker.name)}
        />
      </section>

      <DaybookEntriesView
        dateLabel={dateLabel}
        entries={entries.map((entry) => ({
          id: entry._id.toString(),
          type: entry.type,
          category: entry.category,
          partyName: entry.partyName,
          materialSource: entry.materialSource,
          materialName: entry.materialName,
          vehicleNumber: entry.vehicleNumber,
          driverName: entry.driverName,
          driverPhone: entry.driverPhone,
          weight: entry.weight,
          amount: entry.amount,
          note: entry.note,
          createdAtLabel: new Date(entry.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))}
      />
    </main>
  );
}
