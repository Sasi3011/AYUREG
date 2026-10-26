import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Send } from "lucide-react";
import api from "../api/client";
import DocumentUploader from "../components/DocumentUploader";
import { Alert, Card, PageHeader, PageLoader, ProgressBar, Spinner, formatDate } from "../components/ui";

export default function CorrectionResubmit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const loadData = useCallback(
    () =>
      api
        .get(`/applications/${id}`)
        .then(setData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [id]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleResubmit() {
    setSubmitError("");
    setSubmitting(true);
    try {
      await api.put(`/applications/${id}/resubmit`);
      navigate(`/applications/${id}`);
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
        <Alert type="error" title="Couldn’t load correction details">{error}</Alert>
        <Link to="/applications" className="btn-outline mt-4">← Back to applications</Link>
      </div>
    );

  const { application, checklist = [], decisions = [] } = data;
  const correction = decisions.find((d) => d.decision === "correction_requested");
  const canResubmit = application.status === "correction_required";
  const done = checklist.filter((c) => ["uploaded", "verified"].includes(c.status)).length;

  return (
    <div className="page max-w-4xl space-y-6">
      <PageHeader
        back={{ to: `/applications/${id}`, label: "Application details" }}
        eyebrow="Correction requested"
        title={application.business_name}
        subtitle="Replace the documents the officer flagged, then resubmit for review."
      />

      {!canResubmit && <Alert type="info">This application is not awaiting corrections. Current status: {application.status.replace(/_/g, " ")}.</Alert>}

      {correction && (
        <Alert type="warning" title={`Officer remarks · ${formatDate(correction.decided_at, true)}`}>
          {correction.reason}
        </Alert>
      )}

      <Card title="Documents" subtitle="Use “Replace” to upload a corrected version of any document." actions={<span className="text-sm font-semibold text-slate-500">{done}/{checklist.length}</span>}>
        <ProgressBar value={checklist.length ? (done / checklist.length) * 100 : 0} tone="amber" />
        <div className="mt-5 space-y-3">
          {checklist.map((item) => (
            <DocumentUploader key={item.id} applicationId={application.id} checklistItem={item} onUploaded={loadData} />
          ))}
        </div>
      </Card>

      {submitError && <Alert type="error">{submitError}</Alert>}

      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="font-semibold text-ink">Ready to resubmit?</p>
          <p className="text-sm text-slate-500">Your application returns to the officer’s review queue.</p>
        </div>
        <button onClick={handleResubmit} disabled={submitting || !canResubmit} className="btn-primary">
          {submitting ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />} Resubmit application
        </button>
      </div>
    </div>
  );
}
