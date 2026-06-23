import { invoke } from "@tauri-apps/api/core";

export const getMetalTypes = () =>
  invoke("get_metal_types_cmd");

export const createMetalType = ({ name, description, actorUserId }) =>
  invoke("create_metal_type_cmd", {
    name,
    description,
    actorUserId,
  });

export const toggleMetalType = ({ metalTypeId, isActive, actorUserId }) =>
  invoke("toggle_metal_type_cmd", {
    metalTypeId,
    isActive,
    actorUserId,
  });


  export const getActiveMetalTypes = async () => {
    return await invoke("get_active_metal_types_cmd");
  };
