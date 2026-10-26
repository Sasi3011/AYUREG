import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ScrollText,
  Search,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import useAuthStore from "../context/authStore";
import api from "../api/client";
import Logo from "./Logo";

const NAV = {
  applicant: [
    {
      section: "Overview",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/applications", icon: FileText, label: "My Applications", end: true },
        { to: "/applications/new", icon: PlusCircle, label: "New Application", end: true },
      ],
    },
    {
      section: "Services",
      items: [
        { to: "/payments", icon: CreditCard, label: "Payments" },
        { to: "/assistant", icon: Bot, label: "AI Assistant" },
        { to: "/notifications", icon: Bell, label: "Notifications", badge: true },
      ],
    },
    { section: "Account", items: [{ to: "/profile", icon: UserCircle, label: "Profile & Security" }] },
  ],
  officer: [
    {
      section: "Review",
      items: [
        { to: "/officer", icon: ClipboardList, label: "Verification Queue", end: true },
        { to: "/officer/search", icon: Search, label: "Search" },
        { to: "/officer/history", icon: History, label: "Past Decisions" },
        { to: "/officer/reports", icon: BarChart3, label: "Reports" },
      ],
    },
    { section: "Account", items: [{ to: "/officer/profile", icon: UserCircle, label: "Profile & Security" }] },
  ],
  admin: [
    {
      section: "Administration",
      items: [
        { to: "/admin/analytics", icon: Activity, label: "Analytics" },
        { to: "/admin", icon: Users, label: "Users", end: true },
        { to: "/admin/logs", icon: ScrollText, label: "Audit Logs" },
        { to: "/admin/settings", icon: Settings, label: "Settings" },
      ],
    },
    {
      section: "Review",
      items: [
        { to: "/officer", icon: ClipboardList, label: "Verification Queue", end: true },
        { to: "/officer/reports", icon: BarChart3, label: "Reports" },
      ],
    },
    { section: "Account", items: [{ to: "/admin/profile", icon: UserCircle, label: "Profile & Security" }] },
  ],
};

const ROLE_LABEL = { applicant: "Applicant", officer: "Reviewing Officer", admin: "Administrator" };
const ROLE_TONE = {
  applicant: "from-primary-500 to-secondary-500",
  officer: "from-secondary-500 to-sky-500",
  admin: "from-violet-500 to-primary-500",
};

function useUnreadCount(enabled) {
  const [count, setCount] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const load = () =>
      api
        .get("/notifications")
        .then((res) => alive && setCount((res.notifications || []).filter((n) => !n.read).length))
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    window.addEventListener("notifications:changed", load);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("notifications:changed", load);
    };
  }, [enabled, pathname]);

  return count;
}

function SidebarContent({ role, unread, onNavigate }) {
  const sections = NAV[role] || [];
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link to="/" onClick={onNavigate}>
          <Logo light />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sections.map((group) => (
          <div key={group.section}>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">{group.section}</p>
            <ul className="space-y-1">
              {group.items.map(({ to, icon: Icon, label, end, badge }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-glow"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    {badge && unread > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1.5 text-[10px] font-bold text-ink">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {role === "applicant" && (
        <div className="m-3 rounded-2xl bg-gradient-to-br from-secondary-500/20 to-primary-500/20 p-4 ring-1 ring-white/10">
          <p className="text-sm font-semibold text-white">Need guidance?</p>
          <p className="mt-1 text-xs text-slate-300">Ask the AI assistant about licences, documents and fees.</p>
          <Link to="/assistant" onClick={onNavigate} className="btn-accent btn-sm mt-3 w-full">
            <Bot className="h-4 w-4" /> Ask Assistant
          </Link>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const profilePath = user.role === "admin" ? "/admin/profile" : user.role === "officer" ? "/officer/profile" : "/profile";

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2 transition hover:bg-slate-100"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white ${ROLE_TONE[user.role]}`}>
          {user.name?.[0]?.toUpperCase() || "U"}
        </span>
        <span className="hidden text-left md:block">
          <span className="block max-w-[160px] truncate text-sm font-semibold text-ink">{user.name}</span>
          <span className="block text-xs text-slate-500">{ROLE_LABEL[user.role]}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 animate-fade-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="p-1.5">
            <Link to={profilePath} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-ink">
              <UserCircle className="h-4 w-4" /> Profile & Security
            </Link>
            <button onClick={onLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const isApplicant = user?.role === "applicant";
  const unread = useUnreadCount(isApplicant);

  useEffect(() => setDrawer(false), [pathname]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (!user) return null;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50 print:block print:h-auto print:overflow-visible print:bg-white">
      {/* Desktop sidebar */}
      <aside className="no-print hidden w-64 shrink-0 bg-ink lg:block">
        <SidebarContent role={user.role} unread={unread} />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="relative h-full w-72 max-w-[85%] animate-slide-in bg-ink shadow-2xl">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent role={user.role} unread={unread} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setDrawer(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Logo compact />
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            {isApplicant && (
              <Link to="/applications/new" className="btn-primary btn-sm hidden sm:inline-flex">
                <PlusCircle className="h-4 w-4" /> New Application
              </Link>
            )}
            {isApplicant && (
              <Link to="/notifications" className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-ink" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}
              </Link>
            )}
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto print:overflow-visible">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
