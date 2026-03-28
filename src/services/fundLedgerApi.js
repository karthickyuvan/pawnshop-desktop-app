import { invoke } from "@tauri-apps/api/core";

export async function getFundLedgerReport(filters){

  return await invoke("get_fund_ledger_report_cmd",{

    year: filters?.year ?? null,
    month: filters?.month ?? null,
    week: filters?.week ?? null,
    module_filter: filters?.module ?? "ALL"

  });

}