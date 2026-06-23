
// src/components/pledge/ClosedPledgePanel.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { CheckCircle2, ArrowLeft, User, Hash, IndianRupee, Calendar, Clock } from "lucide-react";
import { getSinglePledge } from "../../services/pledgeApi";
import "./ClosedPledgePanel.css"; // 🚀 Separate CSS file imported

export default function ClosedPledgePanel({ pledgeId, onChangePledge }) {
  const [pledgeData, setPledgeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pledgeId) return;
    setLoading(true);
    getSinglePledge(pledgeId)
      .then(setPledgeData)
      .catch((err) => {
        console.error("Failed to load closed pledge data:", err);
        toast.error("Failed to fetch pledge summary details."); // 🚀 Async failure alert
      })
      .finally(() => setLoading(false));
  }, [pledgeId]);

  if (loading) {
    return (
      <div className="panel-loading">
        Loading...
      </div>
    );
  }

  if (!pledgeData) return null;

  const { pledge, payments, original_principal } = pledgeData;

  const totalInterestPaid = payments
    .filter((p) => p.payment_type === "INTEREST" && p.status === "COMPLETED")
    .reduce((s, p) => s + p.amount, 0);

  const totalPrincipalPaid = payments
    .filter((p) => p.payment_type === "PRINCIPAL" && p.status === "COMPLETED")
    .reduce((s, p) => s + p.amount, 0);

  const closurePayment = payments.find((p) => p.payment_type === "CLOSURE");

  return (
    <div className="closed-panel-container">
      {/* ── Back button ── */}
      <button onClick={onChangePledge} className="back-panel-btn">
        <ArrowLeft size={16} /> Change Pledge
      </button>

      {/* ── Closed Banner ── */}
      <div className="closed-status-banner">
        <div className="banner-icon-wrapper">
          <CheckCircle2 size={30} color="#fff" />
        </div>
        <div className="banner-title-block">
          <div className="banner-title">Pledge Closed</div>
          <div className="banner-subtitle">This pledge has been fully settled and closed.</div>
        </div>
        <div className="banner-meta-block">
          <div className="meta-label">Pledge Number</div>
          <div className="meta-value">{pledge.pledge_no}</div>
        </div>
      </div>

      {/* ── Pledge Info Grid ── */}
      <div className="pledge-info-grid">
        <div className="info-grid-item">
          <User size={16} color="#64748b" />
          <div>
            <div className="item-label">Customer</div>
            <div className="item-value">{pledge.customer_name}</div>
          </div>
        </div>
        <div className="info-grid-item">
          <Hash size={16} color="#64748b" />
          <div>
            <div className="item-label">Scheme</div>
            <div className="item-value">{pledge.scheme_name}</div>
          </div>
        </div>
        <div className="info-grid-item">
          <IndianRupee size={16} color="#64748b" />
          <div>
            <div className="item-label">Original Loan</div>
            <div className="item-value">₹{original_principal.toLocaleString()}</div>
          </div>
        </div>
        <div className="info-grid-item">
          <Calendar size={16} color="#64748b" />
          <div>
            <div className="item-label">Created</div>
            <div className="item-value">{pledge.created_at?.slice(0, 10)}</div>
          </div>
        </div>
      </div>

      {/* ── Settlement Summary ── */}
      <div className="summary-section-card">
        <div className="section-card-title">Settlement Summary</div>
        <div className="summary-rows-stack">
          <div className="summary-row-item">
            <span className="row-label">Original Principal</span>
            <span className="row-value-bold">₹{original_principal.toLocaleString()}</span>
          </div>
          <div className="summary-row-item">
            <span className="row-label">Total Interest Paid</span>
            <span className="row-value-green">₹{totalInterestPaid.toLocaleString()}</span>
          </div>
          {totalPrincipalPaid > 0 && (
            <div className="summary-row-item">
              <span className="row-label">Principal Paid</span>
              <span className="row-value-green">₹{totalPrincipalPaid.toLocaleString()}</span>
            </div>
          )}
          {closurePayment && (
            <>
              <div className="summary-row-divider"></div>
              <div className="summary-row-item">
                <span className="row-label">Closure Date</span>
                <span className="row-value-bold">{closurePayment.date?.slice(0, 10)}</span>
              </div>
              <div className="summary-row-item">
                <span className="row-label">Closure Mode</span>
                <span className="row-value-bold">{closurePayment.mode}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Payment History ── */}
      {payments.length > 0 && (
        <div className="summary-section-card">
          <div className="section-card-title flex-align-center">
            <Clock size={16} /> Payment History
          </div>
          <div className="history-rows-stack">
            {payments.map((p, i) => (
              <div key={i} className="history-row-item">
                <div>
                  <div className="history-item-header">
                    {p.payment_type === "CLOSURE" ? "🔒 Closure" : p.payment_type === "INTEREST" ? "📅 Interest" : "💰 Principal"}
                    <span className="history-mode-tag">{p.mode}</span>
                  </div>
                  <div className="history-item-subtext">
                    {p.date?.slice(0, 10)} · {p.receipt_no}
                  </div>
                </div>
                <div className={p.payment_type === "CLOSURE" ? "amount-red" : "amount-green"}>
                  ₹{p.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}