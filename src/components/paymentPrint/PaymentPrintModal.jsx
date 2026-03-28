// src/components/paymentPrint/PaymentPrintModal.jsx

import { useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
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

function getPaymentTypeLabel(type) {
  if (type === "INTEREST")  return "Interest Payment";
  if (type === "PRINCIPAL") return "Principal / Partial Payment";
  if (type === "CLOSURE")   return "Full Settlement / Closure";
  return type;
}

function getPaymentTypeBadge(type) {
  if (type === "INTEREST")  return { label: "INTEREST",     bg: "#f0fdf4", color: "#16a34a", border: "#86efac" };
  if (type === "PRINCIPAL") return { label: "PART PAYMENT", bg: "#eff6ff", color: "#2563eb", border: "#93c5fd" };
  if (type === "CLOSURE")   return { label: "CLOSURE",      bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" };
  return                           { label: type,            bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
}

// ─── Sub-components — ALL defined OUTSIDE the modal function ─────────────────

function ReceiptHeader({ shopSettings, shopLogo }) {
  return (
    <div className="ppm-header">
      {shopLogo && (
        <div className="ppm-logo-box">
          <img src={shopLogo} alt="Logo" className="ppm-logo" />
        </div>
      )}
      <div className="ppm-shop-info">
        <h1 className="ppm-shop-name">{shopSettings?.shop_name || "Pawn Shop"}</h1>
        <p className="ppm-shop-address">{shopSettings?.address || ""}</p>
        <p className="ppm-shop-contact">
          {shopSettings?.phone ? `📞 ${shopSettings.phone}` : ""}
          {shopSettings?.email ? ` | ✉ ${shopSettings.email}` : ""}
        </p>
        {shopSettings?.license_number && (
          <p className="ppm-license">License No: {shopSettings.license_number}</p>
        )}
      </div>
    </div>
  );
}

function ReceiptMeta({ copyLabel, receiptNo, isReprint }) {
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
            DUPLICATE COPY
          </div>
        )}
      </div>
      <div className="ppm-receipt-info">
        <span className="ppm-receipt-no">Receipt: {receiptNo || "N/A"}</span>
        <span className="ppm-receipt-date">{getCurrentDateTime()} · {formatTime()}</span>
      </div>
    </div>
  );
}

function PaymentTypeBanner({ paymentType }) {
  const badge = getPaymentTypeBadge(paymentType);
  return (
    <div
      className="ppm-type-banner"
      style={{ background: badge.bg, border: `1.5px solid ${badge.border}`, color: badge.color }}
    >
      <span className="ppm-type-icon">
        {paymentType === "CLOSURE" ? "🔒" : paymentType === "INTEREST" ? "📅" : "💳"}
      </span>
      <div>
        <div className="ppm-type-label">{getPaymentTypeLabel(paymentType)}</div>
        {paymentType === "CLOSURE" && (
          <div className="ppm-type-sub" style={{ color: badge.color }}>
            Pledge fully settled &amp; closed
          </div>
        )}
      </div>
      <div className="ppm-type-badge" style={{ background: badge.color, color: "#fff" }}>
        {badge.label}
      </div>
    </div>
  );
}

function CustomerSection({ pledge }) {
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
          <span>ID: {pledge?.customer_code}</span>
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

function LoanSection({ pledge, pledgeNo }) {
  return (
    <div className="ppm-loan-grid">
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">Pledge No</span>
        <span className="ppm-loan-value ppm-mono">{pledgeNo}</span>
      </div>
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">Loan Type</span>
        <span className="ppm-loan-value">{pledge?.loan_type || "-"}</span>
      </div>
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">Scheme</span>
        <span className="ppm-loan-value">{pledge?.scheme_name || "-"}</span>
      </div>
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">Interest Rate</span>
        <span className="ppm-loan-value">{pledge?.interest_rate}% / month</span>
      </div>
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">Loan Amount</span>
        <span className="ppm-loan-value ppm-amount-blue">
          ₹{Number(pledge?.principal_amount || 0).toLocaleString()}
        </span>
      </div>
      <div className="ppm-loan-item">
        <span className="ppm-loan-label">Pledged On</span>
        <span className="ppm-loan-value">{formatDate(pledge?.created_at)}</span>
      </div>
    </div>
  );
}

function PaymentSection({ data }) {
  const isClosure  = data.paymentType === "CLOSURE";
  const isReprint  = data.isReprint === true;
  // On reprints pendingInterest / remainingPrincipal are null — skip those rows
  const showBalances = !isReprint && data.pendingInterest !== null && data.remainingPrincipal !== null;

  return (
    <div className="ppm-payment-box">
      <div className="ppm-payment-row ppm-payment-highlight">
        <span>Amount Paid</span>
        <span className="ppm-amount-paid">₹{Number(data.amount || 0).toLocaleString()}</span>
      </div>
      <div className="ppm-payment-row">
        <span>Payment Mode</span>
        <span className="ppm-mode-badge">{data.paymentMode}</span>
      </div>
      {data.reference && data.paymentMode !== "CASH" && (
        <div className="ppm-payment-row">
          <span>Reference No</span>
          <span className="ppm-mono ppm-ref">{data.reference}</span>
        </div>
      )}
      {showBalances && !isClosure && (
        <>
          <div className="ppm-payment-row ppm-divider-row">
            <span>Remaining Principal</span>
            <span>₹{Number(data.remainingPrincipal || 0).toLocaleString()}</span>
          </div>
          <div className="ppm-payment-row">
            <span>Pending Interest (after payment)</span>
            <span>₹{Number(data.pendingInterest || 0).toLocaleString()}</span>
          </div>
        </>
      )}
      {isClosure && (
        <div className="ppm-closure-note">
          ✅ This pledge is now fully closed. Items may be redeemed on production of this receipt.
        </div>
      )}
      {isReprint && (
        <div style={{
          padding: "10px 14px", fontSize: "0.75rem", color: "#b45309",
          background: "#fffbeb", borderTop: "1px solid #fde68a", fontWeight: "600",
        }}>
          ⚠️ This is a duplicate copy of the original receipt.
        </div>
      )}
    </div>
  );
}

function Signatures() {
  return (
    <div className="ppm-signatures">
      <div className="ppm-sig-box">
        <div className="ppm-sig-line"></div>
        <p>Customer Signature</p>
      </div>
      <div className="ppm-sig-box">
        <div className="ppm-sig-line"></div>
        <p>Staff Signature</p>
      </div>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function PaymentPrintModal({ data, shopSettings, onClose }) {
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
            🧾 Payment Receipt — {data.pledgeNo}
            {isClosure && <span className="ppm-closure-tag">CLOSURE</span>}
            {data.isReprint && <span className="ppm-closure-tag" style={{ background: "#92400e" }}>DUPLICATE</span>}
          </span>
          <div className="ppm-action-btns">
            <button className="ppm-btn-print" onClick={() => window.print()}>
              🖨️ Print
            </button>
            <button className="ppm-btn-close" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Print area */}
        <div ref={printRef} className="ppm-print-area">

          {/* ── CUSTOMER COPY ── */}
          <div className="ppm-section">
            <ReceiptHeader shopSettings={shopSettings} shopLogo={shopLogo} />
            <ReceiptMeta copyLabel="CUSTOMER COPY" receiptNo={data.receiptNo} isReprint={data.isReprint} />
            <PaymentTypeBanner paymentType={data.paymentType} />
            <CustomerSection pledge={data.pledge} />
            <div className="ppm-section-divider" />
            <LoanSection pledge={data.pledge} pledgeNo={data.pledgeNo} />
            <div className="ppm-section-divider" />
            <PaymentSection data={data} />
            <Signatures />
            <div className="ppm-footer">
              ⚠️ Please preserve this receipt as proof of payment.
            </div>
          </div>

          <div className="ppm-separator" />

          {/* ── STORE COPY ── */}
          <div className="ppm-section">
            <ReceiptHeader shopSettings={shopSettings} shopLogo={shopLogo} />
            <ReceiptMeta copyLabel="STORE COPY" receiptNo={data.receiptNo} isReprint={data.isReprint} />
            <PaymentTypeBanner paymentType={data.paymentType} />
            <CustomerSection pledge={data.pledge} />
            <div className="ppm-section-divider" />
            <LoanSection pledge={data.pledge} pledgeNo={data.pledgeNo} />
            <div className="ppm-section-divider" />
            <PaymentSection data={data} />
            <Signatures />
            <div className="ppm-footer ppm-footer-store">
              🏪 Store Copy — For Internal Records
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}