import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Award, Bell, Bot, CheckCircle2, Clock, FileText, FolderOpen, PlusCircle } from "lucide-react";
import api from "../api/client";
import useAuthStore from "../context/authStore";
import { Card, EmptyState, PageLoader, StatCard, StatusBadge, TONES, timeAgo } from "../components/ui";
import { pathwayInfo } from "../lib/pathways";

const IN_REVIEW = ["submitted", "ai_verification", "manual_verification"];

function nextStep(app) {
  switch (app.status) {
    case "draft":
      return { text: "Upload documents & submit", to: `/applications/${app.id}` };
    case "correction_required":
      return { text: "Fix and resubmit", to: `/applications/${app.id}/correct` };
    case "approved":
      return { text: "Pay fee", to: `/payment/${app.id}` };
    case "certificate_generated":
      return { text: "View certificate", to: `/certificate/${app.id}` };
    default:
      return { text: "View details", to: `/applications/${app.id}` };
  }
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/applications/mine"), api.get("/notifications")])
      .then(([appRes, notifRes]) => {
        setApplications(appRes.applications || []);
        setNotifications((notifRes.notifications || []).slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const inReview = applications.filter((a) => IN_REVIEW.includes(a.status)).length;
  const needsAction = applications.filter((a) => ["correction_required", "draft"].includes(a.status)).length;
  const approved = applications.filter((a) => ["approved", "certificate_generated"].includes(a.status)).length;
  const actionItems = applications.filter((a) => ["correction_required", "approved", "draft"].includes(a.status)).slice(0, 3);
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="page space-y-6 sm:space-y-8">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-500 p-6 text-white shadow-glow sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-accent-400/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-100">Welcome back</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">Namaste, {firstName} 👋</h1>
            <p className="mt-2 max-w-xl text-sm text-primary-50 sm:text-base">
              {needsAction > 0
                ? `You have ${needsAction} application${needsAction > 1 ? "s" : ""} waiting on you.`
                : "Track your licences, respond to officers and download certificates — all in one place."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/applications/new" className="btn-accent">
              <PlusCircle className="h-4 w-4" /> New application
            </Link>
            <Link to="/assistant" className="btn border border-white/30 text-white hover:bg-white/10">
              <Bot className="h-4 w-4" /> Ask assistant
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total applications" value={applications.length} icon={FileText} tone="indigo" />
        <StatCard label="In review" value={inReview} icon={Clock} tone="sky" />
        <StatCard label="Needs your action" value={needsAction} icon={AlertTriangle} tone="amber" />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent applications */}
        <Card
          className="lg:col-span-2"
          title="Recent applications"
          subtitle="Your latest submissions and their status"
          bodyClassName=""
          actions={
            <Link to="/applications" className="btn-ghost btn-sm">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {applications.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No applications yet"
              description="Start your first application and we’ll guide you to the right licence."
              action={
                <Link to="/applications/new" className="btn-primary">
                  <PlusCircle className="h-4 w-4" /> Start application
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {applications.slice(0, 5).map((app) => {
                const info = pathwayInfo(app.pathway_code);
                const Icon = info.icon;
                return (
                  <li key={app.id}>
                    <Link to={`/applications/${app.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[info.tone].icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{app.business_name}</p>
                        <p className="truncate text-sm text-slate-500">
                          {app.pathway_name} · #{app.id} · {timeAgo(app.updated_at)}
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
        </Card>

        <div className="space-y-6">
          {/* Action items */}
          <Card title="To-do" subtitle="Things that need your attention">
            {actionItems.length === 0 ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> You’re all caught up.
              </div>
            ) : (
              <ul className="space-y-3">
                {actionItems.map((app) => {
                  const step = nextStep(app);
                  return (
                    <li key={app.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink">{app.business_name}</p>
                        <StatusBadge status={app.status} />
                      </div>
                      <Link to={step.to} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
                        {step.text} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Notifications */}
          <Card
            title="Latest updates"
            actions={
              <Link to="/notifications" className="btn-ghost btn-sm">
                All
              </Link>
            }
          >
            {notifications.length === 0 ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Bell className="h-5 w-5 text-slate-300" /> No notifications yet.
              </div>
            ) : (
              <ul className="space-y-4">
                {notifications.map((n) => (
                  <li key={n.id} className="flex gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-slate-300" : "bg-primary-500"}`} />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm text-slate-700">{n.message}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {approved > 0 && (
            <Link to="/applications" className="card card-hover flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                <Award className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">Certificates</p>
                <p className="text-sm text-slate-500">{approved} approved licence{approved > 1 ? "s" : ""}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
