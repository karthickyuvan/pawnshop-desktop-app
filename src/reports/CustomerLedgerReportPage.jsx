


import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import { formatTransactionTimestamp } from "../utils/timeFormatter"; // ✅ Reusing the centralized formatter
import "./CustomerLedgerReportPage.css";

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

export default function CustomerLedgerReportPage({ setActiveMenu }) {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [customerCode, setCustomerCode] = useState("");
  const [report,       setReport]       = useState(null);

  async function loadLedger() {
    if (!customerCode) return;
    try {
      const result = await invoke("get_customer_ledger_report_cmd", {
        customerCode: customerCode.trim(),
      });
      setReport(result);
    } catch (err) {
      console.error("Ledger Error:", err);
    }
  }

  const totalDebit      = report?.rows.reduce((sum, r) => sum + r.debit,  0) || 0;
  const totalCredit     = report?.rows.reduce((sum, r) => sum + r.credit, 0) || 0;
  const closingBalance  = report?.rows.length
    ? report.rows[report.rows.length - 1].balance
    : 0;
  const totalPledges    = report
    ? Object.keys(report.rows.reduce((acc, r) => { acc[r.pledge_no] = 1; return acc; }, {})).length
    : 0;

  const groupedRows = report?.rows.reduce((acc, row) => {
    if (!acc[row.pledge_no]) acc[row.pledge_no] = [];
    acc[row.pledge_no].push(row);
    return acc;
  }, {});

  return (
    <div className="ledger-page">
      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>{t("customer_ledger")}</h2>
          <p>{t("customer_ledger_desc")}</p>
        </div>
        <div className="ledger-filter">
          <input
            type="text"
            placeholder={t("enter_customer_code_placeholder", "Enter Customer Code (A0001)")}
            value={customerCode}
            onChange={e => setCustomerCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadLedger()}
          />
          <button onClick={loadLedger}>{t("search", "Load Ledger")}</button>
        </div>
      </div>

      {!report && (
        <div className="ledger-empty">
          {t("ledger_empty_prompt", "Enter a Customer ID and click Load Ledger")}
        </div>
      )}

      {report && (
        <>
          {/* ── Customer info ── */}
          <div className="customer-info">
            <div>
              <span>{t("customer_name")}</span>
              <strong>{report.customer_name}</strong>
            </div>
            <div>
              <span>{t("code")}</span>
              <strong>{report.customer_code}</strong>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="stats-grid">
            <StatCard icon="📋" label={t("total_pledges")} value={totalPledges} color="card-blue" />
            <StatCard icon="📉" label={t("total_expense", "Total Debit")} value={`₹${totalDebit.toLocaleString("en-IN")}`} color="card-rose" />
            <StatCard icon="📈" label={t("collected", "Total Credit")} value={`₹${totalCredit.toLocaleString("en-IN")}`} color="card-green" />
            <StatCard icon="💰" label={t("closing_balance", "Closing Balance")} value={`₹${closingBalance.toLocaleString("en-IN")}`} color={closingBalance >= 244550 ? "card-teal" : "card-orange"} />
          </div>

          {/* ── Ledger table ── */}
          <div className="ledger-table">
            <table>
              <thead>
                <tr>
                  <th>{t("date")}</th>
                  <th>{t("description")}</th>
                  <th>{t("debit")}</th>
                  <th>{t("credit")}</th>
                  <th>{t("balance")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedRows || {}).map(([pledgeNo, rows]) => (
                  <React.Fragment key={`group-container-${pledgeNo}`}>
                    <tr className="pledge-group-row">
                      <td colSpan="5">
                        <span
                          className="pledge-link"
                          onClick={() =>
                            setActiveMenu(`single-pledge-${rows[0].pledge_id}-customer-ledger`)
                          }
                        >
                          🔗 {t("pledge", "Pledge")}: {pledgeNo}
                        </span>
                      </td>
                    </tr>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        <td>{formatTransactionTimestamp(row.date)}</td>
                        <td>{row.description}</td>
                        <td className="debit">{row.debit  ? `₹ ${row.debit.toLocaleString("en-IN")}`  : "—"}</td>
                        <td className="credit">{row.credit ? `₹ ${row.credit.toLocaleString("en-IN")}` : "—"}</td>
                        <td className="balance">₹ {row.balance.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}