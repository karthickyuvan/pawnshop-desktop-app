
// // version 4 
// import React from "react";
// import { formatTransactionTimestamp } from "../../utils/timeFormatter";
// import "./InvestorInvestmentModal.css";

// export default function InvestorLedgerModal({
//   summary,
//   ledgerRows = [],
//   onClose,
// }) {
//   if (!summary) {
//     return null;
//   }

//   return (
//     <div className="modal-overlay">
//       <div className="ledger-modal">
//         {/* Header */}
//         <div className="ledger-header">
//           <h2>Investor Ledger</h2>
//           <button className="close-btn" onClick={onClose}>
//             ✕
//           </button>
//         </div>

//         {/* 6 Summary Cards including accrued interest and total valuation */}
//         <div className="ledger-summary-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
//           <div className="ledger-card">
//             <span>Total Investment</span>
//             <strong>
//               ₹{Number(summary.total_investment).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card">
//             <span>Total Withdrawn</span>
//             <strong>
//               ₹{Number(summary.total_withdrawn).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card">
//             <span>Current Principal Balance</span>
//             <strong>
//               ₹{Number(summary.current_balance).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card" style={{ borderLeft: "4px solid #eab308" }}>
//             <span style={{ color: "#854d0e" }}>Accrued Interest (Unpaid)</span>
//             <strong style={{ color: "#ca8a04" }}>
//               ₹{Number(summary.accrued_interest || 0).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card" style={{ borderLeft: "4px solid #16a34a" }}>
//             <span style={{ color: "#166534" }}>Total Account Value</span>
//             <strong style={{ color: "#15803d" }}>
//               ₹{Number(summary.total_account_value || 0).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card">
//             <span>Total Interest Paid</span>
//             <strong>
//               ₹{Number(summary.total_profit_paid).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card">
//             <span>Investor Type</span>
//             <strong>{summary.investor_type}</strong>
//           </div>

//           <div className="ledger-card">
//             <span>Transactions</span>
//             <strong>{summary.transaction_count}</strong>
//           </div>
//         </div>

//         {/* Body */}
//         <div className="ledger-body">
//           <div className="ledger-body-title">Transaction History</div>

//           <table className="ledger-table">
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 <th>Type</th>
//                 <th>Amount</th>
//                 <th>Payment</th>
//                 <th>Remarks</th>
//               </tr>
//             </thead>

//             <tbody>
//               {ledgerRows.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan="5"
//                     style={{
//                       textAlign: "center",
//                       padding: "20px",
//                     }}
//                   >
//                     No Transactions Found
//                   </td>
//                 </tr>
//               ) : (
//                 ledgerRows.map((row) => (
//                   <tr key={row.id}>
//                     <td>{formatTransactionTimestamp(row.transaction_date)}</td>

//                     <td>
//                       <span
//                         className={
//                           row.transaction_type === "INVESTMENT"
//                             ? "tx-investment"
//                             : row.transaction_type === "PROFIT_PAYMENT"
//                               ? "tx-profit"
//                               : "tx-withdraw"
//                         }
//                       >
//                         {row.transaction_type === "PROFIT_PAYMENT"
//                           ? "INTEREST PAYMENT"
//                           : row.transaction_type}
//                       </span>
//                     </td>

//                     <td>₹{Number(row.amount).toLocaleString("en-IN")}</td>

//                     <td>{row.payment_method}</td>

//                     <td 
//                       style={{ 
//                         fontSize: "13px", 
//                         fontWeight: row.remarks?.startsWith("🗓️") ? "500" : "normal",
//                         color: row.remarks?.startsWith("🗓️") ? "#1e293b" : "#64748b" 
//                       }}
//                     >
//                       {row.remarks || "-"}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }







// import React from "react";
// import { useLanguage } from "../../context/LanguageContext"; // ✅ Imported custom language hook
// import { formatTransactionTimestamp } from "../../utils/timeFormatter";
// import "./InvestorInvestmentModal.css";

// export default function InvestorLedgerModal({
//   summary,
//   ledgerRows = [],
//   onClose,
// }) {
//   const { t } = useLanguage(); // ✅ Initialized translation hook

//   if (!summary) {
//     return null;
//   }

//   return (
//     <div className="modal-overlay">
//       <div className="ledger-modal">
//         {/* Header */}
//         <div className="ledger-header">
//           <h2>{t("fund_ledger", "Investor Ledger")}</h2>
//           <button className="close-btn" onClick={onClose}>
//             ✕
//           </button>
//         </div>

//         {/* Summary Cards Grid */}
//         <div className="ledger-summary-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
//           <div className="ledger-card">
//             <span>{t("total_investment_lbl", "Total Investment")}</span>
//             <strong>
//               ₹{Number(summary.total_investment).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card">
//             <span>{t("total_withdrawn_lbl", "Total Withdrawn")}</span>
//             <strong>
//               ₹{Number(summary.total_withdrawn).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card">
//             <span>{t("remaining_principal", "Current Principal Balance")}</span>
//             <strong>
//               ₹{Number(summary.current_balance).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card" style={{ borderLeft: "4px solid #eab308" }}>
//             <span style={{ color: "#854d0e" }}>{t("interest_balance", "Accrued Interest (Unpaid)")}</span>
//             <strong style={{ color: "#ca8a04" }}>
//               ₹{Number(summary.accrued_interest || 0).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card" style={{ borderLeft: "4px solid #16a34a" }}>
//             <span style={{ color: "#166534" }}>{t("total_asset_value_lbl", "Total Account Value")}</span>
//             <strong style={{ color: "#15803d" }}>
//               ₹{Number(summary.total_account_value || 0).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card">
//             <span>{t("interest_paid", "Total Interest Paid")}</span>
//             <strong>
//               ₹{Number(summary.total_profit_paid).toLocaleString("en-IN")}
//             </strong>
//           </div>

//           <div className="ledger-card">
//             <span>{t("investor_type_label", "Investor Type")}</span>
//             <strong>
//               {summary.investor_type === "FIXED_INTEREST" ? t("fixed_interest_option") : summary.investor_type}
//             </strong>
//           </div>

//           <div className="ledger-card">
//             <span>{t("total_transactions", "Transactions")}</span>
//             <strong>{summary.transaction_count}</strong>
//           </div>
//         </div>

//         {/* Body */}
//         <div className="ledger-body">
//           <div className="ledger-body-title">{t("transaction_history")}</div>

//           <table className="ledger-table">
//             <thead>
//               <tr>
//                 <th>{t("date")}</th>
//                 <th>{t("type")}</th>
//                 <th>{t("amount")}</th>
//                 <th>{t("method", "Payment")}</th>
//                 <th>{t("narration", "Remarks")}</th>
//               </tr>
//             </thead>

//             <tbody>
//               {ledgerRows.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan="5"
//                     style={{
//                       textAlign: "center",
//                       padding: "20px",
//                     }}
//                   >
//                     {t("no_matching_records", "No Transactions Found")}
//                   </td>
//                 </tr>
//               ) : (
//                 ledgerRows.map((row) => (
//                   <tr key={row.id}>
//                     <td>{formatTransactionTimestamp(row.transaction_date)}</td>

//                     <td>
//                       <span
//                         className={
//                           row.transaction_type === "INVESTMENT"
//                             ? "tx-investment"
//                             : row.transaction_type === "PROFIT_PAYMENT"
//                               ? "tx-profit"
//                               : "tx-withdraw"
//                         }
//                       >
//                         {row.transaction_type === "PROFIT_PAYMENT"
//                           ? t("interest_payment")
//                           : row.transaction_type === "INVESTMENT"
//                             ? t("fund_management", "INVESTMENT")
//                             : row.transaction_type === "WITHDRAWAL"
//                               ? t("withdraw_funds", "WITHDRAWAL")
//                               : row.transaction_type}
//                       </span>
//                     </td>

//                     <td>₹{Number(row.amount).toLocaleString("en-IN")}</td>

//                     <td>
//                       {row.payment_method === "CASH" ? t("cash") : row.payment_method === "UPI" ? t("upi") : row.payment_method === "BANK" ? t("bank") : row.payment_method}
//                     </td>

//                     <td 
//                       style={{ 
//                         fontSize: "13px", 
//                         fontWeight: row.remarks?.startsWith("🗓️") ? "500" : "normal",
//                         color: row.remarks?.startsWith("🗓️") ? "#1e293b" : "#64748b" 
//                       }}
//                     >
//                       {row.remarks || "-"}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }


// verson 5 

import React from "react";
import { useLanguage } from "../../context/LanguageContext"; // ✅ Imported custom language hook
import { formatTransactionTimestamp } from "../../utils/timeFormatter";
import "./InvestorInvestmentModal.css";

export default function InvestorLedgerModal({
  summary,
  ledgerRows = [],
  onClose,
}) {
  const { t } = useLanguage(); // ✅ Initialized translation hook

  // 🛡️ Safe fallback element: If summary data is completely absent, still render the modal shell
  if (!summary) {
    return (
      <div className="modal-overlay">
        <div className="ledger-modal">
          <div className="ledger-header">
            <h2>{t("fund_ledger", "Investor Ledger")}</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="ledger-body" style={{ textAlign: "center", padding: "40px 20px" }}>
            {t("no_matching_records", "No Ledger Summary Available")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="ledger-modal">
        {/* Header */}
        <div className="ledger-header">
          <h2>{t("fund_ledger", "Investor Ledger")}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Summary Cards Grid */}
        <div className="ledger-summary-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="ledger-card">
            <span>{t("total_investment_lbl", "Total Investment")}</span>
            <strong>
              ₹{Number(summary.total_investment || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="ledger-card">
            <span>{t("total_withdrawn_lbl", "Total Withdrawn")}</span>
            <strong>
              ₹{Number(summary.total_withdrawn || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="ledger-card">
            <span>{t("remaining_principal", "Current Principal Balance")}</span>
            <strong>
              ₹{Number(summary.current_balance || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="ledger-card" style={{ borderLeft: "4px solid #eab308" }}>
            <span style={{ color: "#854d0e" }}>{t("interest_balance", "Accrued Interest (Unpaid)")}</span>
            <strong style={{ color: "#ca8a04" }}>
              ₹{Number(summary.accrued_interest || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="ledger-card" style={{ borderLeft: "4px solid #16a34a" }}>
            <span style={{ color: "#166534" }}>{t("total_asset_value_lbl", "Total Account Value")}</span>
            <strong style={{ color: "#15803d" }}>
              ₹{Number(summary.total_account_value || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="ledger-card">
            <span>{t("interest_paid", "Total Interest Paid")}</span>
            <strong>
              ₹{Number(summary.total_profit_paid || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="ledger-card">
            <span>{t("investor_type_label", "Investor Type")}</span>
            <strong>
              {summary.investor_type === "FIXED_INTEREST" ? t("fixed_interest_option") : summary.investor_type}
            </strong>
          </div>

          <div className="ledger-card">
            <span>{t("total_transactions", "Transactions")}</span>
            <strong>{summary.transaction_count || 0}</strong>
          </div>
        </div>

        {/* Body */}
        <div className="ledger-body">
          <div className="ledger-body-title">{t("transaction_history")}</div>

          <table className="ledger-table">
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th>{t("type")}</th>
                <th>{t("amount")}</th>
                <th>{t("method", "Payment")}</th>
                <th>{t("narration", "Remarks")}</th>
              </tr>
            </thead>

            <tbody>
              {ledgerRows.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                    }}
                  >
                    {t("no_matching_records", "No Transactions Found")}
                  </td>
                </tr>
              ) : (
                ledgerRows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatTransactionTimestamp(row.transaction_date)}</td>

                    <td>
                      <span
                        className={
                          row.transaction_type === "INVESTMENT"
                            ? "tx-investment"
                            : row.transaction_type === "PROFIT_PAYMENT"
                              ? "tx-profit"
                              : "tx-withdraw"
                        }
                      >
                        {row.transaction_type === "PROFIT_PAYMENT"
                          ? t("interest_payment")
                          : row.transaction_type === "INVESTMENT"
                            ? t("fund_management", "INVESTMENT")
                            : row.transaction_type === "WITHDRAWAL"
                              ? t("withdraw_funds", "WITHDRAWAL")
                              : row.transaction_type}
                      </span>
                    </td>

                    <td>₹{Number(row.amount || 0).toLocaleString("en-IN")}</td>

                    <td>
                      {row.payment_method === "CASH" 
                        ? t("cash") 
                        : row.payment_method === "UPI" 
                        ? t("upi") 
                        : row.payment_method === "BANK" 
                        ? t("bank") 
                        : row.payment_method}
                    </td>

                    <td 
                      style={{ 
                        fontSize: "13px", 
                        fontWeight: row.remarks?.startsWith("🗓️") ? "500" : "normal",
                        color: row.remarks?.startsWith("🗓️") ? "#1e293b" : "#64748b" 
                      }}
                    >
                      {row.remarks || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}