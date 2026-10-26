import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, Check, Copy, ExternalLink, Printer, QrCode } from "lucide-react";
import api from "../api/client";
import Logo from "../components/Logo";
import { Alert, PageHeader, PageLoader, formatDate } from "../components/ui";

export default function Certificate() {
  const { applicationId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get(`/certificates/${applicationId}`)
      .then((res) => setCertificate(res.certificate))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [applicationId]);

  function handleCopy(text) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return <PageLoader label="Preparing your certificate…" />;

  return (
    <div className="page max-w-4xl">
      <div className="no-print">
        <PageHeader
          back={{ to: `/applications/${applicationId}`, label: "Application details" }}
          title="Your certificate"
          subtitle="Download, print or share the verification link."
          actions={
            certificate && (
              <>
                <Link to={`/certificates/verify/${certificate.certificate_number}`} target="_blank" className="btn-outline">
                  <ExternalLink className="h-4 w-4" /> Public page
                </Link>
                <button onClick={() => window.print()} className="btn-primary">
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </button>
              </>
            )
          }
        />
      </div>

      {error && <Alert type="error" title="Certificate unavailable">{error}</Alert>}

      {certificate && (
        <article className="relative overflow-hidden rounded-3xl bg-white p-2 shadow-lift print:shadow-none">
          <div className="rounded-[1.25rem] bg-gradient-to-br from-primary-600 via-secondary-500 to-accent-400 p-[3px]">
            <div className="relative overflow-hidden rounded-[1.1rem] bg-white px-6 py-10 sm:px-12 sm:py-12">
              <Award className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 text-primary-50 opacity-50" />

              <div className="relative text-center">
                <div className="flex justify-center">
                  <Logo />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-primary-600">Certificate of registration</p>
                <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">AYUSH Compliance Certificate</h1>
                <p className="mt-1 text-sm text-slate-500">Issued under the Drugs & Cosmetics Rules — AYUSH Licensing Directorate</p>

                <p className="mt-10 text-sm font-medium uppercase tracking-wider text-slate-400">This certifies that</p>
                <p className="mt-2 text-3xl font-extrabold text-primary-700 sm:text-4xl">{certificate.business_name}</p>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600">
                  has completed document verification and officer review and is registered under the licence category
                </p>
                <span className="mt-4 inline-block rounded-full bg-secondary-50 px-5 py-2 text-sm font-bold text-secondary-700 ring-1 ring-secondary-200">
                  {certificate.pathway_name}
                  {certificate.category && ` · ${certificate.category}`}
                </span>
              </div>

              <div className="relative mt-12 grid items-end gap-8 border-t border-slate-100 pt-8 sm:grid-cols-2">
                <div className="flex items-center gap-4">
                  {certificate.qr_code_data ? (
                    <img src={certificate.qr_code_data} alt="Certificate verification QR code" className="h-28 w-28 rounded-xl border border-slate-200 bg-white p-1.5" />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <QrCode className="h-8 w-8" />
                    </div>
                  )}
                  <div className="min-w-0 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Certificate no.</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="break-all font-mono font-bold text-ink">{certificate.certificate_number}</span>
                      <button onClick={() => handleCopy(certificate.certificate_number)} className="no-print rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-primary-600" aria-label="Copy certificate number">
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-1 text-slate-500">Issued {formatDate(certificate.issued_at)}</p>
                    <p className="mt-1 text-xs text-slate-400">Scan to verify authenticity</p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="font-serif text-2xl italic text-slate-700">Licensing Officer</p>
                  <div className="mt-2 h-px bg-slate-300 sm:ml-auto sm:w-56" />
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Authorised signatory</p>
                </div>
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
