import { invoke } from "@tauri-apps/api/core";

export const getJewelleryTypes = () =>
  invoke("get_jewellery_types_cmd");

export const createJewelleryType = (data) =>
  invoke("create_jewellery_type_cmd", data);

export const toggleJewelleryType = (data) =>
  invoke("toggle_jewellery_type_cmd", data);


// import { invoke } from "@tauri-apps/api/core";

// // ✅ GET
// export const getJewelleryTypes = () =>
//   invoke("get_jewellery_types_cmd");

// // ✅ CREATE
// export const createJewelleryType = ({
//   metalTypeId,
//   name,
// }) =>
//   invoke("create_jewellery_type_cmd", {
//     metalTypeId,
//     name,
//   });

// // ✅ TOGGLE
// export const toggleJewelleryType = ({
//   jewelleryTypeId,
//   isActive,
// }) =>
//   invoke("toggle_jewellery_type_cmd", {
//     jewelleryTypeId,
//     isActive,
//   });