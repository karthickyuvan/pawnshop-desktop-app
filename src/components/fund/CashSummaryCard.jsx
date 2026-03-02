export default function CashSummaryCard({ balance }) {
    return (
      <div className="fund-card cash-summary">
        <span>Available Cash</span>
        <span className="cash-amount">₹ {balance}</span>
      </div>
    );
  }
  