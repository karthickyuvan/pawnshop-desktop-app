import { invoke } from "@tauri-apps/api/core";

export const createPledge = async (pledgeData) => {
  return await invoke("create_pledge_cmd", { request: pledgeData });
};

export const getAllPledges = async (search, actorUserId) => {
  return await invoke("get_all_pledges_cmd", {
    search: search || null,
    actorUserId,
  });
};