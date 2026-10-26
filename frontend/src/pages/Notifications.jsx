import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Bell, CheckCheck, CheckCircle2, FileText, Info } from "lucide-react";
import api from "../api/client";
import { EmptyState, PageHeader, PageLoader, TONES, formatDate, timeAgo } from "../components/ui";

function notifTone(message = "") {
  const m = message.toLowerCase();
  if (m.includes("approved") || m.includes("certificate")) return { Icon: CheckCircle2, tone: "emerald" };
  if (m.includes("reject")) return { Icon: AlertTriangle, tone: "rose" };
  if (m.includes("correction")) return { Icon: AlertTriangle, tone: "amber" };
  if (m.includes("submitted") || m.includes("resubmit")) return { Icon: FileText, tone: "indigo" };
  return { Icon: Info, tone: "sky" };
}

const announce = () => window.dispatchEvent(new Event("notifications:changed"));

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api
      .get("/notifications")
      .then((res) => setNotifications(res.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id) {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: 1 } : n)));
    announce();
  }

  async function markAllRead() {
    await api.put("/notifications/read-all").catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    announce();
  }

  if (loading) return <PageLoader />;

  const unread = notifications.filter((n) => !n.read).length;
  const shown = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="page max-w-4xl">
      <PageHeader
        title="Notifications"
        subtitle={unread ? `You have ${unread} unread update${unread > 1 ? "s" : ""}.` : "You’re all caught up."}
        actions={
          unread > 0 && (
            <button onClick={markAllRead} className="btn-outline">
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </button>
          )
        }
      />

      <div className="card">
        <div className="flex gap-1 border-b border-slate-100 p-3 sm:p-4">
          {[
            ["all", `All (${notifications.length})`],
            ["unread", `Unread (${unread})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${filter === key ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <EmptyState icon={Bell} title="Nothing here" description="Status changes and officer decisions will show up here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((n) => {
              const { Icon, tone } = notifTone(n.message);
              return (
                <li key={n.id} className={`flex gap-4 px-4 py-4 transition sm:px-6 ${n.read ? "" : "bg-primary-50/40"}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone].icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.read ? "text-slate-600" : "font-semibold text-ink"}`}>{n.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="text-slate-400" title={formatDate(n.created_at, true)}>
                        {timeAgo(n.created_at)}
                      </span>
                      {n.application_id && (
                        <Link to={`/applications/${n.application_id}`} onClick={() => !n.read && markRead(n.id)} className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700">
                          View application <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} className="font-semibold text-slate-500 hover:text-ink">
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                  {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500" aria-label="Unread" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
