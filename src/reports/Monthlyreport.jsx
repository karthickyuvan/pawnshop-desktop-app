import React, { useState } from 'react';
import { invoke } from "@tauri-apps/api/core";
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

const MonthlyReport = () => {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const fetchMonthlyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke('get_monthly_report_cmd', { month: selectedMonth });
      setMonthlyData(data);
    } catch (err) {
      setError(err.toString());
      console.error('Error fetching monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 2,
    }).format(amount);

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long',
    });
  };

  const isProfit = (monthlyData?.net_profit || 0) >= 0;

  return (
    <div className="report-container">

      {/* ── Header ── */}
      <div className="report-header no-print">
        <div>
          <h2>Monthly Report</h2>
          <p>Monthly financial performance summary</p>
        </div>
        <div className="date-selector">
          <label htmlFor="month-select">Report Month:</label>
          <input
            type="month"
            id="month-select"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            max={new Date().toISOString().slice(0, 7)}
          />
          <button onClick={fetchMonthlyReport} className="btn-generate">
            Generate Report
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner" />
          <p>Generating Monthly Report...</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="error-message">
          <h3>Error Loading Report</h3>
          <p>{error}</p>
          <button onClick={fetchMonthlyReport}>Retry</button>
        </div>
      )}

      {monthlyData && (
        <div className="report-content">

          {/* ── Stat cards ── */}
          <div className="stats-grid">
            <StatCard icon="📤" label="Total Loans Issued"   value={formatCurrency(monthlyData.total_loans_issued)}      color="card-rose"   />
            <StatCard icon="📥" label="Total Repayments"     value={formatCurrency(monthlyData.total_loan_repayments)}   color="card-green"  />
            <StatCard icon="📅" label="Interest Collected"   value={formatCurrency(monthlyData.total_interest_collected)} color="card-teal"  />
            <StatCard icon="🧾" label="Operating Expenses"   value={formatCurrency(monthlyData.total_expenses)}          color="card-orange" />
            <StatCard
              icon={isProfit ? "📈" : "📉"}
              label="Net Profit"
              value={formatCurrency(monthlyData.net_profit)}
              color={isProfit ? "card-green" : "card-orange"}
            />
          </div>

          {/* ── P&L Statement ── */}
          <div className="card">
            <div className="card-header">
              <h3>Profit &amp; Loss Statement</h3>
              <span className="report-date-badge">{formatMonth(monthlyData.month)}</span>
            </div>

            <div className="flow-section">
              <h4 className="section-title">
                <span className="indicator positive" /> Revenue
              </h4>
              <div className="flow-item">
                <span className="item-label">Interest Income</span>
                <span className="item-value positive">
                  {formatCurrency(monthlyData.total_interest_collected)}
                </span>
              </div>
            </div>

            <div className="flow-section">
              <h4 className="section-title">
                <span className="indicator negative" /> Expenses
              </h4>
              <div className="flow-item">
                <span className="item-label">Operating Expenses</span>
                <span className="item-value negative">
                  {formatCurrency(monthlyData.total_expenses)}
                </span>
              </div>
            </div>

            <div className="reconciliation">
              <div className="recon-row total">
                <span>Net Profit</span>
                <span className={isProfit ? "positive" : "negative"}>
                  {formatCurrency(monthlyData.net_profit)}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default MonthlyReport;