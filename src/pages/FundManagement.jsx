import { useEffect, useState } from "react";
import CashSummaryCard from "../components/fund/CashSummaryCard";
import AddFundModal from "../components/fund/AddFundModal";
import WithdrawFundModal from "../components/fund/WithdrawFundModal";
import { getAvailableCash } from "../services/fundServiceApi";
import FundLedger from "./FundLedger";
import "./fundManagement.css"


export default function FundManagement({ user }) {
  const [balance, setBalance] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);


  const loadBalance = () => {
    getAvailableCash().then(setBalance);
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const handleTransactionSuccess = () => {
    loadBalance(); // Refresh Top Card
    setRefreshKey((prev) => prev + 1); // Refresh Ledger Table
  };

  return (
    <div className="fund-page">
      <h2>Fund Management</h2>

      {/* CASH SUMMARY */}
      <CashSummaryCard balance={balance} />

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button className="fund-btn primary" onClick={() => setShowAdd(true)}>
          + Add Funds
        </button>

        <button
          className="fund-btn danger"
          onClick={() => setShowWithdraw(true)}
        >
          − Withdraw Funds
        </button>
      </div>

      {/* MODALS */}
      {showAdd && (
        <AddFundModal
          user={user}
          onClose={() => setShowAdd(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {showWithdraw && (
        <WithdrawFundModal
          user={user}
          balance={balance}
          onClose={() => setShowWithdraw(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

<FundLedger refreshTrigger={refreshKey} />

    </div>
  );
}
