

import React, { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import { getInvestors } from "../services/investorApi";
import { getInvestorLedger } from "../services/investorInvestmentApi";
import { formatTransactionTimestamp } from "../utils/timeFormatter";
import { ArrowLeft, Printer } from "lucide-react";

export default function InvestorStatementReportPage({ setActiveMenu }) {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [investors, setInvestors] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getInvestors().then(setInvestors).catch(console.error);
  }, []);

  const loadStatement = async (e) => {
    const id = e.target.value;
    setSelectedId(id);
    if (!id) {
      setLedger(null);
      return;
    }
    try {
      setLoading(true);
      const data = await getInvestorLedger(Number(id));
      setLedger(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-container" style={{ padding: "24px" }}>
      <div className="report-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <button onClick={() => setActiveMenu("reports")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
            <ArrowLeft size={16} /> {t("back_to_list", "Back to Reports")}
          </button>
          <h2 style={{ marginTop: "12px", color: "#1e293b", fontWeight: "700" }}>{t("investor_statement_report_lbl")}</h2>
          <p style={{ color: "#64748b", margin: 0 }}>{t("investor_statement_report_desc")}</p>
        </div>
        {ledger && (
          <button onClick={() => window.print()} className="btn-print" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1e293b", color: "#fff", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
            <Printer size={16} /> {t("print_report", "Print Statement")}
          </button>
        )}
      </div>

      <div style={{ marginBottom: "24px", maxWidth: "400px" }}>
        <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginBottom: "6px" }}>{t("investor_lbl", "Select Investor")}</label>
        <select value={selectedId} onChange={loadStatement} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
          <option value="">-- {t("search_investor", "Select Investor")} --</option>
          {investors.map((inv) => (
            <option key={inv.id} value={inv.id}>{inv.investor_name} ({inv.investor_code})</option>
          ))}
        </select>
      </div>

      {loading && <p>{t("updating_ledger", "Loading statement...")}</p>}

      {ledger && !loading && (
        <div className="statement-sheet" style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #cbd5e1", paddingBottom: "16px", marginBottom: "20px" }}>
            <div>
              <h3 style={{ margin: 0, color: "#1e293b" }}>{ledger.summary.investor_name}</h3>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                {t("code")}: {ledger.summary.investor_code} | {t("type")}: {ledger.summary.investor_type === "FIXED_INTEREST" ? t("fixed_interest_option") : ledger.summary.investor_type}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{t("remaining_principal", "Current active capital")}</span>
              <strong style={{ display: "block", fontSize: "1.3rem", color: "#15803d" }}>₹{Number(ledger.summary.current_balance).toLocaleString("en-IN")}</strong>
            </div>
          </div>

          <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                <th style={{ padding: "12px" }}>{t("timestamp")}</th>
                <th style={{ padding: "12px" }}>{t("type")}</th>
                <th style={{ padding: "12px" }}>{t("method", "Method")}</th>
                <th style={{ padding: "12px", textAlign: "right" }}>{t("amount")}</th>
                <th style={{ padding: "12px" }}>{t("narration", "Audit Remarks / Period")}</th>
              </tr>
            </thead>
            <tbody>
              {ledger.transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "24px 12px", textAlign: "center", color: "#64748b" }}>
                    {t("no_matching_records")}
                  </td>
                </tr>
              ) : (
                ledger.transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", color: "#64748b", fontSize: "0.85rem" }}>{formatTransactionTimestamp(tx.transaction_date)}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ fontWeight: "600", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "20px", background: tx.transaction_type === "INVESTMENT" ? "#f0fdf4" : "#fef2f2", color: tx.transaction_type === "INVESTMENT" ? "#16a34a" : "#dc2626" }}>
                        {tx.transaction_type === "PROFIT_PAYMENT" 
                          ? t("interest_payment") 
                          : tx.transaction_type === "INVESTMENT" 
                            ? t("fund_management", "INVESTMENT") 
                            : tx.transaction_type === "WITHDRAWAL" 
                              ? t("withdraw_funds", "WITHDRAWAL") 
                              : tx.transaction_type}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {tx.payment_method === "CASH" ? t("cash") : tx.payment_method === "UPI" ? t("upi") : tx.payment_method === "BANK" ? t("bank") : tx.payment_method}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>₹{Number(tx.amount).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px", color: "#334155", fontSize: "0.9rem" }}>{tx.remarks || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}