

// src/components/daybook/DenominationTable.jsx
import React from "react";

const NOTES = [500, 200, 100, 50, 20, 10];
const COINS = [5, 2, 1];

export default function DenominationTable({ data = {}, setData, expectedData = {} }) {
  const updateQty = (denom, qty) => {
    setData((prev = {}) => ({
      ...prev,
      [denom]: Number(qty) >= 0 ? Number(qty) : 0,
    }));
  };

  const totalPhysical = [...NOTES, ...COINS].reduce(
    (sum, d) => sum + (data[d] || 0) * d,
    0
  );

  const totalExpected = [...NOTES, ...COINS].reduce(
    (sum, d) => sum + (expectedData[d] || 0) * d,
    0
  );

  const renderRows = (list) =>
    list.map((d) => {
      const physicalQty = data[d] || 0;
      const expectedQty = expectedData[d] || 0;
      const variance = physicalQty - expectedQty;

      return (
        <tr key={d}>
          <td>₹{d}</td>
          {/* Expected Quantity column */}
          <td style={{ color: "#64748b", fontWeight: "500" }}>{expectedQty}</td>
          {/* Physical Input column */}
          <td>
            <input
              type="number"
              min="0"
              style={{
                width: "60px",
                padding: "6px",
                textAlign: "center",
                borderRadius: "6px",
                border: "1px solid #d1d5db"
              }}
              value={data[d] ?? ""}
              onChange={(e) => updateQty(d, e.target.value)}
            />
          </td>
          {/* Variance (Mismatch) Indicator */}
          <td style={{
            fontWeight: "700",
            color: variance === 0 ? "#16a34a" : variance > 0 ? "#2563eb" : "#dc2626"
          }}>
            {variance > 0 ? `+${variance}` : variance}
          </td>
          <td>₹{(physicalQty * d).toLocaleString()}</td>
        </tr>
      );
    });

  return (
    <table className="denom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "#f8fafc", textAlign: "left" }}>
          <th>Denomination</th>
          <th>Expected</th>
          <th>Physical Qty</th>
          <th>Variance</th>
          <th>Amount</th>
        </tr>
      </thead>

      <tbody>
        {/* NOTES */}
        <tr>
          <td colSpan="5" style={{ fontWeight: "600", background: "#f3f4f6", padding: "8px" }}>
            Notes
          </td>
        </tr>
        {renderRows(NOTES)}

        {/* COINS */}
        <tr>
          <td colSpan="5" style={{ fontWeight: "600", background: "#f9fafb", padding: "8px" }}>
            Coins
          </td>
        </tr>
        {renderRows(COINS)}

        {/* SUMMARY TOTALS */}
        <tr className="denom-total" style={{ fontWeight: "700", borderTop: "2px solid #cbd5e1" }}>
          <td colSpan="2">Expected: ₹{totalExpected.toLocaleString()}</td>
          <td colSpan="2">Physical: ₹{totalPhysical.toLocaleString()}</td>
          <td style={{ color: totalPhysical - totalExpected === 0 ? "#16a34a" : "#dc2626" }}>
            Diff: {totalPhysical - totalExpected >= 0 ? "+" : ""}{(totalPhysical - totalExpected).toLocaleString()}
          </td>
        </tr>
      </tbody>
    </table>
  );
}