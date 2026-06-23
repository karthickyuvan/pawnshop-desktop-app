

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import "./InterestAnalyticsReportPage.css";
import ChartRenderer from "../components/charts/ChartRenderer";

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
        {sub && <div className="stat-card-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function InterestAnalyticsReportPage() {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      const formatToISO = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr; 
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const cleanStartDate = formatToISO(startDate);
      const cleanEndDate = formatToISO(endDate);

      console.log("Sending clean auditing ranges to backend:", cleanStartDate, cleanEndDate);

      const result = await invoke("get_interest_analytics_report_cmd", { 
        startDate: cleanStartDate, 
        endDate: cleanEndDate 
      });
      
      setRows(result.rows || []);
    } catch (err) {
      console.error("Interest analytics error:", err);
    }
  }

  const totalInterest = rows.reduce((sum, r) => sum + (r.interest_amount || 0), 0);
  
  const bestMonth = rows.reduce(
    (max, r) => r.interest_amount > max.interest_amount ? r : max,
    rows[0] || { period: "—", interest_amount: 0 }
  );
  
  const avg = rows.length ? totalInterest / rows.length : 0;

  return (
    <div className="interest-page">
      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>{t("interest_analytics")}</h2>
          <p>{t("interest_analytics_subtitle_desc", "Comprehensive monthly interest tracking (Counter Payments + Auction Recoveries)")}</p>
        </div>
        <div className="filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadReport} className="corporate-btn">{t("load_analysis_btn", "Load Analysis")}</button>
        </div>
      </div>

      {/* ── Corporate Analytics Cards ── */}
      <div className="stats-grid">
        <StatCard icon="💰" label={t("total_interest_revenue_lbl", "Total Interest Revenue")} value={`₹${totalInterest.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} color="card-teal" />
        <StatCard icon="🏆" label={t("highest_yield_month_lbl", "Highest Yield Month")} value={bestMonth.period} sub={`₹${bestMonth.interest_amount.toLocaleString("en-IN")}`} color="card-yellow" />
        <StatCard icon="📊" label={t("avg_monthly_return_lbl", "Average Monthly Return")} value={`₹${Math.floor(avg).toLocaleString("en-IN")}`} color="card-blue" />
        <StatCard icon="📋" label={t("active_months_tracked_lbl", "Active Months Tracked")} value={rows.length} color="card-purple" />
      </div>

      {/* ── Audit Ledger Table ── */}
      <div className="table-section">
        <table>
          <thead>
            <tr>
              <th>{t("accounting_period_hdr", "Accounting Month Period")}</th>
              <th className="text-right">{t("interest_collected_realized_hdr", "Interest Collected Realized")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td><strong>{row.period}</strong></td>
                <td className="amount text-success font-bold" style={{ textAlign: "right" }}>
                  ₹ {row.interest_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="2" style={{ textAlign: "center", color: "#888", padding: "12px" }}>
                  {t("no_interest_revenue_logged", "No historical interest revenues logged in this active date range.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Trend Graph ── */}
      <div className="chart-wrapper-card" style={{ marginTop: "24px", padding: "16px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <ChartRenderer type="line" data={rows} xKey="period" yKey="interest_amount" />
      </div>
    </div>
  );
}