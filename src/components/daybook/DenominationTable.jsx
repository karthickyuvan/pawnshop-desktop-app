


// import React from "react";
// import "../../pages/daybook.css";
// import { useLanguage } from "../../context/LanguageContext";

// /**
//  * DenominationTable
//  * Breaks down the physical cash counts stored in the database
//  */

// export default function DenominationTable({ denominations }) {

//   const {t} = useLanguage();

//   // Calculate total physical cash
//   const actualCashTotal =
//     denominations?.reduce((sum, d) => sum + d.total, 0) || 0;

//   return (
//     <div className="denomination-container">

//       <div className="denom-header">
//         <h3>{t("physical_denominations")}</h3>
//       </div>

//       <table className="denom-table">
//         <thead>
//           <tr>
//             <th>{t("denomination")}</th>
//             <th>{t("count")}</th>
//             <th className="text-right">{t("total")}</th>
//           </tr>
//         </thead>

//         <tbody>
//           {denominations && denominations.length > 0 ? (
//             denominations.map((item, index) => (
//               <tr key={index}>
//                 <td className="denom-value">₹{item.denomination}</td>

//                 <td className="denom-qty">
//                   {item.quantity}
//                 </td>

//                 <td className="text-right bold">
//                   ₹{item.total.toLocaleString("en-IN")}
//                 </td>
//               </tr>
//             ))
//           ) : (
//             <tr>
//               <td colSpan="3" className="text-center text-muted">
//                 {t("no_cash_entries")}
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       <div className="total-badge">
//         <span>{t("total")}:</span>
//         <span>₹{actualCashTotal.toLocaleString("en-IN")}</span>
//       </div>

//     </div>
//   );
// }


// // src/components/daybook/DenominationTable.jsx
// src/components/daybook/DenominationTable.jsx

import "./DenominationTable.css";

/**
 * API returns: [{ denomination: 1, count: 100, total: 100 }, ...]
 * We display all rows sorted ascending, coins (<=5) grouped at bottom.
 */
function parseRows(denomArray = []) {
  const notes = [];
  let coinsCount = 0;
  let coinsTotal = 0;

  // Sort ascending by denomination
  const sorted = [...denomArray].sort((a, b) => a.denomination - b.denomination);

  sorted.forEach((d) => {
    const denom = Number(d.denomination ?? d.note ?? 0);
    const count = Number(d.count ?? d.quantity ?? d.qty ?? 0);
    const total = Number(d.total ?? d.amount ?? d.value ?? count * denom);

    if (denom <= 5) {
      coinsCount += count;
      coinsTotal += total;
    } else {
      notes.push({ label: `₹${denom}`, count, total });
    }
  });

  return { notes, coins: { count: coinsCount, total: coinsTotal } };
}

export default function DenominationTable({ denominations = [] }) {
  const { notes, coins } = parseRows(denominations);
  const grandTotal = notes.reduce((s, r) => s + r.total, 0) + coins.total;

  return (
    <div className="db-denom-container">
      <h3 className="db-denom-heading">Physical Denominations</h3>

      <table className="db-denom-table">
        <thead>
          <tr>
            <th>Denom</th>
            <th>Count</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.count}</td>
              <td>₹{row.total.toLocaleString("en-IN")}</td>
            </tr>
          ))}
          {coins.total > 0 && (
            <tr className="db-denom-coins-row">
              <td>Coins</td>
              <td>{coins.count > 0 ? coins.count : "—"}</td>
              <td>₹{coins.total.toLocaleString("en-IN")}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="db-denom-total">
        <span>Total:</span>
        <span>₹{grandTotal.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}