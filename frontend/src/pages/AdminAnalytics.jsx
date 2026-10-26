import { useEffect, useState } from "react";
import { CheckCircle2, FileText, Timer, XCircle } from "lucide-react";
import api from "../api/client";
import { Alert, Card, PageHeader, PageLoader, StatCard, statusMeta } from "../components/ui";
import { BarList, SplitBar } from "../components/charts";

const STATUS_ORDER = ["draft", "submitted", "ai_verification", "manual_verification", "correction_required", "approved", "certificate_generated", "rejected"];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/analytics")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="page"><Alert type="error">{error}</Alert></div>;
  if (!data) return <PageLoader />;

  const { approved = 0, rejected = 0, total = 0 } = data.approvalRate || {};
  const decided = approved + rejected;
  const rate = decided ? Math.round((approved / decided) * 100) : 0;
  const days = Number(data.avgTurnaroundDays) || 0;
  const turnaround = !days ? "—" : days < 1 ? `${Math.max(1, Math.round(days * 24))} h` : `${days.toFixed(1)} d`;

  const byStatus = STATUS_ORDER.map((s) => ({ label: statusMeta(s).label, count: data.byStatus.find((r) => r.status === s)?.count || 0 })).filter((r) => r.count > 0);
  const inFlight = data.byStatus.filter((r) => ["submitted", "ai_verification", "manual_verification", "correction_required"].includes(r.status)).reduce((s, r) => s + r.count, 0);

  return (
    <div className="page space-y-6">
      <PageHeader title="Platform analytics" subtitle="Live figures across all applications on AYUREG." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total applications" value={total} icon={FileText} tone="indigo" />
        <StatCard label="Approval rate" value={`${rate}%`} icon={CheckCircle2} tone="emerald" hint={`${decided} decided`} />
        <StatCard label="Rejected" value={rejected} icon={XCircle} tone="rose" />
        <StatCard label="Avg. turnaround" value={turnaround} icon={Timer} tone="teal" hint="Submission → decision" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Applications by status" subtitle="Where every application currently sits">
          <BarList data={byStatus} tone="indigo" />
        </Card>
        <Card title="Applications by pathway" subtitle="Demand per licence type">
          <BarList data={data.byPathway} labelKey="pathway" tone="teal" />
        </Card>
      </div>

      <Card title="Pipeline outcome" subtitle="Applications that have left the draft stage">
        <SplitBar
          segments={[
            { label: "Approved / certified", value: approved, tone: "emerald" },
            { label: "In progress", value: inFlight, tone: "sky" },
            { label: "Rejected", value: rejected, tone: "rose" },
          ]}
        />
      </Card>
    </div>
  );
}
