import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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

  const today    = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate,   setEndDate]   = useState(today.toISOString().split("T")[0]);
  const [rows,      setRows]      = useState([]);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    try {
      const result = await invoke("get_interest_analytics_report_cmd", { startDate, endDate });
      setRows(result.rows);
    } catch (err) {
      console.error("Interest analytics error", err);
    }
  }

  const totalInterest = rows.reduce((sum, r) => sum + r.interest_amount, 0);
  const bestMonth     = rows.reduce(
    (max, r) => r.interest_amount > max.interest_amount ? r : max,
    rows[0] || { period: "—", interest_amount: 0 }
  );
  const avg = rows.length ? totalInterest / rows.length : 0;

  return (
    <div className="interest-page">

      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>Interest Analytics</h2>
          <p>Monthly interest income analysis</p>
        </div>
        <div className="filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadReport}>Load</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <StatCard icon="💰" label="Total Interest"   value={`₹${totalInterest.toLocaleString()}`}         color="card-teal"   />
        <StatCard icon="🏆" label="Best Month"       value={bestMonth.period}  sub={`₹${bestMonth.interest_amount.toLocaleString()}`} color="card-yellow" />
        <StatCard icon="📊" label="Average Monthly"  value={`₹${Math.floor(avg).toLocaleString()}`}       color="card-blue"   />
        <StatCard icon="📋" label="Total Months"     value={rows.length}                                   color="card-purple" />
      </div>

      {/* ── Table ── */}
      <div className="table-section">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Interest Collected</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{row.period}</td>
                <td className="amount">₹ {row.interest_amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Chart ── */}
      <ChartRenderer type="line" data={rows} xKey="period" yKey="interest_amount" />

    </div>
  );
}