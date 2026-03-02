import { invoke } from "@tauri-apps/api/core";

/**
 * Fetch current available denomination stock from backend
 */
export async function getDrawerStock() {
  const result = await invoke("get_current_denominations_cmd");

  const stock = {};
  result.forEach(([denom, qty]) => {
    stock[Number(denom)] = Number(qty);
  });

  return stock;
}

/**
 * Auto calculate denomination split using available drawer stock
 * @param {number} amount - amount to disburse
 * @returns {object} { success, denominations, remaining }
 */
export async function autoFillDenominations(amount) {
  const stock = await getDrawerStock();

  let remaining = amount;
  const result = {};

  const sortedNotes = Object.keys(stock)
    .map(Number)
    .sort((a, b) => b - a);

  for (let note of sortedNotes) {
    if (remaining <= 0) break;

    const availableQty = stock[note] || 0;
    const neededQty = Math.floor(remaining / note);

    const finalQty = Math.min(availableQty, neededQty);

    if (finalQty > 0) {
      result[note] = finalQty;
      remaining -= finalQty * note;
    }
  }

  return {
    success: remaining === 0,
    denominations: result,
    remaining
  };
}
