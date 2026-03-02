import { invoke } from "@tauri-apps/api/core";

export const getDaybook = async (date) => {
  return await invoke("fetch_daybook", { date });
};