"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  ShoppingCart,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";

import { deleteDaybookEntryAction } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { formatNumber } from "@/lib/format";
import { getWorkerPaymentCategoryLabel } from "@/lib/salary";

type DaybookEntryViewItem = {
  id: string;
  entryDateKey: string;
  type: "purchase" | "sale" | "payment_given" | "payment_received";
  category: string;
  partyName: string;
  materialSource?: string;
  materialName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  weight?: number | null;
  amount?: number | null;
  note?: string;
  createdAtLabel: string;
};

type DaybookEntriesViewProps = {
  dateLabel: string;
  entries: DaybookEntryViewItem[];
};

const filterOptions = [
  { id: "all", label: "All Entries", icon: Wallet },
  { id: "purchase", label: "Purchases", icon: ShoppingCart },
  { id: "sale", label: "Sales", icon: Truck },
  { id: "payment_given", label: "Payments Given", icon: ArrowUpCircle },
  { id: "payment_received", label: "Payments Received", icon: ArrowDownCircle },
] as const;

const typeLabelMap: Record<DaybookEntryViewItem["type"], string> = {
  purchase: "Purchase",
  sale: "Sale",
  payment_given: "Payment Given",
  payment_received: "Payment Received",
};

export function DaybookEntriesView({
  dateLabel,
  entries,
}: DaybookEntriesViewProps) {
  const [activeFilter, setActiveFilter] =
    useState<(typeof filterOptions)[number]["id"]>("all");

  const filteredEntries = useMemo(() => {
    if (activeFilter === "all") {
      return entries;
    }

    return entries.filter((entry) => entry.type === activeFilter);
  }, [activeFilter, entries]);

  return (
    <section className="mt-8 glass-panel rounded-4xl p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Wallet className="size-5 text-amber-200" />
            <h2 className="text-xl font-semibold text-white">View Daybook Entries</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Entries saved for {dateLabel}. View all types together or isolate one type at a
            time for a cleaner daybook review.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-slate-300">
          Total records: <span className="font-semibold text-white">{entries.length}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveFilter(option.id)}
            className={`flex items-center gap-3 rounded-3xl border px-4 py-4 text-left transition ${
              activeFilter === option.id
                ? "border-amber-300/30 bg-amber-300/10 text-white"
                : "border-white/10 bg-white/3 text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <option.icon className="size-5 text-amber-200" />
            <span className="text-sm font-semibold">{option.label}</span>
          </button>
        ))}
      </div>

      {filteredEntries.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
          No {activeFilter === "all" ? "" : typeLabelMap[activeFilter as DaybookEntryViewItem["type"]].toLowerCase() + " "}entries saved for this date.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-3xl border border-white/8 bg-white/3 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-amber-100">
                      {typeLabelMap[entry.type]}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                      {getWorkerPaymentCategoryLabel(entry.category)}
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-semibold text-white">{entry.partyName}</p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                    {entry.materialName ? (
                      <span className="inline-flex items-center gap-2">
                        <Package className="size-4 text-amber-200" />
                        {entry.materialName}
                      </span>
                    ) : null}
                    {entry.materialSource ? <span>Source: {entry.materialSource}</span> : null}
                    {entry.vehicleNumber ? <span>Vehicle: {entry.vehicleNumber}</span> : null}
                    {entry.driverName ? <span>Driver: {entry.driverName}</span> : null}
                    {entry.driverPhone ? <span>Phone: {entry.driverPhone}</span> : null}
                    {typeof entry.weight === "number" ? (
                      <span>Weight: {formatNumber(entry.weight)}</span>
                    ) : null}
                    {typeof entry.amount === "number" ? (
                      <span>Amount: Rs. {formatNumber(entry.amount)}</span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                  {entry.createdAtLabel}
                </div>
              </div>

              {entry.note ? (
                <p className="mt-4 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm leading-6 text-slate-300">
                  {entry.note}
                </p>
              ) : null}

              <form action={deleteDaybookEntryAction} className="mt-4">
                <input type="hidden" name="entryId" value={entry.id} />
                <input type="hidden" name="entryDateKey" value={entry.entryDateKey} />
                <ConfirmSubmitButton
                  confirmMessage="Delete this daybook entry? This cannot be undone."
                  pendingLabel="Deleting entry..."
                  className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
                  label={
                    <span className="inline-flex items-center gap-2">
                      <Trash2 className="size-4" />
                      Delete Entry
                    </span>
                  }
                />
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
