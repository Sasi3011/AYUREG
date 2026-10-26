import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, Bot, CheckCircle2, CreditCard, FileText, MessageSquareText, RefreshCw, Send } from "lucide-react";
import api from "../api/client";
import StatusTimeline from "../components/StatusTimeline";
import DocumentUploader from "../components/DocumentUploader";
import { Alert, Card, EmptyState, PageHeader, PageLoader, ProgressBar, StatusBadge, TONES, formatDate } from "../components/ui";
import { pathwayInfo } from "../lib/pathways";

const DOC_TONE = { valid: "emerald", uploaded: "sky", missing_info: "amber", incorrect: "rose", unreadable: "rose", inconsistent: "amber" };
const DECISION_TONE = { approved: "emerald", rejected: "rose", correction_requested: "amber" };

export default function ApplicationDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const load = useCallback(
    () =>
      api
        .get(`/applications/${id}`)
        .then(setData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit() {
    setSubmitError("");
    setSubmitting(true);
    try {
      await api.put(`/applications/${id}/submit`);
      await load();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader />;
  if (error)
    return (
      <div className="page-narrow">
        <Alert type="error" title="Couldn’t load this application">{error}</Alert>
        <Link to="/applications" className="btn-outline mt-4">← Back to applications</Link>
      </div>
    );
  if (!data) return null;

  const { application, checklist = [], documents = [], decisions = [] } = data;
  const info = pathwayInfo(application.pathway_code);
  const Icon = info.icon;
  const done = checklist.filter((c) => ["uploaded", "verified"].includes(c.status)).length;
  const isDraft = application.status === "draft";
  const latestCorrection = decisions.find((d) => d.decision === "correction_requested");

  return (
    <div className="page space-y-6">
      <PageHeader
        back={{ to: "/applications", label: "All applications" }}
        title={application.business_name}
        subtitle={`${application.pathway_name} · Application #${application.id}`}
        actions={
          <>
            {application.status === "correction_required" && (
              <Link to={`/applications/${id}/correct`} className="btn-accent">
                <RefreshCw className="h-4 w-4" /> Fix & resubmit
              </Link>
            )}
            {application.status === "approved" && (
              <Link to={`/payment/${id}`} className="btn-primary">
                <CreditCard className="h-4 w-4" /> Pay fee
              </Link>
            )}
            {["approved", "certificate_generated"].includes(application.status) && (
              <Link to={`/certificate/${id}`} className={application.status === "approved" ? "btn-outline" : "btn-primary"}>
                <Award className="h-4 w-4" /> Certificate
              </Link>
            )}
            <Link to="/assistant" className="btn-outline">
              <Bot className="h-4 w-4" /> Ask assistant
            </Link>
          </>
        }
      />

      <Card>
        <StatusTimeline status={application.status} />
      </Card>

      {latestCorrection && application.status === "correction_required" && (
        <Alert type="warning" title="Officer’s remarks">{latestCorrection.reason}</Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Checklist / uploads */}
          <Card
            title={isDraft ? "Upload required documents" : "Document checklist"}
            subtitle={`${done} of ${checklist.length} documents uploaded`}
            actions={<span className="text-sm font-bold text-primary-600">{checklist.length ? Math.round((done / checklist.length) * 100) : 0}%</span>}
          >
            <ProgressBar value={checklist.length ? (done / checklist.length) * 100 : 0} />
            {isDraft ? (
              <div className="mt-5 space-y-3">
                {checklist.map((item) => (
                  <DocumentUploader key={item.id} applicationId={application.id} checklistItem={item} onUploaded={load} />
                ))}
                {submitError && <Alert type="error">{submitError}</Alert>}
                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">All required documents must be uploaded before submitting.</p>
                  <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                    <Send className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit for review"}
                  </button>
                </div>
              </div>
            ) : (
              <ul className="mt-5 divide-y divide-slate-100">
                {checklist.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CheckCircle2 className={`h-5 w-5 shrink-0 ${["uploaded", "verified"].includes(item.status) ? "text-emerald-500" : "text-slate-300"}`} />
                      <span className="truncate text-sm text-slate-700">{item.label}</span>
                    </div>
                    <span className="badge shrink-0 bg-slate-100 capitalize text-slate-600 ring-slate-200">{item.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Documents */}
          <Card title="Uploaded documents" subtitle="AI pre-verification results for each file" bodyClassName="">
            {documents.length === 0 ? (
              <EmptyState icon={FileText} title="No documents uploaded" description="Uploaded files and their AI checks will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  const tone = DOC_TONE[doc.ai_status] || "slate";
                  return (
                    <li key={doc.id} className="flex gap-4 px-5 py-4 sm:px-6">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone].icon}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-ink">{doc.original_name}</p>
                          {doc.ai_status && <span className={`badge capitalize ${TONES[tone].soft}`}>{doc.ai_status.replace(/_/g, " ")}</span>}
                        </div>
                        {doc.ai_explanation && <p className="mt-1 text-sm text-slate-500">{doc.ai_explanation}</p>}
                        <p className="mt-1 text-xs text-slate-400">
                          Uploaded {formatDate(doc.uploaded_at, true)}
                          {doc.confidence_score != null && ` · ${doc.confidence_score}% confidence`}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Summary">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${TONES[info.tone].icon}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{application.pathway_name}</p>
                <p className="text-sm text-slate-500">{info.form}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                ["Status", <StatusBadge key="s" status={application.status} />],
                ["Category", application.category || "—"],
                ["Created", formatDate(application.created_at)],
                ["Submitted", formatDate(application.submitted_at)],
                ["Decided", formatDate(application.decided_at)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            {application.business_description && (
              <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{application.business_description}</p>
            )}
          </Card>

          <Card title="Officer decisions">
            {decisions.length === 0 ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <MessageSquareText className="h-5 w-5 text-slate-300" /> No decisions recorded yet.
              </div>
            ) : (
              <ol className="relative space-y-5 border-l-2 border-slate-100 pl-5">
                {decisions.map((d) => (
                  <li key={d.id} className="relative">
                    <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${TONES[DECISION_TONE[d.decision] || "slate"].solid}`} />
                    <StatusBadge status={d.decision} />
                    <p className="mt-2 text-sm text-slate-700">{d.reason}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(d.decided_at, true)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
