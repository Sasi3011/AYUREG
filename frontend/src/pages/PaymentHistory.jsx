import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Receipt, Wallet } from "lucide-react";
import api from "../api/client";
import { EmptyState, PageHeader, PageLoader, StatCard, StatusBadge, formatDate, formatINR } from "../components/ui";

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/payment/history")
      .then((res) => setPayments(res.payments || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const paid = payments.filter((p) => p.status === "paid");
  const totalPaid = paid.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pending = payments.filter((p) => p.status === "pending").length;

  return (
    <div className="page">
      <PageHeader title="Payments" subtitle="Licence fees paid for your applications." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total paid" value={formatINR(totalPaid)} icon={Wallet} tone="indigo" />
        <StatCard label="Successful payments" value={paid.length} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Pending" value={pending} icon={Clock} tone="amber" />
      </div>

      <div className="card overflow-hidden">
        {error ? (
          <p className="p-6 text-sm text-rose-600">{error}</p>
        ) : payments.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments yet" description="Fees become payable once an officer approves your application." />
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {payments.map((p) => (
                <li key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{p.business_name}</p>
                      <p className="truncate text-sm text-slate-500">{p.pathway_name}</p>
                    </div>
                    <p className="font-bold text-ink">{formatINR(p.amount)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      #{p.id} · {formatDate(p.paid_at || p.created_at)}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
            {/* Desktop table */}
            <div className="table-wrap hidden md:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Application</th>
                    <th>Pathway</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs">#{p.id}</td>
                      <td>
                        <Link to={`/applications/${p.application_id}`} className="font-semibold text-ink hover:text-primary-600">
                          {p.business_name}
                        </Link>
                      </td>
                      <td>{p.pathway_name}</td>
                      <td>{formatDate(p.paid_at || p.created_at, true)}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="text-right font-bold text-ink">{formatINR(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
