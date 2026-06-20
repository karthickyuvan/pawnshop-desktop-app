// import { invoke } from "@tauri-apps/api/core";

// export const getAuctionList = (search = null) =>
//   invoke("get_auction_list_cmd", { search });


// export const getAuctionedList = (search = null) =>
//   invoke("get_auctioned_list_cmd", { search });


// export const markPledgeAuctioned = (
//   pledgeId,
//   // actorUserId,
//   auctionAmount,
//   auctionNotes
// ) =>
//   invoke("mark_pledge_auctioned_cmd", {
//     pledgeId,
//     // actorUserId,
//     auctionAmount,
//     auctionNotes,
//   });

//   export const getAuctionReport = () =>
//   invoke("get_auction_report_cmd");



import { invoke } from "@tauri-apps/api/core";

export const getAuctionList = (search = null) =>
  invoke("get_auction_list_cmd", { search });

export const getAuctionedList = (search = null) =>
  invoke("get_auctioned_list_cmd", { search });

export const markPledgeAuctioned = (pledgeId, auctionAmount, auctionNotes) =>
  invoke("mark_pledge_auctioned_cmd", {
    pledgeId,
    auctionAmount,
    auctionNotes,
  });

export const getAuctionReport = () =>
  invoke("get_auction_report_cmd");