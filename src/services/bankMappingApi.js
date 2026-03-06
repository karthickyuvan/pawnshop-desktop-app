// services/bankMappingApi.js
import { invoke } from "@tauri-apps/api/core";

export async function getPledgeByNumber(pledgeNo) {
  try {
    const result = await invoke("get_pledge_by_number_cmd", { pledgeNo });
    return result;
  } catch (error) {
    throw new Error(error);
  }
}

export async function mapBankToPledge(data) {

  const denominationsArray = data.denominations
    ? Object.entries(data.denominations)
        .filter(([_, qty]) => qty > 0)
        .map(([denom, qty]) => ({
          denomination: parseInt(denom),
          quantity: qty,
        }))
    : null;

  try {
    const result = await invoke("map_bank_to_pledge", { 
      req: {                          // ← was "request", must be "req"
        pledge_id: data.pledgeId,
        bank_id: data.bankId,
        bank_loan_amount: data.bankLoanAmount,
        actual_received: data.actualReceived,
        bank_charges: data.bankCharges,
        payment_method: data.paymentMethod,
        reference_number: data.referenceNumber ?? null,
        denominations: denominationsArray,
        actor_user_id: data.actorUserId,
      }
    });
    return result;
  } catch (error) {
    console.error("Map bank error:", error);
    throw new Error(error);
  }
}

export async function unmapBankFromPledge(data) {
  const denominationsArray = data.denominations
    ? Object.entries(data.denominations)
        .filter(([_, qty]) => qty > 0)
        .map(([denom, qty]) => ({
          denomination: parseInt(denom),
          quantity: qty,
        }))
    : null;
  try {
    const result = await invoke("unmap_bank_from_pledge", {  // ← also remove "_cmd" suffix
      req: {                          // ← was "request", must be "req"
        mapping_id: data.mappingId,
        pledge_id: data.pledgeId,
        customer_payment: data.customerPayment,
        bank_repayment: data.bankRepayment,
        bank_interest: data.bankInterest,
        customer_interest: data.customerInterest,
        payment_method: data.paymentMethod,
        reference_number: data.referenceNumber ?? null,
        denominations: denominationsArray,
        actor_user_id: data.actorUserId,
      }
    });
    return result;
  } catch (error) {
    console.error("Unmap bank error:", error);
    throw new Error(error);
  }
}

export async function getBankMappings() {
  try {
    const result = await invoke("get_bank_mappings_list_cmd");
    return result;
  } catch (error) {
    throw new Error(error);
  }
}


export async function searchPledgesForMapping(query) {
  try {
    return await invoke("search_pledges_for_mapping_cmd", { query });
  } catch (error) {
    throw new Error(error);
  }
}