

import { invoke } from "@tauri-apps/api/core";

/* GET PLEDGE */
export async function getPledgeByNumber(pledgeNo) {

  try {

    return await invoke("get_pledge_by_number_cmd", {
      pledgeNo,
    });

  } catch (error) {

    throw new Error(error);

  }

}

/* MAP BANK */
export async function mapBankToPledge(data) {

  console.log("📥 bankMappingApi.js received data:", data);

  const payload = {
    pledgeId: data.pledgeId,
    bankId: data.bankId,
    bankLoanAmount: data.bankLoanAmount,
    actualReceived: data.actualReceived,
    bankCharges: data.bankCharges,
    paymentMethod: data.paymentMethod,
    referenceNumber: data.referenceNumber ?? null,
    denominations: data.denominations || null,
    actorUserId: data.actorUserId,
  };

  console.log("📤 Sending to Rust:", payload);

  try {

    return await invoke("map_bank_to_pledge", {
      req: payload,
    });

  } catch (error) {

    console.error("❌ Map bank error:", error);
    throw new Error(error);

  }

}

/* UNMAP BANK */
export async function unmapBankFromPledge(data) {

  const payload = {
    mappingId: data.mappingId,
    pledgeId: data.pledgeId,
    customerPayment: data.customerPayment,
    bankRepayment: data.bankRepayment,
    bankInterest: data.bankInterest,
    customerInterest: data.customerInterest,
    paymentMethod: data.paymentMethod,
    referenceNumber: data.referenceNumber ?? null,
    denominations: data.denominations || null,
    actorUserId: data.actorUserId,
  };

  try {

    return await invoke("unmap_bank_from_pledge", {
      req: payload,
    });

  } catch (error) {

    console.error("❌ Unmap bank error:", error);
    throw new Error(error);

  }

}

/* GET BANK MAPPINGS */
export async function getBankMappings() {

  try {

    return await invoke("get_bank_mappings_list_cmd");

  } catch (error) {

    throw new Error(error);

  }

}

/* SEARCH PLEDGES */
export async function searchPledgesForMapping(query) {

  try {

    return await invoke("search_pledges_for_mapping_cmd", {
      query,
    });

  } catch (error) {

    throw new Error(error);

  }

}