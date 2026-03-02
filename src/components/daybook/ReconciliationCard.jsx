import React from "react";

/**
 * ReconciliationCard
 * Displays the cash flow summary: Opening + In - Out = Closing
 */
export default function ReconciliationCard({ data }) {
  const { opening_balance, total_in, total_out, closing_balance, breakdown } = data;

  // Helper for Indian Currency Formatting
  const formatINR = (val) => 
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="reconciliation-card">
      <h3 className="card-header">Cash Reconciliation</h3>
      
      <div className="recon-item">
        <span className="label">Opening Balance</span>
        <span className="value">{formatINR(opening_balance)}</span>
      </div>

      <div className="recon-item text-green">
        <span className="label">Total Inflow (+)</span>
        <span className="value">{formatINR(total_in)}</span>
      </div>

      <div className="recon-item text-red">
        <span className="label">Total Outflow (-)</span>
        <span className="value">{formatINR(total_out)}</span>
      </div>

      <div className="divider" />

      <div className="recon-item closing-highlight">
        <span className="label">Expected Cash</span>
        <span className="value bold">{formatINR(closing_balance)}</span>
      </div>

      {/* Non-Cash Breakdown Section */}
      <div className="non-cash-section">
        <h4>Digital Balances</h4>
        <div className="sub-item">
          <span>UPI</span>
          <span>{formatINR(breakdown.upi)}</span>
        </div>
        <div className="sub-item">
          <span>Bank</span>
          <span>{formatINR(breakdown.bank)}</span>
        </div>
      </div>
    </div>
  );
}