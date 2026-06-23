
import React, { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import { getGlobalInvestorTransactions } from "../services/investorInvestmentApi";
import { formatTransactionTimestamp } from "../utils/timeFormatter";
import { ArrowLeft, Printer } from "lucide-react";

export default function InvestorTransactionsReportPage({ setActiveMenu }) {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGlobalInvestorTransactions()
      .then((data) => setRows(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="report-container" style={{ padding: "24px" }}>
      <div className="report-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <button onClick={() => setActiveMenu("reports")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
            <ArrowLeft size={16} /> {t("back_to_list", "Back to Reports")}
          </button>
          <h2 style={{ marginTop: "12px", color: "#1e293b", fontWeight: "700" }}>{t("investor_transaction_log_lbl")}</h2>
          <p style={{ color: "#64748b", margin: 0 }}>{t("investor_transaction_log_desc")}</p>
        </div>
        <button onClick={() => window.print()} className="btn-print" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1e293b", color: "#fff", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
          <Printer size={16} /> {t("print_report", "Print Report")}
        </button>
      </div>

      <div className="table-section">
        {loading ? (
          <p>{t("updating_ledger", "Loading transactions...")}</p>
        ) : rows.length === 0 ? (
          <div style={{ padding: "24px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", textAlign: "center", color: "#64748b" }}>
            {t("no_matching_records", "No transactions found.")}
          </div>
        ) : (
          <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                <th style={{ padding: "12px 16px" }}>{t("timestamp")}</th>
                <th style={{ padding: "12px 16px" }}>{t("investor_lbl", "Investor")}</th>
                <th style={{ padding: "12px 16px" }}>{t("type")}</th>
                <th style={{ padding: "12px 16px" }}>{t("method", "Method")}</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>{t("amount")}</th>
                <th style={{ padding: "12px 16px" }}>{t("narration", "Description / Remarks")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.85rem" }}>{formatTransactionTimestamp(r.transaction_date)}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "600" }}>{r.investor_name} ({r.investor_code})</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ 
                      fontWeight: "600", 
                      fontSize: "0.75rem", 
                      padding: "2px 8px", 
                      borderRadius: "20px", 
                      background: r.transaction_type === "INVESTMENT" ? "#f0fdf4" : r.transaction_type === "PROFIT_PAYMENT" ? "#eff6ff" : "#fef2f2", 
                      color: r.transaction_type === "INVESTMENT" ? "#16a34a" : r.transaction_type === "PROFIT_PAYMENT" ? "#3b82f6" : "#dc2626" 
                    }}>
                      {r.transaction_type === "PROFIT_PAYMENT" 
                        ? t("interest_payment") 
                        : r.transaction_type === "INVESTMENT" 
                          ? t("fund_management", "INVESTMENT") 
                          : r.transaction_type === "WITHDRAWAL" 
                            ? t("withdraw_funds", "WITHDRAWAL") 
                            : r.transaction_type}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {r.payment_method === "CASH" ? t("cash") : r.payment_method === "UPI" ? t("upi") : r.payment_method === "BANK" ? t("bank") : r.payment_method}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700" }}>₹{Number(r.amount).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 16px", color: "#334155", fontSize: "0.9rem" }}>{r.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}