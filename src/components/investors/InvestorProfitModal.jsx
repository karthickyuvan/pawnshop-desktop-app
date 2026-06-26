

// // version 4 
// import { useState, useEffect } from "react";
// import toast from "react-hot-toast"; // 🚀 Imported toast
// import { useLanguage } from "../../context/LanguageContext"; 
// import CashDenominationInput, {
//   emptyDenominations,
//   calcDenomTotal,
// } from "../../constants/CashDenominationInput";
// import { getInvestorInterestPreview } from "../../services/investorInvestmentApi";
// import "./InvestorInvestmentModal.css";

// export default function InvestorProfitModal({
//   investors = [],
//   onClose,
//   onSave,
// }) {
//   const { t } = useLanguage(); 
//   const [formData, setFormData] = useState({
//     investor_id: "",
//     profit_amount: "",
//     payment_method: "CASH",
//     remarks: "",
//     transaction_date: new Date().toISOString().split("T")[0],
//   });

//   const [denominations, setDenominations] = useState(emptyDenominations());
//   const [errors, setErrors] = useState({});
//   const [preview, setPreview] = useState(null);
//   const [monthsToPay, setMonthsToPay] = useState(1);
//   const [isSubmitting, setIsSubmitting] = useState(false); // 🚀 Track submission state

//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));

//     setErrors((prev) => ({
//       ...prev,
//       [e.target.name]: null,
//     }));
//   };

//   const handleMonthsChange = (e) => {
//     if (!preview) return;
    
//     const val = Math.max(1, Math.min(preview.total_months, parseInt(e.target.value) || 1));
//     setMonthsToPay(val);

//     const monthlyRate = preview.principal_amount * (preview.interest_percentage / 100);
//     const calculatedPayable = Math.floor(monthlyRate * val);

//     setFormData((prev) => ({
//       ...prev,
//       profit_amount: calculatedPayable,
//     }));
//   };

//   const handleSubmit = async () => {
//     const newErrors = {};

//     if (!formData.investor_id) {
//       newErrors.investor_id = t("select_investor_alert", "Select Investor");
//     }

//     if (!formData.profit_amount || Number(formData.profit_amount) <= 0) {
//       newErrors.profit_amount = t("fixed_interest_required_alert", "Enter Profit Amount");
//     }

//     if (formData.payment_method === "CASH") {
//       const total = calcDenomTotal(denominations);

//       if (total !== Number(formData.profit_amount)) {
//         const errorMsg = `${t("denomination")} ${t("total")} ${t("password_not_match", "mismatch")}`;
//         newErrors.denominations = errorMsg;
//         toast.error(errorMsg); // 🚀 Notify globally with a clear toast alert
//       }
//     }

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     setErrors({});
//     setIsSubmitting(true);

//     try {
//       await onSave({
//         investor_id: Number(formData.investor_id),
//         profit_amount: Number(formData.profit_amount),
//         payment_method: formData.payment_method,
//         remarks: formData.remarks || null,
//         transaction_date: formData.transaction_date,
//         denominations:
//           formData.payment_method === "CASH"
//             ? Object.entries(denominations)
//                 .filter(([, qty]) => Number(qty) > 0)
//                 .map(([denom, qty]) => [Number(denom), Number(qty)])
//             : [],
//         months_paid: monthsToPay,
//       });

//       toast.success(t("payout_processed_success", "Profit payout processed successfully!")); // 🚀 Success confirmation
//       if (onClose) onClose();
//     } catch (err) {
//       console.error(err);
//       toast.error(t("operation_failed", "Failed to process payment: ") + (err?.message || err));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   useEffect(() => {
//     if (!formData.investor_id) {
//       setPreview(null);
//       return;
//     }
//     loadPreview();
//   }, [formData.investor_id]);

//   const loadPreview = async () => {
//     try {
//       const data = await getInvestorInterestPreview(
//         Number(formData.investor_id),
//       );
//       setPreview(data);
//       setMonthsToPay(data.total_months || 1);
//       setFormData((prev) => ({
//         ...prev,
//         profit_amount: Number(data.accrued_interest || 0),
//       }));
//     } catch (err) {
//       console.error(err);
//       toast.error(t("failed_to_load_preview", "Failed to load interest summary snapshot.")); // 🚀 Async failure backup
//     }
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="investment-modal">
//         <div className="modal-header">
//           <h2>{t("pay_profit")}</h2>
//           <button onClick={onClose} disabled={isSubmitting}>✕</button>
//         </div>

//         <div className="modal-body">
//           <div className="form-group">
//             <label>{t("investor_lbl", "Investor")}</label>
//             <select
//               name="investor_id"
//               value={formData.investor_id}
//               onChange={handleChange}
//               disabled={isSubmitting}
//             >
//               <option value="">{t("search_investor", "Select Investor")}</option>
//               {investors
//                 .filter((i) => i.is_active)
//                 .map((inv) => (
//                   <option key={inv.id} value={inv.id}>
//                     {inv.investor_name}
//                   </option>
//                 ))}
//             </select>

//             {errors.investor_id && (
//               <span className="field-error">{errors.investor_id}</span>
//             )}
//           </div>

//           {preview && Number(preview.accrued_interest) === 0 && (
//             <div style={{
//               backgroundColor: "#fef2f2",
//               color: "#991b1b",
//               border: "1px solid #fca5a5",
//               borderRadius: "8px",
//               padding: "12px 16px",
//               marginBottom: "16px",
//               fontSize: "0.875rem",
//               fontWeight: "600",
//               lineHeight: "1.4"
//             }}>
//               ℹ️ {t("investors_all_paid_msg")}
//             </div>
//           )}

//           {preview && (
//             <div className="investor-interest-preview">
//               <div className="preview-title">{t("account_summary", "Interest Summary")}</div>

//               <div className="preview-row">
//                 <span>{t("principal_amount")}</span>
//                 <strong>
//                   ₹{Number(preview.principal_amount || 0).toLocaleString("en-IN")}
//                 </strong>
//               </div>

//               <div className="preview-row">
//                 <span>{t("rate", "Interest Rate")}</span>
//                 <strong>{preview.interest_percentage || 0}%</strong>
//               </div>

//               <div className="preview-row">
//                 <span>{t("total_months_available_lbl", "Total Months Available")}</span>
//                 <strong>{preview.total_months || 0} {preview.total_months === 1 ? t("month") : t("months")}</strong>
//               </div>

//               <div className="preview-row">
//                 <span>{t("interest_balance", "Accrued Interest (Total)")}</span>
//                 <strong className="interest-value">
//                   ₹{Number(preview.accrued_interest || 0).toLocaleString("en-IN")}
//                 </strong>
//               </div>
//             </div>
//           )}

//           {preview && (
//             <div className="form-row">
//               <div className="form-group">
//                 <label>{t("months_to_pay_lbl", "Months to Pay")} *</label>
//                 <input
//                   type="number"
//                   min="1"
//                   max={preview.total_months}
//                   value={monthsToPay}
//                   onChange={handleMonthsChange}
//                   disabled={isSubmitting}
//                   style={{ fontWeight: "700", color: "#2563eb" }}
//                 />
//                 <small style={{ color: "#64748b" }}>{t("max_available_lbl", "Max available")}: {preview.total_months}</small>
//               </div>

//               <div className="form-group">
//                 <label>{t("interest_payable_lbl", "Interest Amount Payable")}</label>
//                 <input
//                   type="number"
//                   value={formData.profit_amount}
//                   readOnly
//                   className="readonly-input"
//                   style={{ fontWeight: "700", color: "#16a34a" }}
//                 />
//                 {errors.profit_amount && (
//                   <span className="field-error">{errors.profit_amount}</span>
//                 )}
//               </div>
//             </div>
//           )}

//           <div className="form-row">
//             <div className="form-group">
//               <label>{t("payment_method")}</label>
//               <select
//                 name="payment_method"
//                 value={formData.payment_method}
//                 onChange={handleChange}
//                 disabled={isSubmitting}
//               >
//                 <option value="CASH">{t("cash")}</option>
//                 <option value="UPI">{t("upi")}</option>
//                 <option value="BANK">{t("bank")}</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label>{t("date", "Transaction Date")}</label>
//               <input
//                 type="date"
//                 name="transaction_date"
//                 value={formData.transaction_date}
//                 onChange={handleChange}
//                 disabled={isSubmitting}
//               />
//             </div>
//           </div>

//           {formData.payment_method === "CASH" && (
//             <>
//               <CashDenominationInput
//                 title={t("cash_denominations")}
//                 data={denominations}
//                 setData={setDenominations}
//                 showTotal={true}
//               />
//               {errors.denominations && (
//                 <span className="field-error">{errors.denominations}</span>
//               )}
//             </>
//           )}

//           <div className="form-group">
//             <label>{t("narration", "Remarks")}</label>
//             <textarea
//               rows="2"
//               name="remarks"
//               value={formData.remarks}
//               onChange={handleChange}
//               disabled={isSubmitting}
//               placeholder={t("optional_details", "e.g. Settled financial dues")}
//             />
//           </div>
//         </div>

//         <div className="modal-overlay-footer">
//           <button onClick={onClose} disabled={isSubmitting}>{t("cancel")}</button>
//           <button 
//             onClick={handleSubmit} 
//             disabled={!preview || Number(preview.accrued_interest) <= 0 || isSubmitting}
//           >
//             {isSubmitting ? "..." : t("pay_profit")}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }












// src/components/investor/InvestorProfitModal.jsx

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast"; 
import { useLanguage } from "../../context/LanguageContext"; 
import { autoFillDenominations } from "../../utils/cashDenominationManager"; 
import CashDenominationInput, {
  emptyDenominations,
  calcDenomTotal,
} from "../../constants/CashDenominationInput";
import { getInvestorInterestPreview } from "../../services/investorInvestmentApi";
import "./InvestorInvestmentModal.css";

export default function InvestorProfitModal({
  investors = [],
  onClose,
  onSave,
}) {
  const { t } = useLanguage(); 
  const [formData, setFormData] = useState({
    investor_id: "",
    profit_amount: "",
    payment_method: "CASH",
    remarks: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  // ── 🟢 RESTORED: Must be initialized with emptyDenominations() for CashDenominationInput to work ──
  const [denominations, setDenominations] = useState(emptyDenominations());
  
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [monthsToPay, setMonthsToPay] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const cashTotal = calcDenomTotal(denominations);
  const isCash = formData.payment_method === "CASH";

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setErrors((prev) => ({
      ...prev,
      [e.target.name]: null,
    }));
  };

  const handleMonthsChange = (e) => {
    if (!preview) return;
    
    const val = Math.max(1, Math.min(preview.total_months, parseInt(e.target.value) || 1));
    setMonthsToPay(val);

    const monthlyRate = preview.principal_amount * (preview.interest_percentage / 100);
    const calculatedPayable = Math.floor(monthlyRate * val);

    setFormData((prev) => ({
      ...prev,
      profit_amount: calculatedPayable,
    }));
  };

  // ── 🟢 AUTO FILL CASH DENOMINATIONS FROM REVENUE VAULT STOCK ──
  const handleAutoFill = async () => {
    const targetAmount = Number(formData.profit_amount);
    if (targetAmount <= 0) {
      toast.error("Please enter a valid Profit Amount first to auto-fill.");
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

  // ── 🟢 DYNAMIC VALIDATION GUARD EVALUATION FOR SUBMIT BUTTON ──
  const canSave = useMemo(() => {
    if (isSubmitting) return false;
    if (!formData.investor_id) return false;
    if (!preview || Number(preview.accrued_interest) <= 0) return false;

    const targetAmount = Number(formData.profit_amount);
    if (isNaN(targetAmount) || targetAmount <= 0) return false;

    if (isCash && Math.round(cashTotal) !== Math.round(targetAmount)) {
      return false;
    }

    return true;
  }, [formData, cashTotal, isCash, preview, isSubmitting]);

  const handleSubmit = async () => {
    if (!canSave) return;

    setErrors({});
    setIsSubmitting(true);

    try {
      await onSave({
        investor_id: Number(formData.investor_id),
        profit_amount: Number(formData.profit_amount),
        payment_method: formData.payment_method,
        remarks: formData.remarks || null,
        transaction_date: formData.transaction_date,
        denominations:
          formData.payment_method === "CASH"
            ? Object.entries(denominations)
                .filter(([, qty]) => Number(qty) > 0)
                .map(([denom, qty]) => [Number(denom), Number(qty)])
            : [],
        months_paid: monthsToPay,
      });

      toast.success(t("payout_processed_success", "Profit payout processed successfully!")); 
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      toast.error(t("operation_failed", "Failed to process payment: ") + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!formData.investor_id) {
      setPreview(null);
      return;
    }
    loadPreview();
  }, [formData.investor_id]);

  const loadPreview = async () => {
    try {
      const data = await getInvestorInterestPreview(
        Number(formData.investor_id),
      );
      setPreview(data);
      setMonthsToPay(data.total_months || 1);
      setFormData((prev) => ({
        ...prev,
        profit_amount: Number(data.accrued_interest || 0),
      }));
    } catch (err) {
      console.error(err);
      toast.error(t("failed_to_load_preview", "Failed to load interest summary snapshot.")); 
    }
  };

  const cashDifference = Number(formData.profit_amount) - cashTotal;

  return (
    <div className="modal-overlay">
      <div className="investment-modal" style={{ maxWidth: "800px" }}> {/* Expanded max-width for side-by-side row */}
        <div className="modal-header">
          <h2>{t("pay_profit")}</h2>
          <button onClick={onClose} disabled={isSubmitting}>✕</button>
        </div>

        <div className="modal-body">
          
          {/* ── 🟢 SIDE-BY-SIDE FIELDS ROW (Desktop Only) ── */}
          <div className="form-row-three" style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
            
            {/* 1. Investor Selection */}
            <div className="form-group" style={{ flex: 1.2, marginBottom: 0 }}>
              <label>{t("investor_lbl", "Investor")}</label>
              <select
                name="investor_id"
                value={formData.investor_id}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="">{t("search_investor", "Select Investor")}</option>
                {investors
                  .filter((i) => i.is_active)
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

            {/* 2. Payment Method */}
            <div className="form-group" style={{ flex: 0.9, marginBottom: 0 }}>
              <label>{t("payment_method")}</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="CASH">{t("cash")}</option>
                <option value="UPI">{t("upi")}</option>
                <option value="BANK">{t("bank")}</option>
              </select>
            </div>

            {/* 3. Transaction Date */}
            <div className="form-group" style={{ flex: 0.9, marginBottom: 0 }}>
              <label>{t("date", "Transaction Date")}</label>
              <input
                type="date"
                name="transaction_date"
                value={formData.transaction_date}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

          </div>

          {preview && Number(preview.accrued_interest) === 0 && (
            <div style={{
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "0.875rem",
              fontWeight: "600",
              lineHeight: "1.4"
            }}>
              ℹ️ {t("investors_all_paid_msg")}
            </div>
          )}

          {preview && (
            <div className="investor-interest-preview" style={{ marginTop: "16px" }}>
              <div className="preview-title">{t("account_summary", "Interest Summary")}</div>

              <div className="preview-row">
                <span>{t("principal_amount")}</span>
                <strong>
                  ₹{Number(preview.principal_amount || 0).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="preview-row">
                <span>{t("rate", "Interest Rate")}</span>
                <strong>{preview.interest_percentage || 0}%</strong>
              </div>

              <div className="preview-row">
                <span>{t("total_months_available_lbl", "Total Months Available")}</span>
                <strong>{preview.total_months || 0} {preview.total_months === 1 ? t("month") : t("months")}</strong>
              </div>

              <div className="preview-row">
                <span>{t("interest_balance", "Accrued Interest (Total)")}</span>
                <strong className="interest-value">
                  ₹{Number(preview.accrued_interest || 0).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>
          )}

          {preview && (
            <div className="form-row" style={{ marginTop: "16px" }}>
              <div className="form-group">
                <label>{t("months_to_pay_lbl", "Months to Pay")} *</label>
                <input
                  type="number"
                  min="1"
                  max={preview.total_months}
                  value={monthsToPay}
                  onChange={handleMonthsChange}
                  disabled={isSubmitting}
                  style={{ fontWeight: "700", color: "#2563eb" }}
                />
                <small style={{ color: "#64748b" }}>{t("max_available_lbl", "Max available")}: {preview.total_months}</small>
              </div>

              <div className="form-group">
                <label>{t("interest_payable_lbl", "Interest Amount Payable")}</label>
                <input
                  type="number"
                  value={formData.profit_amount}
                  readOnly
                  className="readonly-input"
                  style={{ fontWeight: "700", color: "#16a34a" }}
                />
                {errors.profit_amount && (
                  <span className="field-error">{errors.profit_amount}</span>
                )}
              </div>
            </div>
          )}

          {formData.payment_method === "CASH" && (
            <div style={{ marginTop: "16px", marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155", margin: 0 }}>
                  {t("cash_denominations")}
                </label>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isSubmitting || !formData.profit_amount || Number(formData.profit_amount) <= 0}
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
                  ✨ Auto Fill (₹{Number(formData.profit_amount).toLocaleString()})
                </button>
              </div>

              <CashDenominationInput
                data={denominations}
                setData={setDenominations}
                showTotal={true}
              />

              {/* ── REAL-TIME CASH ALLOCATION INDICATOR ── */}
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
                  ? "✅ Cash Allocation Matches Profit Amount"
                  : `Remaining to allocate: ₹${cashDifference.toLocaleString()}`}
              </div>

              {errors.denominations && (
                <span className="field-error" style={{ display: "block", marginTop: "6px" }}>{errors.denominations}</span>
              )}
            </div>
          )}

          <div className="form-group" style={{ marginTop: "16px" }}>
            <label>{t("narration", "Remarks")}</label>
            <textarea
              rows="2"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t("optional_details", "e.g. Settled financial dues")}
            />
          </div>
        </div>

        <div className="modal-overlay-footer" style={{ borderTop: "1px solid #e5e7eb", padding: "18px 24px", display: "flex", justifyContent: "flex-end", gap: "12px", backgroundColor: "#f8fafc" }}>
          <button className="cancel-btn" onClick={onClose} disabled={isSubmitting}>{t("cancel")}</button>
          <button 
            className="save-btn" 
            onClick={handleSubmit} 
            disabled={!canSave}
            style={{
              opacity: canSave ? 1 : 0.6,
              cursor: canSave ? "pointer" : "not-allowed",
              backgroundColor: canSave ? "#2563eb" : "#9ca3af" 
            }}
          >
            {isSubmitting ? `${t("processing")}…` : t("pay_profit", "Pay Profit")}
          </button>
        </div>
      </div>
    </div>
  );
}