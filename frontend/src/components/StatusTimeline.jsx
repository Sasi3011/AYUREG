import { AlertTriangle, Award, Check, ClipboardCheck, FileEdit, ScanSearch, Send, ShieldCheck } from "lucide-react";
import { Alert } from "./ui";

const STEPS = [
  { key: "draft", label: "Draft", icon: FileEdit },
  { key: "submitted", label: "Submitted", icon: Send },
  { key: "ai_verification", label: "AI Screening", icon: ScanSearch },
  { key: "manual_verification", label: "Officer Review", icon: ShieldCheck },
  { key: "approved", label: "Approved", icon: ClipboardCheck },
  { key: "certificate_generated", label: "Certified", icon: Award },
];

export default function StatusTimeline({ status }) {
  if (status === "rejected") {
    return (
      <Alert type="error" title="Application rejected">
        See the officer’s remarks below for the grounds of refusal.
      </Alert>
    );
  }

  const current = status === "correction_required" ? 3 : Math.max(0, STEPS.findIndex((s) => s.key === status));

  return (
    <div className="space-y-4">
      {status === "correction_required" && (
        <Alert type="warning" title="Correction requested by the officer">
          Re-upload the rectified documents and resubmit to resume processing.
        </Alert>
      )}
      <ol className="grid grid-cols-3 gap-y-5 sm:grid-cols-6">
        {STEPS.map((step, idx) => {
          const done = idx < current;
          const active = idx === current;
          const Icon = active && status === "correction_required" ? AlertTriangle : step.icon;
          return (
            <li key={step.key} className="relative flex flex-col items-center text-center">
              {idx > 0 && (
                <span
                  className={`absolute right-1/2 top-5 hidden h-0.5 w-full -translate-y-1/2 sm:block ${idx <= current ? "bg-primary-500" : "bg-slate-200"}`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-white transition ${
                  done
                    ? "bg-primary-600 text-white"
                    : active
                    ? status === "correction_required"
                      ? "bg-accent-500 text-white shadow-lg shadow-accent-500/30"
                      : "bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-glow"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className={`mt-2 text-xs font-semibold ${active ? "text-ink" : done ? "text-primary-700" : "text-slate-400"}`}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

