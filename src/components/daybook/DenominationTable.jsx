

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