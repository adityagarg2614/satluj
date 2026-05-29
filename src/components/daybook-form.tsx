"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  ShoppingCart,
  Truck,
} from "lucide-react";

import { addDaybookEntryAction } from "@/app/admin/actions";
import { SubmitButton } from "@/components/submit-button";
import { DAILY_WAGE_PAYMENT_CATEGORY } from "@/lib/salary";
import { WEIGHT_UNIT_LABEL } from "@/lib/recovered-metal";

type DaybookFormProps = {
  selectedDate: string;
  companyNames: string[];
  permanentWorkerNames: string[];
  dihadiWorkerNames: string[];
};

const purchaseMaterialOptions = {
  local: ["Lanter", "Fly Ash", "Other"],
  jindal: ["Slag Powder", "Slag Lumps", "Slag Mix", "Slag 200 mm"],
};

const saleMaterialOptions = ["Granulated Slag Sand", "Revert Scrap Metal"];

const paymentGivenCategories = [
  "Purchase Company",
  "Worker Salary",
  DAILY_WAGE_PAYMENT_CATEGORY,
  "Other Company",
  "Other Expense",
  "Other",
];

const paymentReceivedCategories = ["Sales Customer", "Any Person", "Other"];

export function DaybookForm({
  selectedDate,
  companyNames,
  permanentWorkerNames,
  dihadiWorkerNames,
}: DaybookFormProps) {
  const [entryType, setEntryType] = useState("purchase");
  const [purchaseSource, setPurchaseSource] = useState("local");
  const [purchaseMaterial, setPurchaseMaterial] = useState("Lanter");
  const [localSellerName, setLocalSellerName] = useState("");
  const [paymentGivenCategory, setPaymentGivenCategory] = useState("Purchase Company");
  const [paymentReceivedCategory, setPaymentReceivedCategory] = useState("Sales Customer");

  const uniqueCompanyNames = useMemo(
    () => Array.from(new Set(companyNames.map((name) => name.trim()).filter(Boolean))),
    [companyNames],
  );
  const uniquePermanentWorkerNames = useMemo(
    () =>
      Array.from(new Set(permanentWorkerNames.map((name) => name.trim()).filter(Boolean))),
    [permanentWorkerNames],
  );
  const uniqueDihadiWorkerNames = useMemo(
    () => Array.from(new Set(dihadiWorkerNames.map((name) => name.trim()).filter(Boolean))),
    [dihadiWorkerNames],
  );

  const partySuggestions = useMemo(() => {
    if (entryType === "sale") {
      return uniqueCompanyNames;
    }

    if (entryType === "payment_given" && paymentGivenCategory === "Worker Salary") {
      return uniquePermanentWorkerNames;
    }

    if (entryType === "payment_given" && paymentGivenCategory === DAILY_WAGE_PAYMENT_CATEGORY) {
      return uniqueDihadiWorkerNames;
    }

    if (
      entryType === "payment_given" &&
      (paymentGivenCategory === "Purchase Company" ||
        paymentGivenCategory === "Other Company")
    ) {
      return uniqueCompanyNames;
    }

    return [];
  }, [
    entryType,
    paymentGivenCategory,
    uniqueCompanyNames,
    uniqueDihadiWorkerNames,
    uniquePermanentWorkerNames,
  ]);

  const receivedSuggestions = useMemo(() => {
    if (paymentReceivedCategory === "Sales Customer") {
      return uniqueCompanyNames;
    }

    return [];
  }, [paymentReceivedCategory, uniqueCompanyNames]);

  return (
    <div className="glass-panel rounded-4xl p-7">
      <div className="flex items-center gap-3">
        <ClipboardList className="size-5 text-amber-200" />
        <h2 className="text-xl font-semibold text-white">Add Daybook Entry</h2>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">
        Create one entry for each purchase, sale, payment given, or payment received for
        the selected day.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { id: "purchase", label: "Purchase", icon: ShoppingCart },
          { id: "sale", label: "Sale", icon: Truck },
          { id: "payment_given", label: "Payment Given", icon: ArrowUpCircle },
          { id: "payment_received", label: "Payment Received", icon: ArrowDownCircle },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setEntryType(item.id)}
            className={`flex items-center gap-3 rounded-3xl border px-4 py-4 text-left transition ${
              entryType === item.id
                ? "border-amber-300/30 bg-amber-300/10 text-white"
                : "border-white/10 bg-white/3 text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <item.icon className="size-5 text-amber-200" />
            <span className="text-sm font-semibold">{item.label}</span>
          </button>
        ))}
      </div>

      <form action={addDaybookEntryAction} className="mt-6 grid gap-4">
        <input type="hidden" name="entryType" value={entryType} />
        <input type="hidden" name="entryDate" value={selectedDate} />

        <div className="rounded-3xl border border-white/8 bg-white/3 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Entry Date</p>
          <p className="mt-2 text-lg font-semibold text-white">{selectedDate}</p>
        </div>

        {entryType === "purchase" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Purchase Source</span>
                <select
                  name="purchaseSource"
                  value={purchaseSource}
                  onChange={(event) => {
                    const nextSource = event.target.value;
                    setPurchaseSource(nextSource);
                    setPurchaseMaterial(purchaseMaterialOptions[nextSource as "local" | "jindal"][0]);
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                >
                  <option value="local">Local Seller</option>
                  <option value="jindal">Jindal Stainless Steel</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-200">Material</span>
                <select
                  name="materialName"
                  value={purchaseMaterial}
                  onChange={(event) => setPurchaseMaterial(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                >
                  {purchaseMaterialOptions[purchaseSource as "local" | "jindal"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {purchaseSource === "jindal" ? (
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Seller Name</span>
                <input
                  type="text"
                  name="partyName"
                  required
                  readOnly
                  value="Jindal Stainless Steel"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                />
              </label>
            ) : (
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Seller Name</span>
                <input
                  type="text"
                  name="partyName"
                  required
                  value={localSellerName}
                  onChange={(event) => setLocalSellerName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                  placeholder="Enter local seller name"
                />
              </label>
            )}

            {purchaseMaterial === "Other" ? (
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Other Material Name</span>
                <input
                  type="text"
                  name="otherMaterialName"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                  placeholder="Enter custom material name"
                />
              </label>
            ) : null}

            <TransportFields />
          </>
        ) : null}

        {entryType === "sale" ? (
          <>
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Company Name</span>
              <input
                type="text"
                name="partyName"
                required
                list="saved-company-names"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                placeholder="Start typing company name"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Material</span>
                <select
                  name="materialName"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                >
                  {saleMaterialOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <TransportFields />
          </>
        ) : null}

        {entryType === "payment_given" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Payment Type</span>
                <select
                  name="category"
                  value={paymentGivenCategory}
                  onChange={(event) => setPaymentGivenCategory(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                >
                  {paymentGivenCategories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-200">Amount</span>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                  placeholder="Enter amount"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">
                {paymentGivenCategory === "Other Expense" ? "Expense Item" : "Paid To"}
              </span>
              <input
                type="text"
                name="partyName"
                required
                list={
                  paymentGivenCategory === "Other Expense" || partySuggestions.length === 0
                    ? undefined
                    : "party-name-options"
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                placeholder={
                  paymentGivenCategory === "Other Expense"
                    ? "Diesel, machine repair, tea, loading rope..."
                    : "Worker or company name"
                }
              />
            </label>
          </>
        ) : null}

        {entryType === "payment_received" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Received From Type</span>
                <select
                  name="category"
                  value={paymentReceivedCategory}
                  onChange={(event) => setPaymentReceivedCategory(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                >
                  {paymentReceivedCategories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-200">Amount</span>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                  placeholder="Enter amount"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">Received From</span>
              <input
                type="text"
                name="partyName"
                required
                list="received-party-options"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                placeholder="Company name or person name"
              />
            </label>
          </>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Note (optional)</span>
          <textarea
            name="note"
            rows={3}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
            placeholder="Add any useful remark for this entry"
          />
        </label>

        <SubmitButton
          label="Save Daybook Entry"
          pendingLabel="Saving entry..."
          className="mt-2 inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
        />

        <datalist id="saved-company-names">
          {uniqueCompanyNames.map((company, index) => (
            <option key={`company-${index}-${company}`} value={company} />
          ))}
        </datalist>

        <datalist id="party-name-options">
          {partySuggestions.map((name, index) => (
            <option key={`party-${index}-${name}`} value={name} />
          ))}
        </datalist>

        <datalist id="received-party-options">
          {receivedSuggestions.map((name, index) => (
            <option key={`received-${index}-${name}`} value={name} />
          ))}
        </datalist>
      </form>
    </div>
  );
}

function TransportFields() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-200">Vehicle Number</span>
          <input
            type="text"
            name="vehicleNumber"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
            placeholder="Enter vehicle number"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">
            Material Weight ({WEIGHT_UNIT_LABEL})
          </span>
          
          <input
            type="number"
            name="weight"
            min="0"
            step="0.01"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
            placeholder={`Enter weight in ${WEIGHT_UNIT_LABEL}`}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-200">Driver Name</span>
          <input
            type="text"
            name="driverName"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
            placeholder="Enter driver name"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Driver Number</span>
          <input
            type="tel"
            name="driverPhone"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
            placeholder="Enter driver number"
          />
        </label>
      </div>
    </>
  );
}
