import { invoke } from "@tauri-apps/api/core";

export const getAuctionList = (search = null) =>
  invoke("get_auction_list_cmd", { search });

export const markPledgeAuctioned = (pledgeId, actorUserId) =>
  invoke("mark_pledge_auctioned_cmd", {
    pledgeId,
    actorUserId,
  });