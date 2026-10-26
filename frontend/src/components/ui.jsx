import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Colour tones — one place that maps a semantic tone to Tailwind classes
// ---------------------------------------------------------------------------
export const TONES = {
  indigo: { soft: "bg-primary-50 text-primary-700 ring-primary-200", icon: "bg-primary-100 text-primary-600", solid: "bg-primary-600", text: "text-primary-600", bar: "#4f46e5" },
  teal: { soft: "bg-secondary-50 text-secondary-700 ring-secondary-200", icon: "bg-secondary-100 text-secondary-600", solid: "bg-secondary-500", text: "text-secondary-600", bar: "#14b8a6" },
  amber: { soft: "bg-accent-50 text-accent-700 ring-accent-200", icon: "bg-accent-100 text-accent-600", solid: "bg-accent-500", text: "text-accent-600", bar: "#f59e0b" },
  emerald: { soft: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: "bg-emerald-100 text-emerald-600", solid: "bg-emerald-500", text: "text-emerald-600", bar: "#10b981" },
  rose: { soft: "bg-rose-50 text-rose-700 ring-rose-200", icon: "bg-rose-100 text-rose-600", solid: "bg-rose-500", text: "text-rose-600", bar: "#f43f5e" },
  sky: { soft: "bg-sky-50 text-sky-700 ring-sky-200", icon: "bg-sky-100 text-sky-600", solid: "bg-sky-500", text: "text-sky-600", bar: "#0ea5e9" },
  violet: { soft: "bg-violet-50 text-violet-700 ring-violet-200", icon: "bg-violet-100 text-violet-600", solid: "bg-violet-500", text: "text-violet-600", bar: "#8b5cf6" },
  slate: { soft: "bg-slate-100 text-slate-600 ring-slate-200", icon: "bg-slate-100 text-slate-500", solid: "bg-slate-400", text: "text-slate-500", bar: "#94a3b8" },
};

// Application, payment and decision statuses → label + tone
export const STATUS_META = {
  draft: { label: "Draft", tone: "slate" },
  submitted: { label: "Submitted", tone: "sky" },
  ai_verification: { label: "AI Screening", tone: "violet" },
  manual_verification: { label: "Officer Review", tone: "sky" },
  correction_required: { label: "Correction Needed", tone: "amber" },
  approved: { label: "Approved", tone: "emerald" },
  rejected: { label: "Rejected", tone: "rose" },
  certificate_generated: { label: "Certified", tone: "teal" },
  pending: { label: "Pending", tone: "amber" },
  paid: { label: "Paid", tone: "emerald" },
  failed: { label: "Failed", tone: "rose" },
  correction_requested: { label: "Correction Requested", tone: "amber" },
};

export function statusMeta(status) {
  return STATUS_META[status] || { label: String(status || "Unknown").replace(/_/g, " "), tone: "slate" };
}

export function StatusBadge({ status, className = "" }) {
  const meta = statusMeta(status);
  return (
    <span className={`badge capitalize ${TONES[meta.tone].soft} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${TONES[meta.tone].solid}`} />
      {meta.label}
    </span>
  );
}

export function Badge({ tone = "slate", children, className = "" }) {
  return <span className={`badge ${TONES[tone].soft} ${className}`}>{children}</span>;
}

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------
export function PageHeader({ title, subtitle, eyebrow, actions, back }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link to={back.to} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-primary-600">
            ← {back.label}
          </Link>
        )}
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary-600">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
    </div>
  );
}

export function Card({ title, subtitle, actions, children, className = "", bodyClassName = "card-body" }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="card-header">
          <div className="min-w-0">
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "indigo", hint }) {
  const t = TONES[tone];
  return (
    <div className="card relative overflow-hidden p-5">
      <div className={`absolute inset-x-0 top-0 h-1 ${t.solid}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <div className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:flex ${t.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export function IconBox({ icon: Icon, tone = "indigo", size = "md" }) {
  const sizes = { sm: "h-8 w-8 rounded-lg [&>svg]:h-4 [&>svg]:w-4", md: "h-10 w-10 rounded-xl [&>svg]:h-5 [&>svg]:w-5", lg: "h-12 w-12 rounded-2xl [&>svg]:h-6 [&>svg]:w-6" };
  return (
    <div className={`flex shrink-0 items-center justify-center ${sizes[size]} ${TONES[tone].icon}`}>
      <Icon />
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title, description, action, tone = "indigo" }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${TONES[tone].icon}`}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className = "h-5 w-5" }) {
  const color = /(^|\s)text-/.test(className) ? "" : "text-primary-600";
  return <Loader2 className={`animate-spin ${color} ${className}`} />;
}

export function PageLoader({ label = "Loading…" }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <Spinner className="h-8 w-8" />
      {label}
    </div>
  );
}

const ALERT_STYLES = {
  error: { cls: "border-rose-200 bg-rose-50 text-rose-800", icon: XCircle, iconCls: "text-rose-500" },
  success: { cls: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle2, iconCls: "text-emerald-500" },
  warning: { cls: "border-accent-200 bg-accent-50 text-accent-800", icon: AlertTriangle, iconCls: "text-accent-500" },
  info: { cls: "border-primary-200 bg-primary-50 text-primary-800", icon: Info, iconCls: "text-primary-500" },
};

export function Alert({ type = "info", title, children, className = "" }) {
  if (!children && !title) return null;
  const s = ALERT_STYLES[type];
  const Icon = s.icon;
  return (
    <div role={type === "error" ? "alert" : "status"} className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${s.cls} ${className}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.iconCls}`} />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>}
      </div>
    </div>
  );
}

export function Field({ label, htmlFor, hint, error, children, className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="error-text">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function ProgressBar({ value, tone = "indigo" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-500 ${TONES[tone].solid}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formatting helpers (SQLite timestamps are UTC "YYYY-MM-DD HH:MM:SS")
// ---------------------------------------------------------------------------
export function parseDate(value) {
  if (!value) return null;
  const iso = typeof value === "string" && !value.includes("T") ? value.replace(" ", "T") + "Z" : value;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value, withTime = false) {
  const d = parseDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function timeAgo(value) {
  const d = parseDate(value);
  if (!d) return "—";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(value);
}

export function formatINR(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}
