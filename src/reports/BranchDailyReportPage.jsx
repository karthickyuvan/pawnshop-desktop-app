
// src/pages/BranchDailyReportPage.jsx
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext";
import "./BranchDailyReportPage.css";
import { formatDateTimeIST } from "../utils/timeFormatter";

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

export default function BranchDailyReportPage() {
  const { t } = useLanguage();
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [report, setReport] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const [data, tx] = await Promise.all([
        invoke("get_branch_daily_report_cmd", { reportDate: date }),
        invoke("get_transaction_details_cmd", { reportDate: date }),
      ]);

      setReport(data);
      setTransactions(tx);
    } catch (err) {
      console.error("Report load error:", err);
    }
    setLoading(false);
  }

  // ── Central Formatter Helper: Removes "IST" from DateTime String ──
  const formatDateTimeNoIST = (dateStr) => {
    if (!dateStr) return "—";
    return formatDateTimeIST(dateStr).replace(" IST", "");
  };

  // ── Dynamic Narration Translator Helper ──
  const translateDescription = (desc) => {
    if (!desc) return "—";
    let translated = desc;

    if (desc.includes("Loan Disbursement")) {
      translated = desc.replace("Loan Disbursement", t("Loan Disbursement"));
    }
    if (desc.includes("Processing Fee")) {
      translated = desc.replace("Processing Fee", t("Processing Fee"));
    }
    if (desc.includes("First Month Interest")) {
      translated = desc.replace("First Month Interest", t("First Month Interest"));
    }
    if (desc.includes("Denomination Exchange (Inward)")) {
      translated = desc.replace("Denomination Exchange (Inward)", t("Denomination Exchange (Inward)"));
    }
    if (desc.includes("Denomination Exchange (Outward)")) {
      translated = desc.replace("Denomination Exchange (Outward)", t("Denomination Exchange (Outward)"));
    }
    if (desc.includes("🔨 [AUCTION RECOVERY]")) {
      translated = desc.replace("🔨 [AUCTION RECOVERY]", t("🔨 [AUCTION RECOVERY]"));
    }
    if (desc.includes("Opening Balance")) {
      translated = desc.replace("Opening Balance", t("opening_balance", "Opening Balance"));
    }
    if (desc.includes("Fund Added")) {
      translated = desc.replace("Fund Added", t("add_funds", "Fund Added"));
    }
    if (desc.includes("Fund Withdrawn")) {
      translated = desc.replace("Fund Withdrawn", t("withdraw_funds", "Fund Withdrawn"));
    }
    if (desc.includes("Investor Investment")) {
      translated = desc.replace("Investor Investment", t("Investor Investment"));
    }
    if (desc.includes("Investor Withdrawal")) {
      translated = desc.replace("Investor Withdrawal", t("Investor Withdrawal"));
    }
    if (desc.includes("Investor Profit Payment")) {
      translated = desc.replace("Investor Profit Payment", t("Investor Profit Payment"));
    }
    if (desc.includes("Payment for Pledge")) {
      translated = desc.replace("Payment for Pledge", t("Payment for Pledge"));
    }

    if (translated.includes("(CASH)")) {
      translated = translated.replace("(CASH)", `(${t("CASH")})`);
    }
    if (translated.includes("(UPI)")) {
      translated = translated.replace("(UPI)", `(${t("UPI")})`);
    }
    if (translated.includes("(BANK)")) {
      translated = translated.replace("(BANK)", `(${t("BANK")})`);
    }

    return translated;
  };

  const translateModuleType = (mod) => {
    if (!mod) return "—";
    const normalized = String(mod).toUpperCase();
    if (normalized === "CAPITAL") return t("owner_fund", "Capital");
    if (normalized === "EXPENSE") return t("expenses", "Expenses");
    if (normalized === "PLEDGE") return t("pledge", "Pledge");
    if (normalized === "FEE") return t("processing_fee", "Fee");
    if (normalized === "INTEREST") return t("interest", "Interest");
    if (normalized === "CLOSURE") return t("closures", "Closure");
    if (normalized === "BANK_MAPPING") return t("bank_mapping", "Bank Mapping");
    return t(mod);
  };

  return (
    <div className="branch-report-page">
      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>{t("branch_daily_report")}</h2>
          <p>{t("daily_cash_position_desc", "Daily cash position and transactions")}</p>
        </div>
        <div className="report-controls">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button onClick={loadReport}>{t("load_report_btn", "Load Report")}</button>
        </div>
      </div>

      {loading && <p className="loading-text">{t("loading_pledges", "Loading report...")}</p>}

      {report && (
        <>
          {/* ── Stat Cards Grid (Tamil Localization applied) ── */}
          <div className="stats-grid">
            <StatCard icon="🗂" label={t("total_pockets_lbl", "Total Pockets")} value={report.total_pockets} color="card-blue" />
            <StatCard icon="🟢" label={t("active_pockets_lbl", "Active Pockets")} value={report.active_pockets} color="card-green" />
            <StatCard icon="🔒" label={t("closed_pockets_lbl", "Closed Pockets")} value={report.closed_pockets} color="card-slate" />

            <StatCard icon="🏦" label={t("opening_balance")} value={`₹${report.opening_balance?.toLocaleString("en-IN")}`} color="card-blue" />
            <StatCard icon="📤" label={t("loans_issued_lbl", "Loans Issued")} value={`₹${report.loans_issued?.toLocaleString("en-IN")}`} color="card-rose" />
            <StatCard icon="📥" label={t("loan_repayments_lbl", "Loan Repayments")} value={`₹${report.loan_repayments?.toLocaleString("en-IN")}`} color="card-green" />
            <StatCard icon="📅" label={t("todays_interest")} value={`₹${report.interest_collected?.toLocaleString("en-IN")}`} color="card-teal" />
            <StatCard icon="🏷️" label={t("processing_fee")} value={`₹${report.processing_fees?.toLocaleString("en-IN")}`} color="card-purple" />
            <StatCard icon="💹" label={t("other_income_lbl", "Other Income")} value={`₹${report.other_income?.toLocaleString("en-IN")}`} color="card-yellow" />
            <StatCard icon="🧾" label={t("total_expense")} value={`₹${report.expenses?.toLocaleString("en-IN")}`} color="card-orange" />
            
            <StatCard icon="👥" label={t("investor_capital_additions")} value={`₹${report.investor_investments?.toLocaleString("en-IN")}`} color="card-green" />
            <StatCard icon="💸" label={t("investor_withdrawals_lbl")} value={`₹${report.investor_withdrawals?.toLocaleString("en-IN")}`} color="card-rose" />
            <StatCard icon="🏛️" label={t("bank_refinance_inflow_lbl")} value={`₹${report.bank_refinance_inflow?.toLocaleString("en-IN")}`} color="card-green" />
            <StatCard icon="🏦" label={t("bank_repayments_paid_lbl")} value={`₹${report.bank_refinance_outflow?.toLocaleString("en-IN")}`} color="card-rose" />

            <StatCard icon="📈" label={t("total_inflow")} value={`₹${report.total_inflow?.toLocaleString("en-IN")}`} color="card-green" />
            <StatCard icon="📉" label={t("total_outflow")} value={`₹${report.total_outflow?.toLocaleString("en-IN")}`} color="card-rose" />
            {/* <StatCard icon="💰" label={t("net_cash_flow_lbl", "Net Cash Flow")} value={`₹${report.net_cash_flow?.toLocaleString("en-IN")}`} color={report.net_cash_flow >= 0 ? "card-teal" : "card-orange"} /> */}
            <StatCard icon="🏧" label={t("cash_in_hand")} value={`₹${report.closing_balance?.toLocaleString("en-IN")}`} color="card-blue" />
          </div>

          {/* ── Complete, Itemized Vault Commodity Balance Sheet ── */}
          <div className="metal-movement-section">
            <h3>⚖️ {t("vault_commodity_balance_sheet_title", "Vault Commodity Balance Sheet (Itemized Per Metal)")}</h3>
            <table className="metal-movement-table">
              <thead>
                <tr>
                  <th>{t("metal")}</th>
                  <th>{t("in_gross_customer")}</th>
                  <th>{t("in_net_customer")}</th>
                  <th>{t("out_gross_released")}</th>
                  <th>{t("out_net_released")}</th>
                  <th>{t("store_to_bank_gross")}</th>
                  <th>{t("store_to_bank_net")}</th>
                  <th>{t("bank_to_store_gross")}</th>
                  <th>{t("bank_to_store_net")}</th>
                </tr>
              </thead>
              <tbody>
                {report.metal_movements?.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "12px" }}>
                      {t("no_matching_records")}
                    </td>
                  </tr>
                ) : (
                  report.metal_movements?.map((m, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: "700", color: "#1e293b" }}>
                        {m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal}
                      </td>
                      <td style={{ color: "#15803d" }}>{Number(m.in_gross).toFixed(2)} g</td>
                      <td style={{ color: "#15803d", fontWeight: "600" }}>{Number(m.in_net).toFixed(2)} g</td>
                      <td style={{ color: "#b91c1c" }}>{Number(m.out_gross).toFixed(2)} g</td>
                      <td style={{ color: "#b91c1c", fontWeight: "600" }}>{Number(m.out_net).toFixed(2)} g</td>
                      
                      {/* Bank Mapping Inflow/Outflow Transits */}
                      <td style={{ color: "#d97706" }}>{Number(m.to_bank_gross).toFixed(2)} g</td>
                      <td style={{ color: "#d97706", fontWeight: "600" }}>{Number(m.to_bank_net).toFixed(2)} g</td>
                      <td style={{ color: "#0f766e" }}>{Number(m.from_bank_gross).toFixed(2)} g</td>
                      <td style={{ color: "#0f766e", fontWeight: "600" }}>{Number(m.from_bank_net).toFixed(2)} g</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* ── Dynamic Metal Summary Pills (Piece Counts and Net Weight separated by metal) ── */}
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

          {/* ── Transaction Details Table (ID Column Removed) ── */}
          <div className="table-section">
            <div className="section-title">{t("transaction_audit_trail")}</div>
            <table>
              <thead>
                <tr>
                  <th>{t("date")}</th>
                  <th>{t("category", "Module")}</th>
                  <th>{t("type")}</th>
                  <th>{t("amount")}</th>
                  <th>{t("reference")}</th>
                  <th>{t("description")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                      {t("no_matching_records")}
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      {/* Displays formatted date without "IST" suffix */}
                      <td>{formatDateTimeNoIST(tx.transaction_date)}</td>
                      <td>{translateModuleType(tx.module_type)}</td>
                      <td className={tx.transaction_type === "ADD" ? "add" : "withdraw"}>
                        {tx.transaction_type === "ADD" ? t("credit") : t("debit")}
                      </td>
                      <td>₹ {tx.amount.toFixed(2)}</td>
                      <td>{tx.reference || "—"}</td>
                      <td>{translateDescription(tx.description)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}