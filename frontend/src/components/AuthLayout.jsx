import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Logo from "./Logo";

export default function AuthLayout({ title, subtitle, panelTitle, panelPoints = [], children }) {
  return (
    <div className="flex min-h-[100dvh] bg-white">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] max-w-xl overflow-hidden bg-ink lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-[-60px] h-96 w-96 rounded-full bg-secondary-500/30 blur-3xl" />
        <div className="pointer-events-none absolute right-16 top-1/3 h-40 w-40 rounded-full bg-accent-500/20 blur-3xl" />

        <div className="relative flex h-full flex-col px-10 py-10 xl:px-14">
          <Link to="/" className="w-fit">
            <Logo light />
          </Link>

          <div className="my-auto py-12">
            <h2 className="text-3xl font-extrabold leading-tight text-white xl:text-4xl">{panelTitle}</h2>
            <ul className="mt-8 space-y-4">
              {panelPoints.map((p) => (
                <li key={p.title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary-400" />
                  <div>
                    <p className="font-semibold text-white">{p.title}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{p.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-500">AI screens every document. A human officer always makes the final decision.</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col">
        <div className="flex h-16 items-center px-4 sm:px-8 lg:hidden">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md animate-fade-up">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-500 sm:text-base">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
