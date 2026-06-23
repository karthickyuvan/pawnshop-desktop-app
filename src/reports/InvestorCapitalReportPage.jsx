

import React, { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import { getInvestors } from "../services/investorApi";
import { ArrowLeft, Printer } from "lucide-react";

export default function InvestorCapitalReportPage({ setActiveMenu }) {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvestors()
      .then((data) => setRows(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalInvestment = rows.reduce((sum, r) => sum + (r.total_investment || 0), 0);
  const totalWithdrawn = rows.reduce((sum, r) => sum + (r.total_withdrawn || 0), 0);
  const totalCapital = rows.reduce((sum, r) => sum + (r.current_balance || 0), 0);
  const totalInterestPaid = rows.reduce((sum, r) => sum + (r.total_profit_paid || 0), 0);

  return (
    <div className="report-container" style={{ padding: "24px" }}>
      <div className="report-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <button onClick={() => setActiveMenu("reports")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
            <ArrowLeft size={16} /> {t("back_to_list", "Back to Reports")}
          </button>
          <h2 style={{ marginTop: "12px", color: "#1e293b", fontWeight: "700" }}>{t("investor_capital_report_lbl")}</h2>
          <p style={{ color: "#64748b", margin: 0 }}>{t("investor_capital_report_desc")}</p>
        </div>
        <button onClick={() => window.print()} className="btn-print" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1e293b", color: "#fff", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
          <Printer size={16} /> {t("print_report", "Print Report")}
        </button>
      </div>

      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase" }}>{t("total_investment_lbl")}</span>
          <strong style={{ display: "block", fontSize: "1.4rem", color: "#1e293b", marginTop: "4px" }}>₹{totalInvestment.toLocaleString("en-IN")}</strong>
        </div>
        <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase" }}>{t("total_withdrawn_lbl")}</span>
          <strong style={{ display: "block", fontSize: "1.4rem", color: "#dc2626", marginTop: "4px" }}>₹{totalWithdrawn.toLocaleString("en-IN")}</strong>
        </div>
        <div style={{ padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px" }}>
          <span style={{ fontSize: "0.85rem", color: "#166534", textTransform: "uppercase" }}>{t("remaining_principal", "Active Capital Balance")}</span>
          <strong style={{ display: "block", fontSize: "1.4rem", color: "#15803d", marginTop: "4px" }}>₹{totalCapital.toLocaleString("en-IN")}</strong>
        </div>
        <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase" }}>{t("interest_paid", "Total Interest Paid")}</span>
          <strong style={{ display: "block", fontSize: "1.4rem", color: "#1e293b", marginTop: "4px" }}>₹{totalInterestPaid.toLocaleString("en-IN")}</strong>
        </div>
      </div>

      <div className="table-section">
        {loading ? (
          <p>{t("loading_pledges", "Loading report...")}</p>
        ) : (
          <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                <th style={{ padding: "12px 16px" }}>{t("code")}</th>
                <th style={{ padding: "12px 16px" }}>{t("customer_name", "Investor Name")}</th>
                <th style={{ padding: "12px 16px" }}>{t("rate", "Fixed Rate")}</th>
                <th style={{ padding: "12px 16px" }}>{t("total_investment_lbl")}</th>
                <th style={{ padding: "12px 16px" }}>{t("total_withdrawn_lbl")}</th>
                <th style={{ padding: "12px 16px" }}>{t("remaining_principal", "Principal Capital")}</th>
                <th style={{ padding: "12px 16px" }}>{t("interest_paid", "Interest Settled")}</th>
                <th style={{ padding: "12px 16px" }}>{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: "24px 16px", textAlign: "center", color: "#64748b" }}>
                    {t("no_matching_records")}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "600" }}>{r.investor_code}</td>
                    <td style={{ padding: "12px 16px" }}>{r.investor_name}</td>
                    <td style={{ padding: "12px 16px" }}>{r.fixed_interest_percentage}%</td>
                    <td style={{ padding: "12px 16px" }}>₹{r.total_investment.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px" }}>₹{r.total_withdrawn.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#15803d" }}>₹{r.current_balance.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px" }}>₹{r.total_profit_paid.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px" }}>{r.is_active ? t("active") : t("disabled", "Inactive")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}