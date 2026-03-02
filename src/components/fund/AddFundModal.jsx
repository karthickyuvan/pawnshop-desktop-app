import { useEffect, useState } from "react";
import DenominationTable from "./DenominationTable";
import { addFund, getFundLedger } from "../../services/fundServiceApi";

export default function AddFundModal({ user, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [denoms, setDenoms] = useState({});
  const [transactionRef, setTransactionRef] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  // 🔍 Detect opening balance
  useEffect(() => {
    getFundLedger().then((rows) => {
      if (!rows || rows.length === 0) {
        setIsOpening(true);
      }
    });
  }, []);

  // 💰 Total from denominations
  const totalCash = Object.entries(denoms).reduce((sum, [key, val]) => {
    if (key === "coins") {
      return sum + Number(val || 0);
    }
    return sum + Number(key) * Number(val || 0);
  }, 0);

  const isCash = paymentMethod === "CASH";
  const finalAmount = Number(amount || 0);

  const isAmountMatching =
    !isCash || (finalAmount > 0 && finalAmount === totalCash);

  const handleSave = async () => {
    // 1. Check Amount
    if (finalAmount <= 0) {
      alert("Enter valid amount");
      return;
    }

    // 2. Check Match
    if (!isAmountMatching) {
      alert("Amount and cash denominations do not match");
      return;
    }

    // 3. Check Transaction Ref
    if (!isCash && !transactionRef) {
      alert("Enter transaction reference");
      return;
    }

    // Extract User ID Safely
    const userId = user?.user_id || user?.id;

    if (!userId) {
      alert("System Error: User ID missing. Please log out and log in again.");
      console.error("User object invalid:", user);
      return;
    }

    // Proceed to Save
    try {
      await addFund({
        createdBy: userId,
        reason: isOpening ? "Opening Balance" : "Fund Added",
        paymentMethod,
        transactionRef,
        amount: finalAmount,
        isOpening,
        denominations: isCash
          ? Object.entries(denoms)
              .filter(([_, q]) => q > 0)
              .map(([d, q]) => {
                if (d === "coins") return [1, Number(q)];
                return [Number(d), Number(q)];
              })
          : [],
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save: " + error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{isOpening ? "Opening Balance" : "Add Funds"}</h3>

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
            className="fund-btn primary"
            onClick={handleSave}
            disabled={
              !amount ||
              Number(amount) <= 0 ||
              (paymentMethod === "CASH" && !isAmountMatching) ||
              (paymentMethod !== "CASH" && !transactionRef)
            }
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}