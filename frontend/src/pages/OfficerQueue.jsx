import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, ClipboardList, Inbox, Search, ShieldCheck } from "lucide-react";
import api from "../api/client";
import useAuthStore from "../context/authStore";
import { EmptyState, PageHeader, StatCard, StatusBadge, Spinner, TONES, parseDate, timeAgo } from "../components/ui";
import { pathwayInfo } from "../lib/pathways";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "manual_verification", label: "Awaiting review" },
  { value: "correction_required", label: "Awaiting applicant" },
];

function daysWaiting(app) {
  const d = parseDate(app.submitted_at);
  return d ? Math.floor((Date.now() - d.getTime()) / 86400000) : 0;
}

export default function OfficerQueue() {
  const user = useAuthStore((s) => s.user);
  const [applications, setApplications] = useState([]);
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pathwayFilter, setPathwayFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/pathway").then((res) => setPathways(res.pathways || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (pathwayFilter) params.set("pathwayCode", pathwayFilter);
    setLoading(true);
    api
      .get(`/officer/queue?${params.toString()}`)
      .then((res) => {
        setApplications(res.applications || []);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter, pathwayFilter]);

  const q = search.toLowerCase();
  const filtered = applications.filter((a) => !q || a.business_name?.toLowerCase().includes(q) || a.applicant_name?.toLowerCase().includes(q) || String(a.id) === q.replace("#", ""));
  const pending = applications.filter((a) => a.status === "manual_verification").length;
  const awaiting = applications.filter((a) => a.status === "correction_required").length;
  const overdue = applications.filter((a) => a.status === "manual_verification" && daysWaiting(a) >= 7).length;

  return (
    <div className="page">
      <PageHeader eyebrow={`Welcome, ${user?.name || "Officer"}`} title="Verification queue" subtitle="Review AI pre-screened applications and record your decisions." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="In queue" value={applications.length} icon={ClipboardList} tone="indigo" />
        <StatCard label="Awaiting review" value={pending} icon={ShieldCheck} tone="teal" />
        <StatCard label="Awaiting applicant" value={awaiting} icon={Inbox} tone="amber" />
        <StatCard label="Waiting 7+ days" value={overdue} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="card">
        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 sm:p-5 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search business, applicant or #id" className="input input-icon" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input md:w-48" aria-label="Filter by status">
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select value={pathwayFilter} onChange={(e) => setPathwayFilter(e.target.value)} className="input md:w-52" aria-label="Filter by pathway">
            <option value="">All pathways</option>
            {pathways.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-rose-600">{error}</p>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Inbox} tone="teal" title="Queue is clear" description="No applications match these filters right now." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((app) => {
              const info = pathwayInfo(app.pathway_code);
              const Icon = info.icon;
              const days = daysWaiting(app);
              return (
                <li key={app.id}>
                  <Link to={`/officer/applications/${app.id}`} className="flex flex-col gap-3 px-4 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[info.tone].icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{app.business_name}</p>
                        <p className="truncate text-sm text-slate-500">
                          {app.applicant_name} · {app.pathway_name} · #{app.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 pl-[60px] sm:pl-0">
                      <span className={`text-xs font-medium ${days >= 7 ? "text-rose-600" : "text-slate-400"}`}>Submitted {timeAgo(app.submitted_at)}</span>
                      <StatusBadge status={app.status} />
                      <ArrowRight className="hidden h-4 w-4 text-slate-300 sm:block" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
