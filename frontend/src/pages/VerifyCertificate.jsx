import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, ShieldX } from "lucide-react";
import api from "../api/client";
import { PageLoader, formatDate } from "../components/ui";

export default function VerifyCertificate() {
  const { certificateNumber } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/certificates/verify/${encodeURIComponent(certificateNumber)}`, { auth: false })
      .then(setResult)
      .catch(() => setResult({ valid: false }))
      .finally(() => setLoading(false));
  }, [certificateNumber]);

  if (loading) return <PageLoader label="Verifying certificate…" />;

  const valid = result?.valid;
  const c = result?.certificate;

  return (
    <div className="bg-gradient-to-b from-primary-50/60 to-slate-50 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-xl animate-fade-up">
        <div className="card overflow-hidden">
          <div className={`px-6 py-10 text-center text-white ${valid ? "bg-gradient-to-br from-emerald-500 to-secondary-600" : "bg-gradient-to-br from-rose-500 to-rose-700"}`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-8 ring-white/10">
              {valid ? <BadgeCheck className="h-8 w-8" /> : <ShieldX className="h-8 w-8" />}
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-white">{valid ? "Certificate verified" : "Certificate not found"}</h1>
            <p className="mt-1 text-sm text-white/80">
              {valid ? "This certificate is authentic and was issued through AYUREG." : "We couldn’t find a certificate with this number."}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Certificate number</p>
            <p className="mt-1 break-all font-mono font-bold text-ink">{certificateNumber}</p>

            {valid && c && (
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["Business", c.business_name],
                  ["Licence", c.pathway_name],
                  ["Category", c.category || "—"],
                  ["Issued on", formatDate(c.issued_at)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-slate-50 p-4">
                    <dt className="text-xs text-slate-500">{k}</dt>
                    <dd className="mt-1 font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {!valid && (
              <p className="mt-6 text-sm text-slate-500">
                Check the number for typos, or contact the certificate holder. Forged certificates can be reported to support@ayureg.gov.in.
              </p>
            )}

            <Link to="/" className="btn-outline mt-8 w-full">
              Go to AYUREG home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
