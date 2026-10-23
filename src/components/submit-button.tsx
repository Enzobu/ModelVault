"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} aria-busy={pending}
    className={className || "rounded-xl bg-[var(--accent)] px-4 py-2 font-medium text-white"}>
    {pending ? "Enregistrement…" : children}
  </button>;
}
