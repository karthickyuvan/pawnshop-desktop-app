

import "./CashDenominationInput.css";

const NOTES_LEFT  = [500, 200, 100];
const NOTES_RIGHT = [50, 20, 10];

/** Returns the total rupee value represented by a denomination object. */
export function calcDenomTotal(data = {}) {
  const noteTotal = [...NOTES_LEFT, ...NOTES_RIGHT].reduce(
    (sum, note) => sum + (Number(data[note]) || 0) * note,
    0
  );
  return noteTotal + (Number(data.coins) || 0);
}

/** Returns a zeroed-out denomination object — useful for initialising state. */
export function emptyDenominations() {
  return { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, coins: 0 };
}

export default function CashDenominationInput({
  data = {},
  setData,          // omit (or pass undefined) for readOnly mode
  title = "Cash Denominations",
  readOnly = false,
  showTotal = false,
}) {
  const update = (key, raw) => {
    if (readOnly || !setData) return;
    setData((prev = {}) => ({ ...prev, [key]: Number(raw) }));
  };

  const renderCard = (denom, label, isCoins = false) => {
    const qty   = isCoins ? Number(data.coins) || 0 : Number(data[denom]) || 0;
    const value = isCoins ? qty : qty * denom;
    const key   = isCoins ? "coins" : denom;

    return (
      <div className={`cdenom-card${isCoins ? " cdenom-coin" : ""}`} key={key}>
        <div className="cdenom-label">{label}</div>

        {readOnly ? (
          <div className="cdenom-qty-display">{qty}</div>
        ) : (
          <input
            type="number"
            min="0"
            placeholder="0"
            value={data[key] === 0 ? "" : (data[key] ?? "")}
            onChange={(e) => update(key, e.target.value)}
            onWheel={(e) => e.target.blur()}
          />
        )}

        <div className="cdenom-amount">
          ₹{value.toLocaleString("en-IN")}
        </div>
      </div>
    );
  };

  return (
    <div className="cdenom-container">
      {title && <div className="cdenom-title">{title}</div>}

      <div className="cdenom-grid">
        <div className="cdenom-column">
          {NOTES_LEFT.map((n) => renderCard(n, `₹${n}`))}
        </div>
        <div className="cdenom-column">
          {NOTES_RIGHT.map((n) => renderCard(n, `₹${n}`))}
          {renderCard(null, "Coins", true)}
        </div>
      </div>

      {showTotal && (
        <div className="cdenom-total-row">
          <span>Total</span>
          <span>₹{calcDenomTotal(data).toLocaleString("en-IN")}</span>
        </div>
      )}
    </div>
  );
}