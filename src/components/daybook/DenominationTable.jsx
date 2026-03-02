import React from "react";
import "../../pages/daybook.css";
/**
 * DenominationTable
 * Breaks down the physical cash counts stored in the database
 */
export default function DenominationTable({ denominations }) {
  // Calculate total physical cash
  const actualCashTotal = denominations?.reduce((sum, d) => sum + d.total, 0) || 0;

  return (
    <div className="denomination-container">
      <div className="denom-header">
        <h3>Physical Denominations</h3>
      </div>

      <table className="denom-table">
        <thead>
          <tr>
            <th>Denom</th>
            <th>Count</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {denominations && denominations.length > 0 ? (
            denominations.map((item, index) => (
              <tr key={index}>
                <td className="denom-value">₹{item.denomination}</td>
                <td className="denom-qty"> {item.quantity}</td>
                <td className="text-right bold">
                  ₹{item.total.toLocaleString("en-IN")}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center text-muted">
                No cash entries for this date.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div class="total-badge">
        <span>Total:</span>
        <span>₹{actualCashTotal.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}