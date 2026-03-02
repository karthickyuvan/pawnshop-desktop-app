import { invoke } from "@tauri-apps/api/core";

export const checkOwner = () =>
  invoke("check_owner");

export const createOwner = (data) =>
  invoke("create_owner_cmd", data);

export const login = (data) =>
  invoke("login_cmd", data);
