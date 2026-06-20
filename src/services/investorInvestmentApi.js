// import { invoke } from "@tauri-apps/api/core";

// export const createInvestment = async (
//   payload
// ) => {
//   return await invoke(
//     "create_investment_cmd",
//     {
//       request: payload,
//     }
//   );
// };


// export const getInvestorLedger = async (
//   investorId
// ) => {
//   return await invoke(
//     "get_investor_ledger_cmd",
//     {
//       investorId,
//     }
//   );
// };

// export const withdrawInvestment = async (
//   payload
// ) => {
//   return await invoke(
//     "withdraw_investment_cmd",
//     {
//       request: payload,
//     }
//   );
// };


// export const getInvestorInterestPreview =
//   (investorId) =>
//     invoke(
//       "get_investor_interest_preview_cmd",
//       {
//         investorId,
//       }
//     );




// import { invoke } from "@tauri-apps/api/core";

// export const getInvestorLedger = (investorId) =>
//   invoke("get_investor_ledger_cmd", {
//     investorId,
//   });

// export const createInvestment = (request) =>
//   invoke("create_investment_cmd", {
//     request,
//   });

// export const withdrawInvestment = (request) =>
//   invoke("withdraw_investment_cmd", {
//     request,
//   });

// // ✅ Expose the individual interest preview calculation
// export const getInvestorInterestPreview = (investorId) =>
//   invoke("get_investor_interest_preview_cmd", { investorId });

// // ✅ Expose the all-investor pending interest due report
// export const getInvestorsInterestDueReport = () =>
//   invoke("get_images_interest_due_report_cmd"); // Maps to get_investors_interest_due_report_cmd



import { invoke } from "@tauri-apps/api/core";

export const getInvestorLedger = (investorId) =>
  invoke("get_investor_ledger_cmd", {
    investorId,
  });

export const createInvestment = (request) =>
  invoke("create_investment_cmd", {
    request,
  });

export const withdrawInvestment = (request) =>
  invoke("withdraw_investment_cmd", {
    request,
  });

// ✅ Fixed: Changed 'pub const' to 'export const'
export const getInvestorInterestPreview = (investorId) =>
  invoke("get_investor_interest_preview_cmd", { investorId });

// ✅ Fixed: Changed 'pub const' to 'export const'
export const getInvestorsInterestDueReport = () =>
  invoke("get_investors_interest_due_report_cmd");

// ✅ NEW: Expose global transaction logs command
export const getGlobalInvestorTransactions = () =>
  invoke("get_global_investor_transactions_cmd");