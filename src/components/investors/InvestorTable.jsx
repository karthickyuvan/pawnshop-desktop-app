// export default function InvestorTable({
//   investors,
//   onEdit,
//   onToggleStatus,
//   onViewLedger,
// }) {
//   return (
//     <div className="table-container">
//       <table className="data-table">
//         <thead>
//           <tr>
//             <th>Code</th>
//             <th>Name</th>
//             <th>Mobile</th>
//             <th>Type</th>
//             <th>%</th>
//             <th>Status</th>
//             <th width="180">Action</th>
//           </tr>
//         </thead>

//         <tbody>
//           {investors.length === 0 ? (
//             <tr>
//               <td colSpan="6" style={{ textAlign: "center" }}>
//                 No Investors Found
//               </td>
//             </tr>
//           ) : (
//             investors.map((investor) => (
//               <tr key={investor.id}>
//                 <td>{investor.investor_code}</td>

//                 <td>{investor.investor_name}</td>

//                 <td>{investor.mobile || "-"}</td>

//                 <td>{investor.investor_type}</td>
                 
//                  <td>
//   {investor.investor_type === "PROFIT_SHARE"
//     ? `${investor.profit_share_percentage || 0}%`
//     : `${investor.fixed_interest_percentage || 0}%`}
// </td>

//                 <td>{investor.is_active ? "Active" : "Inactive"}</td>

//                 <td className="action-buttons">
//                   <button
//                     className="edit-btn"
//                     onClick={() => onEdit(investor)}
//                   >
//                     Edit
//                   </button>

//                   <button onClick={() => onViewLedger(investor.id)}>
//                     Ledger
//                   </button>

//                   <button
//                     className="toggle-status-btn"
//                     onClick={() =>
//                       onToggleStatus(investor.id, !investor.is_active)
//                     }
//                   >
//                     {investor.is_active ? "Disable" : "Enable"}
//                   </button>
//                 </td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }




// import React from "react";
// import { useLanguage } from "../../context/LanguageContext"; 

// export default function InvestorTable({
//   investors,
//   onEdit,
//   onToggleStatus,
//   onViewLedger,
// }) {
//   const { t } = useLanguage(); // ✅ Initialized translation hook

//   return (
//     <div className="table-container">
//       <table className="data-table">
//         <thead>
//           <tr>
//             <th>{t("code")}</th>
//             <th>{t("name")}</th>
//             <th>{t("phone", "Mobile")}</th>
//             <th>{t("type")}</th>
//             <th>%</th>
//             <th>{t("status")}</th>
//             <th width="180">{t("action")}</th>
//           </tr>
//         </thead>

//         <tbody>
//           {investors.length === 0 ? (
//             <tr>
//               {/* ✅ Fixed column span matching table row constraints */}
//               <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
//                 {t("no_matching_records", "No Investors Found")}
//               </td>
//             </tr>
//           ) : (
//             investors.map((investor) => (
//               <tr key={investor.id}>
//                 <td>{investor.investor_code}</td>

//                 <td>{investor.investor_name}</td>

//                 <td>{investor.mobile || "-"}</td>

//                 <td>
//                   {investor.investor_type === "FIXED_INTEREST" 
//                     ? t("fixed_interest_option") 
//                     : investor.investor_type}
//                 </td>
                 
//                 <td>
//                   {investor.investor_type === "PROFIT_SHARE"
//                     ? `${investor.profit_share_percentage || 0}%`
//                     : `${investor.fixed_interest_percentage || 0}%`}
//                 </td>

//                 <td>
//                   {investor.is_active ? t("active") : t("disabled", "Inactive")}
//                 </td>

//                 <td className="action-buttons">
//                   <button
//                     className="edit-btn"
//                     onClick={() => onEdit(investor)}
//                   >
//                     {t("edit")}
//                   </button>

//                   <button onClick={() => onViewLedger(investor.id)}>
//                     {t("fund_ledger", "Ledger")}
//                   </button>

//                   <button
//                     className="toggle-status-btn"
//                     onClick={() =>
//                       onToggleStatus(investor.id, !investor.is_active)
//                     }
//                   >
//                     {investor.is_active ? t("disable") : t("enable")}
//                   </button>
//                 </td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }




import React from "react";
import { useLanguage } from "../../context/LanguageContext"; 

export default function InvestorTable({
  investors,
  onEdit,
  onToggleStatus,
  onViewLedger,
}) {
  const { t } = useLanguage(); // ✅ Initialized translation hook

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>{t("code")}</th>
            <th>{t("name")}</th>
            <th>{t("phone", "Mobile")}</th>
            <th>{t("type")}</th>
            <th>%</th>
            <th>{t("status")}</th>
            <th width="180">{t("action")}</th>
          </tr>
        </thead>

        <tbody>
          {investors.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                {t("no_matching_records", "No Investors Found")}
              </td>
            </tr>
          ) : (
            investors.map((investor) => (
              <tr key={investor.id}>
                <td>{investor.investor_code}</td>

                <td>{investor.investor_name}</td>

                <td>{investor.mobile || "-"}</td>

                <td>
                  {investor.investor_type === "FIXED_INTEREST" 
                    ? t("fixed_interest_option") 
                    : investor.investor_type}
                </td>
                 
                <td>
                  {investor.investor_type === "PROFIT_SHARE"
                    ? `${investor.profit_share_percentage || 0}%`
                    : `${investor.fixed_interest_percentage || 0}%`}
                </td>

                <td>
                  {investor.is_active ? t("active") : t("disabled", "Inactive")}
                </td>

                <td className="action-buttons">
                  <button
                    className="edit-btn"
                    onClick={() => onEdit(investor)}
                  >
                    {t("edit")}
                  </button>

                  <button onClick={() => onViewLedger(investor.id)}>
                    {t("fund_ledger", "Ledger")}
                  </button>

                  <button
                    className="toggle-status-btn"
                    onClick={() =>
                      onToggleStatus(investor.id, !investor.is_active)
                    }
                  >
                    {investor.is_active ? t("disable") : t("enable")}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}