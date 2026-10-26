import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  ChevronDown,
  FileSearch,
  Languages,
  Lock,
  QrCode,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import api from "../api/client";
import useAuthStore from "../context/authStore";
import { homePathFor } from "../components/Navbar";
import { TONES, formatINR } from "../components/ui";
import { PATHWAY_INFO, pathwayInfo } from "../lib/pathways";

const STEPS = [
  { icon: Sparkles, tone: "indigo", title: "Describe your business", desc: "Tell us what you make or offer. The AI matches you to the right licence pathway and builds your document checklist." },
  { icon: ScanSearch, tone: "teal", title: "Upload & pre-check", desc: "Each document is scanned with OCR and checked for missing information before it ever reaches an officer." },
  { icon: UserCheck, tone: "amber", title: "Officer review", desc: "A licensing officer reviews your file and approves, rejects or requests corrections — always with a reason." },
  { icon: QrCode, tone: "emerald", title: "Pay & get certified", desc: "Pay the fee online and download a QR-verifiable certificate that anyone can authenticate." },
];

const FEATURES = [
  { icon: FileSearch, tone: "indigo", title: "AI document pre-verification", desc: "OCR flags unreadable scans, missing signatures and inconsistent data instantly." },
  { icon: Bot, tone: "teal", title: "Compliance assistant", desc: "Ask questions about licences, documents and fees and get answers instantly." },
  { icon: Languages, tone: "violet", title: "Multilingual support", desc: "Get guidance in English, Hindi and other regional languages." },
  { icon: ShieldCheck, tone: "emerald", title: "Human in the loop", desc: "AI never approves. Every decision is made and justified by an officer." },
  { icon: QrCode, tone: "amber", title: "QR-verifiable certificates", desc: "Customs, partners and customers can verify authenticity in one scan." },
  { icon: Lock, tone: "rose", title: "Secure by design", desc: "Two-step sign in, role-based access and a full audit trail of every action." },
];

const FAQS = [
  { q: "Which licence do I need?", a: "Describe your products or services when you start a new application. The AI suggests the matching pathway — manufacturing, loan licence, GMP, export or clinic — and you can change it before continuing." },
  { q: "Does the AI approve my application?", a: "No. AI only pre-screens documents to catch obvious issues early. A licensing officer reviews every application and records a reason for each decision." },
  { q: "What happens if a correction is requested?", a: "You’ll get a notification with the officer’s remarks. Re-upload the corrected documents and resubmit — your application goes straight back into the review queue." },
  { q: "How do I prove my certificate is genuine?", a: "Every certificate carries a QR code linked to a public verification page that shows the business name, licence type and issue date." },
];

export default function Landing() {
  const { user } = useAuthStore();
  const [pathways, setPathways] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);
  const ctaPath = user ? homePathFor(user) : "/register";

  useEffect(() => {
    api
      .get("/pathway", { auth: false })
      .then((res) => setPathways(res.pathways || []))
      .catch(() => setPathways(Object.keys(PATHWAY_INFO).map((code) => ({ code, name: code.replace(/_/g, " ") }))));
  }, []);

  return (
    <div className="-mt-16 overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white pb-20 pt-32 sm:pb-28 sm:pt-40">
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full bg-secondary-300/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-200/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-4 py-1.5 text-xs font-semibold text-primary-700 shadow-sm backdrop-blur sm:text-sm">
              <BadgeCheck className="h-4 w-4 text-secondary-500" /> Single-window AYUSH registration
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Get your AYUSH licence{" "}
              <span className="bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-500 bg-clip-text text-transparent">without the paperwork maze</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg">
              AYUREG finds the right licence for your business, checks your documents with AI before they’re submitted, and sends every application to a
              licensing officer for review.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={ctaPath} className="btn-primary btn-lg w-full sm:w-auto">
                {user ? "Go to your portal" : "Start your application"} <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#how-it-works" className="btn-outline btn-lg w-full sm:w-auto">
                See how it works
              </a>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { v: "5", l: "Licence pathways", tone: "indigo" },
              { v: "100%", l: "Human-approved", tone: "teal" },
              { v: "OCR", l: "Document pre-check", tone: "amber" },
              { v: "QR", l: "Verifiable certificates", tone: "violet" },
            ].map((s) => (
              <div key={s.l} className="card p-4 text-center sm:p-5">
                <p className={`text-2xl font-extrabold sm:text-3xl ${TONES[s.tone].text}`}>{s.v}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="How it works" title="From application to certificate in four steps" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="card card-hover relative p-6">
                  <span className="absolute right-5 top-5 text-4xl font-extrabold text-slate-100">0{i + 1}</span>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${TONES[s.tone].icon}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pathways */}
      <section id="pathways" className="scroll-mt-20 bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Licence pathways" title="One portal for every AYUSH licence" subtitle="Not sure which one applies? Describe your business and the AI will recommend one." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pathways.map((p) => {
              const info = pathwayInfo(p.code);
              const Icon = info.icon;
              return (
                <div key={p.code} className="card card-hover flex flex-col p-6">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${TONES[info.tone].icon}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`badge ${TONES[info.tone].soft}`}>{info.form}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold capitalize">{p.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{info.summary || p.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                    <span className="text-slate-500">Fee</span>
                    <span className="font-bold text-ink">{formatINR(info.fee)}</span>
                  </div>
                </div>
              );
            })}
            <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-500 p-6 text-white shadow-glow">
              <div>
                <Sparkles className="h-8 w-8 text-accent-300" />
                <h3 className="mt-5 text-lg font-bold text-white">Not sure where you fit?</h3>
                <p className="mt-2 text-sm text-primary-50">Describe your products in plain language and get an instant pathway recommendation.</p>
              </div>
              <Link to={ctaPath} className="btn mt-6 bg-white text-primary-700 hover:bg-primary-50">
                Find my pathway <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Features" title="Built for applicants and officers alike" />
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[f.tone].icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="card overflow-hidden">
                  <button onClick={() => setOpenFaq(open ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6" aria-expanded={open}>
                    <span className="font-semibold text-ink">{f.q}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? "rotate-180 text-primary-600" : ""}`} />
                  </button>
                  {open && <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary-600/50 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-secondary-500/40 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Ready to register your AYUSH business?</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">Create a free account and get your personalised document checklist in minutes.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={ctaPath} className="btn-accent btn-lg">
                  {user ? "Open portal" : "Create free account"} <ArrowRight className="h-5 w-5" />
                </Link>
                {!user && (
                  <Link to="/login" className="btn btn-lg border border-white/20 text-white hover:bg-white/10">
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-primary-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-slate-500">{subtitle}</p>}
    </div>
  );
}
