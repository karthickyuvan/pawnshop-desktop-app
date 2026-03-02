import { invoke } from "@tauri-apps/api/core";

/**
 * Map a bank to a pledge
 */
export const mapBankToPledge = async ({
  pledgeId,
  bankId,
  amount,
  bankCharges,
  actorUserId,
}) => {
  return invoke("map_bank_to_pledge_cmd", {
    pledgeId,
    bankId,
    amount,
    bankCharges,
    actorUserId,
  });
};
