import { useEffect, useState } from "react";
import { Building2, Scale, Search, ShieldCheck, Trash2, UserPlus, Users, X } from "lucide-react";
import api from "../api/client";
import useAuthStore from "../context/authStore";
import { Alert, EmptyState, PageHeader, Spinner, StatCard, formatDate } from "../components/ui";

const ROLES = [
  { value: "applicant", label: "Applicant" },
  { value: "officer", label: "Officer" },
  { value: "admin", label: "Admin" },
];
const ROLE_TONE = { applicant: "from-primary-500 to-secondary-500", officer: "from-secondary-500 to-sky-500", admin: "from-violet-500 to-primary-500" };
const EMPTY_FORM = { name: "", email: "", phone: "", password: "", role: "officer" };

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/admin/users", form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-lg animate-fade-up rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="create-user-title" className="text-lg font-bold">Add a user</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          {error && <Alert type="error">{error}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="u-name">Full name</label>
              <input id="u-name" required value={form.name} onChange={set("name")} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="u-phone">Phone</label>
              <input id="u-phone" value={form.phone} onChange={set("phone")} className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="u-email">Email</label>
            <input id="u-email" type="email" required value={form.email} onChange={set("email")} className="input" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="u-pass">Temporary password</label>
              <input id="u-pass" type="password" required minLength={8} value={form.password} onChange={set("password")} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="u-role">Role</label>
              <select id="u-role" value={form.role} onChange={set("role")} className="input">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner className="h-4 w-4 text-white" /> : <UserPlus className="h-4 w-4" />} Create user
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminUsers() {
  const me = useAuthStore((s) => s.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  function load() {
    return api
      .get("/admin/users")
      .then((res) => setUsers(res.users || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(user, role) {
    setError("");
    try {
      const res = await api.put(`/admin/users/${user.id}`, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
      setNotice(`${user.name} is now ${role === "admin" ? "an" : "a"} ${role}.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api.del(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setNotice("User removed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmId(null);
    }
  }

  const q = search.toLowerCase();
  const shown = users.filter((u) => (!roleFilter || u.role === roleFilter) && (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)));
  const count = (role) => users.filter((u) => u.role === role).length;

  return (
    <div className="page">
      <PageHeader
        title="Users"
        subtitle="Manage applicants, licensing officers and administrators."
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <UserPlus className="h-4 w-4" /> Add user
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={users.length} icon={Users} tone="indigo" />
        <StatCard label="Applicants" value={count("applicant")} icon={Building2} tone="sky" />
        <StatCard label="Officers" value={count("officer")} icon={Scale} tone="teal" />
        <StatCard label="Admins" value={count("admin")} icon={ShieldCheck} tone="violet" />
      </div>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      {notice && !error && <Alert type="success" className="mb-4">{notice}</Alert>}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 sm:grid-cols-[1fr_auto] sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className="input input-icon" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input sm:w-44" aria-label="Filter by role">
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}s
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        ) : shown.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((u) => {
              const isMe = u.id === me?.id;
              return (
                <li key={u.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white ${ROLE_TONE[u.role]}`}>
                      {u.name?.[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {u.name} {isMe && <span className="badge ml-1 bg-primary-50 text-primary-700 ring-primary-200">You</span>}
                      </p>
                      <p className="truncate text-sm text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-[52px] sm:pl-0">
                    <span className="hidden text-xs text-slate-400 md:inline">Joined {formatDate(u.created_at)}</span>
                    <select value={u.role} disabled={isMe} onChange={(e) => changeRole(u, e.target.value)} className="input w-32 py-2" aria-label={`Role for ${u.name}`}>
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    {confirmId === u.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(u.id)} className="btn-danger btn-sm">Delete</button>
                        <button onClick={() => setConfirmId(null)} className="btn-ghost btn-sm">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(u.id)}
                        disabled={isMe}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                        aria-label={`Delete ${u.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setNotice("User created.");
            load();
          }}
        />
      )}
    </div>
  );
}
