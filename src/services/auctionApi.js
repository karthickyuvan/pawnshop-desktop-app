import { invoke } from "@tauri-apps/api/core";

export const getAuctionList = (search = null) =>
  invoke("get_auction_list_cmd", { search });

export const getAuctionedList = (search = null) =>
  invoke("get_auctioned_list_cmd", { search });

// Fix applied: Added actorUserId parameter
export const markPledgeAuctioned = (pledgeId, auctionAmount, auctionNotes, actorUserId) =>
  invoke("mark_pledge_auctioned_cmd", {
    pledgeId,
    auctionAmount,
    auctionNotes,
    actorUserId, // <-- Tauri backend command-uku user ID ah anuprom
  });

export const getAuctionReport = () =>
  invoke("get_auction_report_cmd");