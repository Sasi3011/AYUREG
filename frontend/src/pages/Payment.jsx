import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, Building2, CheckCircle2, CreditCard, Landmark, Lock, Smartphone } from "lucide-react";
import api from "../api/client";
import { Alert, PageHeader, PageLoader, Spinner, StatusBadge, formatDate, formatINR } from "../components/ui";
import { pathwayInfo } from "../lib/pathways";

const METHODS = [
  { key: "upi", label: "UPI", icon: Smartphone },
  { key: "card", label: "Card", icon: CreditCard },
  { key: "netbanking", label: "Net banking", icon: Landmark },
];

export default function Payment() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("upi");

  useEffect(() => {
    Promise.all([api.get(`/applications/${applicationId}`), api.get("/payment/history")])
      .then(([appRes, payRes]) => {
        setApplication(appRes.application);
        const existing = (payRes.payments || []).filter((p) => String(p.application_id) === String(applicationId));
        setPayment(existing.find((p) => p.status === "paid") || existing.find((p) => p.status === "pending") || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [applicationId]);

  async function handlePay() {
    setError("");
    setBusy(true);
    try {
      let current = payment;
      if (!current || current.status !== "pending") {
        const res = await api.post("/payment/initiate", { applicationId: Number(applicationId) });
        current = res.payment;
      }
      const res = await api.post("/payment/webhook", { paymentId: current.id });
      setPayment(res.payment);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader />;

  const info = pathwayInfo(application?.pathway_code);
  const paid = payment?.status === "paid";
  const amount = payment?.amount ?? info.fee;
  const canPay = application?.status === "approved";

  return (
    <div className="page max-w-4xl">
      <PageHeader back={{ to: `/applications/${applicationId}`, label: "Application details" }} title="Licence fee payment" subtitle="Pay securely to receive your verifiable certificate." />

      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Summary */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="bg-gradient-to-br from-primary-600 to-secondary-500 p-6 text-white">
            <p className="text-sm text-primary-100">Amount payable</p>
            <p className="mt-1 text-4xl font-extrabold">{formatINR(amount)}</p>
            <p className="mt-2 text-sm text-primary-100">{application?.pathway_name}</p>
          </div>
          <dl className="space-y-3 p-6 text-sm">
            {[
              ["Business", application?.business_name],
              ["Application", `#${applicationId}`],
              ["Licence form", info.form],
              ["Status", <StatusBadge key="s" status={paid ? "paid" : application?.status} />],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{k}</dt>
                <dd className="truncate text-right font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Pay / receipt */}
        <div className="card p-6 lg:col-span-3">
          {paid ? (
            <div className="flex h-full flex-col items-center justify-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-xl font-extrabold">Payment successful</h2>
              <p className="mt-1 text-sm text-slate-500">
                Receipt #{payment.id} · {formatDate(payment.paid_at, true)}
              </p>
              <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                <Link to={`/certificate/${applicationId}`} className="btn-primary">
                  <Award className="h-4 w-4" /> Get certificate
                </Link>
                <Link to="/payments" className="btn-outline">
                  Payment history
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h2 className="section-title">Choose a payment method</h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {METHODS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setMethod(key)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition ${
                      method === key ? "border-primary-500 bg-primary-50 text-primary-700 ring-4 ring-primary-100" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" /> {label}
                  </button>
                ))}
              </div>
              <Alert type="info" className="mt-5">
                This is a sandbox gateway — no real money is charged.
              </Alert>
              {!canPay && (
                <Alert type="warning" className="mt-3">
                  Payment opens once your application is approved by an officer.
                </Alert>
              )}
              <button onClick={handlePay} disabled={busy || !canPay} className="btn-primary btn-lg mt-6 w-full">
                {busy ? <Spinner className="h-5 w-5 text-white" /> : <Lock className="h-4 w-4" />} Pay {formatINR(amount)}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Building2 className="h-3.5 w-3.5" /> Paid to AYUSH Licensing Authority
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
