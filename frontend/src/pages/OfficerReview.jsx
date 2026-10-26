import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ExternalLink, FileText, RotateCcw, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import api from "../api/client";
import StatusTimeline from "../components/StatusTimeline";
import { Alert, Card, EmptyState, PageHeader, PageLoader, StatusBadge, TONES, formatDate } from "../components/ui";
import { pathwayInfo } from "../lib/pathways";

const DECISIONS = [
  {
    key: "approved",
    label: "Approve",
    icon: CheckCircle2,
    btn: "btn-success",
    preset: "All submitted documents are complete and comply with AYUSH licensing requirements. Application approved.",
  },
  {
    key: "correction_requested",
    label: "Request correction",
    icon: RotateCcw,
    btn: "btn-accent",
    preset: "Please re-upload a clearer copy of the flagged document(s) with all required signatures and stamps.",
  },
  {
    key: "rejected",
    label: "Reject",
    icon: XCircle,
    btn: "btn-danger",
    preset: "The application does not meet the statutory requirements for this licence category.",
  },
];

const DOC_TONE = { valid: "emerald", missing_info: "amber", incorrect: "rose", unreadable: "rose", inconsistent: "amber" };
const DECIDABLE = ["manual_verification", "submitted", "ai_verification"];

export default function OfficerReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/applications/${id}`)
      .then(setData)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function decide(decision) {
    if (reason.trim().length < 5) {
      setError("Please give a reason of at least 5 characters — the applicant will see it.");
      return;
    }
    setError("");
    setSubmitting(decision);
    try {
      await api.put(`/officer/applications/${id}/decision`, { decision, reason: reason.trim() });
      navigate("/officer");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) return <PageLoader />;
  if (loadError)
    return (
      <div className="page-narrow">
        <Alert type="error" title="Couldn’t load this application">{loadError}</Alert>
        <Link to="/officer" className="btn-outline mt-4">← Back to queue</Link>
      </div>
    );

  const { application, checklist = [], documents = [], decisions = [] } = data;
  const info = pathwayInfo(application.pathway_code);
  const Icon = info.icon;
  const flagged = documents.filter((d) => d.ai_status && d.ai_status !== "valid").length;
  const canDecide = DECIDABLE.includes(application.status);

  return (
    <div className="page space-y-6">
      <PageHeader back={{ to: "/officer", label: "Verification queue" }} title={application.business_name} subtitle={`${application.pathway_name} · Application #${application.id}`} actions={<StatusBadge status={application.status} />} />

      <Card>
        <StatusTimeline status={application.status} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* AI summary */}
          <div className={`rounded-2xl border p-5 sm:p-6 ${flagged ? "border-accent-200 bg-accent-50/60" : "border-emerald-200 bg-emerald-50/60"}`}>
            <div className="flex items-start gap-3">
              <Sparkles className={`mt-0.5 h-5 w-5 shrink-0 ${flagged ? "text-accent-600" : "text-emerald-600"}`} />
              <div>
                <p className="font-semibold text-ink">AI pre-screening summary</p>
                <p className="mt-1 text-sm text-slate-600">
                  {documents.length === 0
                    ? "No documents were uploaded."
                    : flagged
                    ? `${flagged} of ${documents.length} documents were flagged for your attention. AI findings are advisory only.`
                    : `All ${documents.length} documents passed automated checks. Please verify before deciding.`}
                </p>
              </div>
            </div>
          </div>

          <Card title="Documents" subtitle={`${checklist.filter((c) => c.status !== "pending").length}/${checklist.length} checklist items uploaded`} bodyClassName="">
            {documents.length === 0 ? (
              <EmptyState icon={FileText} title="No documents" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  const tone = DOC_TONE[doc.ai_status] || "slate";
                  return (
                    <li key={doc.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:px-6">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone].icon}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-ink">{doc.original_name}</p>
                            {doc.ai_status && <span className={`badge capitalize ${TONES[tone].soft}`}>{doc.ai_status.replace(/_/g, " ")}</span>}
                            {doc.confidence_score != null && <span className="text-xs text-slate-400">{doc.confidence_score}%</span>}
                          </div>
                          {doc.ai_explanation && <p className="mt-1 text-sm text-slate-500">{doc.ai_explanation}</p>}
                        </div>
                      </div>
                      <a href={`/uploads/${encodeURIComponent(doc.file_path)}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm shrink-0 self-start">
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {decisions.length > 0 && (
            <Card title="Decision history">
              <ul className="space-y-4">
                {decisions.map((d) => (
                  <li key={d.id} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge status={d.decision} />
                      <span className="text-xs text-slate-400">{formatDate(d.decided_at, true)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{d.reason}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Applicant">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${TONES[info.tone].icon}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{application.pathway_name}</p>
                <p className="text-sm text-slate-500">
                  {info.form} · {application.category || "—"}
                </p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Submitted</dt>
                <dd className="font-medium text-ink">{formatDate(application.submitted_at, true)}</dd>
              </div>
            </dl>
            {application.business_description && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{application.business_description}</p>}
          </Card>

          <div className="card sticky top-20 overflow-hidden">
            <div className="flex items-center gap-2 bg-ink px-5 py-4 text-white">
              <ShieldCheck className="h-5 w-5 text-secondary-400" />
              <p className="font-semibold">Record decision</p>
            </div>
            <div className="space-y-4 p-5">
              {!canDecide ? (
                <Alert type="info">This application is not awaiting an officer decision.</Alert>
              ) : (
                <>
                  <div>
                    <label htmlFor="reason" className="label">Reason (shared with applicant)</label>
                    <textarea id="reason" rows={5} value={reason} onChange={(e) => setReason(e.target.value)} className="input resize-y" placeholder="Explain your decision…" />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {DECISIONS.map((d) => (
                        <button key={d.key} type="button" onClick={() => setReason(d.preset)} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
                          Use “{d.label}” template
                        </button>
                      ))}
                    </div>
                  </div>
                  {error && <Alert type="error">{error}</Alert>}
                  <div className="grid grid-cols-1 gap-2">
                    {DECISIONS.map((d) => {
                      const DIcon = d.icon;
                      return (
                        <button key={d.key} onClick={() => decide(d.key)} disabled={!!submitting} className={`${d.btn} w-full`}>
                          <DIcon className="h-4 w-4" /> {submitting === d.key ? "Saving…" : d.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400">Your decision is logged in the audit trail and the applicant is notified immediately.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
