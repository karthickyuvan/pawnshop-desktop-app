export default function ExpenseStatsCards({ stats }) {

  if (!stats) {
    return <div className="stats-grid">Loading stats...</div>;
  }

  return (
    <div className="stats-grid">

      <div className="stat-card">
        <div className="stat-title">Total Expenses</div>
        <div className="stat-value">
          ₹{stats.total_expense.toLocaleString()}
        </div>
        <div className="stat-sub">All time</div>
      </div>

      <div className="stat-card">
        <div className="stat-title">This Month</div>
        <div className="stat-value">
          ₹{stats.this_month_expense.toLocaleString()}
        </div>
        <div className="stat-sub">Current month</div>
      </div>

      <div className="stat-card">
        <div className="stat-title">Total Categories</div>
        <div className="stat-value">
          {stats.total_categories}
        </div>
        <div className="stat-sub">Active categories</div>
      </div>

      <div className="stat-card">
        <div className="stat-title">Total Transactions</div>
        <div className="stat-value">
          {stats.total_transactions}
        </div>
        <div className="stat-sub">All expenses recorded</div>
      </div>

    </div>
  );
}
