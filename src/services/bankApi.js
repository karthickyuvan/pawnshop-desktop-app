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





// import { invoke } from "@tauri-apps/api/core";

// /* CREATE BANK */
// export const createBank = async ({
//   bankName,
//   branchName,
//   accountNumber,
//   ifscCode,
// }) => {

//   return await invoke("create_bank_cmd", {
//     bankName,
//     branchName,
//     accountNumber,
//     ifscCode,
//   });

// };

// /* GET BANKS */
// export const getBanks = async () => {
//   return await invoke("get_banks_cmd");
// };