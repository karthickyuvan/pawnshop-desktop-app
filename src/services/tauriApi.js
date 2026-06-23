

import { invoke } from "@tauri-apps/api/core";

const isTauri = () => {
  return typeof window !== "undefined" &&
         window.__TAURI_INTERNALS__;
};

// ✅ Check owner
export const checkOwner = async () => {
  if (!isTauri()) {
    console.log("Tauri not available");
    return false;
  }

  return await invoke("check_owner");
};

// ✅ Create owner
export const createOwner = async (data) => {
  if (!isTauri()) return null;

  return await invoke("create_owner_cmd", {
    username: data.username,
    password: data.password,
  });
};

// ✅ Login
export const login = async (data) => {
  if (!isTauri()) return null;

  return await invoke("login_cmd", {
    username: data.username,
    password: data.password,
  });
};