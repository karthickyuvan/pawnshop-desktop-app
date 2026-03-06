import { useEffect, useState } from "react";
import { CheckCircle2, ArrowLeft, User, Hash, IndianRupee, Calendar, Clock } from "lucide-react";
import { getSinglePledge } from "../../services/pledgeApi";

export default function ClosedPledgePanel({ pledgeId, onChangePledge }) {
  const [pledgeData, setPledgeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pledgeId) return;
    setLoading(true);
    getSinglePledge(pledgeId)
      .then(setPledgeData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pledgeId]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
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
    <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
      {/* ── Back button ── */}
      <button
        onClick={onChangePledge}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "none", border: "none", color: "#64748b",
          cursor: "pointer", fontSize: "0.9rem", marginBottom: "20px", padding: 0
        }}
      >
        <ArrowLeft size={16} /> Change Pledge
      </button>

      {/* ── Closed Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
        border: "2px solid #86efac",
        borderRadius: "16px",
        padding: "28px 32px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        marginBottom: "24px",
      }}>
        <div style={{
          width: "56px", height: "56px", borderRadius: "50%",
          background: "#22c55e", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0
        }}>
          <CheckCircle2 size={30} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#15803d" }}>
            Pledge Closed
          </div>
          <div style={{ color: "#16a34a", fontSize: "0.9rem", marginTop: "2px" }}>
            This pledge has been fully settled and closed.
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Pledge Number</div>
          <div style={{ fontWeight: "700", fontSize: "1rem", color: "#1e293b" }}>
            {pledge.pledge_no}
          </div>
        </div>
      </div>

      {/* ── Pledge Info Grid ── */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px",
        padding: "20px", marginBottom: "20px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <User size={16} color="#64748b" />
          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Customer</div>
            <div style={{ fontWeight: "600", color: "#1e293b" }}>{pledge.customer_name}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Hash size={16} color="#64748b" />
          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Scheme</div>
            <div style={{ fontWeight: "600", color: "#1e293b" }}>{pledge.scheme_name}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <IndianRupee size={16} color="#64748b" />
          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Original Loan</div>
            <div style={{ fontWeight: "600", color: "#1e293b" }}>₹{original_principal.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Calendar size={16} color="#64748b" />
          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Created</div>
            <div style={{ fontWeight: "600", color: "#1e293b" }}>{pledge.created_at?.slice(0, 10)}</div>
          </div>
        </div>
      </div>

      {/* ── Settlement Summary ── */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px",
        padding: "20px", marginBottom: "20px"
      }}>
        <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "14px", fontSize: "0.95rem" }}>
          Settlement Summary
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
            <span style={{ color: "#64748b" }}>Original Principal</span>
            <span style={{ fontWeight: "600" }}>₹{original_principal.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
            <span style={{ color: "#64748b" }}>Total Interest Paid</span>
            <span style={{ fontWeight: "600", color: "#059669" }}>₹{totalInterestPaid.toLocaleString()}</span>
          </div>
          {totalPrincipalPaid > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "#64748b" }}>Principal Paid</span>
              <span style={{ fontWeight: "600", color: "#059669" }}>₹{totalPrincipalPaid.toLocaleString()}</span>
            </div>
          )}
          {closurePayment && (
            <>
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#64748b" }}>Closure Date</span>
                <span style={{ fontWeight: "600" }}>{closurePayment.date?.slice(0, 10)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#64748b" }}>Closure Mode</span>
                <span style={{ fontWeight: "600" }}>{closurePayment.mode}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Payment History ── */}
      {payments.length > 0 && (
        <div style={{
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px"
        }}>
          <div style={{
            fontWeight: "700", color: "#1e293b", marginBottom: "14px",
            fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px"
          }}>
            <Clock size={16} /> Payment History
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {payments.map((p, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", borderRadius: "8px", background: "#f8fafc",
                border: "1px solid #f1f5f9"
              }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "#1e293b" }}>
                    {p.payment_type === "CLOSURE" ? "🔒 Closure" : p.payment_type === "INTEREST" ? "📅 Interest" : "💰 Principal"}
                    <span style={{ marginLeft: "8px", fontWeight: "400", fontSize: "0.78rem", color: "#94a3b8" }}>
                      {p.mode}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>
                    {p.date?.slice(0, 10)} · {p.receipt_no}
                  </div>
                </div>
                <div style={{
                  fontWeight: "700", fontSize: "0.95rem",
                  color: p.payment_type === "CLOSURE" ? "#dc2626" : "#059669"
                }}>
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