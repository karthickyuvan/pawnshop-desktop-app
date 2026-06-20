import { invoke } from "@tauri-apps/api/core";

export const getInvestors = () =>
  invoke("get_investors_cmd");

export const getInvestorById = (investorId) =>
  invoke("get_investor_by_id_cmd", {
    investorId,
  });

export const createInvestor = (request) =>
  invoke("create_investor_cmd", {
    request,
  });

export const updateInvestor = async (
  payload
) => {
  return await invoke(
    "update_investor_cmd",
    {
      request: payload,
    }
  );
};

export const toggleInvestorStatus =
  async (payload) => {

  return await invoke(
    "toggle_investor_status_cmd",
    {
      request: payload,
    }
  );
};



export const payProfit = (
  request
) =>
  invoke(
    "pay_profit_cmd",
    { request }
  );



