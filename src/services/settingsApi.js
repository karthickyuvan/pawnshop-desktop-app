import { invoke } from "@tauri-apps/api/core";

export const getSystemSettings = async () => {
  return await invoke("get_system_settings_cmd");
};

export const updateSystemSettings = async (settings) => {
  return await invoke("update_system_settings_cmd", {
    settings,
  });
};
