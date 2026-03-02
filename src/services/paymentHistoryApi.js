import { invoke } from "@tauri-apps/api/core";

/**
 * Get today's payment history
 */
export async function getTodayPaymentHistory() {
  try {
    const result = await invoke("get_today_payment_history");
    return result;
  } catch (error) {
    console.error("Error fetching today's payments:", error);
    throw error;
  }
}

export async function searchPledges(query) {
  console.log("Searching:", query);
  const res = await invoke("search_pledges", { query });
  console.log("Search Result:", res);
  return res;
}

export async function getQuickAccessPledges() {
  console.log("Loading Quick Access...");
  const res = await invoke("get_quick_access_pledges");
  console.log("Quick Access Result:", res);
  return res;
}

export async function getPledgePaymentDetails(pledgeId) {
  return await invoke("get_pledge_payment_details", { pledgeId });
}


/**
 * Get payment history with date filters
 * @param {Object} filters - { startDate, endDate }
 */
export async function getPaymentHistory(filters = {}) {
  try {
    const result = await invoke("get_payment_history", {
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
    });
    return result;
  } catch (error) {
    console.error("Error fetching payment history:", error);
    throw error;
  }
}

/**
 * Export payment history to CSV
 */
export function exportPaymentsToCSV(payments) {
  const headers = [
    "Receipt No",
    "Time",
    "Pledge No",
    "Customer",
    "Type",
    "Mode",
    "Amount",
    "Collected By"
  ];

  const rows = payments.map(p => [
    p.receipt_no,
    p.time,
    p.pledge_no,
    p.customer_name,
    p.payment_type,
    p.payment_mode,
    p.amount,
    p.collected_by
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}