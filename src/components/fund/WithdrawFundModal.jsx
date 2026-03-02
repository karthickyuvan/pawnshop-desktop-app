import { useState } from "react";
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
    // 1. Validation
    if (finalAmount <= 0) {
      alert("Enter valid amount");
      return;
    }

    if (finalAmount > balance) {
      alert("Insufficient cash balance");
      return;
    }

    if (!isAmountMatching) {
      alert("Amount and cash denominations do not match");
      return;
    }

    if (!isCash && !transactionRef) {
      alert("Enter transaction reference");
      return;
    }

    // 2. FIX: Get User ID safely
    const userId = user?.user_id || user?.id;
    if (!userId) {
      alert("System Error: User ID missing. Please log out and log in again.");
      return;
    }

    // 3. Prepare Denominations
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

    // 4. FIX: Try/Catch Block
    try {
      await withdrawFund({
        createdBy: userId, // Use the safe ID
        reason: "Fund Withdrawn",
        denominations: formattedDenominations,
        paymentMethod,
        transactionRef,
        amount: finalAmount,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Failed to withdraw: " + error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Withdraw Funds</h3>

        {/* Available Balance Info */}
        <div className="balance-info">
          Available Balance: <strong>₹{balance.toLocaleString("en-IN")}</strong>
        </div>

        {/* AMOUNT + PAYMENT METHOD */}
        <div className="modal-section">
          <div className="fund-row">
            {/* AMOUNT */}
            <div className="fund-col">
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
            <div className="fund-col">
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
            <div className="fund-col">
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
        </div>

        {/* CASH DENOMINATIONS */}
        {isCash && (
          <div className="modal-section">
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
              (paymentMethod !== "CASH" && !transactionRef)
            }
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}