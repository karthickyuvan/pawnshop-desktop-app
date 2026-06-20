import { invoke } from "@tauri-apps/api/core";

export const getStaffSalaryReport = () =>
  invoke("get_staff_salary_report_cmd");