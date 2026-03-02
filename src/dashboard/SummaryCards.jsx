import "./summaryCards.css";

export default function SummaryCards() {
  return (
    <div className="summary-grid">
      <SummaryCard
        title="Total Staff"
        value="3"
        hint="Including active staff"
      />

      <SummaryCard
        title="Active Customers"
        value="128"
        hint="Customers with pledges"
      />

      <SummaryCard
        title="Today Pledges"
        value="₹ 2,45,000"
        hint="Total pledged amount"
      />

      <SummaryCard
        title="Owner Fund Balance"
        value="₹ 8,50,000"
        hint="Available cash"
      />
    </div>
  );
}

function SummaryCard({ title, value, hint }) {
  return (
    <div className="summary-card">
      <div className="summary-title">{title}</div>
      <div className="summary-value">{value}</div>
      <div className="summary-hint">{hint}</div>
    </div>
  );
}
