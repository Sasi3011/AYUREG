import { Leaf } from "lucide-react";

export default function Logo({ light = false, compact = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white shadow-glow">
        <Leaf className="h-5 w-5" />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent-400 ring-2 ring-white" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={`block text-base font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>AYUREG</span>
          <span className={`block text-[11px] font-medium ${light ? "text-slate-400" : "text-slate-500"}`}>AYUSH Compliance Portal</span>
        </span>
      )}
    </span>
  );
}
