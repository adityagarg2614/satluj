"use client";

import type { ReactNode, MouseEvent, FormEvent } from "react";
import { useRef, useState } from "react";
import { ShieldAlert, TriangleAlert } from "lucide-react";
import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = {
  label: ReactNode;
  pendingLabel?: string;
  className?: string;
  confirmMessage: string;
};

export function ConfirmSubmitButton({
  label,
  pendingLabel,
  className,
  confirmMessage,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (pending) {
      return;
    }

    event.preventDefault();
    formRef.current = event.currentTarget.form;
    setOpen(true);
  }

  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <button type="submit" disabled={pending} className={className} onClick={handleClick}>
        {pending ? pendingLabel ?? "Saving..." : label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(10,14,21,0.98),rgba(19,24,35,0.98))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300/12 text-amber-100">
                <ShieldAlert className="size-6" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">
                  Please Confirm
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  You&apos;re about to make a permanent change
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{confirmMessage}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-slate-300">
              <div className="flex items-center gap-2 text-amber-100">
                <TriangleAlert className="size-4" />
                <span className="font-medium">This action cannot be automatically restored.</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
