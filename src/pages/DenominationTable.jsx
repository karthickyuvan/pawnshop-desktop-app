const NOTES = [500, 200, 100, 50, 20, 10];
const COINS = [5, 2, 1];

export default function DenominationTable({ data = {}, setData }) {
  const updateQty = (denom, qty) => {
    setData((prev = {}) => ({
      ...prev,
      [denom]: Number(qty),
    }));
  };

  const total = [...NOTES, ...COINS].reduce(
    (sum, d) => sum + (data[d] || 0) * d,
    0
  );

  const renderRows = (list) =>
    list.map((d) => (
      <tr key={d}>
        <td>₹{d}</td>
        <td>
          <input
            type="number"
            min="0"
            value={data[d] ?? ""}
            onChange={(e) => updateQty(d, e.target.value)}
          />
        </td>
        <td>₹{(data[d] || 0) * d}</td>
      </tr>
    ));

  return (
    <table className="denom-table">
      <thead>
        <tr>
          <th>Denomination</th>
          <th>Qty</th>
          <th>Amount</th>
        </tr>
      </thead>

      <tbody>
        {/* NOTES */}
        <tr>
          <td colSpan="3" style={{ fontWeight: "600", background: "#f3f4f6" }}>
            Notes
          </td>
        </tr>
        {renderRows(NOTES)}

        {/* COINS */}
        <tr>
          <td colSpan="3" style={{ fontWeight: "600", background: "#f9fafb" }}>
            Coins
          </td>
        </tr>
        {renderRows(COINS)}

        {/* TOTAL */}
        <tr className="denom-total">
          <td colSpan="2">Total</td>
          <td>₹{total}</td>
        </tr>
      </tbody>
    </table>
  );
}
