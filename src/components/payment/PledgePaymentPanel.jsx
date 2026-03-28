

// PledgePaymentPanel.jsx 
import { useEffect, useState } from "react";
import { Phone, User, Calendar, CheckCircle2, Receipt, IndianRupee, Landmark } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { invoke } from "@tauri-apps/api/core";
import { message } from "@tauri-apps/plugin-dialog";
import { formatDateIST } from "../../utils/timeFormatter";
import { useLanguage } from "../../context/LanguageContext";
import PaymentPrintModal from "../paymentPrint/PaymentPrintModal";
import CashDenominationInput, { calcDenomTotal, emptyDenominations } from "../../constants/CashDenominationInput";

// Convert denomination object { 500: 2, 100: 3 } → { "500": 2, "100": 3 }
// Rust's HashMap<i32, i32> deserialises JSON object keys as strings-that-are-numbers
function denomsToStringKeys(denoms) {
  if (!denoms) return null;
  const out = {};
  for (const [k, v] of Object.entries(denoms)) {
    if (Number(v) > 0) out[String(k)] = Number(v);
  }
  return Object.keys(out).length ? out : null;
}

// ── Payment type helpers ────────────────────────────────────────────────────
function paymentTypeLabel(type) {
  if (type === "CLOSURE")  return "Closure";
  if (type === "INTEREST") return "Interest";
  if (type === "PRINCIPAL") return "Principal";
  return type;
}
function paymentTypeColor(type) {
  if (type === "CLOSURE")  return { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" };
  if (type === "INTEREST") return { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" };
  return { bg: "#eff6ff", color: "#2563eb", border: "#93c5fd" };
}
function paymentTypeIcon(type) {
  if (type === "CLOSURE")  return "🔒";
  if (type === "INTEREST") return "📅";
  return "💰";
}

// ── Closed Pledge View ──────────────────────────────────────────────────────
function ClosedPledgeView({ pledge, payments, onChangePledge }) {
  const { t } = useLanguage();

  const originalPrincipal =
    pledge.principal_amount > 0
      ? pledge.principal_amount
      : (() => {
          const closure = payments.find((p) => p.payment_type === "CLOSURE");
          if (closure) return closure.amount;
          return payments
            .filter((p) => p.payment_type === "PRINCIPAL")
            .reduce((s, p) => s + p.amount, 0) || 0;
        })();

  const closurePayment = payments.find((p) => p.payment_type === "CLOSURE");
  let closureDate = "-";
  if (closurePayment) {
    closureDate = formatDateIST(closurePayment.paid_at || closurePayment.date || closurePayment.created_at);
  } else if (payments.length > 0) {
    closureDate = formatDateIST(payments[0].paid_at || payments[0].date || payments[0].created_at);
  }
  if (closureDate === "-") closureDate = formatDateIST(pledge.created_at);

  const totalInterestPaid = payments
    .filter((p) => p.payment_type === "INTEREST")
    .reduce((s, p) => s + p.amount, 0);

  const wasBeforeBankMapping = pledge.had_bank_mapping === true;

  return (
    <div className="pledge-panel">
      <div className="pledge-header">
        <div className="header-left">
          <h2>{pledge.pledge_no}</h2>
          <span>{t("selected_pledge_details")}</span>
        </div>
        <button className="btn-change" onClick={onChangePledge}>{t("change")}</button>
      </div>

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
            {t("pledge_closed")}
          </div>
          <div style={{ color: "#16a34a", fontSize: "0.85rem", marginTop: "2px" }}>
            {t("fully_settled")} · {t("closed_on")}{closureDate}
          </div>
        </div>
        <div style={{
          background: "#fff", borderRadius: "10px", padding: "8px 16px",
          border: "1px solid #86efac", textAlign: "center",
        }}>
          <div style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: "600", marginBottom: "2px" }}>
            {t("closed_on_caps")}
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#15803d" }}>
            {closureDate}
          </div>
        </div>
      </div>

      {wasBeforeBankMapping && (
        <div style={{
          background: "#fefce8", border: "1px solid #fde047",
          borderRadius: "10px", padding: "12px 16px", marginBottom: "14px",
          display: "flex", alignItems: "center", gap: "10px", color: "#854d0e",
          fontSize: "0.875rem",
        }}>
          <Landmark size={18} style={{ flexShrink: 0 }} />
          <span>{t("closed_via_bank_unmapping")}</span>
        </div>
      )}

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
                <span className="label">{t("customer_id")}</span>
                <h3 className="customer-id">{pledge.customer_id}</h3>
              </div>
              <div>
                <span className="label">{t("name")}</span>
                <h2 className="customer-name">{pledge.customer_name}</h2>
                <div className="relation-row">
                  <User size={16} />
                  <span>{pledge.relation || t("self")}</span>
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="phone-section">
                <Phone size={16} />
                <span>{pledge.phone}</span>
              </div>
              <div className="address-section">
                <span className="label">{t("address")} : </span>
                <span>{pledge.address || "No Address"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="loan-section">
          <h3 className="loan-title">{t("loan_info")}</h3>
          <div className="loan-grid">
            <div>
              <span className="label">Original Principal</span>
              <h2 className="amount-blue">₹{originalPrincipal.toLocaleString()}</h2>
            </div>
            <div>
              <span className="label">Interest Rate</span>
              <h3>{pledge.interest_rate}% {t("per_month")}</h3>
            </div>
            <div>
              <Calendar size={16} />
              <span className="label">{t("pledge_date")}</span>
              <h3>{formatDateIST(pledge.created_at)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: "#f8fafc", border: "1px solid #e2e8f0",
        borderRadius: "12px", padding: "16px 20px", margin: "14px 0",
      }}>
        <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "#374151", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <IndianRupee size={16} /> {t("settlement_summary")}
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
              {t("closed_on")}
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "800", color: "#15803d" }}>
              {closureDate}
            </div>
          </div>
        </div>
      </div>

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
          <Receipt size={16} /> {t("payment_history")} ({payments.length} {t("transactions")})
        </div>

        {payments.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
            {t("no_payment_records")}
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
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    background: colors.bg, border: `1px solid ${colors.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px", flexShrink: 0,
                  }}>
                    {paymentTypeIcon(payment.payment_type)}
                  </div>
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
                      {formatDateIST(payment.paid_at || payment.date || payment.created_at)}
                      {payment.receipt_no && (
                        <span style={{ marginLeft: "10px", color: "#94a3b8" }}>
                          Receipt: {payment.receipt_no}
                        </span>
                      )}
                      {payment.transaction_ref && payment.payment_mode !== "CASH" && (
                        <span style={{ marginLeft: "10px", color: "#6366f1", fontFamily: "monospace", fontSize: "0.75rem" }}>
                          Ref: {payment.transaction_ref}
                        </span>
                      )}
                    </div>
                  </div>
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
  const { t } = useLanguage();

  // ── ALL hooks must be declared here, before any early returns ──────────────
  const [details, setDetails]         = useState(null);
  const [paymentType, setPaymentType] = useState("INTEREST");
  const [printData, setPrintData]     = useState(null);
  const [shopSettings, setShopSettings] = useState(null);
  const [paymentModes, setPaymentModes] = useState([
    { method: "CASH", amount: 0, reference: "", denominations: emptyDenominations() },
  ]);

  // Fetch pledge details whenever pledgeId changes
  useEffect(() => {
    if (!pledgeId) return;
    invoke("get_single_pledge_cmd", { pledgeId: Number(pledgeId) })
      .then(setDetails)
      .catch((err) => console.error("Failed to load pledge:", err));
  }, [pledgeId]);

  // Fetch shop settings once on mount
  useEffect(() => {
    invoke("get_shop_settings").then(setShopSettings).catch(console.error);
  }, []);

  // ── Early return AFTER all hooks ───────────────────────────────────────────
  if (!details || !details.pledge) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "#94a3b8" }}>
        Loading Pledge Details
      </div>
    );
  }

  const pledge    = details.pledge;
  const payments  = details.payments || [];
  const isClosed     = pledge.status === "CLOSED";
  const isBankMapped = pledge.is_bank_mapped === true;

  if (isClosed) {
    return <ClosedPledgeView pledge={pledge} payments={payments} onChangePledge={onChangePledge} />;
  }

  const principal       = pledge.principal_amount;
  const pendingInterest = details.interest_pending ?? 0;
  const totalCollected  = paymentModes.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  let paymentDue = 0;
  if (paymentType === "INTEREST") paymentDue = pendingInterest;
  else paymentDue = principal + pendingInterest;

  const balance = paymentDue - totalCollected;

  const hasCashMismatch = paymentModes.some((mode) => {
    if (mode.method !== "CASH") return false;
    return calcDenomTotal(mode.denominations) !== mode.amount;
  });

  const updateMode = (index, field, value) => {
    const updated = [...paymentModes];
    updated[index] = { ...updated[index], [field]: value };
    setPaymentModes(updated);
  };

  const makeDenomSetter = (index) => (updater) => {
    const updated = [...paymentModes];
    updated[index] = {
      ...updated[index],
      denominations:
        typeof updater === "function"
          ? updater(updated[index].denominations)
          : updater,
    };
    setPaymentModes(updated);
  };

  async function handleProcessPayment() {
    try {
      await invoke("add_pledge_payment_cmd", {
        req: {
          pledge_id:     Number(pledgeId),
          payment_type:
            paymentType === "FULL"       ? "CLOSURE"
            : paymentType === "INTEREST" ? "INTEREST"
            : "PRINCIPAL",
          payment_mode:  paymentModes[0].method,
          amount:        Number(totalCollected),
          created_by:    1,
          reference:     paymentModes[0].method !== "CASH" ? paymentModes[0].reference || null : null,
          // Rust HashMap<i32,i32> needs JSON object keys as strings e.g. {"500":2,"100":3}
          denominations: paymentModes[0].method === "CASH"
            ? denomsToStringKeys(paymentModes[0].denominations)
            : null,
        },
      });

      // Refresh pledge data
      const updated = await invoke("get_single_pledge_cmd", { pledgeId: Number(pledgeId) });
      setDetails(updated);

      // Build print payload
      const latestPayment = updated?.payments?.[0];
      const resolvedPaymentType =
        paymentType === "FULL"       ? "CLOSURE"
        : paymentType === "INTEREST" ? "INTEREST"
        : "PRINCIPAL";

      setPrintData({
        receiptNo:          latestPayment?.receipt_no || "N/A",
        pledgeNo:           pledge.pledge_no,
        paymentType:        resolvedPaymentType,
        paymentMode:        paymentModes[0].method,
        amount:             Number(totalCollected),
        reference:          paymentModes[0].method !== "CASH" ? paymentModes[0].reference : null,
        pledge: {
          pledge_no:        pledge.pledge_no,
          loan_type:        pledge.loan_type,
          scheme_name:      pledge.scheme_name,
          interest_rate:    pledge.interest_rate,
          principal_amount: pledge.principal_amount,
          created_at:       pledge.created_at,
          duration_months:  pledge.duration_months,
          customer_name:    pledge.customer_name,
          customer_code:    pledge.customer_code,
          phone:            pledge.phone,
          address:          pledge.address,
          photo_path:       pledge.photo_path,
          relation_type:    pledge.relation_type,
          relation_name:    pledge.relation_name,
        },
        pendingInterest:    updated?.interest_pending ?? 0,
        remainingPrincipal: updated?.pledge?.principal_amount ?? 0,
      });

      // Reset form
      setPaymentModes([
        { method: "CASH", amount: 0, reference: "", denominations: emptyDenominations() },
      ]);
    } catch (error) {
      console.error("Payment error:", error);
      await message(String(error), { title: "Payment Failed", kind: "error" });
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
            <strong style={{ display: "block", marginBottom: "4px" }}>{t("bank_mapped_pledge")}</strong>
            <span style={{ fontSize: "14px" }}>
              {t("bank_mapped_warning")}
              <strong> {t("bank_mapping")} </strong>
              {t("page_to_unmap_close")}
            </span>
          </div>
        </div>
      )}

      <div className="pledge-header">
        <div className="header-left">
          <h2>{pledge.pledge_no}</h2>
          <span>{t("selected_pledge_details")}</span>
        </div>
        <button className="btn-change" onClick={onChangePledge}>{t("change")}</button>
      </div>

      {/* Customer Card */}
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
                <span className="label">{t("customer_id")}</span>
                <h3 className="customer-id">{pledge.customer_code}</h3>
              </div>
              <div>
                <span className="label">{t("name")}</span>
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
                <span className="label">{t("address")} : </span>
                <span>{pledge.address || "No Address"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="loan-section">
          <h3 className="loan-title">{t("loan_info")}</h3>
          <div className="loan-grid">
            <div>
              <span className="label">{t("principal_amount")}</span>
              <h2 className="amount-blue">₹{pledge.principal_amount.toLocaleString()}</h2>
            </div>
            <div>
              <span className="label">{t("interest_rate")}</span>
              <h3>{pledge.interest_rate}% {t("per_month")}</h3>
            </div>
            <div>
              <Calendar size={18} />
              <span className="label">{t("pledge_date")}</span>
              <h3>{formatDateIST(pledge.created_at)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Interest */}
      <div className="pending-box">
        <div>
          <p>{t("pending_interest")}</p>
          <small>{t("calculated_till_today")}</small>
        </div>
        <h2>₹{pendingInterest.toLocaleString()}</h2>
      </div>

      {/* Payment Type */}
      <div className="payment-details-wrapper">
        <div className="payment-header"><h3>{t("payment_details")}</h3></div>
        <div className="payment-body">
          <h4 className="payment-subtitle">{t("payment_type")}</h4>
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
              <h4>{t("interest_payment")}</h4>
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
              <h4>{t("partial_payment")}</h4>
              <span>{t("custom_amount")}</span>
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
              <h4>{t("full_settlement")}</h4>
              {isBankMapped ? (
                <span style={{ color: "#f97316", fontSize: "12px" }}>{t("use_bank_unmapping")}</span>
              ) : (
                <span>₹{(pledge.principal_amount + pendingInterest).toLocaleString()}</span>
              )}
            </div>
          </div>

          <div className="total-box">
            <div><h4>{t("total_payment_amount")}</h4></div>
            <div className="total-amount">₹{paymentDue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Payment Collection */}
      <div className="collection-wrapper">
        <div className="collection-header"><h3>{t("payment_collection")}</h3></div>
        <div className="collection-body">
          {paymentModes.map((mode, index) => {
            const denomTotal = calcDenomTotal(mode.denominations);
            const difference = mode.amount - denomTotal;

            return (
              <div key={index} className="payment-mode-card">
                <div className="payment-mode-layout">
                  <div className="payment-left">
                    <div className="form-group-modern">
                      <label className="modern-label">{t("payment_method")}</label>
                      <select
                        className="modern-select"
                        value={mode.method}
                        onChange={(e) => updateMode(index, "method", e.target.value)}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK">Bank</option>
                      </select>
                    </div>

                    <div className="form-group-modern">
                      <label className="modern-label">{t("amount")} (₹)</label>
                      <input
                        type="number"
                        className="modern-input"
                        value={mode.amount}
                        onChange={(e) => updateMode(index, "amount", Number(e.target.value) || 0)}
                      />
                      {mode.method === "CASH" && (
                        <div className="cash-amount-status">
                          <div className="cash-counted">
                            {t("cash_counted")}: ₹{denomTotal.toLocaleString()}
                          </div>
                          {difference !== 0 && (
                            <div className="cash-mismatch">
                              ⚠ {t("difference")}: ₹{Math.abs(difference).toLocaleString()}
                            </div>
                          )}
                          {difference === 0 && mode.amount > 0 && (
                            <div className="cash-match">{t("cash_matches_entered_amount")}</div>
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
                          onChange={(e) => updateMode(index, "reference", e.target.value)}
                        />
                      </div>
                    )}
                    {mode.method === "CASH" && (
                      <CashDenominationInput
                        data={mode.denominations}
                        setData={makeDenomSetter(index)}
                        title={t("cash_denominations")}
                      />
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
                denominations: emptyDenominations(),
              }])
            }
          >
            + {t("add_another_payment_mode")}
          </div>

          <div className="collection-summary">
            <div className="summary-row">
              <span>{t("payment_due")}:</span>
              <strong>₹{paymentDue.toLocaleString()}</strong>
            </div>
            <div className="summary-row">
              <span>{t("amount_collected")}:</span>
              <strong className="green">₹{totalCollected.toLocaleString()}</strong>
            </div>
            <hr />
            <div className="summary-row balance">
              <span>{t("balance")}:</span>
              <strong className={balance > 0 ? "red" : "green"}>
                ₹{balance.toLocaleString()}
              </strong>
            </div>
            {paymentType === "PARTIAL" && (
              <div className="partial-note">{t("partial_payment_note")}</div>
            )}
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn-cancel" onClick={onChangePledge}>{t("cancel")}</button>
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

      {printData && (
        <PaymentPrintModal
          data={printData}
          shopSettings={shopSettings}
          onClose={() => setPrintData(null)}
        />
      )}
    </div>
  );
}