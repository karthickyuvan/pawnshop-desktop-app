// // import { formatDateTimeIST } from "../../utils/timeFormatter";

// export default function PledgeTableRow({ pledge, setActiveMenu, onPrint }) {
//   const getStatusClass = () => {
//     if (pledge.status === "CLOSED") return "status closed";
//     if (pledge.status === "OVERDUE") return "status red";
//     if (pledge.status === "DUE_SOON") return "status orange";
//     return "status green";
//   };

//   return (
//     <tr>
//       <td className="pledge-link">{pledge.pledge_no}</td>

//       <td>
//         <div className="customer-cell">
//           <div className="avatar">
//             <span style={{ opacity: 0.5 }}>👤</span>
//           </div>

//           <div>
//             <div style={{ fontWeight: "600" }}>{pledge.customer_name}</div>
//             <div className="customer-code">{pledge.customer_code}</div>
//           </div>
//         </div>
//       </td>

//       <td style={{ fontWeight: "600" }}>
//         ₹{pledge.loan_amount.toLocaleString()}
//       </td>

//       <td>{new Date(pledge.created_at).toLocaleDateString("en-GB")}</td>
//       {/* <td>{pledge.pledge_date}</td> */}

//       <td>
//         <div> {new Date(pledge.created_at).toLocaleDateString("en-GB")}</div>
//         <div className="days-remaining">
//           {pledge.days_remaining} days remaining
//         </div>
//       </td>

//       <td>
//         <span className={getStatusClass()}>
//           {pledge.status.replace("_", " ")}
//         </span>
//       </td>

//       <td className="actions">
//         <button
//           className="view-btn"
//           onClick={() => setActiveMenu(`single-pledge-${pledge.id}`)}
//         >
//           👁
//         </button>

//         <button className="print-btn" onClick={() => onPrint(pledge.id)}>
//           🖨
//         </button>
//       </td>
//     </tr>
//   );
// }





import { useLanguage } from "../../context/LanguageContext"; // ✅ Added for seamless localization stability

export default function PledgeTableRow({ pledge, setActiveMenu, onPrint }) {
  const { t } = useLanguage();

  const getStatusClass = () => {
    if (pledge.status === "CLOSED") return "status closed";
    if (pledge.status === "OVERDUE") return "status red";
    if (pledge.status === "DUE_SOON") return "status orange";
    return "status green";
  };

  return (
    <tr>
      <td className="pledge-link">{pledge.pledge_no}</td>

      <td>
        <div className="customer-cell">
          <div className="avatar">
            <span style={{ opacity: 0.5 }}>👤</span>
          </div>

          <div>
            <div style={{ fontWeight: "600" }}>{pledge.customer_name}</div>
            <div className="customer-code">{pledge.customer_code}</div>
          </div>
        </div>
      </td>

      <td style={{ fontWeight: "600" }}>
        ₹{pledge.loan_amount.toLocaleString("en-IN")}
      </td>

      <td>{new Date(pledge.created_at).toLocaleDateString("en-GB")}</td>

      <td>
        <div>{new Date(pledge.created_at).toLocaleDateString("en-GB")}</div>
        <div className="days-remaining">
          {pledge.days_remaining} {t("days_remaining", "days remaining")}
        </div>
      </td>

      <td>
        <span className={getStatusClass()}>
          {pledge.status.replace("_", " ")}
        </span>
      </td>

      <td className="actions">
        <button
          className="view-btn"
          onClick={() => setActiveMenu(`single-pledge-${pledge.id}`)}
          title={t("view", "View")}
        >
          👁
        </button>

        <button 
          className="print-btn" 
          onClick={() => onPrint(pledge.id)}
          title={t("print", "Print")}
        >
          🖨
        </button>
      </td>
    </tr>
  );
}