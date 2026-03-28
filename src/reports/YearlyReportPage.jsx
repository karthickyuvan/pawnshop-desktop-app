import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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
  const [rows,   setRows]   = useState([]);
  const [metals, setMetals] = useState([]);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    try {
      const result = await invoke("get_yearly_report_cmd");
      setRows(result.rows   || []);
      setMetals(result.metals || []);
    } catch (err) {
      console.error("Yearly report error:", err);
    }
  }

  const totalPledges    = rows.reduce((sum, r) => sum + (r.total_pledges    || 0), 0);
  const totalLoanAmount = rows.reduce((sum, r) => sum + (r.total_loan_amount || 0), 0);
  const totalInterest   = rows.reduce((sum, r) => sum + (r.interest_income  || 0), 0);
  const totalExpenses   = rows.reduce((sum, r) => sum + (r.expenses         || 0), 0);
  const totalProfit     = rows.reduce((sum, r) => sum + (r.net_profit       || 0), 0);

  return (
    <div className="yearly-page">

      {/* ── Header ── */}
      <div className="report-header">
        <h2>Yearly Business Report</h2>
        <p>Annual performance overview across all years</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <StatCard icon="📋" label="Total Pledges"   value={totalPledges}                          color="card-blue"   />
        <StatCard icon="🏦" label="Loan Amount"     value={`₹${totalLoanAmount.toLocaleString()}`} color="card-purple" />
        <StatCard icon="📅" label="Interest Earned" value={`₹${totalInterest.toLocaleString()}`}   color="card-teal"   />
        <StatCard icon="🧾" label="Expenses"        value={`₹${totalExpenses.toLocaleString()}`}   color="card-rose"   />
        <StatCard icon={totalProfit >= 0 ? "📈" : "📉"}
                  label="Net Profit"
                  value={`₹${totalProfit.toLocaleString()}`}
                  color={totalProfit >= 0 ? "card-green" : "card-orange"} />
      </div>

      {/* ── Year table ── */}
      <div className="table-section" style={{ marginBottom: 22 }}>
        <div className="section-title">Year-wise Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Pledges</th>
              <th>Loan Amount</th>
              <th>Interest</th>
              <th>Expenses</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><strong>{r.year}</strong></td>
                <td>{r.total_pledges}</td>
                <td>₹ {(r.total_loan_amount || 0).toLocaleString()}</td>
                <td className="interest">₹ {(r.interest_income || 0).toLocaleString()}</td>
                <td className="expense">₹ {(r.expenses        || 0).toLocaleString()}</td>
                <td className={r.net_profit >= 0 ? "profit" : "loss"}>
                  ₹ {(r.net_profit || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Metal Portfolio ── */}
      <div className="table-section">
        <div className="section-title">Metal Portfolio</div>
        <table>
          <thead>
            <tr>
              <th>Metal</th>
              <th>Pledged Net (IN)</th>
              <th>Pledged Gross (IN)</th>
              <th>Closed Net (OUT)</th>
              <th>Closed Gross (OUT)</th>
            </tr>
          </thead>
          <tbody>
            {metals.map((m, i) => (
              <tr key={i}>
                <td><strong>{m.metal}</strong></td>
                <td>{m.pledged_net_weight.toFixed(2)} g</td>
                <td>{m.pledged_gross_weight.toFixed(2)} g</td>
                <td>{m.closed_net_weight.toFixed(2)} g</td>
                <td>{m.closed_gross_weight.toFixed(2)} g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}