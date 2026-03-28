import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./ProfitLossReport.css";

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

function Row({ label, value, highlight }) {
  return (
    <div className={`row ${highlight ? "highlight" : ""}`}>
      <span>{label}</span>
      <strong>₹ {(value || 0).toLocaleString()}</strong>
    </div>
  );
}

export default function ProfitLossReport() {

  const today = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate,   setEndDate]   = useState(today);
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    try {
      setLoading(true);
      const result = await invoke("get_profit_loss_report_cmd", { startDate, endDate });
      setData(result);
    } catch (err) {
      console.error("Report Error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="page-loader">Loading financial report...</div>;
  if (!data)   return <div className="page-loader">No data available</div>;

  const totalIncome = (data.interest_income || 0)
    + (data.processing_fee_income || 0)
    + (data.other_income || 0);

  const outstandingCapital = (data.pledge_loans_issued || 0)
    - (data.pledge_principal_received || 0);

  const isProfit = (data.net_profit || 0) >= 0;

  return (
    <div className="financial-dashboard">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1>Financial Dashboard</h1>
          <p>Profitability &amp; Loan Portfolio Analytics</p>
        </div>
        <div className="filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadReport}>Refresh</button>
        </div>
      </div>

      {/* ── KPI stat cards ── */}
      <div className="stats-grid">
        <StatCard icon="📅" label="Interest Income"    value={`₹${(data.interest_income || 0).toLocaleString()}`}         color="card-teal"   />
        <StatCard icon="🏷️" label="Processing Fees"   value={`₹${(data.processing_fee_income || 0).toLocaleString()}`}   color="card-blue"   />
        <StatCard icon="💹" label="Other Income"       value={`₹${(data.other_income || 0).toLocaleString()}`}            color="card-purple" />
        <StatCard icon="🧾" label="Business Expenses"  value={`₹${(data.business_expenses || 0).toLocaleString()}`}       color="card-rose"   />
        <StatCard icon={isProfit ? "📈" : "📉"}
                  label="Net Profit"
                  value={`₹${(data.net_profit || 0).toLocaleString()}`}
                  color={isProfit ? "card-green" : "card-orange"} />
      </div>

      {/* ── Analytics panels ── */}
      <div className="analytics-grid">

        <div className="card">
          <h3>Profit Summary</h3>
          <Row label="Total Income"    value={totalIncome} />
          <Row label="Total Expenses"  value={data.business_expenses} />
          <div className="divider" />
          <Row label="Net Profit"      value={data.net_profit} highlight />
        </div>

        <div className="card">
          <h3>Pledge Movement</h3>
          <Row label="Loans Issued"        value={data.pledge_loans_issued} />
          <Row label="Principal Returned"  value={data.pledge_principal_received} />
          <div className="divider" />
          <Row label="Outstanding Capital" value={outstandingCapital} highlight />
        </div>

        <div className="card">
          <h3>Interest Yield Analytics</h3>
          <Row label="Loan Portfolio"  value={data.loan_portfolio} />
          <Row label="Interest Earned" value={data.interest_income} />
          <div className="divider" />
          <div className="row highlight">
            <span>Yield</span>
            <strong>{(data.interest_yield_percent || 0).toFixed(2)} %</strong>
          </div>
        </div>

      </div>

      {/* ── Metal Portfolio ── */}
      <div className="card metal-card">
        <h3>Metal Portfolio</h3>
        <table>
          <thead>
            <tr>
              <th>Metal</th>
              <th>Pledged Net</th>
              <th>Pledged Gross</th>
              <th>Closed Net</th>
              <th>Closed Gross</th>
            </tr>
          </thead>
          <tbody>
            {(data.metals || []).map((m, i) => (
              <tr key={m.metal || i}>
                <td>{m.metal}</td>
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