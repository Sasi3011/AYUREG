import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, History } from "lucide-react";
import api from "../api/client";
import { EmptyState, PageHeader, PageLoader, StatusBadge, formatDate } from "../components/ui";

const FILTERS = [
  { key: "", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "correction_requested", label: "Corrections" },
  { key: "rejected", label: "Rejected" },
];

export default function OfficerHistory() {
  const [decisions, setDecisions] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api
      .get("/officer/history")
      .then((res) => setDecisions(res.decisions || []))
      .catch((err) => {
        setError(err.message);
        setDecisions([]);
      });
  }, []);

  if (!decisions) return <PageLoader />;
  const shown = filter ? decisions.filter((d) => d.decision === filter) : decisions;

  return (
    <div className="page">
      <PageHeader title="Past decisions" subtitle="Every application you have approved, rejected or sent back for correction." />

      <div className="card">
        <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-100 p-3 px-4 sm:p-4">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${filter === f.key ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {f.label} <span className="ml-1 opacity-70">{f.key ? decisions.filter((d) => d.decision === f.key).length : decisions.length}</span>
            </button>
          ))}
        </div>

        {error && <p className="p-6 text-sm text-rose-600">{error}</p>}

        {shown.length === 0 ? (
          <EmptyState icon={History} title="No decisions yet" description="Applications you decide on will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((d) => (
              <li key={d.id}>
                <Link to={`/officer/applications/${d.application_id}`} className="flex flex-col gap-3 px-4 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-start sm:gap-6 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{d.business_name}</p>
                      <StatusBadge status={d.decision} />
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {d.applicant_name} · {d.pathway_name} · #{d.application_id}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">“{d.reason}”</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="text-xs text-slate-400">{formatDate(d.decided_at, true)}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
