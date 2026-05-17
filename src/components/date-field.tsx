"use client";

import { useRef } from "react";
import { CalendarDays } from "lucide-react";

type DateFieldProps = {
  name: string;
  label: string;
  required?: boolean;
};

export function DateField({ name, label, required = false }: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-200">{label}</span>

      <div className="relative mt-2">
        <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-amber-200" />

        <input
          ref={inputRef}
          type="date"
          name={name}
          required={required}
          onClick={openPicker}
          className="w-full rounded-[1.4rem] border border-white/10 bg-slate-950/60 py-3 pl-12 pr-14 text-sm font-medium text-white outline-none transition focus:border-amber-300/40 scheme-dark"
        />

        <button
          type="button"
          onClick={openPicker}
          className="absolute right-2 top-1/2 inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-amber-300/35 hover:text-white"
          aria-label={`Open ${label} calendar`}
        >
          Open
        </button>
      </div>
    </label>
  );
}
