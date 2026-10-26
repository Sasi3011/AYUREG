import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import api from "../api/client";
import useAuthStore from "../context/authStore";
import AuthLayout from "../components/AuthLayout";
import { Alert, Spinner } from "../components/ui";

const PANEL_POINTS = [
  { title: "Find the right licence", desc: "Describe your business and get matched to the correct pathway." },
  { title: "AI document pre-check", desc: "Catch missing or unreadable documents before an officer does." },
  { title: "Human-approved decisions", desc: "Every application is reviewed by a licensing officer." },
];

const STRENGTH = [
  { label: "Weak", cls: "bg-rose-500", width: "25%" },
  { label: "Fair", cls: "bg-accent-500", width: "50%" },
  { label: "Good", cls: "bg-sky-500", width: "75%" },
  { label: "Strong", cls: "bg-emerald-500", width: "100%" },
];

function strengthOf(p) {
  if (!p) return null;
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return STRENGTH[Math.max(0, score - 1)];
}

const FIELDS = [
  { key: "name", label: "Full name", type: "text", icon: User, placeholder: "Priya Sharma", autoComplete: "name", required: true },
  { key: "email", label: "Email address", type: "email", icon: Mail, placeholder: "you@company.com", autoComplete: "email", required: true },
  { key: "phone", label: "Mobile number", type: "tel", icon: Phone, placeholder: "98765 43210", autoComplete: "tel", hint: "Optional — used for status alerts." },
];

export default function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const strength = strengthOf(form.password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form, { auth: false });
      login(res.user, res.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create account. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your AYUSH licence application in minutes."
      panelTitle="Register once. Apply for every AYUSH licence."
      panelPoints={PANEL_POINTS}
    >
      {error && <Alert type="error" className="mb-5">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {FIELDS.map(({ key, label, type, icon: Icon, placeholder, autoComplete, required, hint }) => (
          <div key={key}>
            <label htmlFor={key} className="label">{label}</label>
            <div className="relative">
              <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id={key}
                type={type}
                required={required}
                autoComplete={autoComplete}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input input-icon"
                placeholder={placeholder}
              />
            </div>
            {hint && <p className="hint">{hint}</p>}
          </div>
        ))}

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input input-icon pr-11"
              placeholder="At least 8 characters"
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
          {strength && (
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-all ${strength.cls}`} style={{ width: strength.width }} />
              </div>
              <span className="text-xs font-semibold text-slate-500">{strength.label}</span>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
          {loading ? <Spinner className="h-5 w-5 text-white" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
