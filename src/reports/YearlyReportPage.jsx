// src/pages/YearlyReportPage.jsx

import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext"; 
import "./YearlyReportPage.css";

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

export default function YearlyReportPage() {
  const { t } = useLanguage(); 
  const currentYearStr = new Date().getFullYear().toString();

  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [rows, setRows] = useState([]);
  const [metals, setMetals] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── 🟢 Re-run report compilation whenever selectedYear changes ──
  useEffect(() => {
    loadReport();
  }, [selectedYear]);

  async function loadReport() {
    setLoading(true);
    try {
      // ── 🟢 Pass selectedYear as parameter to retrieve correct metal weights ──
      const result = await invoke("get_yearly_report_cmd", { year: selectedYear });
      setRows(result.rows || []);
      setMetals(result.metals || []);
      setAuctions(result.auctions || []);
    } catch (err) {
      console.error("Yearly corporate compile error:", err);
    }
    setLoading(false);
  }

  const formatCurrency = (amt) => {
    return `₹${(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const formatWeight = (grams) => {
    return `${Number(grams || 0).toFixed(2)} g`;
  };

  const activeYearData = rows.find((r) => r.year === selectedYear) || {
    total_pledges: 0,
    active_pockets: 0,
    closed_pockets: 0,
    auctioned_pockets: 0,
    total_loan_amount: 0,
    interest_income: 0,
    processing_fees: 0,
    other_income: 0,
    expenses: 0,
    auction_surplus_deficit: 0,
    net_profit: 0,
    bank_refinance_inflow: 0,
    bank_refinance_outflow: 0,
    bank_refinance_surplus: 0,
    investor_investments: 0,
    investor_withdrawals: 0,
    investor_interest_paid: 0,
    opening_balance: 0,
    closing_balance: 0,
    total_inflow: 0,
    total_outflow: 0,
    net_cash_flow: 0,
    loans_issued: 0,
    loan_repayments: 0,
    closure_collections: 0,
  };

  const activeYearAuction = auctions.find((a) => a.year === selectedYear) || {
    total_auctioned_pockets: 0,
    principal_recovered: 0,
    interest_recovered: 0,
    total_outstanding: 0,
    total_auction_sales: 0,
    auction_profit_loss: 0,
  };

  const totalRevenue = 
    activeYearData.interest_income + 
    activeYearData.processing_fees + 
    activeYearData.other_income + 
    activeYearData.auction_surplus_deficit;

  const isProfit = (totalRevenue - (activeYearData.expenses + activeYearData.investor_interest_paid)) >= 0;

  const currentYear = new Date().getFullYear();
  const baseYears = [];
  for (let y = 2023; y <= Math.max(currentYear + 2, 2030); y++) {
    baseYears.push(y.toString());
  }

  const standardYearsList = Array.from(new Set([
    ...baseYears,
    ...rows.map((r) => r.year)
  ])).sort().reverse();

  return (
    <div className="yearly-page animate-fade-in">
      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>{t("yearly_business_report")}</h2>
          <p>{t("yearly_business_report_desc")}</p>
        </div>
        <div className="report-controls">
          <label htmlFor="year-select">{t("select_accounting_period_lbl", "Select Accounting Period")}: </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="corporate-select"
          >
            {standardYearsList.map((y) => (
              <option key={y} value={y}>{t("year", "Year")} {y}</option>
            ))}
          </select>
          <button onClick={loadReport} className="corporate-refresh-btn">
            {t("syncing", "Sync Ledger")}
          </button>
        </div>
      </div>

      {loading && <p className="loading-text">{t("re-evaluating_statement_msg", "Re-evaluating Annual Asset Ledgers...")}</p>}

      {!loading && (
        <>
          {/* ── Stat Cards Grid (Reordered to the requested layout sequence) ── */}
          <div className="stats-grid">
            <StatCard icon="🗂" label={t("total_pockets_lbl", "Total Pockets")} value={activeYearData.total_pledges.toLocaleString()} color="card-blue" />
            <StatCard icon="🟢" label={t("active_pockets_lbl", "Active Pockets")} value={activeYearData.active_pockets.toLocaleString()} color="card-green" />
            <StatCard icon="🔒" label={t("closed_pockets_lbl", "Closed Pockets")} value={activeYearData.closed_pockets.toLocaleString()} color="card-slate" />
            <StatCard icon="🔨" label={t("auctioned_pockets_lbl", "Auctioned Pockets")} value={activeYearData.auctioned_pockets.toLocaleString()} color="card-orange" />
            
            <StatCard icon="🏦" label={t("opening_balance")} value={formatCurrency(activeYearData.opening_balance)} color="card-blue" />
            <StatCard icon="💎" label={t("capital_disbursed_lbl", "Capital Disbursed")} value={formatCurrency(activeYearData.total_loan_amount)} color="card-purple" />
            <StatCard icon="📅" label={t("todays_interest", "Total Interest Collected")} value={formatCurrency(activeYearData.interest_income)} color="card-teal" />
            <StatCard icon="🏷️" label={t("processing_fee", "Total Processing Fees")} value={formatCurrency(activeYearData.processing_fees)} color="card-purple" />
            <StatCard icon="📤" label={t("loans_issued_lbl", "Loans Issued")} value={formatCurrency(activeYearData.loans_issued)} color="card-rose" />
            <StatCard icon="📥" label={t("loan_repayments_lbl", "Loan Repayments")} value={formatCurrency(activeYearData.loan_repayments)} color="card-green" />
            <StatCard icon="💹" label={t("other_income_lbl", "Other Income")} value={formatCurrency(activeYearData.other_income)} color="card-yellow" />
            <StatCard icon="🧾" label={t("total_expense", "Total Expense")} value={formatCurrency(activeYearData.expenses)} color="card-orange" />
            
            <StatCard icon="📈" label={t("total_annual_revenue_lbl", "Total Inflow")} value={formatCurrency(activeYearData.total_inflow)} color="card-green" />
            <StatCard icon="📉" label={t("total_annual_outflow_lbl", "Total Outflow")} value={formatCurrency(activeYearData.total_outflow)} color="card-rose" />
            <StatCard icon="🏧" label={t("cash_in_hand")} value={formatCurrency(activeYearData.closing_balance)} color="card-blue" />
            
            {/* ── Separate metals, Gold & Silver items display ordered gross/net ── */}
            {metals.map((m) => {
              const metalLabel = m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal;
              return (
                <React.Fragment key={m.metal}>
                  <StatCard 
                    icon="📥" 
                    label={`${metalLabel} ${t("gross")} (+)`} 
                    value={formatWeight(m.pledged_gross_weight)} 
                    color="card-green" 
                  />
                  <StatCard 
                    icon="📥" 
                    label={`${metalLabel} ${t("net")} (+)`} 
                    value={formatWeight(m.pledged_net_weight)} 
                    color="card-teal" 
                  />
                  <StatCard 
                    icon="📤" 
                    label={`${metalLabel} ${t("gross")} (-)`} 
                    value={formatWeight(m.closed_gross_weight)} 
                    color="card-orange" 
                  />
                  <StatCard 
                    icon="📤" 
                    label={`${metalLabel} ${t("net")} (-)`} 
                    value={formatWeight(m.closed_net_weight)} 
                    color="card-rose" 
                  />
                </React.Fragment>
              );
            })}
          </div>


          {/* ── Vault Metal Weight Balance Matrix Breakdown (Summary Pills Added) ── */}
          <div className="metal-movement-section" style={{ marginTop: "30px" }}>
            <div className="section-title" style={{ paddingBottom: "10px", borderBottom: "2px solid #cbd5e1", marginBottom: "15px" }}>
              {t("vault_commodity_balance_sheet_title", "Vault Commodity Weight Inventory Balance Sheet")}
            </div>
            <table className="metal-movement-table">
              <thead>
                <tr>
                  <th>{t("metal_classification_hdr", "Metal Classification")}</th>
                  <th>{t("active_live_vault_net_hdr", "Active Live Vault Net (IN)")}</th>
                  <th>{t("active_live_vault_gross_hdr", "Active Live Vault Gross (IN)")}</th>
                  <th>Active Live Vault Count (IN)</th> 
                  <th>{t("total_released_outflow_net_hdr", "Total Released/Outflow Net (via Closure/Auction)")}</th>
                  <th>{t("total_released_outflow_gross_hdr", "Total Released/Outflow Gross (via Closure/Auction)")}</th>
                  <th>Total Released/Outflow Count</th> 
                </tr>
              </thead>
              <tbody>
                {metals.map((m, i) => (
                  <tr key={i}>
                    <td className="metal-name-cell">{m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal}</td>
                    <td className="font-bold" style={{ color: "#0f766e" }}>{formatWeight(m.pledged_net_weight)}</td>
                    <td>{formatWeight(m.pledged_gross_weight)}</td>
                    <td className="font-bold" style={{ color: "#0f766e" }}>{m.pledged_count} {t("pieces_unit_lbl", "items")}</td>
                    <td className="font-bold" style={{ color: "#b91c1c" }}>{formatWeight(m.closed_net_weight)}</td>
                    <td>{formatWeight(m.closed_gross_weight)}</td>
                    <td className="font-bold" style={{ color: "#b91c1c" }}>{m.closed_count} {t("pieces_unit_lbl", "items")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Dynamic metal summary cards (Match indicators like Daily & Monthly report) ── */}
            <div className="metal-summary-pills" style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
              <div className="stat-pill" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                📦 {t("total_items")}: {activeYearData.total_pledges} {t("pieces_unit_lbl", "items")}
              </div>
              
              {metals.map((m) => {
                const metalLabel = m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal;
                return (
                  <React.Fragment key={m.metal}>
                    <div className="stat-pill" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                      🪙 {metalLabel} - {t("net_weight")}: <span style={{ color: "#0f766e" }}>Active {Number(m.pledged_net_weight).toFixed(2)}g</span> | <span style={{ color: "#b91c1c" }}>Released {Number(m.closed_net_weight).toFixed(2)}g</span>
                    </div>
                    <div className="stat-pill" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                      📊 {metalLabel} - {t("count")}: <span style={{ color: "#0f766e" }}>Active {m.pledged_count}</span> | <span style={{ color: "#b91c1c" }}>Released {m.closed_count}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── Auditing Layout Block ── */}
          <div className="corporate-audit-layout">
            
            {/* LEFT SIDE: Income & Expenditure P&L Statement Sheet */}
            <div className="pnl-section-card">
              <div className="pnl-section-header">
                <h3>{t("pnl_audit_statement_title", "Profit & Loss Audit Statement")}</h3>
                <span className="pnl-period-badge">{t("fiscal_review_period_lbl", "Fiscal Review Period")}: {selectedYear}</span>
              </div>
              <table className="pnl-statement-table">
                <thead>
                  <tr>
                    <th>{t("particulars_lbl", "Particulars")}</th>
                    <th className="text-right">{t("amount_lbl", "Amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="pnl-group-header">
                    <td colSpan="2">{t("operational_revenue_hdr", "Operational Revenue / Core Gross Income")}</td>
                  </tr>
                  <tr>
                    <td className="pnl-indent-item">{t("interest_collected_lbl", "Gross Interest Collected")}</td>
                    <td className="text-right text-success">{formatCurrency(activeYearData.interest_income)}</td>
                  </tr>
                  <tr>
                    <td className="pnl-indent-item">{t("processing_fees_lbl", "Processing Charges & Fees")}</td>
                    <td className="text-right text-success">{formatCurrency(activeYearData.processing_fees)}</td>
                  </tr>
                  <tr>
                    <td className="pnl-indent-item">{t("auction_margin_lbl", "Realized Auction Surplus/Deficit Margin")}</td>
                    <td className={`text-right ${activeYearData.auction_surplus_deficit >= 0 ? "text-success" : "text-danger"}`}>
                      {formatCurrency(activeYearData.auction_surplus_deficit)}
                    </td>
                  </tr>
                  <tr>
                    <td className="pnl-indent-item">{t("misc_income_lbl", "Other Penalty & Misc Receipts")}</td>
                    <td className="text-right text-success">{formatCurrency(activeYearData.other_income)}</td>
                  </tr>
                  <tr className="pnl-subtotal-row">
                    <td>{t("total_gross_revenue_lbl", "Total Gross Revenue Asset (A)")}</td>
                    <td className="text-right font-bold">{formatCurrency(totalRevenue)}</td>
                  </tr>

                  <tr className="pnl-group-header">
                    <td colSpan="2">{t("operating_expenses_hdr", "Operating Revenue Outflow Expenses")}</td>
                  </tr>
                  <tr>
                    <td className="pnl-indent-item">{t("branch_expenses_lbl", "Corporate & Branch Operating Costs")}</td>
                    <td className="text-right text-danger">({formatCurrency(activeYearData.expenses)})</td>
                  </tr>
                  <tr>
                    <td className="pnl-indent-item">Investor Interest/Profit Payouts</td>
                    <td className="text-right text-danger">({formatCurrency(activeYearData.investor_interest_paid)})</td>
                  </tr>
                  <tr className="pnl-subtotal-row">
                    <td>{t("total_operating_expenses_lbl", "Total Operating Outflow Expenses (B)")}</td>
                    <td className="text-right text-danger font-bold">({formatCurrency(activeYearData.expenses + activeYearData.investor_interest_paid)})</td>
                  </tr>

                  <tr className={`pnl-summary-final-row ${isProfit ? "profit-tint" : "loss-tint"}`}>
                    <td><strong>{t("net_profit_loss_lbl", "Net Retained Balance Profit / Loss (A - B)")}</strong></td>
                    <td className="text-right">
                      <strong className={isProfit ? "text-success" : "text-danger"}>
                        {formatCurrency(totalRevenue - (activeYearData.expenses + activeYearData.investor_interest_paid))}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* RIGHT SIDE: Public Auction Asset Recovery Log Panel */}
            <div className="pnl-section-card">
              <div className="pnl-section-header">
                <h3>{t("asset_liquidation_auctions_title", "Asset Liquidation & Inventory Auctions")}</h3>
                <span className="pnl-period-badge" style={{ backgroundColor: "#e2e8f0", color: "#334155" }}>
                  {t("status", "Status")}: {t("closed_audits_lbl", "Closed Audits")}
                </span>
              </div>
              
              <div className="corporate-auction-summary-box">
                <div className="auction-metric-tile">
                  <span>{t("pockets_liquidated_lbl", "Pockets Liquidated")}</span>
                  <strong>{activeYearAuction.total_auctioned_pockets} {t("pieces_unit_lbl", "items")}</strong>
                </div>
                <div className="auction-metric-tile">
                  <span>{t("total_asset_value_lbl", "Total Asset Value")}</span>
                  <strong>{formatCurrency(activeYearAuction.total_outstanding)}</strong>
                </div>
                <div className="auction-metric-tile">
                  <span>{t("gross_capital_realized_lbl", "Gross Capital Realized")}</span>
                  <strong className="text-success">{formatCurrency(activeYearAuction.total_auction_sales)}</strong>
                </div>
              </div>

              {/* COMPLIANCE ASSESSMENT TABLE */}
              <table className="pnl-statement-table" style={{ marginTop: "12px" }}>
                <thead>
                  <tr>
                    <th>{t("auction_assessment_line_hdr", "Auction Assessment Line")}</th>
                    <th className="text-right">{t("amount_lbl", "Value")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="pnl-indent-item">{t("total_inventory_liquidation_lbl", "Total Inventory Liquidation Inflows")}</td>
                    <td className="text-right text-success">{formatCurrency(activeYearAuction.total_auction_sales)}</td>
                  </tr>
                  <tr>
                    <td className="pnl-indent-item">{t("principal_cost_recovery_lbl", "Less: Principal Cost Recovery Base")}</td>
                    <td className="text-right text-muted">({formatCurrency(activeYearAuction.principal_recovered)})</td>
                  </tr>
                  <tr>
                    <td className="pnl-indent-item">{t("recovered_interest_liability_lbl", "Less: Recovered Interest Liability")}</td>
                    <td className="text-right text-danger">({formatCurrency(activeYearAuction.interest_recovered)})</td>
                  </tr>
                  <tr className="pnl-subtotal-row">
                    <td>{t("net_realized_auction_spread_lbl", "Net Realized Auction Spread Margin (Surplus)")}</td>
                    <td className={`text-right font-bold ${activeYearAuction.auction_profit_loss >= 0 ? "text-success" : "text-danger"}`}>
                      {formatCurrency(activeYearAuction.auction_profit_loss)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="corporate-audit-disclaimer">
                * {t("corporate_audit_disclaimer_desc", "Realized liquidation spreads strictly match statutory rules for non-performing pledges older than 3 years.")}
              </div>
            </div>

          </div>

          {/* ── Annual Investor Capital Activity & Financing ── */}
          <div className="pnl-section-card" style={{ marginTop: "30px", borderLeft: "5px solid #10b981" }}>
            <div className="pnl-section-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>👥</span> Investor Capital Activity Summary
              </h3>
              <span className="pnl-period-badge" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>
                Investor Financing Ledger: {selectedYear}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#555", margin: "-10px 0 20px 0", paddingLeft: "4px" }}>
              Monitors equity inflows and withdrawals made by active investors alongside total interest payouts.
            </p>
            <table className="pnl-statement-table">
              <thead>
                <tr>
                  <th>Investor Activity Category</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pnl-indent-item" style={{ fontWeight: "500" }}>
                    📥 Investor Investments (Add Fund Inflow)
                  </td>
                  <td className="text-right text-success" style={{ fontWeight: "600" }}>
                    {formatCurrency(activeYearData.investor_investments)}
                  </td>
                </tr>
                <tr>
                  <td className="pnl-indent-item" style={{ fontWeight: "500" }}>
                    📤 Investor Capital Withdrawals (Outflow)
                  </td>
                  <td className="text-right text-danger" style={{ fontWeight: "600" }}>
                    ({formatCurrency(activeYearData.investor_withdrawals)})
                  </td>
                </tr>
                <tr>
                  <td className="pnl-indent-item" style={{ fontWeight: "500" }}>
                    📤 Investor Interest Payments Paid Out (Expense Outflow)
                  </td>
                  <td className="text-right text-danger" style={{ fontWeight: "600" }}>
                    ({formatCurrency(activeYearData.investor_interest_paid)})
                  </td>
                </tr>
                <tr className="pnl-subtotal-row" style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ fontWeight: "700" }}>
                    ⚖️ Net Equity Capital Flow
                  </td>
                  <td className="text-right" style={{ fontWeight: "700", color: (activeYearData.investor_investments - activeYearData.investor_withdrawals - activeYearData.investor_interest_paid) >= 0 ? "#0d9488" : "#ea580c" }}>
                    {formatCurrency(activeYearData.investor_investments - activeYearData.investor_withdrawals - activeYearData.investor_interest_paid)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Annual Bank Refinancing Operations Summary ── */}
          <div className="pnl-section-card" style={{ marginTop: "30px", borderLeft: "5px solid #2563eb" }}>
            <div className="pnl-section-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🏛️</span> {t("bank_refinancing_report", "Bank Refinancing & Mapping Summary")}
              </h3>
              <span className="pnl-period-badge" style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>
                {t("refinancing_audit_lbl", "Funding & Leverage Ledger")}: {selectedYear}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#555", margin: "-10px 0 20px 0", paddingLeft: "4px" }}>
              Monitors capital flows received from bank mappings versus funding payments returned to the banks.
            </p>
            <table className="pnl-statement-table">
              <thead>
                <tr>
                  <th>{t("transaction_type_lbl", "Transaction Category")}</th>
                  <th className="text-right">{t("amount_lbl", "Amount")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pnl-indent-item" style={{ fontWeight: "500" }}>
                    📥 {t("bank_loans_received_lbl", "Capital Sourced From Bank Mappings")} (Inflow)
                  </td>
                  <td className="text-right text-success" style={{ fontWeight: "600" }}>
                    {formatCurrency(activeYearData.bank_refinance_inflow)}
                  </td>
                </tr>
                <tr>
                  <td className="pnl-indent-item" style={{ fontWeight: "500" }}>
                    📤 {t("bank_repayments_paid_lbl", "Funding Capital Returned to Banks")} (Outflow)
                  </td>
                  <td className="text-right text-danger" style={{ fontWeight: "600" }}>
                    ({formatCurrency(activeYearData.bank_refinance_outflow)})
                  </td>
                </tr>
                <tr className="pnl-subtotal-row" style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ fontWeight: "700" }}>
                    ⚖️ {t("net_refinancing_surplus_lbl", "Net Refinancing Spread / Surplus")}
                  </td>
                  <td className="text-right" style={{ fontWeight: "700", color: activeYearData.bank_refinance_surplus >= 0 ? "#0d9488" : "#ea580c" }}>
                    {formatCurrency(activeYearData.bank_refinance_surplus)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </>
      )}
    </div>
  );
}