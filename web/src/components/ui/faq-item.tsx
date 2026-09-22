"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border py-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="font-medium text-foreground">{question}</span>
        <Plus
          className={`h-4 w-4 shrink-0 text-primary transition-transform duration-200 ${
            open ? "rotate-45" : ""
          }`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
