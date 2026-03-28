import { useEffect, useState, useCallback } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import "./singlepledgepage.css";
import { useLanguage } from "../context/LanguageContext";
import PaymentPrintModal from "../components/paymentPrint/PaymentPrintModal";

export default function SinglePledgePage({ pledgeId,source, setActiveMenu }) {
  const [data, setData] = useState(null);
  // const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reprintData, setReprintData] = useState(null);   // ← reprint state
  const [shopSettings, setShopSettings] = useState(null); // ← shop settings
  const { t } = useLanguage();
  // ✅ Reusable fetch function (PRODUCTION STYLE)
  const fetchData = useCallback(async () => {
    if (!pledgeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await invoke("get_single_pledge_cmd", {
        pledgeId: Number(pledgeId),
      });

      setData(response);
    } catch (err) {
      console.error("Failed to fetch pledge:", err);
    } finally {
      setLoading(false);
    }
  }, [pledgeId]);

  // ✅ Load when component mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]);
// ── Fetch shop settings once ────────────────────────────────────────────────
useEffect(() => {
  invoke("get_shop_settings").then(setShopSettings).catch(console.error);
}, []);

// ── Reprint handler ─────────────────────────────────────────────────────────
// Builds the same data shape that PaymentPrintModal expects, then marks it
// as a duplicate so the modal shows "DUPLICATE COPY" watermark.
function handleReprintPayment(payment) {
  if (!data) return;
  const { pledge } = data;

  setReprintData({
    receiptNo:   payment.receipt_no || "N/A",
    pledgeNo:    pledge.pledge_no,
    paymentType: payment.payment_type,   // "INTEREST" | "PRINCIPAL" | "CLOSURE"
    paymentMode: payment.mode,
    amount:      payment.amount,
    reference:   null,                   // not stored per-row; omit on reprint
    isReprint:   true,                   // ← tells modal to show DUPLICATE banner
    pledge: {
      pledge_no:        pledge.pledge_no,
      loan_type:        pledge.loan_type,
      scheme_name:      pledge.scheme_name,
      interest_rate:    pledge.interest_rate,
      principal_amount: data.original_principal || pledge.principal_amount,
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
    // For reprints we don't show live balances — pass null so modal skips them
    pendingInterest:    null,
    remainingPrincipal: null,
  });
}
  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-box">
          <div className="spinner"></div>
          <p>Loading pledge details...</p>
        </div>
      </div>
    );
  }
  if (!data) return <div className="loading">No Data Found</div>;

  // 1️⃣ EXTRACT `original_principal` FROM BACKEND DATA
  const {
    pledge,
    items,
    payments,
    months_elapsed,
    interest_accrued,
    interest_received,
    interest_pending,
    original_principal,
  } = data;

  // Setup fallback just in case
  const originalAmount = original_principal || pledge.principal_amount;

  // ---------- DATE CALCULATIONS (Unified) ----------

  const createdDate = new Date(pledge.created_at);
  const today = new Date();

  // Format creation date
  const formattedCreatedDate = createdDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Due date (based on full duration)
  const dueDate = new Date(createdDate);
  dueDate.setMonth(dueDate.getMonth() + pledge.duration_months);

  const formattedDueDate = dueDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Days since pledge created
  const daysSinceCreated = Math.floor(
    (today - createdDate) / (1000 * 60 * 60 * 24)
  );

  // ---------- STATUS CALCULATIONS ----------

  // Days elapsed
  const daysElapsed = daysSinceCreated;

  // Sort payments (latest first)
  const sortedPayments = [...(payments || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Last payment date
  const lastPaymentDate =
    sortedPayments.length > 0 ? new Date(sortedPayments[0].date) : createdDate;

  // Next due date (1 month after last payment)
  const nextDueDate = new Date(lastPaymentDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  const formattedNextDueDate = nextDueDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Overdue check
  const isOverdue = today > nextDueDate;

  // ----------- ALERT STATUS LOGIC -------------

  let alertTitle = "";
  let alertMessage = "";
  let alertIcon = "🕒";

  // If pledge is closed
  if (pledge.status === "CLOSED") {
    alertTitle = "Pledge Closed";
    alertMessage = "This pledge has been closed successfully.";
    alertIcon = "✅";
  }

  // If overdue
  else if (isOverdue) {
    const overdueDays = Math.floor(
      (today - nextDueDate) / (1000 * 60 * 60 * 24)
    );

    alertTitle = "Payment Overdue";
    alertMessage = `Interest payment overdue by ${overdueDays} days (Due on ${formattedNextDueDate})`;
    alertIcon = "❌";
  }

  // Due within 7 days
  else if ((nextDueDate - today) / (1000 * 60 * 60 * 24) <= 7) {
    alertTitle = "Payment Due Soon";
    alertMessage = `Next interest payment is due on ${formattedNextDueDate}`;
    alertIcon = "⚠️";
  }

  // Normal
  else {
    alertTitle = "Active Loan";
    alertMessage = `Next interest payment due on ${formattedNextDueDate}`;
  }

  // ✅ Safe image conversion
  const photoUrl =
    pledge?.photo_path && pledge.photo_path.trim() !== ""
      ? convertFileSrc(pledge.photo_path)
      : null;
// ── Payment type display helpers ────────────────────────────────────────────
function paymentTypeDisplay(type) {
  if (type === "INTEREST")  return { label: t("interest_payment"),  color: "#16a34a", bg: "#f0fdf4", border: "#86efac" };
  if (type === "PRINCIPAL") return { label: t("principal_payment"), color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" };
  if (type === "CLOSURE")   return { label: t("closure_payment"),   color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" };
  return                           { label: type,                    color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" };
}

  return (
    <div className="single-pledge-container">
      <header className="page-header">
        {/* Row 1: Back Link */}
        <div className="back-nav">
          <button
            className="back-btn"
            onClick={() => setActiveMenu(source || "viewpledges")}
          >
           ← {t("back_to")} {source.replace("-", " ")}
          </button>
        </div>

        {/* Row 2: ID, Status, and Print Button */}
        <div className="header-main-row">
          <div className="header-left">
            <div className="id-group">
              <h1>{pledge.pledge_no}</h1>

              <span
                className={`status-badge ${
                  pledge.status === "CLOSED" ? "closed" : "active"
                }`}
              >
                {pledge.status}
              </span>
            </div>

            <div className="header-meta">
            {t("created_on")} {formattedCreatedDate} • {t("due_on")} {formattedDueDate}
              <span style={{ marginLeft: "10px", color: "#888" }}>
              ({daysSinceCreated} {t("days_ago")})
              </span>
            </div>
          </div>

          <button className="print-btn">
            <span className="print-icon">⎙</span> Print
          </button>
        </div>
      </header>

      <main className="content-layout">
        {/* LEFT COLUMN */}
        <div className="main-column">
          <section className="info-card">
          <h3 className="card-title">👤 {t("customer_information")}</h3>

            <div className="customer-card-body">
              {/* LEFT: PHOTO (Fixed Width) */}
              <div className="customer-photo-container">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Customer"
                    className="customer-photo-rect"
                  />
                ) : (
                  <div className="photo-placeholder">
                    <span className="placeholder-label">Customer</span>
                    <div className="placeholder-icon-box">?</div>
                  </div>
                )}
              </div>

              {/* RIGHT: ALL TEXT (Flexible but with min-width) */}
              <div className="info-text-wrapper">
                <div className="info-row three-cols">
                  <div className="field">
                    <span>{t("customer_id")}</span>
                    <p>{pledge.customer_code}</p>
                  </div>
                  <div className="field">
                    <span>{t("full_name")}</span>
                    <p>{pledge.customer_name}</p>
                  </div>
                  <div className="field">
  <span>{t("relation")}</span>
  <p>
    {pledge.relation_type && pledge.relation_name
      ? `${pledge.relation_type} ${pledge.relation_name}`
      : "Self"}
  </p>
</div>
                </div>

                <div className="divider-line"></div>

                <div className="info-row">
                  <div className="field">
                    <span>{t("phone_number")}</span>
                    <div className="value-with-icon">
                      <span className="icon-muted">📞</span>
                      <p>{pledge.phone}</p>
                    </div>
                  </div>
                  <div className="field">
                    <span>{t("address")}</span>
                    <div className="value-with-icon">
                      <span className="icon-muted">📍</span>
                      <p>{pledge.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="info-card">
          <h3>📄 {t("loan_details")}</h3>
            <div className="info-grid four-cols">
              <div className="field">
                <span>{t("loan_type")}</span>
                <p>{pledge.loan_type}</p>
              </div>
              <div className="field">
                <span>{t("scheme")}</span>
                <p>{pledge.scheme_name}</p>
              </div>
              <div className="field">
                <span>{t("interest_rate")}</span>
                <p>{pledge.interest_rate}%</p>
              </div>
              <div className="field">
                <span>{t("duration")}</span>
                <p>{pledge.duration_months} months</p>
              </div>
              <div className="divider-line"></div>

              {/* 3️⃣ SHOW ORIGINAL AMOUNT + REMAINING IF PARTIALLY PAID */}
              <div className="field">
                <span>{t("principal_amount")}</span>
                <p className="bold">₹{originalAmount.toLocaleString()}</p>
                {originalAmount > pledge.principal_amount && (
                  <span
                    style={{
                      color: "#e11d48",
                      fontSize: "12px",
                      fontWeight: "600",
                      marginTop: "2px",
                      display: "block",
                    }}
                  >
                    {t("remaining")} ₹{pledge.principal_amount.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="field">
                <span>{t("price_per_gram")}</span>
                <p>₹{pledge.price_per_gram}</p>
              </div>
            </div>
          </section>

          <section className="info-card">
          <h3>💍 {t("pledged_items")}</h3>
            <table className="items-table">
              <thead>
                <tr>
                <th>#</th>
<th>{t("item_type")}</th>
<th>{t("purity")}</th>
<th>{t("gross_weight")}</th>
<th>{t("net_weight")}</th>
<th>{t("value")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{item.jewellery_type}</td>
                    <td>
                      <span className="purity-tag">{item.purity}</span>
                    </td>
                    <td>{item.gross_weight}g</td>
                    <td>{item.net_weight}g</td>
                    <td className="bold">₹{item.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-summary-footer">
                <tr>
                  <td colSpan="3" className="total-label">
                  {t("total_value")}
                  </td>
                  <td className="total-value">{pledge.total_gross_weight} g</td>
                  <td className="total-value">{pledge.total_net_weight} g</td>
                  <td className="total-amount-highlight">
                    ₹{pledge.total_value?.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>
          <section className="info-card">
          <h3 className="card-title">💳 {t("payment_history")}</h3>

            <div className="table-container">
              <table className="history-table">
                <thead>
                  <tr>
                  <th>{t("date")}</th>
<th>{t("payment_type")}</th>
<th>{t("mode")}</th>
<th>{t("receipt_no")}</th>
<th>{t("amount")}</th>
<th>{t("status")}</th>
<th style={{ textAlign: "center" }}>Reprint</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments && data.payments.length > 0 ? (
                    data.payments.map((payment, index) => (
                      <tr key={index}>
                        <td>{payment.date?.slice(0, 10)}</td>

                        <td>
                          {payment.payment_type === "INTEREST"
                            ? t("interest_payment")
                            : payment.payment_type === "PRINCIPAL"
                            ? t("principal_payment")
                            : t("closure_payment")}
                        </td>

                        <td>
                          <span className="mode-badge">{payment.mode}</span>
                        </td>

                        <td className="receipt-no">
                          {payment.receipt_no || "-"}
                        </td>

                        <td className="payment-amount">
                          ₹{Number(payment.amount).toLocaleString()}
                        </td>

                        <td>
                          <span
                            className={`status-pill ${
                              payment.status === "COMPLETED"
                                ? "completed"
                                : "reversed"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        {/* ── Reprint button ── */}
                        <td style={{ textAlign: "center" }}>
                            <button
                              onClick={() => handleReprintPayment(payment)}
                              title="Reprint this receipt"
                              style={{
                                background: "none",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                cursor: "pointer",
                                padding: "5px 9px",
                                fontSize: "15px",
                                color: "#64748b",
                                transition: "all 0.15s",
                                lineHeight: 1,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f0f9ff";
                                e.currentTarget.style.borderColor = "#7dd3fc";
                                e.currentTarget.style.color = "#0369a1";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "none";
                                e.currentTarget.style.borderColor = "#e2e8f0";
                                e.currentTarget.style.color = "#64748b";
                              }}
                            >
                              🖨️
                            </button>
                          </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "#888",
                        }}
                      >
                        {t("no_payments_recorded")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="sidebar-column">
          {/* Current Status Card */}
          <div className="side-card status-card">
            <div className="card-header-row">
              <span className="icon-orange">🕒</span>
              <h4 className="status-title">{t("current_status")}</h4>
            </div>
            <div className="side-row">
              <span>{t("days_elapsed")}</span>
              <span className="bold-val">{daysElapsed} days</span>
            </div>

            <div className="side-row">
              <span>{t("next_due_date")}</span>
              <span
                className="due-date-val"
                style={{ color: isOverdue ? "#dc2626" : undefined }}
              >
                {formattedNextDueDate}
              </span>
            </div>

            {sortedPayments.length > 0 && (
              <div className="side-row">
                <span>{t("last_payment")}</span>
                <span>
                  {new Date(sortedPayments[0].date).toLocaleDateString("en-IN")}
                </span>
              </div>
            )}
          </div>

          {/* Amount Summary Card */}

          <div className="side-card amount-summary-card-old">
          <h4 className="summary-title">{t("account_summary")}</h4>

            <div className="summary-row">
            <span>{t("item_value")}</span>
              <span>₹{pledge.total_value?.toLocaleString()}</span>
            </div>

            <div className="divider-line"></div>

            {/* 3️⃣ UPDATED SIDEBAR ORIGINAL PRINCIPAL VIEW */}
            <div className="summary-row">
            <span>{t("original_loan")}</span>
              <span>₹{originalAmount.toLocaleString()}</span>
            </div>

            {originalAmount > pledge.principal_amount && (
              <div className="summary-row danger">
                <span>{t("remaining_principal")}</span>
                <span>₹{pledge.principal_amount.toLocaleString()}</span>
              </div>
            )}

            <div className="summary-row">
              <span>{t("accrued_interest")} ({months_elapsed} months)</span>
              <span>₹{Number(interest_accrued || 0).toLocaleString()}</span>
            </div>

            <div className="summary-row success">
              <span>{t("interest_paid")}</span>
              <span>₹{Number(interest_received || 0).toLocaleString()}</span>
            </div>

            <div className="summary-row danger">
              <span>{t("interest_balance")}</span>
              <span>₹{Number(interest_pending || 0).toLocaleString()}</span>
            </div>

            <div className="divider-line"></div>

            <div className="summary-row total-highlight">
              <span>{t("to_close_today")}</span>
              <span>
                ₹
                {Number(
                  pledge.principal_amount + (interest_pending || 0)
                ).toLocaleString()}
              </span>
            </div>

            <div className="divider-line"></div>

            <div className="summary-row small">
              <span>{t("days_since_pledge")}</span>
              <span>{daysElapsed} days</span>
            </div>

            <div className="summary-row small">
              <span>{t("next_interest_due")}</span>
              <span>{formattedNextDueDate}</span>
            </div>

            <div className="summary-row small">
              <span>{t("payments_count")}</span>
              <span>{data.payments?.length || 0}</span>
            </div>

            <div className="summary-row small">
              <span>{t("last_payment")}</span>
              <span>
                {sortedPayments.length > 0
                  ? new Date(sortedPayments[0].date).toLocaleDateString("en-IN")
                  : "-"}
              </span>
            </div>
          </div>

          {/* Payment Due Alert */}
          <div className="due-alert-box">
            <span className="alert-icon">{alertIcon}</span>
            <div className="alert-content">
              <p className="alert-title">{alertTitle}</p>
              <p className="alert-sub">{alertMessage}</p>
            </div>
          </div>

          {/* Actions Card */}
          <div className="side-card actions-card">
          <h4>{t("actions")}</h4>
            <button
              className="payment-btn"
              disabled={pledge.status === "CLOSED"}
              onClick={() => setActiveMenu(`payments-${pledgeId}`)}
            >
              <span>💳</span> {t("make_payment")}
            </button>

            <div className="owner-only-group">
            <button className="repledge-btn" disabled={pledge.status === "CLOSED"} 
            onClick={() => setActiveMenu(`repledge-${pledgeId}`)} >
                🔄 {t("repledge")} </button>
              <button className="action-btn-secondary" disabled>
                <span className="btn-main-danger">📄 {t("close_pledge")}</span>
              </button>
            </div>
          </div>
        </aside>
      </main>

      {reprintData && (
        <PaymentPrintModal
          data={reprintData}
          shopSettings={shopSettings}
          onClose={() => setReprintData(null)}
        />
      )}
 
    </div>
  );
}
