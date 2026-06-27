
// src/components/investor/InvestorWithdrawModal.jsx

import { useState, useMemo } from "react";
import toast from "react-hot-toast"; 
import { useLanguage } from "../../context/LanguageContext"; 
import { autoFillDenominations } from "../../utils/cashDenominationManager"; 
import CashDenominationInput, {
  emptyDenominations,
  calcDenomTotal,
} from "../../constants/CashDenominationInput";

import "./InvestorInvestmentModal.css";

export default function InvestorWithdrawModal({
  investors = [],
  onClose,
  onSave,
}) {
  const { t } = useLanguage(); 
  const [formData, setFormData] = useState({
    investor_id: "",
    amount: "",
    payment_method: "CASH",
    remarks: "",
    transaction_ref: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const [denominations, setDenominations] = useState(emptyDenominations());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Get selected investor details for live balance checks and hint
  const selectedInvestor = investors.find(
    (inv) => String(inv.id) === String(formData.investor_id),
  );

  const cashTotal = calcDenomTotal(denominations);
  const isCash = formData.payment_method === "CASH";

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  };

  // Auto fill cash denominations from drawer stock
  const handleAutoFill = async () => {
    const targetAmount = Number(formData.amount);
    if (targetAmount <= 0) {
      toast.error("Please enter a valid Withdrawal Amount first to auto-fill.");
      return;
    }

    const response = await autoFillDenominations(targetAmount);
    if (!response.success) {
      toast.error("Not enough physical cash available in the vault drawer stock.");
      return;
    }

    setDenominations(response.denominations);
    toast.success("Optimal denomination quantities distributed.");
  };

  // Dynamic validation guard evaluation for submit button
  const canSave = useMemo(() => {
    if (loading) return false;
    if (!formData.investor_id) return false;
    
    const targetAmount = Number(formData.amount);
    if (isNaN(targetAmount) || targetAmount <= 0) return false;

    if (selectedInvestor && targetAmount > Number(selectedInvestor.current_balance || 0)) {
      return false;
    }

    if (isCash && Math.round(cashTotal) !== Math.round(targetAmount)) {
      return false;
    }

    return true;
  }, [formData, cashTotal, isCash, selectedInvestor, loading]);

  const handleSubmit = async () => {
    if (!canSave) return;

    setErrors({});
    setLoading(true);

    try {
      await onSave({
        investor_id: Number(formData.investor_id),
        amount: Number(formData.amount),
        payment_method: formData.payment_method,
        remarks: formData.remarks || null,
        transaction_ref: formData.transaction_ref || null,
        transaction_date: formData.transaction_date,
        denominations:
          formData.payment_method === "CASH"
            ? Object.entries(denominations)
                .filter(([, qty]) => Number(qty) > 0)
                .map(([denom, qty]) => [Number(denom), Number(qty)])
            : [],
      });
      
      toast.success(t("withdrawal_processed_success", "Capital withdrawal processed successfully!")); 
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      const rawError = err?.toString() || t("operation_failed", "Withdrawal failed. Please try again.");
      toast.error(rawError); 
    } finally {
      setLoading(false);
    }
  };

  const cashDifference = Number(formData.amount) - cashTotal;

  return (
    <div className="modal-overlay">
      <div className="investment-modal" style={{ maxWidth: "800px" }}> {/* Expanded max-width for side-by-side row */}
        <div className="modal-header">
          <h2>{t("withdraw_capital", "Investor Withdrawal")}</h2>
          <button onClick={onClose} disabled={loading}>✕</button>
        </div>

        <div className="modal-body">
          
          {/* ── 🟢 SIDE-BY-SIDE FIELDS ROW ── */}
          <div className="form-row-three" style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
            
            {/* 1. Investor Selection */}
            <div className="form-group" style={{ flex: 1.2, marginBottom: 0 }}>
              <label>{t("investor_lbl", "Investor")}</label>
              <select
                name="investor_id"
                value={formData.investor_id}
                onChange={handleChange}
                disabled={loading}
                className={errors.investor_id ? "input-error" : ""}
              >
                <option value="">{t("search_investor", "Select Investor")}</option>
                {investors
                  .filter((inv) => inv.is_active)
                  .map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.investor_name}
                    </option>
                  ))}
              </select>
              {errors.investor_id && (
                <span className="field-error">{errors.investor_id}</span>
              )}
            </div>

            {/* 2. Withdrawal Amount */}
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>{t("amount", "Withdrawal Amount")}</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                disabled={loading}
                className={errors.amount ? "input-error" : ""}
              />
              {errors.amount && (
                <span className="field-error">{errors.amount}</span>
              )}
              {selectedInvestor && selectedInvestor.current_balance != null && (
                <span className="field-hint">
                  {t("available_balance_lbl", "Available")}: ₹
                  {Number(selectedInvestor.current_balance).toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* 3. Payment Method */}
            <div className="form-group" style={{ flex: 0.8, marginBottom: 0 }}>
              <label>{t("payment_method", "Payment Method")}</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="CASH">{t("cash")}</option>
                <option value="UPI">{t("upi")}</option>
                <option value="BANK">{t("bank")}</option>
              </select>
            </div>

          </div>

          {/* ── Denominations Section ── */}
          {formData.payment_method === "CASH" && (
            <div style={{ marginTop: "16px", marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155", margin: 0 }}>
                  {t("cash_denominations")}
                </label>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={loading || !formData.amount || Number(formData.amount) <= 0}
                  style={{
                    padding: "4px 10px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px dashed #3b82f6",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  ✨ Auto Fill (₹{Number(formData.amount).toLocaleString()})
                </button>
              </div>

              <CashDenominationInput
                data={denominations}
                setData={setDenominations}
                showTotal={true}
              />

              {/* Real-time cash allocation indicator */}
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  textAlign: "center",
                  background: cashDifference === 0 ? "#ecfdf5" : "#fff1f2",
                  color: cashDifference === 0 ? "#059669" : "#e11d48",
                  border: `1px solid ${cashDifference === 0 ? "#10b981" : "#f43f5e"}`
                }}
              >
                {cashDifference === 0
                  ? "✅ Cash Allocation Matches Withdrawal Amount"
                  : `Remaining to allocate: ₹${cashDifference.toLocaleString()}`}
              </div>

              {errors.denominations && (
                <span className="field-error" style={{ display: "block", marginTop: "6px" }}>{errors.denominations}</span>
              )}
            </div>
          )}

          {/* ── Remarks ── */}
          <div className="form-group" style={{ marginTop: "16px" }}>
            <label>{t("narration", "Remarks")}</label>
            <textarea
              rows="3"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              disabled={loading}
              placeholder={t("optional_details", "Optional notes")}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </button>
          <button 
            className="save-btn" 
            onClick={handleSubmit} 
            disabled={!canSave}
            style={{
              opacity: canSave ? 1 : 0.6,
              cursor: canSave ? "pointer" : "not-allowed",
              backgroundColor: canSave ? "#dc2626" : "#9ca3af" 
            }}
          >
            {loading ? `${t("processing")}…` : t("withdraw_funds", "Withdraw")}
          </button>
        </div>
      </div>
    </div>
  );
}