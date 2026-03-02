import { invoke } from "@tauri-apps/api/core";

/**
 * Create a new bank
 */
export const createBank = async ({
  bankName,
  branchName,
  accountNumber,
  ifscCode,
  actorUserId,
}) => {
  return invoke("create_bank_cmd", {
    bankName,
    branchName,
    accountNumber,
    ifscCode,
    actorUserId,
  });
};

/**
 * Get all banks
 */
export const getBanks = async () => {
  return invoke("get_banks_cmd");
};
