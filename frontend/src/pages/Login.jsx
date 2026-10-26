import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, KeyRound, Lock, Mail, Scale, ShieldCheck } from "lucide-react";
import api from "../api/client";
import useAuthStore from "../context/authStore";
import AuthLayout from "../components/AuthLayout";
import { homePathFor } from "../components/Navbar";
import { Alert, Spinner, TONES } from "../components/ui";

const DEMO_ROLES = [
  { role: "applicant", label: "Applicant", email: "applicant@enterprise.com", password: "Applicant@123", Icon: Building2, tone: "indigo" },
  { role: "officer", label: "Officer", email: "officer@ayureg.gov.in", password: "Officer@123", Icon: Scale, tone: "teal" },
  { role: "admin", label: "Admin", email: "admin@ayureg.gov.in", password: "Admin@123", Icon: ShieldCheck, tone: "violet" },
];

const PANEL_POINTS = [
  { title: "Two-step secure sign in", desc: "Password plus a one-time code for every session." },
  { title: "Track every application", desc: "Live status from draft to certificate in one place." },
  { title: "Verifiable QR certificates", desc: "Anyone can confirm authenticity with a scan." },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [stage, setStage] = useState("credentials");
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState(null);
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickRole, setQuickRole] = useState(null);

  async function handleCredentials(e) {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form, { auth: false });
      setUserId(res.userId);
      setDevOtp(res.devOtp || "");
      setOtp(res.devOtp || "");
      setStage("otp");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp(e) {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { userId, code: otp.trim() }, { auth: false });
      login(res.user, res.token);
      navigate(homePathFor(res.user));
    } catch (err) {
      setError(err.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLogin(demo) {
    setError("");
    setQuickRole(demo.role);
    try {
      const res = await api.post("/auth/login", { email: demo.email, password: demo.password }, { auth: false });
      const otpRes = await api.post("/auth/verify-otp", { userId: res.userId, code: res.devOtp }, { auth: false });
      login(otpRes.user, otpRes.token);
      navigate(homePathFor(otpRes.user));
    } catch (err) {
      setForm({ email: demo.email, password: demo.password });
      setError(err.message || "Quick login failed. Credentials have been filled in for you.");
    } finally {
      setQuickRole(null);
    }
  }

  return (
    <AuthLayout
      title={stage === "otp" ? "Verify it’s you" : "Welcome back"}
      subtitle={stage === "otp" ? `Enter the 6-digit code sent to ${form.email}.` : "Sign in to manage your AYUSH registrations."}
      panelTitle="Your AYUSH licensing journey, simplified."
      panelPoints={PANEL_POINTS}
    >
      {error && <Alert type="error" className="mb-5">{error}</Alert>}

      {stage === "credentials" ? (
        <>
          <form onSubmit={handleCredentials} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input input-icon"
                  placeholder="you@company.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input input-icon pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
              {loading ? <Spinner className="h-5 w-5 text-white" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="my-8 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> Demo accounts <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {DEMO_ROLES.map((demo) => {
              const { Icon } = demo;
              return (
                <button
                  key={demo.role}
                  onClick={() => handleQuickLogin(demo)}
                  disabled={!!quickRole}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 p-3 text-center transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-soft disabled:opacity-60 sm:p-4"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONES[demo.tone].icon}`}>
                    {quickRole === demo.role ? <Spinner className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <span className="text-xs font-semibold text-ink sm:text-sm">{demo.label}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            New to AYUREG?{" "}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Create an account
            </Link>
          </p>
        </>
      ) : (
        <form onSubmit={handleOtp} className="space-y-5">
          {devOtp && (
            <Alert type="info" title="Development mode">
              Your code is <span className="font-mono font-bold tracking-widest">{devOtp}</span> — it has been filled in for you.
            </Alert>
          )}
          <div>
            <label htmlFor="otp" className="label">One-time code</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="input input-icon font-mono text-lg tracking-[0.5em]"
                placeholder="000000"
              />
            </div>
          </div>
          <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary btn-lg w-full">
            {loading ? <Spinner className="h-5 w-5 text-white" /> : <>Verify & sign in <ArrowRight className="h-4 w-4" /></>}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStage("credentials");
                setError("");
              }}
              className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button type="button" onClick={handleCredentials} disabled={loading} className="font-semibold text-primary-600 hover:text-primary-700">
              Resend code
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
