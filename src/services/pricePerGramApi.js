import { invoke } from "@tauri-apps/api/core";

/* ---------------- GET PRICE LIST ---------------- */
export const getPrices = async () => {
  return await invoke("get_price_per_gram_cmd");
};

/* ---------------- SET / UPDATE PRICE ---------------- */
export const setPricePerGram = async ({
  metalTypeId,
  pricePerGram,
  actorUserId,
}) => {
  return await invoke("set_price_per_gram_cmd", {
    metalTypeId,
    pricePerGram,
    actorUserId,
  });
};
