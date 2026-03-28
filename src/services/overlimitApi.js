import { invoke } from "@tauri-apps/api/core";

export const getOverlimitPledges = async () => {
  return await invoke("get_overlimit_pledges_cmd");
};