import { Link } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import Logo from "./Logo";

const COLUMNS = [
  {
    title: "Pathways",
    links: [
      { href: "/#pathways", label: "Manufacturing Licence" },
      { href: "/#pathways", label: "Loan Licence" },
      { href: "/#pathways", label: "GMP Certification" },
      { href: "/#pathways", label: "Export / CoPP" },
      { href: "/#pathways", label: "Clinic Registration" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#features", label: "AI document pre-check" },
      { to: "/register", label: "Create an account" },
      { to: "/login", label: "Sign in" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <Logo light />
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              A single-window portal that guides AYUSH businesses to the right licence, pre-checks documents with AI, and routes every
              application to a human officer for the final decision.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
                <ShieldCheck className="h-3.5 w-3.5 text-secondary-400" /> Human-approved decisions
              </span>
              <a href="mailto:support@ayureg.gov.in" className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 hover:text-white">
                <Mail className="h-3.5 w-3.5 text-accent-400" /> support@ayureg.gov.in
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className="transition hover:text-white">
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className="transition hover:text-white">
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AYUREG · Ministry of AYUSH compliance portal (demo)</p>
          <p>AI screens. A human officer always decides.</p>
        </div>
      </div>
    </footer>
  );
}
