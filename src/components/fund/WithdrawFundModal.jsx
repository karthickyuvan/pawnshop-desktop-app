


// src/components/fund/WithdrawFundModal.jsx
import { useState } from "react";
import toast from "react-hot-toast"; 
import DenominationTable from "./DenominationTable";
import { withdrawFund } from "../../services/fundServiceApi";

export default function WithdrawFundModal({
  user,
  balance,
  onClose,
  onSuccess,
}) {
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [denoms, setDenoms] = useState({});
  const [amount, setAmount] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [description, setDescription] = useState(""); 
  
  // ── NEW STATE: Added Custom Transaction Date selection ──
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // 💰 Total from denominations
  const totalCash = Object.entries(denoms).reduce((sum, [key, val]) => {
    if (key === "coins") {
      return sum + Number(val || 0);
    }
    return sum + Number(key) * Number(val || 0);
  }, 0);

  const isCash = paymentMethod === "CASH";
  const finalAmount = Number(amount || 0);

  const isAmountMatching = !isCash || (finalAmount > 0 && finalAmount === totalCash);

  const handleWithdraw = async () => {
    if (finalAmount <= 0) {
      toast.error("Please enter a valid withdrawal amount."); 
      return;
    }

    if (finalAmount > balance) {
      toast.error("Insufficient cash balance available."); 
      return;
    }

    if (!isAmountMatching) {
      toast.error("Amount and cash denominations total do not match."); 
      return;
    }

    if (!isCash && !transactionRef.trim()) {
      toast.error(
        paymentMethod === "UPI"
          ? "Please enter the UPI Transaction ID."
          : "Please enter the Bank Transaction Reference."
      ); 
      return;
    }

    const userId = user?.user_id || user?.id;
    if (!userId) {
      toast.error("System Error: Session expired. Please log out and log in again."); 
      return;
    }

    const formattedDenominations = isCash
      ? Object.entries(denoms)
          .filter(([_, q]) => q > 0)
          .map(([d, q]) => {
            if (d === "coins") {
              return [1, Number(q)];
            }
            return [Number(d), Number(q)];
          })
      : [];

    try {
      await withdrawFund({
        createdBy: userId,
        reference: "WITHDRAW",
        description: description.trim() || "Fund Withdrawn", 
        denominations: formattedDenominations,
        paymentMethod,
        transactionRef: transactionRef.trim() || null,
        amount: finalAmount,
        transactionDate, // ── Passed selected date parameter to backend ──
      });

      toast.success("Funds withdrawn successfully!"); 
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Withdrawal failed:", error);
      toast.error("Failed to process withdrawal: " + (error?.message || error)); 
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Withdraw Funds</h3>

        {/* Available Balance Info */}
        <div className="balance-info" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "#eff6ff",
          color: "#2563eb",
          border: "1px solid #bfdbfe",
          padding: "10px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          marginBottom: "22px",
          marginTop: "10px" 
        }}>
          Available Balance: <strong>₹{balance.toLocaleString("en-IN")}</strong>
        </div>

        {/* AMOUNT + PAYMENT METHOD + DATE */}
        <div className="modal-section" style={{ marginTop: "10px" }}>
          {/* Dynamic Flex Row supporting Date selection side-by-side with Amount */}
          <div className="fund-row" style={{ display: "flex", gap: "18px", marginBottom: "18px", width: "100%" }}>
            {/* Date Picker */}
            <div className="fund-col" style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <label className="fund-label">Date</label>
              <input
                className="fund-input"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            {/* AMOUNT */}
            <div className="fund-col" style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <label className="fund-label">Amount</label>
              <input
                className="fund-input"
                type="number"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* PAYMENT METHOD */}
            <div className="fund-col" style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <label className="fund-label">Payment Method</label>
              <select
                className="fund-input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK">Bank</option>
              </select>
            </div>
          </div>

          {/* TRANSACTION REF */}
          {!isCash && (
            <div className="fund-col" style={{ marginTop: "12px" }}>
              <label className="fund-label">
                {paymentMethod === "UPI"
                  ? "UPI Transaction ID"
                  : "Bank Transaction Reference"}
              </label>
              <input
                className="fund-input"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
              />
            </div>
          )}

          {/* DESCRIPTION / NARRATION INPUT ── */}
          <div className="fund-col" style={{ marginTop: "12px", width: "100%" }}>
            <label className="fund-label">Description / Narration</label>
            <input
              className="fund-input"
              placeholder="e.g. Weekly tea expenses, office maintenance"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* CASH DENOMINATIONS */}
        {isCash && (
          <div className="modal-section" style={{ marginTop: "20px" }}>
            <DenominationTable data={denoms} setData={setDenoms} />

            {/* TOTAL BAR */}
            <div
              className={`denom-total-bar ${
                isAmountMatching ? "total-ok" : "total-error"
              }`}
            >
              Total: ₹{totalCash.toLocaleString("en-IN")}
            </div>

            {/* MATCH STATUS MESSAGE */}
            {isAmountMatching ? (
              <p className="success-message">
                ✓ Amount and denominations match
              </p>
            ) : (
              <p className="error-message">
                ✗ Amount and denominations must match
              </p>
            )}
          </div>
        )}

        {/* ACTIONS */}
        <div className="modal-actions">
          <button className="fund-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="fund-btn danger"
            onClick={handleWithdraw}
            disabled={
              !amount ||
              Number(amount) <= 0 ||
              (paymentMethod === "CASH" && !isAmountMatching) ||
              (paymentMethod !== "CASH" && !transactionRef.trim())
            }
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}