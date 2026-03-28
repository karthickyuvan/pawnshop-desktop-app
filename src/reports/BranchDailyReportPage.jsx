import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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

  const today = new Date().toISOString().split("T")[0];

  const [date,         setDate]         = useState(today);
  const [report,       setReport]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pocketStats,  setPocketStats]  = useState({ total: 0, active: 0, closed: 0 });
  const [loading,      setLoading]      = useState(false);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const [data, tx, pledges] = await Promise.all([
        invoke("get_branch_daily_report_cmd",   { reportDate: date }),
        invoke("get_transaction_details_cmd",   { reportDate: date }),
        invoke("get_pledge_register_report_cmd", { startDate: "2000-01-01", endDate: date }),
      ]);

      setReport(data);
      setTransactions(tx);

      const rows         = pledges?.pledges || [];
      const totalPockets  = rows.filter(r => r.pocket_number != null).length;
      const activePockets = rows.filter(r => r.pocket_number != null && r.status !== "CLOSED").length;
      const closedPockets = rows.filter(r => r.pocket_number != null && r.status === "CLOSED").length;
      setPocketStats({ total: totalPockets, active: activePockets, closed: closedPockets });

    } catch (err) {
      console.error("Report load error:", err);
    }
    setLoading(false);
  }

  return (
    <div className="branch-report-page">

      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>Daily Branch Report</h2>
          <p>Daily cash position and transactions</p>
        </div>
        <div className="report-controls">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <button onClick={loadReport}>Load Report</button>
        </div>
      </div>

      {loading && <p className="loading-text">Loading report...</p>}

      {report && (
        <>
          {/* ── All stat cards ── */}
          <div className="stats-grid">

            {/* Pocket stats */}
            <StatCard icon="🗂"  label="Total Pockets"       value={pocketStats.total}                              color="card-blue"   />
            <StatCard icon="🟢" label="Active Pockets"       value={pocketStats.active}                             color="card-green"  />
            <StatCard icon="🔒" label="Closed Pockets"       value={pocketStats.closed}                             color="card-slate"  />

            {/* Financial stats */}
            <StatCard icon="🏦" label="Opening Balance"      value={`₹${report.opening_balance?.toLocaleString()}`} color="card-blue"   />
            <StatCard icon="📤" label="Loans Issued"         value={`₹${report.loans_issued?.toLocaleString()}`}    color="card-rose"   />
            <StatCard icon="📥" label="Loan Repayments"      value={`₹${report.loan_repayments?.toLocaleString()}`} color="card-green"  />
            <StatCard icon="📅" label="Interest Collected"   value={`₹${report.interest_collected?.toLocaleString()}`} color="card-teal"   />
            <StatCard icon="🏷️" label="Processing Fees"      value={`₹${report.processing_fees?.toLocaleString()}`} color="card-purple" />
            <StatCard icon="💹" label="Other Income"         value={`₹${report.other_income?.toLocaleString()}`}    color="card-yellow" />
            <StatCard icon="🧾" label="Expenses"             value={`₹${report.expenses?.toLocaleString()}`}        color="card-orange" />
            <StatCard icon="📈" label="Total Inflow"         value={`₹${report.total_inflow?.toLocaleString()}`}    color="card-green"  />
            <StatCard icon="📉" label="Total Outflow"        value={`₹${report.total_outflow?.toLocaleString()}`}   color="card-rose"   />
            <StatCard icon="💰" label="Net Cash Flow"        value={`₹${report.net_cash_flow?.toLocaleString()}`}   color={report.net_cash_flow >= 0 ? "card-teal" : "card-orange"} />
            <StatCard icon="🏧" label="Closing Balance"      value={`₹${report.closing_balance?.toLocaleString()}`} color="card-blue"   />

          </div>

          {/* ── Transaction Details ── */}
          <div className="table-section">
            <div className="section-title">Transaction Details</div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Module</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{tx.id}</td>
                    <td>{formatDateTimeIST(tx.transaction_date)}</td>
                    <td>{tx.module_type}</td>
                    <td className={tx.transaction_type === "ADD" ? "add" : "withdraw"}>
                      {tx.transaction_type}
                    </td>
                    <td>₹ {tx.amount.toFixed(2)}</td>
                    <td>{tx.reference    || "—"}</td>
                    <td>{tx.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}