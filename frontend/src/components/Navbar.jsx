import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, LayoutDashboard, Menu, X } from "lucide-react";
import useAuthStore from "../context/authStore";
import Logo from "./Logo";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pathways", label: "Pathways" },
  { href: "/#features", label: "Features" },
  { href: "/#faq", label: "FAQ" },
];

export function homePathFor(user) {
  if (!user) return "/login";
  if (user.role === "admin") return "/admin/analytics";
  if (user.role === "officer") return "/officer";
  return "/dashboard";
}

export default function Navbar() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition ${
        scrolled || open ? "border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="AYUREG home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link to={homePathFor(user)} className="btn-primary">
              <LayoutDashboard className="h-4 w-4" /> Go to portal
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="animate-fade-up border-t border-slate-100 bg-white px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 grid gap-2">
            {user ? (
              <Link to={homePathFor(user)} className="btn-primary w-full">
                <LayoutDashboard className="h-4 w-4" /> Go to portal
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary w-full">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/login" className="btn-outline w-full">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
