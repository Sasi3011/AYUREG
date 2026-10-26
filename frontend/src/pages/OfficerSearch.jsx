import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, SearchX } from "lucide-react";
import api from "../api/client";
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge, TONES, formatDate } from "../components/ui";
import { pathwayInfo } from "../lib/pathways";

export default function OfficerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searchedFor, setSearchedFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/officer/search?q=${encodeURIComponent(q)}`);
      setResults(res.applications || []);
      setSearchedFor(q);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="Search applications" subtitle="Find any submitted application by business, applicant name, email or ID." />

      <form onSubmit={handleSearch} className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:p-5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Churna, founder@example.com or #12" className="input input-icon" autoFocus />
        </div>
        <button type="submit" disabled={loading || !query.trim()} className="btn-primary">
          {loading ? <Spinner className="h-4 w-4 text-white" /> : <Search className="h-4 w-4" />} Search
        </button>
      </form>

      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {results !== null && (
        <div className="card">
          <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500 sm:px-6">
            {results.length} result{results.length === 1 ? "" : "s"} for <span className="font-semibold text-ink">“{searchedFor}”</span>
          </div>
          {results.length === 0 ? (
            <EmptyState icon={SearchX} tone="slate" title="No matches" description="Try a business name, applicant email or application number." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((app) => {
                const info = pathwayInfo(app.pathway_code);
                const Icon = info.icon;
                return (
                  <li key={app.id}>
                    <Link to={`/officer/applications/${app.id}`} className="flex items-center gap-4 px-4 py-4 transition hover:bg-slate-50 sm:px-6">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[info.tone].icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{app.business_name}</p>
                        <p className="truncate text-sm text-slate-500">
                          {app.applicant_name} · {app.applicant_email}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          #{app.id} · {app.pathway_name} · updated {formatDate(app.updated_at)}
                        </p>
                      </div>
                      <StatusBadge status={app.status} className="hidden sm:inline-flex" />
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
