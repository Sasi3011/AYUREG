import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Hourglass, Timer } from "lucide-react";
import api from "../api/client";
import { Alert, Card, PageHeader, PageLoader, StatCard } from "../components/ui";
import { BarList, ColumnChart, SplitBar, fillDays } from "../components/charts";

function formatDays(days) {
  if (!days) return "—";
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} h`;
  return `${days.toFixed(1)} d`;
}

export default function OfficerReports() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/officer/stats")
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="page"><Alert type="error">{error}</Alert></div>;
  if (!stats) return <PageLoader />;

  const approvalRate = stats.total ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <div className="page space-y-6">
      <PageHeader title="Reports" subtitle="Your review activity and pipeline health." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Decisions made" value={stats.total} icon={ClipboardList} tone="indigo" />
        <StatCard label="Approval rate" value={`${approvalRate}%`} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Avg. turnaround" value={formatDays(stats.avgTurnaroundDays)} icon={Timer} tone="teal" hint="Submission → decision" />
        <StatCard label="Pending in queue" value={stats.pendingQueue} icon={Hourglass} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Decisions per day" subtitle="Last 14 days">
          <ColumnChart data={fillDays(stats.byDay)} xKey="day" yKey="count" unit="decisions" />
        </Card>
        <Card title="Outcome mix" subtitle="All of your decisions">
          <SplitBar
            segments={[
              { label: "Approved", value: stats.approved, tone: "emerald" },
              { label: "Corrections", value: stats.corrections, tone: "amber" },
              { label: "Rejected", value: stats.rejected, tone: "rose" },
            ]}
          />
        </Card>
      </div>

      <Card title="Decisions by pathway">
        <BarList data={stats.byPathway} labelKey="pathway" tone="teal" />
      </Card>
    </div>
  );
}
