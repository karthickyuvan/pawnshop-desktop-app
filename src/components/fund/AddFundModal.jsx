
// src/components/fund/AddFundModal.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast"; 
import DenominationTable from "./DenominationTable";
import { addFund, getFundLedger } from "../../services/fundServiceApi";

export default function AddFundModal({ user, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [denoms, setDenoms] = useState({});
  const [transactionRef, setTransactionRef] = useState("");
  const [description, setDescription] = useState(""); 
  const [isOpening, setIsOpening] = useState(false);

  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    getFundLedger()
      .then((rows) => {
        if (!rows || rows.length === 0) {
          setIsOpening(true);
        }
      })
      .catch((err) => {
        console.error("Failed to check ledger state:", err);
        toast.error("Failed to verify ledger state.");
      });
  }, []);

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
    if (finalAmount <= 0) {
      toast.error("Please enter a valid amount greater than zero."); 
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
      toast.error("System Error: User session missing. Please re-login."); 
      return;
    }

    try {
      await addFund({
        createdBy: userId,
        reference: isOpening ? "OPENING" : "CAPITAL",
        description: description.trim() || (isOpening ? "Opening Balance" : "Fund Added"),
        paymentMethod,
        transactionRef: transactionRef.trim() || null,
        amount: finalAmount,
        transactionDate,
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

      if (isOpening) {
        toast.success("Opening balance initialized successfully!");
      } else {
        toast.success("Funds added successfully!");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save transaction: " + (error?.message || error)); 
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 style={{ marginBottom: "22px" }}>{isOpening ? "Opening Balance" : "Add Funds"}</h3>

        {/* AMOUNT + PAYMENT METHOD */}
        <div className="modal-section" style={{ marginTop: "10px" }}>
          {/* Flex Row with exact 50/50 or 33/33/33 distribution */}
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
            <div className="fund-col" style={{ marginTop: "12px", width: "100%" }}>
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

          {/* ── DESCRIPTION / NARRATION INPUT ── */}
          <div className="fund-col" style={{ marginTop: "12px", width: "100%" }}>
            <label className="fund-label">Description / Narration</label>
            <input
              className="fund-input"
              placeholder="e.g. Initial capital deposit, daily top-up"
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
        <div className="modal-actions" style={{ marginTop: "28px" }}>
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
              (paymentMethod !== "CASH" && !transactionRef.trim())
            }
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}