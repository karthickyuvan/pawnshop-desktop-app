import { useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useLanguage } from "../../context/LanguageContext"; 
import "./PaymentPrintModal.css";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

function formatTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function getCurrentDateTime() {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function getPaymentTypeLabel(type, t) {
  if (type === "INTEREST")  return t("interest_payment_lbl", "Interest Payment");
  if (type === "PRINCIPAL") return t("part_payment_lbl", "Principal / Partial Payment");
  if (type === "CLOSURE")   return t("full_settlement_lbl", "Full Settlement / Closure");
  return type;
}

function getPaymentTypeBadge(type, t) {
  if (type === "INTEREST")  return { label: t("interest_caps", "INTEREST"),     bg: "#f0fdf4", color: "#16a34a", border: "#86efac" };
  if (type === "PRINCIPAL") return { label: t("part_payment_caps", "PART PAYMENT"), bg: "#eff6ff", color: "#2563eb", border: "#93c5fd" };
  if (type === "CLOSURE")   return { label: t("closure_caps", "CLOSURE"),      bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" };
  return                           { label: type,            bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ReceiptHeader({ shopSettings, shopLogo, t }) {
  return (
    <div className="ppm-header">
      {shopLogo && (
        <div className="ppm-logo-box">
          <img src={shopLogo} alt="Logo" className="ppm-logo" />
        </div>
      )}
      <div className="ppm-shop-info">
        <h1 className="ppm-shop-name">{shopSettings?.shop_name || t("pawn_shop", "Pawn Shop")}</h1>
        <p className="ppm-shop-address">{shopSettings?.address || ""}</p>
        <p className="ppm-shop-contact">
          {shopSettings?.phone ? `📞 ${shopSettings.phone}` : ""}
          {shopSettings?.email ? ` | ✉ ${shopSettings.email}` : ""}
        </p>
        {shopSettings?.license_number && (
          <p className="ppm-license">{t("license_no_lbl", "License No")}: {shopSettings.license_number}</p>
        )}
      </div>
    </div>
  );
}

function ReceiptMeta({ copyLabel, receiptNo, isReprint, t }) {
  return (
    <div className="ppm-meta-row">
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div className="ppm-copy-badge">{copyLabel}</div>
        {isReprint && (
          <div style={{
            fontSize: "0.68rem", fontWeight: "800", letterSpacing: "0.06em",
            padding: "3px 10px", borderRadius: "4px",
            background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5",
          }}>
            {t("duplicate_copy_caps", "DUPLICATE COPY")}
          </div>
        )}
      </div>
      <div className="ppm-receipt-info">
        <span className="ppm-receipt-no">{t("receipt_lbl", "Receipt")}: {receiptNo || "N/A"}</span>
        <span className="ppm-receipt-date">{getCurrentDateTime()} · {formatTime()}</span>
      </div>
    </div>
  );
}

function PaymentTypeBanner({ paymentType, t }) {
  const badge = getPaymentTypeBadge(paymentType, t);
  return (
    <div
      className="ppm-type-banner"
      style={{ background: badge.bg, border: `1.5px solid ${badge.border}`, color: badge.color }}
    >
      <span className="ppm-type-icon">
        {paymentType === "CLOSURE" ? "🔒" : paymentType === "INTEREST" ? "📅" : "💳"}
      </span>
      <div>
        <div className="ppm-type-label">{getPaymentTypeLabel(paymentType, t)}</div>
        {paymentType === "CLOSURE" && (
          <div className="ppm-type-sub" style={{ color: badge.color }}>
            {t("pledge_fully_closed_msg", "Pledge fully settled & closed")}
          </div>
        )}
      </div>
      <div className="ppm-type-badge" style={{ background: badge.color, color: "#fff" }}>
        {badge.label}
      </div>
    </div>
  );
}

function CustomerSection({ pledge, t }) {
  return (
    <div className="ppm-customer-section">
      <div className="ppm-customer-photo">
        {pledge?.photo_path ? (
          <img src={convertFileSrc(pledge.photo_path)} alt="Customer" />
        ) : (
          <div className="ppm-photo-placeholder">
            {pledge?.customer_name?.charAt(0) || "?"}
          </div>
        )}
      </div>
      <div className="ppm-customer-details">
        <div className="ppm-customer-name">{pledge?.customer_name}</div>
        <div className="ppm-customer-meta">
          <span>{t("id", "ID")}: {pledge?.customer_code}</span>
          {pledge?.relation_type && pledge?.relation_name && (
            <span>{pledge.relation_type}: {pledge.relation_name}</span>
          )}
        </div>
        <div className="ppm-customer-contact">
          <span>📞 {pledge?.phone}</span>
          {pledge?.address && <span>📍 {pledge.address}</span>}
        </div>
      </div>
    </div>
  );
}

function LoanSection({ pledge, pledgeNo, t }) {
  return (
    <div className="ppm-loan-grid">
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">{t("pledge_no", "Pledge No")}</span>
        <span className="ppm-loan-value ppm-mono">{pledgeNo}</span>
      </div>
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">{t("loan_type", "Loan Type")}</span>
        <span className="ppm-loan-value">{pledge?.loan_type || "-"}</span>
      </div>
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">{t("scheme", "Scheme")}</span>
        <span className="ppm-loan-value">{pledge?.scheme_name || "-"}</span>
      </div>
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">{t("rate", "Interest Rate")}</span>
        <span className="ppm-loan-value">{pledge?.interest_rate}% / {t("month", "month")}</span>
      </div>
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">{t("amount", "Loan Amount")}</span>
        <span className="ppm-loan-value ppm-amount-blue">
          ₹{Number(pledge?.principal_amount || 0).toLocaleString("en-IN")}
        </span>
      </div>
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">{t("pledged_on_lbl", "Pledged On")}</span>
        <span className="ppm-loan-value">{formatDate(pledge?.created_at)}</span>
      </div>
    </div>
  );
}

function PaymentSection({ data, t }) {
  const isClosure  = data.paymentType === "CLOSURE";
  const isReprint  = data.isReprint === true;
  const showBalances = !isReprint && data.pendingInterest !== null && data.remainingPrincipal !== null;

  return (
    <div className="ppm-payment-box">
      <div className="ppm-payment-row ppm-payment-highlight">
        <span>{t("amount_paid_lbl", "Amount Paid")}</span>
        <span className="ppm-amount-paid">₹{Number(data.amount || 0).toLocaleString("en-IN")}</span>
      </div>
      <div className="ppm-payment-row">
        <span>{t("payment_method", "Payment Mode")}</span>
        <span className="ppm-mode-badge">{data.paymentMode === "CASH" ? t("cash") : data.paymentMode === "UPI" ? t("upi") : data.paymentMode === "BANK" ? t("bank") : data.paymentMode}</span>
      </div>
      {data.reference && data.paymentMode !== "CASH" && (
        <div className="ppm-payment-row">
          <span>{t("reference", "Reference No")}</span>
          <span className="ppm-mono ppm-ref">{data.reference}</span>
        </div>
      )}
      {showBalances && !isClosure && (
        <>
          <div className="ppm-payment-row ppm-divider-row">
            <span>{t("remaining_principal", "Remaining Principal")}</span>
            <span>₹{Number(data.remainingPrincipal || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="ppm-payment-row">
            <span>{t("pending_interest_after_payment_lbl", "Pending Interest (after payment)")}</span>
            <span>₹{Number(data.pendingInterest || 0).toLocaleString("en-IN")}</span>
          </div>
        </>
      )}
      {isClosure && (
        <div className="ppm-closure-note">
          ✅ {t("pledge_fully_closed_receipt_note", "This pledge is now fully closed. Items may be redeemed on production of this receipt.")}
        </div>
      )}
      {isReprint && (
        <div style={{
          padding: "10px 14px", fontSize: "0.75rem", color: "#b45309",
          background: "#fffbeb", borderTop: "1px solid #fde68a", fontWeight: "600",
        }}>
          ⚠️ {t("duplicate_copy_warning_note", "This is a duplicate copy of the original receipt.")}
        </div>
      )}
    </div>
  );
}

function Signatures({ t }) {
  return (
    <div className="ppm-signatures">
      <div className="ppm-sig-box">
        <div className="ppm-sig-line"></div>
        <p>{t("customer_signature_lbl", "Customer Signature")}</p>
      </div>
      <div className="ppm-sig-box">
        <div className="ppm-sig-line"></div>
        <p>{t("staff_signature_lbl", "Staff Signature")}</p>
      </div>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function PaymentPrintModal({ data, shopSettings, onClose }) {
  const { t } = useLanguage(); // ✅ Initialized translation hook here
  const printRef = useRef();

  useEffect(() => {
    setTimeout(() => window.print(), 500);
  }, []);

  const shopLogo = shopSettings?.logo_path
    ? convertFileSrc(shopSettings.logo_path)
    : null;

  const isClosure = data.paymentType === "CLOSURE";

  return (
    <div className="ppm-overlay">
      <div className="ppm-container">

        {/* Action bar — screen only */}
        <div className="ppm-action-bar no-print">
          <span>
            🧾 {t("payment_receipt_title", "Payment Receipt")} — {data.pledgeNo}
            {isClosure && <span className="ppm-closure-tag">{t("closure_caps", "CLOSURE")}</span>}
            {data.isReprint && <span className="ppm-closure-tag" style={{ background: "#92400e" }}>{t("duplicate_caps", "DUPLICATE")}</span>}
          </span>
          <div className="ppm-action-btns">
            <button className="ppm-btn-print" onClick={() => window.print()}>
              🖨️ {t("print", "Print")}
            </button>
            <button className="ppm-btn-close" onClick={onClose}>
              ✕ {t("close", "Close")}
            </button>
          </div>
        </div>

        {/* Print area */}
        <div ref={printRef} className="ppm-print-area">

          {/* ── CUSTOMER COPY ── */}
          <div className="ppm-section">
            <ReceiptHeader shopSettings={shopSettings} shopLogo={shopLogo} t={t} />
            <ReceiptMeta copyLabel={t("customer_copy_caps", "CUSTOMER COPY")} receiptNo={data.receiptNo} isReprint={data.isReprint} t={t} />
            <PaymentTypeBanner paymentType={data.paymentType} t={t} />
            <CustomerSection pledge={data.pledge} t={t} />
            <div className="ppm-section-divider" />
            <LoanSection pledge={data.pledge} pledgeNo={data.pledgeNo} t={t} />
            <div className="ppm-section-divider" />
            <PaymentSection data={data} t={t} />
            <Signatures t={t} />
            <div className="ppm-footer">
              ⚠️ {t("preserve_receipt_warning", "Please preserve this receipt as proof of payment.")}
            </div>
          </div>

          <div className="ppm-separator" />

          {/* ── STORE COPY ── */}
          <div className="ppm-section">
            <ReceiptHeader shopSettings={shopSettings} shopLogo={shopLogo} t={t} />
            <ReceiptMeta copyLabel={t("store_copy_caps", "STORE COPY")} receiptNo={data.receiptNo} isReprint={data.isReprint} t={t} />
            <PaymentTypeBanner paymentType={data.paymentType} t={t} />
            <CustomerSection pledge={data.pledge} t={t} />
            <div className="ppm-section-divider" />
            <LoanSection pledge={data.pledge} pledgeNo={data.pledgeNo} t={t} />
            <div className="ppm-section-divider" />
            <PaymentSection data={data} t={t} />
            <Signatures t={t} />
            <div className="ppm-footer ppm-footer-store">
              🏪 {t("store_copy_footer_msg", "Store Copy — For Internal Records")}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}