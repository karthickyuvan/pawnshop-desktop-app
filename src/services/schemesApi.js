import { invoke } from "@tauri-apps/api/core";

export const getSchemes = async () => {
  return await invoke("get_schemes_cmd");
};

export const createScheme = async (data) => {
  return await invoke("create_scheme_cmd", {
    metalTypeId: data.metalTypeId,
    schemeName: data.schemeName,
    loanPercentage: data.loanPercentage,
    priceProgram: data.priceProgram,
    interestRate: data.interestRate,
    interestType: data.interestType,
    processingFeeType: data.processingFeeType,
    processingFeeValue: data.processingFeeValue,
    actorUserId: data.actorUserId,
  });
};

// ✅ ADD THIS
export const updateScheme = async (data) => {
  return await invoke("update_scheme_cmd", {
    id: data.id,
    metalTypeId: data.metalTypeId,
    schemeName: data.schemeName,
    loanPercentage: data.loanPercentage,
    priceProgram: data.priceProgram,
    interestRate: data.interestRate,
    interestType: data.interestType,
    processingFeeType: data.processingFeeType,
    processingFeeValue: data.processingFeeValue,
    actorUserId: data.actorUserId,
  });
};

export const toggleScheme = async ({ schemeId, isActive, actorUserId }) => {
  return await invoke("toggle_scheme_cmd", {
    schemeId,
    isActive,
    actorUserId,
  });
};