

// version 3 

import { useEffect, useState, useCallback } from "react"; // ✅ Added useCallback
import CashSummaryCard from "../components/fund/CashSummaryCard";
import AddFundModal from "../components/fund/AddFundModal";
import WithdrawFundModal from "../components/fund/WithdrawFundModal";
import { getAvailableCash } from "../services/fundServiceApi";
import FundLedger from "./FundLedger";
import { useLanguage } from "../context/LanguageContext";
import "./fundManagement.css";


export default function FundManagement({ user }) {
  const { t } = useLanguage();
  const [balance, setBalance] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ Wrapped with useCallback to avoid breaking re-render dependency tracking arrays
  const loadBalance = useCallback(() => {
    getAvailableCash()
      .then(setBalance)
      .catch((err) => console.error("Balance loading error:", err));
  }, []);

  // ✅ Keep monitoring refreshKey signals to synchronize parent totals as well!
  useEffect(() => {
    loadBalance();
  }, [loadBalance, refreshKey]); // Dynamic synchronization monitoring hook trace added here

  const handleTransactionSuccess = () => {
    loadBalance(); 
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="fund-page">
      <h2>{t("fund_management")}</h2>

      {/* CASH SUMMARY */}
      <CashSummaryCard balance={balance} />

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", marginLeft: "30px" }}>
        <button className="fund-btn primary" onClick={() => setShowAdd(true)}>
          + {t("add_funds")}
        </button>
        <button className="fund-btn danger" onClick={() => setShowWithdraw(true)}>
          − {t("withdraw_funds")}
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

      {/* FUND LEDGER */}
      {/* <FundLedger refreshTrigger={refreshKey} /> */}
      <FundLedger refreshTrigger={refreshKey} user={user} />
    </div>
  );
}

