

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import { formatTransactionTimestamp } from "../utils/timeFormatter"; // ✅ Reusing the centralized formatter
import "./ExpenseAuditReportPage.css";

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

export default function ExpenseAuditReportPage() {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const today = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState(today);
  const [rows,      setRows]      = useState([]);
  const [summary,   setSummary]   = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const result = await invoke("get_expense_audit_report_cmd", { startDate, endDate });
      setRows(result.expenses || []);
      setSummary(result.summary || []);
    } catch (err) {
      console.error("Expense Audit Error:", err);
    }
    setLoading(false);
  }

  const totalExpense  = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalEntries  = rows.length;
  const topCategory   = summary.length > 0
    ? summary.reduce((a, b) => a.total_amount > b.total_amount ? a : b).category
    : "—";
  const categoryCount = summary.length;

  return (
    <div className="expense-audit-page">
      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>{t("expense_audit_report")}</h2>
          <p>{t("expense_audit_report_desc")}</p>
        </div>
        <div className="filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadReport}>{t("search", "Load")}</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <StatCard icon="💸" label={t("total_expense")} value={`₹${totalExpense.toLocaleString("en-IN")}`} color="card-rose" />
        <StatCard icon="📋" label={t("total_transactions", "Total Entries")} value={totalEntries} color="card-blue" />
        <StatCard icon="🏷️" label={t("total_categories", "Categories")} value={categoryCount} color="card-purple" />
        <StatCard icon="🔝" label={t("top_category_lbl", "Top Category")} value={topCategory} color="card-orange" />
      </div>

      {/* ── Category Summary ── */}
      <div className="table-section" style={{ marginBottom: 20 }}>
        <div className="section-title">{t("expense_by_category")}</div>
        <table>
          <thead>
            <tr>
              <th>{t("category")}</th>
              <th>{t("total_amount")}</th>
            </tr>
          </thead>
          <tbody>
            {summary.length === 0 ? (
              <tr>
                <td colSpan="2" className="table-empty-state" style={{ textAlign: "center", padding: "12px" }}>
                  {t("no_matching_records")}
                </td>
              </tr>
            ) : (
              summary.map((row, index) => (
                <tr key={index}>
                  <td>{row.category}</td>
                  <td className="amount">₹ {row.total_amount.toLocaleString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Expense Table ── */}
      <div className="table-section">
        <div className="section-title">{t("all_expenses_recorded", "All Expenses")}</div>
        {loading ? (
          <p className="loading-text">{t("loading_pledges", "Loading report...")}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th>{t("category")}</th>
                <th>{t("description")}</th>
                <th>{t("amount")}</th>
                <th>{t("staff_member", "Created By")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty-state" style={{ textAlign: "center", padding: "20px" }}>
                    {t("no_matching_records")}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={index}>
                    <td>{formatTransactionTimestamp(row.date)}</td>
                    <td>{row.category}</td>
                    <td>{row.description}</td>
                    <td className="amount">₹ {row.amount.toLocaleString("en-IN")}</td>
                    <td>{row.created_by}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}