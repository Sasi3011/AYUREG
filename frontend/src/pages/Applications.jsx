import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FolderOpen, PlusCircle, Search } from "lucide-react";
import api from "../api/client";
import { EmptyState, PageHeader, PageLoader, StatusBadge, TONES, formatDate } from "../components/ui";
import { pathwayInfo } from "../lib/pathways";

const TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts", match: ["draft"] },
  { key: "in_review", label: "In review", match: ["submitted", "ai_verification", "manual_verification"] },
  { key: "action", label: "Action needed", match: ["correction_required", "rejected"] },
  { key: "approved", label: "Approved", match: ["approved", "certificate_generated"] },
];

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  useEffect(() => {
    api
      .get("/applications/mine")
      .then((res) => setApplications(res.applications || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const countFor = (t) => (t.match ? applications.filter((a) => t.match.includes(a.status)).length : applications.length);
  const activeTab = TABS.find((t) => t.key === tab);
  const q = search.toLowerCase();
  const filtered = applications.filter(
    (a) =>
      (!activeTab.match || activeTab.match.includes(a.status)) &&
      (!q || a.business_name?.toLowerCase().includes(q) || a.pathway_name?.toLowerCase().includes(q) || String(a.id) === q.replace("#", ""))
  );

  if (loading) return <PageLoader />;

  return (
    <div className="page">
      <PageHeader
        title="My applications"
        subtitle="Track every licence application, respond to officers and download certificates."
        actions={
          <Link to="/applications/new" className="btn-primary">
            <PlusCircle className="h-4 w-4" /> New application
          </Link>
        }
      />

      <div className="card">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                  tab === t.key ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
                <span className={`rounded-full px-1.5 text-xs ${tab === t.key ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{countFor(t)}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search business, pathway or #id" className="input input-icon" />
          </div>
        </div>

        {error ? (
          <p className="p-6 text-sm text-rose-600">{error}</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={applications.length ? "No matching applications" : "No applications yet"}
            description={applications.length ? "Try a different filter or search term." : "Start your first application to get a personalised checklist."}
            action={
              !applications.length && (
                <Link to="/applications/new" className="btn-primary">
                  <PlusCircle className="h-4 w-4" /> Start application
                </Link>
              )
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            {filtered.map((app) => {
              const info = pathwayInfo(app.pathway_code);
              const Icon = info.icon;
              return (
                <li key={app.id}>
                  <Link to={`/applications/${app.id}`} className="card card-hover flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONES[info.tone].icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    <h3 className="mt-4 line-clamp-1 font-bold">{app.business_name}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{app.pathway_name}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <span>
                        #{app.id} · {formatDate(app.submitted_at || app.created_at)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-primary-600">
                        Open <ArrowRight className="h-3.5 w-3.5" />
                      </span>
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
