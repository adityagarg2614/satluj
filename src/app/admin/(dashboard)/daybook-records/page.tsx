import {
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingCart,
  Truck,
} from "lucide-react";

import { AdminStatusToast } from "@/components/admin-toast";
import { DaybookEntriesView } from "@/components/daybook-entries-view";
import { AttendanceDateNavigator } from "@/components/admin-route-controls";
import { connectToDatabase } from "@/lib/db";
import { formatDateLabel, formatNumber, normalizeDateKey } from "@/lib/format";
import { WEIGHT_UNIT_LABEL } from "@/lib/recovered-metal";
import { DaybookEntryModel } from "@/models/daybook-entry";

export const dynamic = "force-dynamic";

type DaybookRecordsPageProps = {
  searchParams: Promise<{
    date?: string;
    error?: string;
    success?: string;
  }>;
};

const successMessages: Record<string, string> = {
  "entry-deleted": "Daybook entry deleted successfully.",
};

const errorMessages: Record<string, string> = {
  "missing-entry": "Unable to delete the selected daybook entry.",
};

export default async function DaybookRecordsPage({ searchParams }: DaybookRecordsPageProps) {
  await connectToDatabase();

  const params = await searchParams;
  const selectedDate = normalizeDateKey(params.date);

  // Fetch only the entries for the selected day, sorted by creation order
  const entries = await DaybookEntryModel.find({ entryDateKey: selectedDate })
    .sort({ createdAt: -1 })
    .lean();

  // Compute detailed financial and load statistics for the day
  const totals = entries.reduce(
    (acc, entry) => {
      const amount = Number(entry.amount ?? 0);
      const weight = Number(entry.weight ?? 0);

      if (entry.type === "purchase") {
        acc.purchaseAmount += amount;
        acc.purchaseWeight += weight;
        acc.purchaseCount += 1;
      } else if (entry.type === "sale") {
        acc.saleAmount += amount;
        acc.saleWeight += weight;
        acc.saleCount += 1;
      } else if (entry.type === "payment_given") {
        acc.paymentGivenAmount += amount;
        acc.paymentGivenCount += 1;
      } else if (entry.type === "payment_received") {
        acc.paymentReceivedAmount += amount;
        acc.paymentReceivedCount += 1;
      }
      return acc;
    },
    {
      purchaseAmount: 0,
      purchaseWeight: 0,
      purchaseCount: 0,
      saleAmount: 0,
      saleWeight: 0,
      saleCount: 0,
      paymentGivenAmount: 0,
      paymentGivenCount: 0,
      paymentReceivedAmount: 0,
      paymentReceivedCount: 0,
    }
  );

  const successMessage = params.success ? successMessages[params.success] : null;
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const dateLabel = formatDateLabel(selectedDate);

  const metrics = [
    {
      icon: ShoppingCart,
      label: "Material Purchases",
      badge: `${totals.purchaseCount} records`,
      value: `Rs. ${formatNumber(totals.purchaseAmount)}`,
      detail: `${formatNumber(totals.purchaseWeight)} ${WEIGHT_UNIT_LABEL} loaded`,
      theme: "border-emerald-500/20 bg-emerald-500/5 text-emerald-200",
    },
    {
      icon: Truck,
      label: "Material Sales",
      badge: `${totals.saleCount} records`,
      value: `Rs. ${formatNumber(totals.saleAmount)}`,
      detail: `${formatNumber(totals.saleWeight)} ${WEIGHT_UNIT_LABEL} dispatched`,
      theme: "border-indigo-500/20 bg-indigo-500/5 text-indigo-200",
    },
    {
      icon: ArrowUpCircle,
      label: "Payments Given",
      badge: `${totals.paymentGivenCount} records`,
      value: `Rs. ${formatNumber(totals.paymentGivenAmount)}`,
      detail: "Cash outward transactions",
      theme: "border-rose-500/20 bg-rose-500/5 text-rose-200",
    },
    {
      icon: ArrowDownCircle,
      label: "Payments Received",
      badge: `${totals.paymentReceivedCount} records`,
      value: `Rs. ${formatNumber(totals.paymentReceivedAmount)}`,
      detail: "Cash inward transactions",
      theme: "border-amber-500/20 bg-amber-500/5 text-amber-200",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl">
      <AdminStatusToast successMessage={successMessage} errorMessage={errorMessage} />

      <section className="glass-panel rounded-4xl p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200">Daybook Records</p>
            <h1 className="mt-5 font-display text-5xl text-white">
              Daily ledger overview and reporting.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              A dedicated clean workspace for reviewing purchases, sales, and financial cashflow.
              This report isolates record tracking for simplified bookkeeping and quick audits.
            </p>
          </div>

          <AttendanceDateNavigator date={selectedDate} basePath="/admin/daybook-records" />
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`rounded-3xl border p-6 backdrop-blur-xl transition hover:scale-[1.02] ${metric.theme}`}
          >
            <div className="flex items-center justify-between gap-4">
              <metric.icon className="size-6 text-amber-200" />
              <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                {metric.badge}
              </span>
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.28em] text-slate-400">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{metric.detail}</p>
          </div>
        ))}
      </section>

      <DaybookEntriesView
        dateLabel={dateLabel}
        entries={entries.map((entry) => ({
          id: entry._id.toString(),
          entryDateKey: entry.entryDateKey,
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
