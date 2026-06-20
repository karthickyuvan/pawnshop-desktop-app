// import { useState } from "react";
// import CashDenominationInput, {
//   emptyDenominations,
//   calcDenomTotal,
// } from "../../constants/CashDenominationInput";

// import "./InvestorInvestmentModal.css";

// export default function InvestorWithdrawModal({
//   investors = [],
//   onClose,
//   onSave,
// }) {
//   const [formData, setFormData] = useState({
//     investor_id: "",
//     amount: "",
//     payment_method: "CASH",
//     remarks: "",
//     transaction_ref: "",
//     transaction_date: new Date().toISOString().split("T")[0],
//   });

//   const [denominations, setDenominations] = useState(emptyDenominations());

//   // { field: "message" } for field-level errors
//   // { info: "message" }  for backend/balance info
//   const [errors, setErrors] = useState({});
//   const [infoMsg, setInfoMsg] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//     // Clear field error on change
//     setErrors((prev) => ({ ...prev, [e.target.name]: null }));
//     setInfoMsg(null);
//   };

//   const handleSubmit = async () => {
//     const newErrors = {};

//     if (!formData.investor_id) {
//       newErrors.investor_id = "Please select an investor.";
//     }

//     if (!formData.amount || Number(formData.amount) <= 0) {
//       newErrors.amount = "Enter a valid withdrawal amount.";
//     }

//     if (formData.payment_method === "CASH") {
//       const total = calcDenomTotal(denominations);
//       if (total !== Number(formData.amount)) {
//         newErrors.denominations = `Denomination total ₹${total.toLocaleString()} does not match amount ₹${Number(formData.amount).toLocaleString()}.`;
//       }
//     }

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     setErrors({});
//     setInfoMsg(null);
//     setLoading(true);

//     try {
//       await onSave({
//         investor_id: Number(formData.investor_id),
//         amount: Number(formData.amount),
//         payment_method: formData.payment_method,
//         remarks: formData.remarks || null,
//         transaction_ref: formData.transaction_ref || null,
//         transaction_date: formData.transaction_date,
//         denominations:
//           formData.payment_method === "CASH"
//             ? Object.entries(denominations)
//                 .filter(([, qty]) => Number(qty) > 0)
//                 .map(([denom, qty]) => [Number(denom), Number(qty)])
//             : [],
//       });
//     } catch (err) {
//       // Parse backend error messages like:
//       // "Investor: karthick, Balance: 350000, Requested: 500000"
//       const raw = err?.toString() || "Withdrawal failed. Please try again.";
//       setInfoMsg({ type: "error", text: raw });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Get selected investor details for live balance hint
//   const selectedInvestor = investors.find(
//     (inv) => String(inv.id) === String(formData.investor_id),
//   );

//   return (
//     <div className="modal-overlay">
//       <div className="investment-modal">
//         <div className="modal-header">
//           <h2>Investor Withdrawal</h2>
//           <button onClick={onClose}>✕</button>
//         </div>

//         <div className="modal-body">
//           {/* ── Global info / error banner ── */}
//           {infoMsg && (
//             <div
//               className={`form-info-banner ${infoMsg.type === "error" ? "form-info-banner--error" : "form-info-banner--success"}`}
//             >
//               {infoMsg.type === "error" ? "⚠️" : "✅"} {infoMsg.text}
//             </div>
//           )}

//           {/* ── Investor ── */}
//           <div className="form-group">
//             <label>Investor</label>
//             <select
//               name="investor_id"
//               value={formData.investor_id}
//               onChange={handleChange}
//               className={errors.investor_id ? "input-error" : ""}
//             >
//               <option value="">Select Investor</option>

//               {investors
//                 .filter((inv) => inv.is_active)
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

//           {/* ── Amount ── */}
//           <div className="form-group">
//             <label>Withdrawal Amount</label>
//             <input
//               type="number"
//               name="amount"
//               value={formData.amount}
//               onChange={handleChange}
//               className={errors.amount ? "input-error" : ""}
//             />
//             {errors.amount && (
//               <span className="field-error">{errors.amount}</span>
//             )}
//             {/* Live hint: show selected investor's balance */}
//             {selectedInvestor && selectedInvestor.current_balance != null && (
//               <span className="field-hint">
//                 Available balance: ₹
//                 {Number(selectedInvestor.current_balance).toLocaleString()}
//               </span>
//             )}
//           </div>

//           {/* ── Payment Method ── */}
//           <div className="form-group">
//             <label>Payment Method</label>
//             <select
//               name="payment_method"
//               value={formData.payment_method}
//               onChange={handleChange}
//             >
//               <option value="CASH">CASH</option>
//               <option value="UPI">UPI</option>
//               <option value="BANK">BANK</option>
//             </select>
//           </div>

//           {/* ── Denominations ── */}
//           {formData.payment_method === "CASH" && (
//             <>
//               <CashDenominationInput
//                 title="Cash Denominations"
//                 data={denominations}
//                 setData={setDenominations}
//                 showTotal={true}
//               />
//               {errors.denominations && (
//                 <span className="field-error">{errors.denominations}</span>
//               )}
//             </>
//           )}

//           {/* ── Remarks ── */}
//           <div className="form-group">
//             <label>Remarks</label>
//             <textarea
//               rows="3"
//               name="remarks"
//               value={formData.remarks}
//               onChange={handleChange}
//             />
//           </div>
//         </div>

//         <div className="modal-footer">
//           <button onClick={onClose} disabled={loading}>
//             Cancel
//           </button>
//           <button onClick={handleSubmit} disabled={loading}>
//             {loading ? "Processing…" : "Withdraw"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }




// import { useState } from "react";
// import { useLanguage } from "../../context/LanguageContext"; // ✅ Imported custom language hook
// import CashDenominationInput, {
//   emptyDenominations,
//   calcDenomTotal,
// } from "../../constants/CashDenominationInput";

// import "./InvestorInvestmentModal.css";

// export default function InvestorWithdrawModal({
//   investors = [],
//   onClose,
//   onSave,
// }) {
//   const { t } = useLanguage(); // ✅ Initialized translation hook
//   const [formData, setFormData] = useState({
//     investor_id: "",
//     amount: "",
//     payment_method: "CASH",
//     remarks: "",
//     transaction_ref: "",
//     transaction_date: new Date().toISOString().split("T")[0],
//   });

//   const [denominations, setDenominations] = useState(emptyDenominations());

//   // { field: "message" } for field-level errors
//   // { info: "message" }  for backend/balance info
//   const [errors, setErrors] = useState({});
//   const [infoMsg, setInfoMsg] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//     // Clear field error on change
//     setErrors((prev) => ({ ...prev, [e.target.name]: null }));
//     setInfoMsg(null);
//   };

//   const handleSubmit = async () => {
//     const newErrors = {};

//     if (!formData.investor_id) {
//       newErrors.investor_id = t("select_investor_alert", "Please select an investor.");
//     }

//     if (!formData.amount || Number(formData.amount) <= 0) {
//       newErrors.amount = t("invalid_input", "Enter a valid withdrawal amount.");
//     }

//     if (formData.payment_method === "CASH") {
//       const total = calcDenomTotal(denominations);
//       if (total !== Number(formData.amount)) {
//         newErrors.denominations = `${t("denomination", "Denom")} ${t("total", "Total")} ₹${total.toLocaleString("en-IN")} ${t("password_not_match", "does not match")} ${t("amount", "Amount")} ₹${Number(formData.amount).toLocaleString("en-IN")}.`;
//       }
//     }

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     setErrors({});
//     setInfoMsg(null);
//     setLoading(true);

//     try {
//       await onSave({
//         investor_id: Number(formData.investor_id),
//         amount: Number(formData.amount),
//         payment_method: formData.payment_method,
//         remarks: formData.remarks || null,
//         transaction_ref: formData.transaction_ref || null,
//         transaction_date: formData.transaction_date,
//         denominations:
//           formData.payment_method === "CASH"
//             ? Object.entries(denominations)
//                 .filter(([, qty]) => Number(qty) > 0)
//                 .map(([denom, qty]) => [Number(denom), Number(qty)])
//             : [],
//       });
//     } catch (err) {
//       const raw = err?.toString() || t("operation_failed", "Withdrawal failed. Please try again.");
//       setInfoMsg({ type: "error", text: raw });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Get selected investor details for live balance hint
//   const selectedInvestor = investors.find(
//     (inv) => String(inv.id) === String(formData.investor_id),
//   );

//   return (
//     <div className="modal-overlay">
//       <div className="investment-modal">
//         <div className="modal-header">
//           <h2>{t("withdraw_capital", "Investor Withdrawal")}</h2>
//           <button onClick={onClose}>✕</button>
//         </div>

//         <div className="modal-body">
//           {/* ── Global info / error banner ── */}
//           {infoMsg && (
//             <div
//               className={`form-info-banner ${infoMsg.type === "error" ? "form-info-banner--error" : "form-info-banner--success"}`}
//             >
//               {infoMsg.type === "error" ? "⚠️" : "✅"} {infoMsg.text}
//             </div>
//           )}

//           {/* ── Investor ── */}
//           <div className="form-group">
//             <label>{t("investor_lbl", "Investor")}</label>
//             <select
//               name="investor_id"
//               value={formData.investor_id}
//               onChange={handleChange}
//               className={errors.investor_id ? "input-error" : ""}
//             >
//               <option value="">{t("search_investor", "Select Investor")}</option>

//               {investors
//                 .filter((inv) => inv.is_active)
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

//           {/* ── Amount ── */}
//           <div className="form-group">
//             <label>{t("amount", "Withdrawal Amount")}</label>
//             <input
//               type="number"
//               name="amount"
//               value={formData.amount}
//               onChange={handleChange}
//               className={errors.amount ? "input-error" : ""}
//             />
//             {errors.amount && (
//               <span className="field-error">{errors.amount}</span>
//             )}
//             {/* Live hint: show selected investor's balance */}
//             {selectedInvestor && selectedInvestor.current_balance != null && (
//               <span className="field-hint">
//                 {t("available_balance_lbl", "Available balance")}: ₹
//                 {Number(selectedInvestor.current_balance).toLocaleString("en-IN")}
//               </span>
//             )}
//           </div>

//           {/* ── Payment Method ── */}
//           <div className="form-group">
//             <label>{t("payment_method")}</label>
//             <select
//               name="payment_method"
//               value={formData.payment_method}
//               onChange={handleChange}
//             >
//               <option value="CASH">{t("cash")}</option>
//               <option value="UPI">{t("upi")}</option>
//               <option value="BANK">{t("bank")}</option>
//             </select>
//           </div>

//           {/* ── Denominations ── */}
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

//           {/* ── Remarks ── */}
//           <div className="form-group">
//             <label>{t("narration", "Remarks")}</label>
//             <textarea
//               rows="3"
//               name="remarks"
//               value={formData.remarks}
//               onChange={handleChange}
//               placeholder={t("optional_details", "Optional notes")}
//             />
//           </div>
//         </div>

//         <div className="modal-footer">
//           <button onClick={onClose} disabled={loading}>
//             {t("cancel")}
//           </button>
//           <button onClick={handleSubmit} disabled={loading}>
//             {loading ? `${t("processing")}…` : t("withdraw_funds", "Withdraw")}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// version final 
import { useState } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useLanguage } from "../../context/LanguageContext"; // ✅ Imported custom language hook
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
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [formData, setFormData] = useState({
    investor_id: "",
    amount: "",
    payment_method: "CASH",
    remarks: "",
    transaction_ref: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const [denominations, setDenominations] = useState(emptyDenominations());

  // { field: "message" } for field-level errors
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Get selected investor details for live balance checks and hint
  const selectedInvestor = investors.find(
    (inv) => String(inv.id) === String(formData.investor_id),
  );

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear field error on change
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  };

  const handleSubmit = async () => {
    const newErrors = {};

    if (!formData.investor_id) {
      newErrors.investor_id = t("select_investor_alert", "Please select an investor.");
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = t("invalid_input", "Enter a valid withdrawal amount.");
    }

    // 🛡️ Safe check against current principal balance limit
    if (selectedInvestor && Number(formData.amount) > Number(selectedInvestor.current_balance || 0)) {
      newErrors.amount = t("insufficient_balance", "Withdrawal amount exceeds available balance.");
      toast.error(t("insufficient_balance", "Insufficient investor capital balance."));
    }

    if (formData.payment_method === "CASH") {
      const total = calcDenomTotal(denominations);
      if (total !== Number(formData.amount)) {
        const mismatchMsg = `${t("denomination", "Denom")} ${t("total", "Total")} ₹${total.toLocaleString("en-IN")} ${t("password_not_match", "does not match")} ${t("amount", "Amount")} ₹${Number(formData.amount).toLocaleString("en-IN")}.`;
        newErrors.denominations = mismatchMsg;
        toast.error(mismatchMsg); // 🚀 Fire crisp toast on physical currency mismatches
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
      
      toast.success(t("withdrawal_processed_success", "Capital withdrawal processed successfully!")); // 🚀 Clean success toast
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      const rawError = err?.toString() || t("operation_failed", "Withdrawal failed. Please try again.");
      toast.error(rawError); // 🚀 Extracted global error state out of visual UI layout completely into standard toast channel
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="investment-modal">
        <div className="modal-header">
          <h2>{t("withdraw_capital", "Investor Withdrawal")}</h2>
          <button onClick={onClose} disabled={loading}>✕</button>
        </div>

        <div className="modal-body">
          {/* ── Investor ── */}
          <div className="form-group">
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

          {/* ── Amount ── */}
          <div className="form-group">
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
            {/* Live hint: show selected investor's balance */}
            {selectedInvestor && selectedInvestor.current_balance != null && (
              <span className="field-hint">
                {t("available_balance_lbl", "Available balance")}: ₹
                {Number(selectedInvestor.current_balance).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* ── Payment Method ── */}
          <div className="form-group">
            <label>{t("payment_method")}</label>
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

          {/* ── Denominations ── */}
          {formData.payment_method === "CASH" && (
            <>
              <CashDenominationInput
                title={t("cash_denominations")}
                data={denominations}
                setData={setDenominations}
                showTotal={true}
              />
              {errors.denominations && (
                <span className="field-error">{errors.denominations}</span>
              )}
            </>
          )}

          {/* ── Remarks ── */}
          <div className="form-group">
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
          <button onClick={onClose} disabled={loading}>
            {t("cancel")}
          </button>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? `${t("processing")}…` : t("withdraw_funds", "Withdraw")}
          </button>
        </div>
      </div>
    </div>
  );
}