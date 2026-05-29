import { ArrowRightLeft, Building2, Factory, RotateCcw } from "lucide-react";

import { AdminStatusToast } from "@/components/admin-toast";
import { connectToDatabase } from "@/lib/db";
import { formatMonthLabel, formatNumber, getCurrentMonthKey } from "@/lib/format";
import {
  calculateRecoveredMetalSnapshot,
  isEligibleJindalRecoveryPurchase,
  isRecoveredMetalReturnSale,
  WEIGHT_UNIT_LABEL,
} from "@/lib/recovered-metal";
import { DaybookEntryModel } from "@/models/daybook-entry";

export const dynamic = "force-dynamic";

export default async function RevertScrapPage() {
  await connectToDatabase();

  const currentMonth = getCurrentMonthKey();
  const [allEntries, currentMonthEntries] = await Promise.all([
    DaybookEntryModel.find()
      .sort({ entryDateKey: -1, createdAt: -1 })
      .lean(),
    DaybookEntryModel.find({
      entryDateKey: { $regex: `^${currentMonth}` },
    })
      .sort({ entryDateKey: -1, createdAt: -1 })
      .lean(),
  ]);

  const overall = calculateRecoveredMetalSnapshot(allEntries);
  const currentMonthSnapshot = calculateRecoveredMetalSnapshot(currentMonthEntries);
  const relevantEntries = allEntries.filter(
    (entry) =>
      isEligibleJindalRecoveryPurchase(entry) || isRecoveredMetalReturnSale(entry),
  );

  return (
    <main className="mx-auto max-w-7xl">
      <AdminStatusToast successMessage={null} errorMessage={null} />

      <section className="glass-panel rounded-4xl p-8">
        <div className="max-w-4xl">
          <p className="text-xs uppercase tracking-[0.32em] text-amber-200">
            Revert Scrap Tracking
          </p>
          <h1 className="mt-5 font-display text-5xl text-white">
            Recovered metal return balance for Jindal.
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            This screen tracks the live recovered metal quantity to return against Jindal
            Stainless Steel. Only Slag Lumps, Slag Mix, and Slag 200 mm purchases are
            counted, and the return metal is calculated at 1.4% of eligible received
            weight. Every sale of Revert Scrap Metal reduces the pending balance.
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: Factory,
            label: "Eligible Jindal Intake",
            value: `${overall.eligiblePurchaseWeight.toFixed(2)} ${WEIGHT_UNIT_LABEL}`,
            detail: "Total weight from Slag Lumps, Slag Mix, and Slag 200 mm",
          },
          {
            icon: RotateCcw,
            label: "Recovered Metal Generated",
            value: `${overall.generatedRecoveredMetal.toFixed(3)} ${WEIGHT_UNIT_LABEL}`,
            detail: "Calculated at 1.4% of eligible Jindal intake",
          },
          {
            icon: ArrowRightLeft,
            label: "Revert Scrap Dispatched",
            value: `${overall.returnedRecoveredMetal.toFixed(3)} ${WEIGHT_UNIT_LABEL}`,
            detail: "Subtracted automatically from the pending return balance",
          },
          {
            icon: Building2,
            label: "Pending To Return",
            value: `${overall.outstandingRecoveredMetal.toFixed(3)} ${WEIGHT_UNIT_LABEL}`,
            detail: "Current live recovered metal quantity still to be returned",
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

      <section className="mt-8 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel rounded-4xl p-7">
          <p className="text-xs uppercase tracking-[0.32em] text-amber-200">
            {formatMonthLabel(currentMonth)}
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            This month&apos;s recovery position
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/3 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Eligible Intake
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {currentMonthSnapshot.eligiblePurchaseWeight.toFixed(2)} {WEIGHT_UNIT_LABEL}
              </p>
            </div>

            <div className="rounded-3xl border border-amber-300/18 bg-amber-300/8 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Generated
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {currentMonthSnapshot.generatedRecoveredMetal.toFixed(3)} {WEIGHT_UNIT_LABEL}
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-300/18 bg-emerald-300/8 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Dispatched
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {currentMonthSnapshot.returnedRecoveredMetal.toFixed(3)} {WEIGHT_UNIT_LABEL}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-rose-300/18 bg-[linear-gradient(145deg,rgba(127,29,29,0.18),rgba(15,23,42,0.92))] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-rose-100/80">
              Pending This Month
            </p>
            <p className="mt-4 text-5xl font-semibold text-white">
              {currentMonthSnapshot.outstandingRecoveredMetal.toFixed(3)} {WEIGHT_UNIT_LABEL}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-4xl p-7">
          <h2 className="text-2xl font-semibold text-white">Recent Relevant Entries</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            This list includes only the Jindal material entries that create return metal
            liability and the Revert Scrap Metal sales that reduce it.
          </p>

          {relevantEntries.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
              No relevant Jindal or revert scrap records have been saved yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {relevantEntries.slice(0, 10).map((entry) => {
                const isPurchase = isEligibleJindalRecoveryPurchase(entry);
                return (
                  <article
                    key={entry._id.toString()}
                    className="rounded-3xl border border-white/8 bg-white/3 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] ${
                          isPurchase
                            ? "border border-amber-300/20 bg-amber-300/10 text-amber-100"
                            : "border border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                        }`}
                      >
                        {isPurchase ? "Jindal Intake" : "Revert Scrap Sale"}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                        {entry.entryDateKey}
                      </span>
                    </div>

                    <p className="mt-3 text-lg font-semibold text-white">
                      {entry.materialName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                      <span>{entry.partyName}</span>
                      <span>
                        Weight: {formatNumber(Number(entry.weight ?? 0))} {WEIGHT_UNIT_LABEL}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
