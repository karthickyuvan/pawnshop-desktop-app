
// // src/components/daybook/DenominationTable.jsx

// import "./DenominationTable.css";

// /**
//  * API returns: [{ denomination: 1, count: 100, total: 100 }, ...]
//  * We display all rows sorted ascending, coins (<=5) grouped at bottom.
//  */
// function parseRows(denomArray = []) {
//   const notes = [];
//   let coinsCount = 0;
//   let coinsTotal = 0;

//   // Sort ascending by denomination
//   const sorted = [...denomArray].sort((a, b) => a.denomination - b.denomination);

//   sorted.forEach((d) => {
//     const denom = Number(d.denomination ?? d.note ?? 0);
//     const count = Number(d.count ?? d.quantity ?? d.qty ?? 0);
//     const total = Number(d.total ?? d.amount ?? d.value ?? count * denom);

//     if (denom <= 5) {
//       coinsCount += count;
//       coinsTotal += total;
//     } else {
//       notes.push({ label: `₹${denom}`, count, total });
//     }
//   });

//   return { notes, coins: { count: coinsCount, total: coinsTotal } };
// }

// export default function DenominationTable({ denominations = [] }) {
//   const { notes, coins } = parseRows(denominations);
//   const grandTotal = notes.reduce((s, r) => s + r.total, 0) + coins.total;

//   return (
//     <div className="db-denom-container">
//       <h3 className="db-denom-heading">Physical Denominations</h3>

//       <table className="db-denom-table">
//         <thead>
//           <tr>
//             <th>Denom</th>
//             <th>Count</th>
//             <th>Total</th>
//           </tr>
//         </thead>
//         <tbody>
//           {notes.map((row) => (
//             <tr key={row.label}>
//               <td>{row.label}</td>
//               <td>{row.count}</td>
//               <td>₹{row.total.toLocaleString("en-IN")}</td>
//             </tr>
//           ))}
//           {coins.total > 0 && (
//             <tr className="db-denom-coins-row">
//               <td>Coins</td>
//               <td>{coins.count > 0 ? coins.count : "—"}</td>
//               <td>₹{coins.total.toLocaleString("en-IN")}</td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       <div className="db-denom-total">
//         <span>Total:</span>
//         <span>₹{grandTotal.toLocaleString("en-IN")}</span>
//       </div>
//     </div>
//   );
// }



// src/components/daybook/DenominationTable.jsx

import "./DenominationTable.css";

// The standard list of denominations we ALWAYS want to display
const STANDARD_DENOMS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

function parseRows(denomArray = []) {
  const rows = [];
  let grandTotal = 0;

  // 1. Convert the backend data into a dictionary/map for easy lookup
  const denomMap = {};
  denomArray.forEach((d) => {
    const denom = Number(d.denomination ?? d.note ?? 0);
    const count = Number(d.count ?? d.quantity ?? d.qty ?? 0);
    denomMap[denom] = (denomMap[denom] || 0) + count;
  });

  // 2. Loop through our standard list so they ALL show up in order
  STANDARD_DENOMS.forEach((denom) => {
    const count = denomMap[denom] || 0;
    const total = count * denom;
    const isCoin = denom <= 5;

    rows.push({
      label: isCoin ? `₹${denom} (Coin)` : `₹${denom}`,
      denom,
      count,
      total,
    });

    grandTotal += total;
  });

  return { rows, grandTotal };
}

export default function DenominationTable({ denominations = [] }) {
  const { rows, grandTotal } = parseRows(denominations);

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
          {rows.map((row) => (
            <tr key={row.denom} style={{ opacity: row.count === 0 ? 0.5 : 1 }}>
              <td>{row.label}</td>
              <td>{row.count}</td>
              <td style={{ fontWeight: "600" }}>₹{row.total.toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="db-denom-total">
        <span>Total:</span>
        <span>₹{grandTotal.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}