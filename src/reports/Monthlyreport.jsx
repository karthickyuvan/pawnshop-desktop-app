
// src/pages/MonthlyReportPage.jsx
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext";
import "./MonthlyReport.css";

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

export default function MonthlyReportPage() {
  const { t } = useLanguage();
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const [month, setMonth] = useState(currentMonthStr);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMonthlyReport();
  }, []);

  async function loadMonthlyReport() {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke("get_monthly_report_cmd", { month: month });
      setReport(data);
    } catch (err) {
      console.error("Monthly report load error:", err);
      setError(err.toString());
    }
    setLoading(false);
  }

  const formatCurrency = (amt) => {
    return `₹${(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const formatWeight = (grams) => {
    return `${Number(grams || 0).toFixed(2)} g`;
  };

  const auctionSurplus = report ? report.total_auction_surplus_deficit : 0;
  const totalRevenue = report 
    ? (report.interest_collected + report.processing_fees + report.other_income + auctionSurplus) 
    : 0;
  const netProfit = report ? (totalRevenue - report.expenses) : 0;
  const isProfit = netProfit >= 0;

  return (
    <div className="monthly-report-page">
      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>{t("monthly_business_report")}</h2>
          <p>{t("monthly_business_report_desc")}</p>
        </div>
        <div className="report-controls">
          <input
            type="month"
            value={month}
            max={currentMonthStr}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button onClick={loadMonthlyReport}>{t("load_report_btn", "Load Report")}</button>
        </div>
      </div>

      {loading && <p className="loading-text">{t("generating_statement_msg", "Generating Monthly Statement...")}</p>}
      {error && <p className="error-text">{t("operation_failed")}: {error}</p>}

      {report && !loading && (
        <>
          {/* ── Stat Cards Grid ── */}
          <div className="stats-grid">
            <StatCard icon="🗂" label={t("total_pockets_lbl", "Total Pockets")} value={report.total_pockets} color="card-blue" />
            <StatCard icon="🟢" label={t("active_pockets_lbl", "Active Pockets")} value={report.active_pockets} color="card-green" />
            <StatCard icon="🔒" label={t("closed_pockets_lbl", "Closed Pockets")} value={report.closed_pockets} color="card-slate" />
            <StatCard icon="🔨" label={t("auctioned_pockets_lbl", "Auctioned Pockets")} value={report.auctioned_pockets} color="card-orange" />

            <StatCard icon="🏦" label={t("opening_balance")} value={formatCurrency(report.opening_balance)} color="card-blue" />
            <StatCard icon="📤" label={t("loans_issued_lbl", "Loans Issued")} value={formatCurrency(report.loans_issued)} color="card-rose" />
            <StatCard icon="📥" label={t("loan_repayments_lbl", "Loan Repayments")} value={formatCurrency(report.loan_repayments)} color="card-green" />
            <StatCard icon="📅" label={t("todays_interest")} value={formatCurrency(report.interest_collected)} color="card-teal" />
            <StatCard icon="🏷️" label={t("processing_fee")} value={formatCurrency(report.processing_fees)} color="card-purple" />
            <StatCard icon="💹" label={t("other_income_lbl", "Other Income")} value={formatCurrency(report.other_income)} color="card-yellow" />
            <StatCard icon="🧾" label={t("total_expense")} value={formatCurrency(report.expenses)} color="card-orange" />
            <StatCard icon="📈" label={t("total_inflow")} value={formatCurrency(report.total_inflow)} color="card-green" />
            <StatCard icon="📉" label={t("total_outflow")} value={formatCurrency(report.total_outflow)} color="card-rose" />
            <StatCard icon="💰" label={t("net_cash_flow_lbl", "Net Cash Flow")} value={formatCurrency(report.net_cash_flow)} color={report.net_cash_flow >= 0 ? "card-teal" : "card-orange"} />
            <StatCard icon="🏧" label={t("cash_in_hand")} value={formatCurrency(report.closing_balance)} color="card-blue" />

            {/* ── แยกโลஹங்கள் தங்கம் & வெள்ளி தனித்தனியாகக் காட்டப்படுகிறது ── */}
            {report.metal_movements?.map((m) => {
              const metalLabel = m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal;
              return (
                <React.Fragment key={m.metal}>
                  <StatCard 
                    icon="📥" 
                    label={`${metalLabel} ${t("gross")} (+)`} 
                    value={formatWeight(m.in_gross)} 
                    color="card-green" 
                  />
                  <StatCard 
                    icon="📥" 
                    label={`${metalLabel} ${t("net")} (+)`} 
                    value={formatWeight(m.in_net)} 
                    color="card-teal" 
                  />
                  <StatCard 
                    icon="📤" 
                    label={`${metalLabel} ${t("gross")} (-)`} 
                    value={formatWeight(m.out_gross)} 
                    color="card-orange" 
                  />
                  <StatCard 
                    icon="📤" 
                    label={`${metalLabel} ${t("net")} (-)`} 
                    value={formatWeight(m.out_net)} 
                    color="card-rose" 
                  />
                </React.Fragment>
              );
            })}
          </div>

                    {/* ── Section: Commodity Table Breakdown ── */}
          <div className="metal-movement-section">
            <h3>{t("metal_movement_breakdown_title", "Metal Movement Breakdown (Includes Auction Outflows)")}</h3>
            <table className="metal-movement-table">
              <thead>
                <tr>
                  <th>{t("metal")}</th>
                  <th>{t("in_gross_tbl_hdr", "In Gross")}</th>
                  <th>{t("in_net_tbl_hdr", "In Net")}</th>
                  <th>In Count (pcs)</th> 
                  <th>{t("out_gross_tbl_hdr", "Out Gross")}</th>
                  <th>{t("out_net_tbl_hdr", "Out Net")}</th>
                  <th>Out Count (pcs)</th> 
                </tr>
              </thead>
              <tbody>
                {report.metal_movements?.map((m, index) => (
                  <tr key={index}>
                    <td className="metal-name-cell">{m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal}</td>
                    <td>{formatWeight(m.in_gross)}</td>
                    <td>{formatWeight(m.in_net)}</td>
                    <td className="font-bold" style={{ color: "#15803d" }}>{m.in_count} {t("pieces_unit_lbl", "items")}</td>
                    <td>{formatWeight(m.out_gross)}</td>
                    <td>{formatWeight(m.out_net)}</td>
                    <td className="font-bold" style={{ color: "#b91c1c" }}>{m.out_count} {t("pieces_unit_lbl", "items")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── NEW: Dynamic metal summary cards (Match indicators like Daily report) ── */}
            <div className="metal-summary-pills" style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
              <div className="stat-pill" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                📦 {t("total_items")}: {report.total_pockets} {t("pieces_unit_lbl", "items")}
              </div>
              
              {report.metal_movements?.map((m) => {
                const metalLabel = m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal;
                return (
                  <React.Fragment key={m.metal}>
                    {/* Metal Net weight Pill */}
                    <div className="stat-pill" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                      🪙 {metalLabel} - {t("net_weight")}: <span style={{ color: "#15803d" }}>In {Number(m.in_net).toFixed(2)}g</span> | <span style={{ color: "#b91c1c" }}>Out {Number(m.out_net).toFixed(2)}g</span>
                    </div>
                    {/* Metal Item count Pill (In and Out Piece count separated) */}
                    <div className="stat-pill" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                      📊 {metalLabel} - {t("count")}: <span style={{ color: "#15803d" }}>In {m.in_count}</span> | <span style={{ color: "#b91c1c" }}>Out {m.out_count}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── Section: Profit & Loss Statement ── */}
          <div className="pnl-section-card" style={{ marginTop: "30px" }}>
            <div className="pnl-section-header">
              <h3>{t("profit_loss_report")}</h3>
              <span className="pnl-period-badge">{t("statement_period_lbl", "Statement Period")}: {month}</span>
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
                  <td colSpan="2">{t("operational_revenue_hdr", "Operational Revenue / Income")}</td>
                </tr>
                <tr>
                  <td className="pnl-indent-item">{t("interest_collected_lbl", "Interest Collected")}</td>
                  <td className="text-right text-success">{formatCurrency(report.interest_collected)}</td>
                </tr>
                <tr>
                  <td className="pnl-indent-item">{t("processing_fees_lbl", "Processing Fees")}</td>
                  <td className="text-right text-success">{formatCurrency(report.processing_fees)}</td>
                </tr>
                <tr>
                  <td className="pnl-indent-item">{t("auction_margin_lbl", "Auction Surplus/Deficit Margin")}</td>
                  <td className={`text-right ${auctionSurplus >= 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(auctionSurplus)}
                  </td>
                </tr>
                <tr>
                  <td className="pnl-indent-item">{t("misc_income_lbl", "Other Miscellaneous Income")}</td>
                  <td className="text-right text-success">{formatCurrency(report.other_income)}</td>
                </tr>
                <tr className="pnl-subtotal-row">
                  <td>{t("total_gross_revenue_lbl", "Total Gross Revenue (A)")}</td>
                  <td className="text-right font-bold">{formatCurrency(totalRevenue)}</td>
                </tr>

                <tr className="pnl-group-header">
                  <td colSpan="2">{t("operating_expenses_hdr", "Operating Expenses")}</td>
                </tr>
                <tr>
                  <td className="pnl-indent-item">{t("branch_expenses_lbl", "Branch Expenses")}</td>
                  <td className="text-right text-danger">({formatCurrency(report.expenses)})</td>
                </tr>
                <tr>
                  <td className="pnl-indent-item">Investor Interest/Profit Payouts</td>
                  <td className="text-right text-danger">({formatCurrency(report.investor_interest_paid)})</td>
                </tr>
                <tr className="pnl-subtotal-row">
                  <td>{t("total_operating_expenses_lbl", "Total Operating Expenses (B)")}</td>
                  <td className="text-right text-danger font-bold">({formatCurrency(report.expenses + report.investor_interest_paid)})</td>
                </tr>

                <tr className={`pnl-summary-final-row ${isProfit ? "profit-tint" : "loss-tint"}`}>
                  <td><strong>{t("net_profit_loss_lbl", "Net Profit / Loss (A - B)")}</strong></td>
                  <td className="text-right">
                    <strong className={(totalRevenue - (report.expenses + report.investor_interest_paid)) >= 0 ? "text-success" : "text-danger"}>
                      {formatCurrency(totalRevenue - (report.expenses + report.investor_interest_paid))}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          
          {/* ── Investor Capital Activity Summary ── */}
          <div className="pnl-section-card" style={{ marginTop: "30px", borderLeft: "5px solid #10b981" }}>
            <div className="pnl-section-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>👥</span> Investor Capital Activity Summary
              </h3>
              <span className="pnl-period-badge" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>
                Investor Financing Ledger
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
                    {formatCurrency(report.investor_investments)}
                  </td>
                </tr>
                <tr>
                  <td className="pnl-indent-item" style={{ fontWeight: "500" }}>
                    📤 Investor Capital Withdrawals (Outflow)
                  </td>
                  <td className="text-right text-danger" style={{ fontWeight: "600" }}>
                    ({formatCurrency(report.investor_withdrawals)})
                  </td>
                </tr>
                <tr>
                  <td className="pnl-indent-item" style={{ fontWeight: "500" }}>
                    📤 Investor Interest Payments Paid Out (Expense Outflow)
                  </td>
                  <td className="text-right text-danger" style={{ fontWeight: "600" }}>
                    ({formatCurrency(report.investor_interest_paid)})
                  </td>
                </tr>
                <tr className="pnl-subtotal-row" style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ fontWeight: "700" }}>
                    ⚖️ Net Equity Capital Flow
                  </td>
                  <td className="text-right" style={{ fontWeight: "700", color: (report.investor_investments - report.investor_withdrawals - report.investor_interest_paid) >= 0 ? "#0d9488" : "#ea580c" }}>
                    {formatCurrency(report.investor_investments - report.investor_withdrawals - report.investor_interest_paid)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Section: Bank Refinancing & Mapping Summary ── */}
          <div className="pnl-section-card" style={{ marginTop: "30px", borderLeft: "5px solid #2563eb" }}>
            <div className="pnl-section-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🏛️</span> {t("bank_refinancing_report", "Bank Refinancing & Mapping Summary")}
              </h3>
              <span className="pnl-period-badge" style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>
                {t("refinancing_audit_lbl", "Funding & Leverage Ledger")}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#555", margin: "-10px 0 20px 0", paddingLeft: "4px" }}>
              {t("refinancing_summary_desc", "This panel monitors capital flows received from bank mappings versus funding payments returned to the banks.")}
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
                    {formatCurrency(report.bank_refinance_inflow)}
                  </td>
                </tr>
                <tr>
                  <td className="pnl-indent-item" style={{ fontWeight: "500" }}>
                    📤 {t("bank_repayments_paid_lbl", "Funding Capital Returned to Banks")} (Outflow)
                  </td>
                  <td className="text-right text-danger" style={{ fontWeight: "600" }}>
                    ({formatCurrency(report.bank_refinance_outflow)})
                  </td>
                </tr>
                <tr className="pnl-subtotal-row" style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ fontWeight: "700" }}>
                    ⚖️ {t("net_refinancing_surplus_lbl", "Net Refinancing Spread / Surplus")}
                  </td>
                  <td className="text-right" style={{ fontWeight: "700", color: report.bank_refinance_surplus >= 0 ? "#0d9488" : "#ea580c" }}>
                    {formatCurrency(report.bank_refinance_surplus)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>



          {/* ── SECTION: Monthly Auction Items Breakdown ── */}
          <div className="metal-movement-section" style={{ marginTop: "30px" }}>
            <h3>{t("auctions_realized_this_month_title", "Auctions Realized This Month")} ({report.monthly_auctions?.length || 0})</h3>
            <table className="metal-movement-table">
              <thead>
                <tr>
                  <th>{t("pledge_no")}</th>
                  <th>{t("customer")}</th>
                  <th>{t("loan_principal_hdr", "Loan Principal")}</th>
                  <th>{t("interest_pending_lbl", "Interest Pending")}</th>
                  <th>{t("total_outstanding_hdr", "Total Outstanding")}</th>
                  <th>{t("auction_amount_label", "Auction Amount")}</th>
                  <th>{t("profit_loss_hdr", "PROFIT / LOSS")}</th>
                  <th>{t("gross_weight_hdr", "Gross Wt")}</th>
                  <th>{t("net_weight_hdr", "Net Wt")}</th>
                </tr>
              </thead>
              <tbody>
                {report.monthly_auctions?.map((a, index) => {
                  const pureMargin = a.auction_amount - a.total_outstanding;
                  return (
                    <tr key={index}>
                      <td className="font-bold">{a.pledge_no}</td>
                      <td>{a.customer_name}</td>
                      <td>{formatCurrency(a.loan_amount)}</td>
                      <td className="text-danger">{formatCurrency(a.interest_pending)}</td>
                      <td className="font-bold">{formatCurrency(a.total_outstanding)}</td>
                      <td className="text-success font-bold">{formatCurrency(a.auction_amount)}</td>
                      <td>
                        <span className={`pnl-badge ${pureMargin >= 0 ? "profit-badge" : "loss-badge"}`}>
                          {pureMargin >= 0 ? `${t("profit", "Profit")} ` : `${t("loss", "Loss")} `}
                          {formatCurrency(Math.abs(pureMargin))}
                        </span>
                      </td>
                      <td>{formatWeight(a.gross_weight)}</td>
                      <td>{formatWeight(a.net_weight)}</td>
                    </tr>
                  );
                })}
                {report.monthly_auctions?.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", color: "#888", padding: "15px" }}>
                      {t("no_auctions_logged_desc", "No inventory pledges were sent to open public auction during this calendar window.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


        </>
      )}
    </div>
  );
}