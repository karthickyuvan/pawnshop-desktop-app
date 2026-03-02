export default function PledgeSummaryCards({ summary }) {
  return (
    <div className="summary-grid">
      <div className="summary-card">
        <div className="summary-info">
          <h4>Total Pledges</h4>
          <h2>{summary.total_pledges}</h2>
        </div>
        <div className="icon-box icon-blue">$</div>
      </div>

      <div className="summary-card">
        <div className="summary-info">
          <h4>Total Amount</h4>
          <h2>₹{summary.total_amount.toLocaleString()}</h2>
        </div>
        <div className="icon-box icon-gold">₹</div>
      </div>

      <div className="summary-card">
        <div className="summary-info">
          <h4>Active</h4>
          <h2>{summary.active_count}</h2>
        </div>
        <div className="icon-box icon-green">📅</div>
      </div>

      <div className="summary-card">
        <div className="summary-info">
          <h4>Overdue</h4>
          <h2>{summary.overdue_count}</h2>
        </div>
        <div className="icon-box icon-red">📅</div>
      </div>
    </div>
  );
}