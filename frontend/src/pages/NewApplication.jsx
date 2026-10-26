import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Check, ClipboardCheck, Lightbulb, Send, Sparkles, UploadCloud } from "lucide-react";
import api from "../api/client";
import DocumentUploader from "../components/DocumentUploader";
import { Alert, Card, PageHeader, ProgressBar, Spinner, TONES, formatINR } from "../components/ui";
import { pathwayInfo } from "../lib/pathways";

const STEPS = [
  { num: 1, label: "Business", icon: Building2 },
  { num: 2, label: "Pathway", icon: Sparkles },
  { num: 3, label: "Documents", icon: UploadCloud },
  { num: 4, label: "Review", icon: ClipboardCheck },
];

const PRESETS = [
  {
    title: "Classical Ayurvedic churna",
    name: "Classical Ayurvedic Churna LLP",
    desc: "Manufacturing classical Triphala and Ashwagandha churna using Ayurvedic Pharmacopoeia of India references in our own dedicated unit.",
  },
  {
    title: "Wellness capsule (loan licence)",
    name: "Proprietary Wellness Capsule LLP",
    desc: "Proprietary herbal capsule for immunity made at an existing GMP-certified partner facility under a loan licence.",
  },
  {
    title: "Panchakarma centre",
    name: "Ayurvedic Panchakarma Centre",
    desc: "Integrated AYUSH clinic offering Panchakarma therapies, naturopathy consultations and diet counselling.",
  },
];

const MODES = [
  { value: "direct", label: "Our own facility" },
  { value: "loan", label: "Partner facility (loan licence)" },
  { value: "clinic", label: "Clinic / wellness service" },
];

function Stepper({ step }) {
  return (
    <ol className="mb-8 grid grid-cols-4 gap-2">
      {STEPS.map((s) => {
        const done = step > s.num;
        const active = step === s.num;
        const Icon = s.icon;
        return (
          <li key={s.num} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                done ? "bg-emerald-500 text-white" : active ? "bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-glow" : "bg-white text-slate-400 ring-1 ring-slate-200"
              }`}
            >
              {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-slate-400">Step {s.num}</span>
              <span className={`block text-xs font-semibold sm:text-sm ${active ? "text-ink" : "text-slate-500"}`}>{s.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function NewApplication() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("direct");
  const [exportIntent, setExportIntent] = useState("no");
  const [pathways, setPathways] = useState([]);
  const [identification, setIdentification] = useState(null);
  const [selectedCode, setSelectedCode] = useState("");
  const [application, setApplication] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/pathway").then((res) => setPathways(res.pathways || [])).catch(() => {});
  }, []);

  async function handleIdentify(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fullDesc = `Mode: ${mode}. Export: ${exportIntent}. Details: ${description}`;
      const res = await api.post("/pathway/identify", { description: fullDesc });
      setIdentification(res);
      setSelectedCode(res.pathwayCode);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmPathway() {
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/applications", {
        businessName,
        description,
        pathwayCode: selectedCode,
        category: identification?.category,
      });
      setApplication(res.application);
      const detail = await api.get(`/applications/${res.application.id}`);
      setChecklist(detail.checklist || []);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function refreshChecklist() {
    if (!application) return;
    const detail = await api.get(`/applications/${application.id}`);
    setChecklist(detail.checklist || []);
  }

  async function handleSubmit() {
    setError("");
    setBusy(true);
    try {
      await api.put(`/applications/${application.id}/submit`);
      navigate(`/applications/${application.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const selectedPathway = pathways.find((p) => p.code === selectedCode);
  const requiredPending = checklist.filter((c) => c.required && !["uploaded", "verified"].includes(c.status)).length;
  const uploaded = checklist.filter((c) => ["uploaded", "verified"].includes(c.status)).length;

  return (
    <div className="page max-w-5xl">
      <PageHeader eyebrow="New application" title="Register your AYUSH business" subtitle="Four short steps. Your progress is saved as a draft once a pathway is confirmed." />
      <Stepper step={step} />
      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {/* Step 1 — business details */}
      {step === 1 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" title="Tell us about your business" subtitle="The AI uses this to recommend a licence pathway.">
            <form onSubmit={handleIdentify} className="space-y-5">
              <div>
                <label htmlFor="bname" className="label">Business name</label>
                <input id="bname" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="input" placeholder="e.g. Shree Ayurveda Pvt. Ltd." />
              </div>
              <div>
                <label htmlFor="desc" className="label">What do you make or offer?</label>
                <textarea
                  id="desc"
                  required
                  minLength={10}
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input resize-y"
                  placeholder="Describe your products, ingredients, facility and target market…"
                />
                <p className="hint">{description.length} characters · mention products, ingredients and where they are made.</p>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <fieldset>
                  <legend className="label">How will you operate?</legend>
                  <div className="space-y-2">
                    {MODES.map((m) => (
                      <label key={m.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition ${mode === m.value ? "border-primary-400 bg-primary-50 text-primary-800" : "border-slate-200 hover:bg-slate-50"}`}>
                        <input type="radio" name="mode" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} className="accent-primary-600" />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="label">Do you plan to export?</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {["no", "yes"].map((v) => (
                      <label key={v} className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium capitalize transition ${exportIntent === v ? "border-secondary-400 bg-secondary-50 text-secondary-800" : "border-slate-200 hover:bg-slate-50"}`}>
                        <input type="radio" name="export" value={v} checked={exportIntent === v} onChange={() => setExportIntent(v)} className="sr-only" />
                        {v}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">
                  {busy ? <Spinner className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4" />} Find my pathway
                </button>
              </div>
            </form>
          </Card>

          <Card title="Quick start" subtitle="Try an example">
            <div className="space-y-3">
              {PRESETS.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => {
                    setBusinessName(p.name);
                    setDescription(p.desc);
                  }}
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-left transition hover:border-primary-300 hover:bg-primary-50/50"
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Lightbulb className="h-4 w-4 text-accent-500" /> {p.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{p.desc}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Step 2 — pathway */}
      {step === 2 && identification && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-secondary-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-card">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary-700">AI recommendation · {Math.round((identification.confidence || 0) * 100)}% confidence</p>
                <h2 className="mt-1 text-xl font-extrabold">{identification.pathway?.name || identification.pathwayCode}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{identification.reasoning}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Detected category: <span className="font-semibold text-ink">{identification.category}</span>
                </p>
              </div>
            </div>
          </div>

          <Card title="Confirm your pathway" subtitle="Keep the recommendation or pick a different licence.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pathways.map((p) => {
                const info = pathwayInfo(p.code);
                const Icon = info.icon;
                const active = selectedCode === p.code;
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => setSelectedCode(p.code)}
                    className={`relative rounded-2xl border p-4 text-left transition ${active ? "border-primary-500 bg-primary-50/60 ring-4 ring-primary-100" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    {p.code === identification.pathwayCode && <span className="badge absolute right-3 top-3 bg-accent-100 text-accent-800 ring-accent-200">Suggested</span>}
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONES[info.tone].icon}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 font-semibold text-ink">{p.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {info.form} · {formatINR(info.fee)}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
              <button onClick={() => setStep(1)} className="btn-outline">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={handleConfirmPathway} disabled={busy || !selectedCode} className="btn-primary">
                {busy ? <Spinner className="h-4 w-4 text-white" /> : null} Confirm & build checklist <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Step 3 — documents */}
      {step === 3 && (
        <Card
          title="Upload your documents"
          subtitle="Each file is checked by OCR as soon as it’s uploaded."
          actions={<span className="text-sm font-semibold text-slate-500">{uploaded}/{checklist.length} uploaded</span>}
        >
          <ProgressBar value={checklist.length ? (uploaded / checklist.length) * 100 : 0} tone="teal" />
          <div className="mt-5 space-y-3">
            {checklist.map((item) => (
              <DocumentUploader key={item.id} applicationId={application.id} checklistItem={item} onUploaded={refreshChecklist} />
            ))}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link to={`/applications/${application.id}`} className="btn-ghost">Save draft & exit</Link>
            <button onClick={() => setStep(4)} disabled={requiredPending > 0} className="btn-primary">
              {requiredPending > 0 ? `${requiredPending} required remaining` : "Review application"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Step 4 — review */}
      {step === 4 && application && (
        <Card title="Review & submit" subtitle="Once submitted, your application goes to a licensing officer.">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ["Business name", businessName],
              ["Pathway", selectedPathway?.name || selectedCode],
              ["Category", identification?.category || "—"],
              ["Fee (payable after approval)", formatINR(pathwayInfo(selectedCode).fee)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">{k}</dt>
                <dd className="mt-1 font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Description</p>
            <p className="mt-1 text-sm text-slate-700">{description}</p>
          </div>
          <ul className="mt-4 space-y-2">
            {checklist.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm text-slate-600">
                <Check className={`h-4 w-4 ${["uploaded", "verified"].includes(c.status) ? "text-emerald-500" : "text-slate-300"}`} /> {c.label}
              </li>
            ))}
          </ul>
          <Alert type="info" className="mt-6">
            AI pre-screening never approves an application. A licensing officer reviews every submission and records a reason for the decision.
          </Alert>
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
            <button onClick={() => setStep(3)} className="btn-outline">
              <ArrowLeft className="h-4 w-4" /> Back to documents
            </button>
            <button onClick={handleSubmit} disabled={busy} className="btn-primary">
              {busy ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />} Submit application
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
