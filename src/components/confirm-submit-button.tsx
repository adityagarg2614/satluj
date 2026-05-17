"use client";

import type { ReactNode, MouseEvent } from "react";
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

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (pending) {
      return;
    }

    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  }

  return (
    <button type="submit" disabled={pending} className={className} onClick={handleClick}>
      {pending ? pendingLabel ?? "Saving..." : label}
    </button>
  );
}
