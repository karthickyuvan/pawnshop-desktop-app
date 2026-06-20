

// import { useState } from "react";
// import CashDenominationInput, {
//   emptyDenominations,
//   calcDenomTotal,
// } from "../../constants/CashDenominationInput";
// import "./InvestorInvestmentModal.css";

// export default function InvestorInvestmentModal({
//   investors = [],
//   onClose,
//   onSave,
// }) {
//   const [formData, setFormData] = useState({
//     investor_id: "",
//     amount: "",
//     payment_method: "CASH",
//     transaction_ref: "",
//     remarks: "",
//     transaction_date: new Date().toISOString().split("T")[0],
//   });

//   const [denominations, setDenominations] = useState(emptyDenominations());

//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleSubmit = () => {
//     if (!formData.investor_id) {
//       alert("Please Select Investor");
//       return;
//     }
//     if (!formData.amount || Number(formData.amount) <= 0) {
//       alert("Enter Valid Amount");
//       return;
//     }

//     if (formData.payment_method === "CASH") {
//       const denomTotal = calcDenomTotal(denominations);
//       if (denomTotal !== Number(formData.amount)) {
//         alert(
//           `Denomination Total ₹${denomTotal.toLocaleString(
//             "en-IN",
//           )} does not match Amount ₹${Number(formData.amount).toLocaleString(
//             "en-IN",
//           )}`,
//         );
//         return;
//       }
//     }

//     const payload = {
//       investor_id: Number(formData.investor_id),
//       amount: Number(formData.amount),
//       payment_method: formData.payment_method,
//       transaction_ref: formData.transaction_ref || null,
//       remarks: formData.remarks || null,
//       transaction_date: formData.transaction_date,
//       denominations:
//         formData.payment_method === "CASH"
//           ? Object.entries(denominations)
//               .filter(([, qty]) => Number(qty) > 0)
//               .map(([denom, qty]) => [Number(denom), Number(qty)])
//           : [],
//     };

//     // 1. Save data
//     onSave(payload);

//     // 2. Show success message
//     alert("Investment Saved Successfully!");

//     // 3. Close the modal automatically (Optional, but standard UX)
//     if (onClose) onClose();
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="investment-modal">
//         <div className="modal-header">
//           <h2>Investor Investment</h2>
//           <button className="close-btn" onClick={onClose}>
//             ✕
//           </button>
//         </div>

//         <div className="modal-body">
//           {/* Row 1: Date & Investor (Side by Side) */}
//           <div className="form-row">
//             <div className="form-group">
//               <label>Date</label>
//               <input
//                 type="date"
//                 name="transaction_date"
//                 value={formData.transaction_date}
//                 onChange={handleChange}
//               />
//             </div>

//             <div className="form-group">
//               <label>Investor *</label>
//               <select
//                 name="investor_id"
//                 value={formData.investor_id}
//                 onChange={handleChange}
//               >
//                 <option value="">Select Investor</option>

//                 {investors
//                   .filter((investor) => investor.is_active)
//                   .map((investor) => (
//                     <option key={investor.id} value={investor.id}>
//                       {investor.investor_name}
//                     </option>
//                   ))}
//               </select>
//             </div>
//           </div>

//           {/* Row 2: Amount & Payment Method (Side by Side) */}
//           <div className="form-row">
//             <div className="form-group">
//               <label>Amount *</label>
//               <input
//                 type="number"
//                 min="1"
//                 name="amount"
//                 value={formData.amount}
//                 onChange={handleChange}
//                 placeholder="0.00"
//               />
//             </div>

//             <div className="form-group">
//               <label>Payment Method</label>
//               <select
//                 name="payment_method"
//                 value={formData.payment_method}
//                 onChange={handleChange}
//               >
//                 <option value="CASH">CASH</option>
//                 <option value="UPI">UPI</option>
//                 <option value="BANK">BANK</option>
//               </select>
//             </div>
//           </div>

//           {/* Row 3: Conditional Reference Number Block */}
//           {formData.payment_method !== "CASH" && (
//             <div className="form-group">
//               <label>Reference No</label>
//               <input
//                 name="transaction_ref"
//                 value={formData.transaction_ref}
//                 onChange={handleChange}
//                 placeholder="UTR / UPI Ref"
//               />
//             </div>
//           )}

//           {/* Row 4: Remarks Full Width */}
//           <div className="form-group">
//             <label>Remarks</label>
//             <textarea
//               rows="2"
//               name="remarks"
//               value={formData.remarks}
//               onChange={handleChange}
//               placeholder="Enter context or notes here..."
//             />
//           </div>

//           {/* Cash Denominations Segment */}
//           {formData.payment_method === "CASH" && (
//             <div className="denomination-container">
//               <CashDenominationInput
//                 title="Cash Denominations"
//                 data={denominations}
//                 setData={setDenominations}
//                 showTotal={true}
//               />
//               <div className="denom-total">
//                 Denomination Total : ₹
//                 {calcDenomTotal(denominations).toLocaleString("en-IN")}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="modal-footer">
//           <button className="cancel-btn" onClick={onClose}>
//             Cancel
//           </button>
//           <button className="save-btn" onClick={handleSubmit}>
//             Save Investment
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }







// import { useState } from "react";
// import { useLanguage } from "../../context/LanguageContext"; 
// import CashDenominationInput, {
//   emptyDenominations,
//   calcDenomTotal,
// } from "../../constants/CashDenominationInput";
// import "./InvestorInvestmentModal.css";

// export default function InvestorInvestmentModal({
//   investors = [],
//   onClose,
//   onSave,
// }) {
//   const { t } = useLanguage(); // ✅ Initialized translation hook
//   const [formData, setFormData] = useState({
//     investor_id: "",
//     amount: "",
//     payment_method: "CASH",
//     transaction_ref: "",
//     remarks: "",
//     transaction_date: new Date().toISOString().split("T")[0],
//   });

//   const [denominations, setDenominations] = useState(emptyDenominations());

//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleSubmit = () => {
//     if (!formData.investor_id) {
//       alert(t("select_investor_alert", "Please Select Investor"));
//       return;
//     }
//     if (!formData.amount || Number(formData.amount) <= 0) {
//       alert(t("invalid_input", "Enter Valid Amount"));
//       return;
//     }

//     if (formData.payment_method === "CASH") {
//       const denomTotal = calcDenomTotal(denominations);
//       if (denomTotal !== Number(formData.amount)) {
//         alert(
//           `${t("denomination", "Denom")} ${t("total", "Total")} ₹${denomTotal.toLocaleString(
//             "en-IN",
//           )} ${t("password_not_match", "does not match")} ${t("amount", "Amount")} ₹${Number(formData.amount).toLocaleString(
//             "en-IN",
//           )}`
//         );
//         return;
//       }
//     }

//     const payload = {
//       investor_id: Number(formData.investor_id),
//       amount: Number(formData.amount),
//       payment_method: formData.payment_method,
//       transaction_ref: formData.transaction_ref || null,
//       remarks: formData.remarks || null,
//       transaction_date: formData.transaction_date,
//       denominations:
//         formData.payment_method === "CASH"
//           ? Object.entries(denominations)
//               .filter(([, qty]) => Number(qty) > 0)
//               .map(([denom, qty]) => [Number(denom), Number(qty)])
//           : [],
//     };

//     onSave(payload);
//     alert(t("investment_saved"));
//     if (onClose) onClose();
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="investment-modal">
//         <div className="modal-header">
//           <h2>{t("add_investment")}</h2>
//           <button className="close-btn" onClick={onClose}>
//             ✕
//           </button>
//         </div>

//         <div className="modal-body">
//           {/* Row 1: Date & Investor (Side by Side) */}
//           <div className="form-row">
//             <div className="form-group">
//               <label>{t("date")}</label>
//               <input
//                 type="date"
//                 name="transaction_date"
//                 value={formData.transaction_date}
//                 onChange={handleChange}
//               />
//             </div>

//             <div className="form-group">
//               <label>{t("investor_lbl", "Investor *")}</label>
//               <select
//                 name="investor_id"
//                 value={formData.investor_id}
//                 onChange={handleChange}
//               >
//                 <option value="">{t("search_investor", "Select Investor")}</option>

//                 {investors
//                   .filter((investor) => investor.is_active)
//                   .map((investor) => (
//                     <option key={investor.id} value={investor.id}>
//                       {investor.investor_name}
//                     </option>
//                   ))}
//               </select>
//             </div>
//           </div>

//           {/* Row 2: Amount & Payment Method (Side by Side) */}
//           <div className="form-row">
//             <div className="form-group">
//               <label>{t("amount")} *</label>
//               <input
//                 type="number"
//                 min="1"
//                 name="amount"
//                 value={formData.amount}
//                 onChange={handleChange}
//                 placeholder="0.00"
//               />
//             </div>

//             <div className="form-group">
//               <label>{t("payment_method")}</label>
//               <select
//                 name="payment_method"
//                 value={formData.payment_method}
//                 onChange={handleChange}
//               >
//                 <option value="CASH">{t("cash")}</option>
//                 <option value="UPI">{t("upi")}</option>
//                 <option value="BANK">{t("bank")}</option>
//               </select>
//             </div>
//           </div>

//           {/* Row 3: Conditional Reference Number Block */}
//           {formData.payment_method !== "CASH" && (
//             <div className="form-group">
//               <label>{t("reference")}</label>
//               <input
//                 name="transaction_ref"
//                 value={formData.transaction_ref}
//                 onChange={handleChange}
//                 placeholder="UTR / UPI Ref"
//               />
//             </div>
//           )}

//           {/* Row 4: Remarks Full Width */}
//           <div className="form-group">
//             <label>{t("narration", "Remarks")}</label>
//             <textarea
//               rows="2"
//               name="remarks"
//               value={formData.remarks}
//               onChange={handleChange}
//               placeholder={t("optional_details", "Enter context or notes here...")}
//             />
//           </div>

//           {/* Cash Denominations Segment */}
//           {formData.payment_method === "CASH" && (
//             <div className="denomination-container">
//               <CashDenominationInput
//                 title={t("cash_denominations")}
//                 data={denominations}
//                 setData={setDenominations}
//                 showTotal={true}
//               />
//               <div className="denom-total">
//                 {t("denomination")} {t("total")} : ₹
//                 {calcDenomTotal(denominations).toLocaleString("en-IN")}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="modal-footer">
//           <button className="cancel-btn" onClick={onClose}>
//             {t("cancel")}
//           </button>
//           <button className="save-btn" onClick={handleSubmit}>
//             {t("add_investment")}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



// version 3 

import { useState } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useLanguage } from "../../context/LanguageContext"; 
import CashDenominationInput, {
  emptyDenominations,
  calcDenomTotal,
} from "../../constants/CashDenominationInput";
import "./InvestorInvestmentModal.css";

export default function InvestorInvestmentModal({
  investors = [],
  onClose,
  onSave,
}) {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [formData, setFormData] = useState({
    investor_id: "",
    amount: "",
    payment_method: "CASH",
    transaction_ref: "",
    remarks: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const [denominations, setDenominations] = useState(emptyDenominations());

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = () => {
    if (!formData.investor_id) {
      toast.error(t("select_investor_alert", "Please Select Investor")); // 🚀 Replaced alert
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error(t("invalid_input", "Enter Valid Amount")); // 🚀 Replaced alert
      return;
    }

    if (formData.payment_method === "CASH") {
      const denomTotal = calcDenomTotal(denominations);
      if (denomTotal !== Number(formData.amount)) {
        // 🚀 Replaced alert
        toast.error(
          `${t("denomination", "Denom")} ${t("total", "Total")} ₹${denomTotal.toLocaleString(
            "en-IN",
          )} ${t("password_not_match", "does not match")} ${t("amount", "Amount")} ₹${Number(formData.amount).toLocaleString(
            "en-IN",
          )}`
        );
        return;
      }
    }

    if (formData.payment_method !== "CASH" && !formData.transaction_ref.trim()) {
      toast.error(t("reference_required", "Please enter a transaction reference")); // 🚀 Guard Validation
      return;
    }

    const payload = {
      investor_id: Number(formData.investor_id),
      amount: Number(formData.amount),
      payment_method: formData.payment_method,
      transaction_ref: formData.transaction_ref || null,
      remarks: formData.remarks || null,
      transaction_date: formData.transaction_date,
      denominations:
        formData.payment_method === "CASH"
          ? Object.entries(denominations)
              .filter(([, qty]) => Number(qty) > 0)
              .map(([denom, qty]) => [Number(denom), Number(qty)])
          : [],
    };

    onSave(payload);
    toast.success(t("investment_saved", "Investment Saved Successfully!")); // 🚀 Replaced alert
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="investment-modal">
        <div className="modal-header">
          <h2>{t("add_investment")}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Row 1: Date & Investor (Side by Side) */}
          <div className="form-row">
            <div className="form-group">
              <label>{t("date")}</label>
              <input
                type="date"
                name="transaction_date"
                value={formData.transaction_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t("investor_lbl", "Investor *")}</label>
              <select
                name="investor_id"
                value={formData.investor_id}
                onChange={handleChange}
              >
                <option value="">{t("search_investor", "Select Investor")}</option>

                {investors
                  .filter((investor) => investor.is_active)
                  .map((investor) => (
                    <option key={investor.id} value={investor.id}>
                      {investor.investor_name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Row 2: Amount & Payment Method (Side by Side) */}
          <div className="form-row">
            <div className="form-group">
              <label>{t("amount")} *</label>
              <input
                type="number"
                min="1"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>{t("payment_method")}</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
              >
                <option value="CASH">{t("cash")}</option>
                <option value="UPI">{t("upi")}</option>
                <option value="BANK">{t("bank")}</option>
              </select>
            </div>
          </div>

          {/* Row 3: Conditional Reference Number Block */}
          {formData.payment_method !== "CASH" && (
            <div className="form-group">
              <label>{t("reference")} *</label>
              <input
                name="transaction_ref"
                value={formData.transaction_ref}
                onChange={handleChange}
                placeholder="UTR / UPI Ref"
              />
            </div>
          )}

          {/* Row 4: Remarks Full Width */}
          <div className="form-group">
            <label>{t("narration", "Remarks")}</label>
            <textarea
              rows="2"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder={t("optional_details", "Enter context or notes here...")}
            />
          </div>

          {/* Cash Denominations Segment */}
          {formData.payment_method === "CASH" && (
            <div className="denomination-container">
              <CashDenominationInput
                title={t("cash_denominations")}
                data={denominations}
                setData={setDenominations}
                showTotal={true}
              />
              <div className="denom-total">
                {t("denomination")} {t("total")} : ₹
                {calcDenomTotal(denominations).toLocaleString("en-IN")}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="save-btn" onClick={handleSubmit}>
            {t("add_investment")}
          </button>
        </div>
      </div>
    </div>
  );
}