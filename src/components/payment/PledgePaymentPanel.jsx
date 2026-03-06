import { useEffect, useState } from "react";
import { Phone, User, Calendar, CheckCircle2, Receipt, IndianRupee, Landmark } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { invoke } from "@tauri-apps/api/core";
import { formatDateIST } from "../../utils/timeFormatter";

// ── Payment type helpers ────────────────────────────────────────────────────
function paymentTypeLabel(type) {
  if (type === "CLOSURE") return "Closure";
  if (type === "INTEREST") return "Interest";
  if (type === "PRINCIPAL") return "Principal";
  return type;
}
function paymentTypeColor(type) {
  if (type === "CLOSURE") return { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" };
  if (type === "INTEREST") return { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" };
  return { bg: "#eff6ff", color: "#2563eb", border: "#93c5fd" };
}
function paymentTypeIcon(type) {
  if (type === "CLOSURE") return "🔒";
  if (type === "INTEREST") return "📅";
  return "💰";
}

// ── Closed Pledge View ──────────────────────────────────────────────────────
function ClosedPledgeView({ pledge, payments, onChangePledge }) {
  const originalPrincipal =
    pledge.principal_amount > 0
      ? pledge.principal_amount
      : (() => {
          const closure = payments.find((p) => p.payment_type === "CLOSURE");
          if (closure) return closure.amount;
          const principalSum = payments
            .filter((p) => p.payment_type === "PRINCIPAL")
            .reduce((s, p) => s + p.amount, 0);
          return principalSum || 0;
        })();

  // ✅ FIXED: Get closure date from the last payment OR fall back to most recent payment
  const closurePayment = payments.find((p) => p.payment_type === "CLOSURE");
  
  let closureDate = "-";
  
  if (closurePayment) {
    // Found a CLOSURE payment - use its date
    const rawDate = closurePayment.paid_at || closurePayment.date || closurePayment.created_at;
    closureDate = formatDateIST(rawDate);
  } else if (payments.length > 0) {
    // No CLOSURE payment - use the most recent payment's date
    // Payments are ordered by paid_at DESC in the backend query
    const lastPayment = payments[0];
    const rawDate = lastPayment.paid_at || lastPayment.date || lastPayment.created_at;
    closureDate = formatDateIST(rawDate);
  }
  
  // If still no date, fall back to pledge created_at (shouldn't happen but safe)
  if (closureDate === "-") {
    closureDate = formatDateIST(pledge.created_at);
  }

  const totalInterestPaid = payments
    .filter((p) => p.payment_type === "INTEREST")
    .reduce((s, p) => s + p.amount, 0);

  const wasBeforeBankMapping = pledge.had_bank_mapping === true;

  return (
    <div className="pledge-panel">
      {/* ── Header ── */}
      <div className="pledge-header">
        <div className="header-left">
          <h2>{pledge.pledge_no}</h2>
          <span>Selected Pledge Details</span>
        </div>
        <button className="btn-change" onClick={onChangePledge}>Change</button>
      </div>

      {/* ── Closed Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
        border: "2px solid #86efac", borderRadius: "14px",
        padding: "20px 24px", display: "flex", alignItems: "center",
        gap: "16px", margin: "0 0 16px 0",
      }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          background: "#22c55e", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
        }}>
          <CheckCircle2 size={26} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#15803d" }}>
            Pledge Closed
          </div>
          <div style={{ color: "#16a34a", fontSize: "0.85rem", marginTop: "2px" }}>
            Fully settled · Closed on {closureDate}
          </div>
        </div>
        <div style={{
          background: "#fff", borderRadius: "10px", padding: "8px 16px",
          border: "1px solid #86efac", textAlign: "center",
        }}>
          <div style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: "600", marginBottom: "2px" }}>
            CLOSED ON
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#15803d" }}>
            {closureDate}
          </div>
        </div>
      </div>

      {/* ── Bank Mapping Notice ── */}
      {wasBeforeBankMapping && (
        <div style={{
          background: "#fefce8", border: "1px solid #fde047",
          borderRadius: "10px", padding: "12px 16px", marginBottom: "14px",
          display: "flex", alignItems: "center", gap: "10px", color: "#854d0e",
          fontSize: "0.875rem",
        }}>
          <Landmark size={18} style={{ flexShrink: 0 }} />
          <span>This pledge was closed via <strong>Bank Unmapping</strong>. The closure amount includes bank principal repayment.</span>
        </div>
      )}

      {/* ── Customer Card ── */}
      <div className="customer-card">
        <div className="customer-top-section">
          <div className="customer-photo">
            {pledge.photo_path ? (
              <img src={convertFileSrc(pledge.photo_path)} alt="customer" />
            ) : (
              <div className="photo-placeholder">{pledge.customer_name?.charAt(0)}</div>
            )}
          </div>
          <div className="customer-info-area">
            <div className="info-row">
              <div>
                <span className="label">Customer ID</span>
                <h3 className="customer-id">{pledge.customer_id}</h3>
              </div>
              <div>
                <span className="label">Name</span>
                <h2 className="customer-name">{pledge.customer_name}</h2>
                <div className="relation-row">
                  <User size={16} />
                  <span>{pledge.relation || "Self"}</span>
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="phone-section">
                <Phone size={16} />
                <span>{pledge.phone}</span>
              </div>
              <div className="address-section">
                <span className="label">Address: </span>
                <span>{pledge.address || "No Address"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* ── Loan Info ── */}
        <div className="loan-section">
          <h3 className="loan-title">Loan Info</h3>
          <div className="loan-grid">
            <div>
              <span className="label">Original Principal</span>
              <h2 className="amount-blue">₹{originalPrincipal.toLocaleString()}</h2>
            </div>
            <div>
              <span className="label">Interest Rate</span>
              <h3>{pledge.interest_rate}% per month</h3>
            </div>
            <div>
              <Calendar size={16} />
              <span className="label">Pledge Date</span>
              <h3>{formatDateIST(pledge.created_at)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ── Settlement Summary ── */}
      <div style={{
        background: "#f8fafc", border: "1px solid #e2e8f0",
        borderRadius: "12px", padding: "16px 20px", margin: "14px 0",
      }}>
        <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "#374151", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <IndianRupee size={16} /> Settlement Summary
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px" }}>
            <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase" }}>
              Original Principal
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1e40af" }}>
              ₹{originalPrincipal.toLocaleString()}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px" }}>
            <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase" }}>
              Total Interest Paid
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#16a34a" }}>
              ₹{totalInterestPaid.toLocaleString()}
            </div>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px", padding: "12px 14px" }}>
            <div style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase" }}>
              Closed On
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "800", color: "#15803d" }}>
              {closureDate}
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment History ── */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: "12px", overflow: "hidden", margin: "14px 0",
      }}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
          fontWeight: "700", fontSize: "0.9rem", color: "#374151",
          display: "flex", alignItems: "center", gap: "8px",
          background: "#f8fafc",
        }}>
          <Receipt size={16} /> Payment History ({payments.length} transactions)
        </div>

        {payments.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
            No payment records found
          </div>
        ) : (
          <div style={{ maxHeight: "340px", overflowY: "auto" }}>
            {payments.map((payment, idx) => {
              const colors = paymentTypeColor(payment.payment_type);
              return (
                <div key={idx} style={{
                  padding: "14px 20px",
                  borderBottom: idx < payments.length - 1 ? "1px solid #f1f5f9" : "none",
                  display: "flex", alignItems: "center", gap: "14px",
                }}>
                  {/* Icon */}
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    background: colors.bg, border: `1px solid ${colors.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px", flexShrink: 0,
                  }}>
                    {paymentTypeIcon(payment.payment_type)}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{
                        fontSize: "0.8rem", fontWeight: "700", padding: "2px 8px",
                        borderRadius: "20px", background: colors.bg, color: colors.color,
                        border: `1px solid ${colors.border}`,
                      }}>
                        {paymentTypeLabel(payment.payment_type)}
                      </span>
                      {payment.payment_mode && (
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          via {payment.payment_mode}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                      {(() => {
                        const d = payment.paid_at || payment.date || payment.created_at;
                        return formatDateIST(d);
                      })()}
                      {payment.receipt_no && (
                        <span style={{ marginLeft: "10px", color: "#94a3b8" }}>
                          Receipt: {payment.receipt_no}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{
                    fontWeight: "800", fontSize: "1rem",
                    color: payment.payment_type === "CLOSURE" ? "#dc2626" : "#15803d",
                    flexShrink: 0,
                  }}>
                    ₹{payment.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function PledgePaymentPanel({ pledgeId, onChangePledge }) {
  const [details, setDetails] = useState(null);
  const [paymentType, setPaymentType] = useState("INTEREST");
  const [paymentModes, setPaymentModes] = useState([
    {
      method: "CASH", amount: 0, reference: "",
      denominations: { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 },
    },
  ]);

  useEffect(() => {
    if (!pledgeId) return;
    async function fetchDetails() {
      try {
        const data = await invoke("get_single_pledge_cmd", { pledgeId: Number(pledgeId) });
        setDetails(data);
      } catch (err) {
        console.error("Failed to load pledge:", err);
      }
    }
    fetchDetails();
  }, [pledgeId]);

  if (!details || !details.pledge) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "#94a3b8" }}>
        Loading pledge details...
      </div>
    );
  }

  const pledge = details.pledge;
  const payments = details.payments || [];
  const isClosed = pledge.status === "CLOSED";
  const isBankMapped = pledge.is_bank_mapped === true;

  // ── Render CLOSED state ────────────────────────────────────────────────
  if (isClosed) {
    return (
      <ClosedPledgeView
        pledge={pledge}
        payments={payments}
        onChangePledge={onChangePledge}
      />
    );
  }

  // ── Render ACTIVE state ────────────────────────────────────────────────
  const principal = pledge.principal_amount;
  const pendingInterest = details.interest_pending ?? 0;

  const totalCollected = paymentModes.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  let paymentDue = 0;
  if (paymentType === "INTEREST") paymentDue = pendingInterest;
  else paymentDue = principal + pendingInterest;

  const balance = paymentDue - totalCollected;

  const hasCashMismatch = paymentModes.some((mode) => {
    if (mode.method !== "CASH") return false;
    const total = Object.entries(mode.denominations).reduce(
      (sum, [n, c]) => sum + Number(n) * Number(c), 0
    );
    return total !== mode.amount;
  });

  async function handleProcessPayment() {
    try {
      await invoke("add_pledge_payment_cmd", {
        req: {
          pledge_id: Number(pledgeId),
          payment_type:
            paymentType === "FULL" ? "CLOSURE"
            : paymentType === "INTEREST" ? "INTEREST"
            : "PRINCIPAL",
          payment_mode: paymentModes[0].method,
          amount: Number(totalCollected),
          created_by: 1,
          reference: paymentModes[0].method !== "CASH" ? paymentModes[0].reference : null,
          denominations: paymentModes[0].method === "CASH" ? paymentModes[0].denominations : null,
        },
      });

      alert("Payment processed successfully");
      const updated = await invoke("get_single_pledge_cmd", { pledgeId: Number(pledgeId) });
      setDetails(updated);
      setPaymentModes([{
        method: "CASH", amount: 0, reference: "",
        denominations: { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 },
      }]);
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Check console.");
    }
  }

  return (
    <div className="pledge-panel">
      {isBankMapped && (
        <div style={{
          background: "#fff7ed", border: "1px solid #f97316",
          borderRadius: "10px", padding: "14px 18px", marginBottom: "16px",
          display: "flex", alignItems: "flex-start", gap: "12px", color: "#9a3412",
        }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <div>
            <strong style={{ display: "block", marginBottom: "4px" }}>Bank-Mapped Pledge</strong>
            <span style={{ fontSize: "14px" }}>
              This pledge is linked to a bank loan. It cannot be closed from here.
              Go to <strong>Bank Mapping</strong> page to unmap and close.
            </span>
          </div>
        </div>
      )}

      <div className="pledge-header">
        <div className="header-left">
          <h2>{pledge.pledge_no}</h2>
          <span>Selected Pledge Details</span>
        </div>
        <button className="btn-change" onClick={onChangePledge}>Change</button>
      </div>

      <div className="customer-card">
        <div className="customer-top-section">
          <div className="customer-photo">
            {pledge.photo_path ? (
              <img src={convertFileSrc(pledge.photo_path)} alt="customer" />
            ) : (
              <div className="photo-placeholder">{pledge.customer_name?.charAt(0)}</div>
            )}
          </div>
          <div className="customer-info-area">
            <div className="info-row">
              <div>
                <span className="label">Customer ID</span>
                <h3 className="customer-id">{pledge.customer_id}</h3>
              </div>
              <div>
                <span className="label">Name</span>
                <h2 className="customer-name">{pledge.customer_name}</h2>
                <div className="relation-row">
                  <User size={18} />
                  <span>{pledge.relation || "Self"}</span>
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="phone-section">
                <Phone size={18} />
                <span>{pledge.phone}</span>
              </div>
              <div className="address-section">
                <span className="label">Address : </span>
                <span>{pledge.address || "No Address"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="loan-section">
          <h3 className="loan-title">Loan Info</h3>
          <div className="loan-grid">
            <div>
              <span className="label">Principal Amount</span>
              <h2 className="amount-blue">₹{pledge.principal_amount.toLocaleString()}</h2>
            </div>
            <div>
              <span className="label">Interest Rate</span>
              <h3>{pledge.interest_rate}% per month</h3>
            </div>
            <div>
              <Calendar size={18} />
              <span className="label">Pledge Date</span>
              <h3>{formatDateIST(pledge.created_at)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="pending-box">
        <div>
          <p>Pending Interest</p>
          <small>Calculated till today</small>
        </div>
        <h2>₹{pendingInterest.toLocaleString()}</h2>
      </div>

      <div className="payment-details-wrapper">
        <div className="payment-header"><h3>Payment Details</h3></div>
        <div className="payment-body">
          <h4 className="payment-subtitle">Payment Type</h4>
          <div className="payment-type-grid">
            <div
              className={`type-card ${paymentType === "INTEREST" ? "active" : ""}`}
              onClick={() => {
                setPaymentType("INTEREST");
                const updated = [...paymentModes];
                updated[0].amount = pendingInterest;
                setPaymentModes(updated);
              }}
            >
              <div className="type-icon green">$</div>
              <h4>Interest Payment</h4>
              <span>₹{pendingInterest.toLocaleString()}</span>
            </div>

            <div
              className={`type-card ${paymentType === "PARTIAL" ? "active" : ""}`}
              onClick={() => {
                setPaymentType("PARTIAL");
                const updated = [...paymentModes];
                updated[0].amount = 0;
                setPaymentModes(updated);
              }}
            >
              <div className="type-icon blue">💳</div>
              <h4>Partial Payment</h4>
              <span>Custom amount</span>
            </div>

            <div
              className={`type-card ${paymentType === "FULL" ? "active" : ""} ${isBankMapped ? "disabled" : ""}`}
              onClick={() => {
                if (isBankMapped) return;
                const total = pledge.principal_amount + pendingInterest;
                setPaymentType("FULL");
                const updated = [...paymentModes];
                updated[0].amount = total;
                setPaymentModes(updated);
              }}
              style={isBankMapped ? { opacity: 0.4, cursor: "not-allowed" } : {}}
            >
              <div className="type-icon purple">✔</div>
              <h4>Full Settlement</h4>
              {isBankMapped ? (
                <span style={{ color: "#f97316", fontSize: "12px" }}>Use Bank Unmapping</span>
              ) : (
                <span>₹{(pledge.principal_amount + pendingInterest).toLocaleString()}</span>
              )}
            </div>
          </div>

          <div className="total-box">
            <div><h4>Total Payment Amount</h4></div>
            <div className="total-amount">₹{paymentDue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="collection-wrapper">
        <div className="collection-header"><h3>Payment Collection</h3></div>
        <div className="collection-body">
          {paymentModes.map((mode, index) => {
            const denominationTotal = Object.entries(mode.denominations).reduce(
              (sum, [note, count]) => sum + Number(note) * Number(count), 0
            );
            const difference = mode.amount - denominationTotal;

            return (
              <div key={index} className="payment-mode-card">
                <div className="payment-mode-layout">
                  <div className="payment-left">
                    <div className="form-group-modern">
                      <label className="modern-label">Payment Method</label>
                      <select
                        className="modern-select"
                        value={mode.method}
                        onChange={(e) => {
                          const updated = [...paymentModes];
                          updated[index].method = e.target.value;
                          setPaymentModes(updated);
                        }}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK">Bank</option>
                      </select>
                    </div>

                    <div className="form-group-modern">
                      <label className="modern-label">Amount (₹)</label>
                      <input
                        type="number"
                        className="modern-input"
                        value={mode.amount}
                        onChange={(e) => {
                          const updated = [...paymentModes];
                          updated[index].amount = Number(e.target.value) || 0;
                          setPaymentModes(updated);
                        }}
                      />
                      {mode.method === "CASH" && (
                        <div className="cash-amount-status">
                          <div className="cash-counted">
                            Cash Counted: ₹{denominationTotal.toLocaleString()}
                          </div>
                          {difference !== 0 && (
                            <div className="cash-mismatch">
                              ⚠ Difference: ₹{Math.abs(difference).toLocaleString()}
                            </div>
                          )}
                          {difference === 0 && mode.amount > 0 && (
                            <div className="cash-match">✓ Cash matches entered amount</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="payment-right">
                    {mode.method !== "CASH" && (
                      <div className="form-group-modern">
                        <label className="modern-label">
                          {mode.method === "UPI" ? "UPI Transaction ID" : "Bank Reference No"}
                        </label>
                        <input
                          type="text"
                          className="modern-input"
                          placeholder="Enter reference number"
                          value={mode.reference}
                          onChange={(e) => {
                            const updated = [...paymentModes];
                            updated[index].reference = e.target.value;
                            setPaymentModes(updated);
                          }}
                        />
                      </div>
                    )}

                    {mode.method === "CASH" && (
                      <div className="denomination-box-modern">
                        <h4>Cash Denominations</h4>
                        <div className="denomination-grid">
                          {[500, 200, 100, 50, 20, 10].map((note) => (
                            <div key={note} className="denomination-item">
                              <span>₹{note}</span>
                              <input
                                type="number"
                                value={mode.denominations[note]}
                                onChange={(e) => {
                                  const count = Number(e.target.value) || 0;
                                  const updated = [...paymentModes];
                                  updated[index].denominations[note] = count;
                                  setPaymentModes(updated);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div
            className="add-payment-mode"
            onClick={() =>
              setPaymentModes([...paymentModes, {
                method: "CASH", amount: 0, reference: "",
                denominations: { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 },
              }])
            }
          >
            + Add Another Payment Mode
          </div>

          <div className="collection-summary">
            <div className="summary-row">
              <span>Payment Due:</span>
              <strong>₹{paymentDue.toLocaleString()}</strong>
            </div>
            <div className="summary-row">
              <span>Amount Collected:</span>
              <strong className="green">₹{totalCollected.toLocaleString()}</strong>
            </div>
            <hr />
            <div className="summary-row balance">
              <span>Balance:</span>
              <strong className={balance > 0 ? "red" : "green"}>
                ₹{balance.toLocaleString()}
              </strong>
            </div>
            {paymentType === "PARTIAL" && (
              <div className="partial-note">
                Partial payment will clear pending interest first. Remaining amount will reduce principal.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn-cancel" onClick={onChangePledge}>Cancel</button>
        <button
          className="btn-primary"
          disabled={
            (isBankMapped && paymentType === "FULL") ||
            (paymentType !== "PARTIAL" && balance !== 0) ||
            hasCashMismatch
          }
          onClick={handleProcessPayment}
        >
          {isBankMapped && paymentType === "FULL"
            ? "Cannot Close — Bank Mapped"
            : "Process Payment"}
        </button>
      </div>
    </div>
  );
}