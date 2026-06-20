import { invoke } from "@tauri-apps/api/core";

/* GET CURRENT PRICES */
export async function getPrices() {
  return await invoke("get_price_per_gram_cmd");
}

/* SET PRICE */
export async function setPricePerGram(data) {
  return await invoke("set_price_per_gram_cmd", data);
}

/* GET PRICE HISTORY */
export async function getPriceHistory() {
  return await invoke("get_price_history_cmd");
}


// import { invoke } from "@tauri-apps/api/core";

// /* GET CURRENT PRICES */
// export async function getPrices() {
//   return await invoke("get_prices");
// }

// /* SET PRICE */
// export async function setPricePerGram({
//   metalTypeId,
//   price,
//   actorUserId,
// }) {

//   return await invoke("set_price_per_gram", {
//     metalTypeId,
//     price: Number(price),
//     actorUserId,
//   });

// }

// /* GET PRICE HISTORY */
// export async function getPriceHistory() {
//   return await invoke("get_price_history");
// }