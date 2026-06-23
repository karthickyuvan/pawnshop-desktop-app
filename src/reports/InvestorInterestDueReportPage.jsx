

import React, { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import { getInvestorsInterestDueReport } from "../services/investorInvestmentApi";
import { ArrowLeft, Printer } from "lucide-react";

export default function InvestorInterestDueReportPage({ setActiveMenu }) {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvestorsInterestDueReport()
      .then((data) => setRows(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalDues = rows.reduce((sum, r) => sum + (r.accrued_interest || 0), 0);

  return (
    <div className="report-container" style={{ padding: "24px" }}>
      <div className="report-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <button onClick={() => setActiveMenu("reports")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
            <ArrowLeft size={16} /> {t("back_to_list", "Back to Reports")}
          </button>
          <h2 style={{ marginTop: "12px", color: "#1e293b", fontWeight: "700" }}>{t("pending_interest_due_report_title")}</h2>
          <p style={{ color: "#64748b", margin: 0 }}>{t("investor_interest_due_desc")}</p>
        </div>
        <button onClick={() => window.print()} className="btn-print" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1e293b", color: "#fff", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
          <Printer size={16} /> {t("print_report", "Print Report")}
        </button>
      </div>

      <div style={{ padding: "20px", background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "10px", marginBottom: "24px", maxWidth: "300px" }}>
        <span style={{ fontSize: "0.85rem", color: "#b45309", textTransform: "uppercase", fontWeight: "600" }}>{t("interest_balance", "Total Pending Interest")}</span>
        <strong style={{ display: "block", fontSize: "1.6rem", color: "#d97706", marginTop: "4px" }}>₹{totalDues.toLocaleString("en-IN")}</strong>
      </div>

      <div className="table-section">
        {loading ? (
          <p>{t("loading_pledges", "Loading report...")}</p>
        ) : rows.length === 0 ? (
          <div style={{ padding: "24px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", textAlign: "center", color: "#64748b" }}>
            ✅ {t("investors_all_paid_msg")}
          </div>
        ) : (
          <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                <th style={{ padding: "12px 16px" }}>{t("investor_lbl", "Investor Name")}</th>
                <th style={{ padding: "12px 16px" }}>{t("principal_amount", "Principal Capital")}</th>
                <th style={{ padding: "12px 16px" }}>{t("rate", "Interest Rate")}</th>
                <th style={{ padding: "12px 16px" }}>{t("months_pending_hdr", "Months Pending")}</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>{t("interest_payable_lbl", "Accrued Interest Due")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.investor_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "600" }}>{r.investor_name}</td>
                  <td style={{ padding: "12px 16px" }}>₹{r.principal_amount.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 16px" }}>{r.interest_percentage}%</td>
                  <td style={{ padding: "12px 16px", color: "#d97706", fontWeight: "600" }}>
                    {r.total_months} {r.total_months === 1 ? t("month") : t("months")}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#dc2626", fontWeight: "700" }}>
                    ₹{r.accrued_interest.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}