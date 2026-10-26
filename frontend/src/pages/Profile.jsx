import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, Mail, Phone, Save, User } from "lucide-react";
import api from "../api/client";
import useAuthStore from "../context/authStore";
import { Alert, Card, PageHeader, Spinner, formatDate } from "../components/ui";

const ROLE_LABEL = { applicant: "AYUSH Applicant", officer: "Licensing Officer", admin: "System Administrator" };

function PasswordInput({ id, label, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input id={id} type={show ? "text" : "password"} required value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} className="input input-icon pr-11" />
        <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const storeUser = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  useEffect(() => {
    api
      .get("/profile")
      .then((res) => {
        setProfile(res.user);
        setName(res.user?.name || "");
        setPhone(res.user?.phone || "");
      })
      .catch((err) => setProfileMsg({ type: "error", text: err.message }));
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      const res = await api.put("/profile", { name, phone });
      updateUser({ name: res.user.name, phone: res.user.phone });
      setProfile((p) => ({ ...p, ...res.user }));
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) return setPwMsg({ type: "error", text: "New passwords do not match." });
    if (newPw.length < 8) return setPwMsg({ type: "error", text: "Password must be at least 8 characters." });
    setPwSaving(true);
    try {
      await api.put("/profile/password", { currentPassword: currentPw, newPassword: newPw });
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      setPwMsg({ type: "error", text: err.message });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="page max-w-5xl">
      <PageHeader title="Profile & security" subtitle="Manage your personal details and password." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-400" />
          <div className="-mt-10 px-6 pb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl font-extrabold text-primary-600 shadow-lift ring-4 ring-white">
              {storeUser?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <h2 className="mt-4 text-lg font-extrabold">{storeUser?.name}</h2>
            <p className="text-sm text-slate-500">{ROLE_LABEL[storeUser?.role]}</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" /> <span className="truncate">{storeUser?.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" /> {profile?.phone || "No phone added"}
              </div>
              {profile?.created_at && <p className="pt-2 text-xs text-slate-400">Member since {formatDate(profile.created_at)}</p>}
            </dl>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Personal details" subtitle="This name appears on your applications.">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {profileMsg && <Alert type={profileMsg.type}>{profileMsg.text}</Alert>}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="label">Full name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className="input input-icon" />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="label">Mobile number</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input input-icon" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input id="email" value={storeUser?.email || ""} disabled className="input" />
                <p className="hint">Contact support to change your email address.</p>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={profileSaving} className="btn-primary">
                  {profileSaving ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />} Save changes
                </button>
              </div>
            </form>
          </Card>

          <Card title="Change password" subtitle="Use at least 8 characters with a mix of letters, numbers and symbols.">
            <form onSubmit={handleChangePassword} className="space-y-5">
              {pwMsg && <Alert type={pwMsg.type}>{pwMsg.text}</Alert>}
              <PasswordInput id="current" label="Current password" value={currentPw} onChange={setCurrentPw} autoComplete="current-password" />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <PasswordInput id="new" label="New password" value={newPw} onChange={setNewPw} autoComplete="new-password" />
                <PasswordInput id="confirm" label="Confirm new password" value={confirmPw} onChange={setConfirmPw} autoComplete="new-password" />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={pwSaving} className="btn-secondary">
                  {pwSaving ? <Spinner className="h-4 w-4 text-white" /> : <KeyRound className="h-4 w-4" />} Update password
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
