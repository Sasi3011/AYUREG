import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, FilePlus2, Gavel, LogIn, RefreshCw, ScrollText, Send, Settings, UserPlus } from "lucide-react";
import api from "../api/client";
import { EmptyState, PageHeader, PageLoader, TONES, formatDate, timeAgo } from "../components/ui";

const ACTIONS = {
  user_login: { label: "Signed in", icon: LogIn, tone: "slate" },
  user_registered: { label: "Registered", icon: UserPlus, tone: "sky" },
  application_created: { label: "Application created", icon: FilePlus2, tone: "indigo" },
  application_submitted: { label: "Application submitted", icon: Send, tone: "teal" },
  application_resubmitted: { label: "Application resubmitted", icon: RefreshCw, tone: "amber" },
  officer_decision: { label: "Officer decision", icon: Gavel, tone: "violet" },
  settings_updated: { label: "Settings updated", icon: Settings, tone: "rose" },
};

function actionMeta(action) {
  return ACTIONS[action] || { label: action.replace(/_/g, " "), icon: ScrollText, tone: "slate" };
}

function describe(log) {
  try {
    const d = JSON.parse(log.details || "{}");
    if (log.action === "officer_decision") return `${d.decision?.replace(/_/g, " ")} — “${d.reason}”`;
    if (log.action === "application_created") return `Pathway: ${d.pathwayCode}`;
    if (log.action === "settings_updated") return Object.entries(d).map(([k, v]) => `${k.replace(/_/g, " ")} = ${v}`).join(", ");
    return "";
  } catch {
    return "";
  }
}

export default function AdminLogs() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  function load() {
    api
      .get("/admin/logs?limit=200")
      .then((res) => setLogs(res.logs || []))
      .catch((err) => {
        setError(err.message);
        setLogs([]);
      });
  }

  useEffect(load, []);

  function exportCsv() {
    const rows = [["timestamp", "action", "user", "email", "application_id", "details"], ...shown.map((l) => [l.created_at, l.action, l.user_name || "", l.user_email || "", l.application_id || "", describe(l)])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "ayureg-audit-log.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!logs) return <PageLoader />;
  const types = [...new Set(logs.map((l) => l.action))];
  const shown = filter ? logs.filter((l) => l.action === filter) : logs;

  return (
    <div className="page">
      <PageHeader
        title="Audit logs"
        subtitle="Every sign-in, submission and decision recorded on the platform."
        actions={
          <>
            <button onClick={load} className="btn-outline">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={exportCsv} disabled={!shown.length} className="btn-primary">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </>
        }
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-ink">{shown.length}</span> of {logs.length} latest events
          </p>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input sm:w-56" aria-label="Filter by event type">
            <option value="">All events</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {actionMeta(t).label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="p-6 text-sm text-rose-600">{error}</p>}

        {shown.length === 0 ? (
          <EmptyState icon={ScrollText} title="No events" description="Platform activity will be recorded here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((log) => {
              const meta = actionMeta(log.action);
              const Icon = meta.icon;
              const detail = describe(log);
              return (
                <li key={log.id} className="flex gap-4 px-4 py-4 sm:px-6">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[meta.tone].icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm">
                        <span className="font-semibold capitalize text-ink">{meta.label}</span>
                        <span className="text-slate-500"> by {log.user_name || "System"}</span>
                        {log.user_role && <span className="badge ml-2 bg-slate-100 capitalize text-slate-600 ring-slate-200">{log.user_role}</span>}
                      </p>
                      <span className="shrink-0 text-xs text-slate-400" title={formatDate(log.created_at, true)}>
                        {timeAgo(log.created_at)}
                      </span>
                    </div>
                    {(detail || log.application_id) && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {log.application_id && (
                          <Link to={`/officer/applications/${log.application_id}`} className="mr-2 font-semibold text-primary-600 hover:text-primary-700">
                            #{log.application_id}
                          </Link>
                        )}
                        {detail}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
