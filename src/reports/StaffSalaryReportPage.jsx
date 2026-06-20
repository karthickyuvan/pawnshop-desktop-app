// import React, { useEffect, useState } from "react";
// import { getStaffSalaryReport } from "../services/staffSalaryReportApi";
// import { formatTransactionTimestamp } from "../utils/timeFormatter";
// import { ArrowLeft, Printer, Award, FileSpreadsheet, UserCheck, ShieldAlert, Sparkles } from "lucide-react";
// // import "./StaffSalaryReportPage.css"; // Ensure to style as desired

// function StatCard({ icon, label, value, color }) {
//   return (
//     <div className={`stat-card ${color}`}>
//       <div className="stat-card-icon">{icon}</div>
//       <div className="stat-card-body">
//         <div className="stat-card-value">{value}</div>
//         <div className="stat-card-label">{label}</div>
//       </div>
//     </div>
//   );
// }

// export default function StaffSalaryReportPage({ setActiveMenu }) {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("registry"); // "registry" | "advances" | "payments"

//   useEffect(() => {
//     loadReport();
//   }, []);

//   const loadReport = () => {
//     setLoading(true);
//     getStaffSalaryReport()
//       .then(setData)
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   };

//   const formatCurrency = (val) => {
//     return `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
//   };

//   if (loading) return <div className="page-loader" style={{ textAlign: "center", padding: "80px" }}>Compiling Payroll Audit Logs...</div>;
//   if (!data) return <div className="page-error" style={{ textAlign: "center", padding: "80px" }}>Failed to load salary reports.</div>;

//   return (
//     <div className="salary-report-container" style={{ padding: "24px" }}>
//       {/* ── Header ── */}
//       <div className="report-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
//         <div>
//           <button onClick={() => setActiveMenu("reports")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
//             <ArrowLeft size={16} /> Back to Reports
//           </button>
//           <h2 style={{ marginTop: "12px", color: "#1e293b", fontWeight: "700" }}>Staff Salary &amp; Payroll Report</h2>
//           <p style={{ color: "#64748b", margin: 0 }}>Detailed corporate auditing trail of salary payments, unsettled advances, and pending dues</p>
//         </div>
//         <button onClick={() => window.print()} className="btn-print" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1e293b", color: "#fff", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
//           <Printer size={16} /> Print Report
//         </button>
//       </div>

//       {/* ── KPI Summary Cards ── */}
//       <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
//         <StatCard icon="👥" label="Active Monthly Payroll" value={formatCurrency(data.total_monthly_payroll)} color="card-blue" />
//         <StatCard icon="✅" label="Total Settled Payments" value={formatCurrency(data.total_paid_to_date)} color="card-green" />
//         <StatCard icon="⏳" label="Unsettled Advance Balance" value={formatCurrency(data.total_unsettled_advances)} color="card-orange" />
//         <StatCard icon="⚠️" label="Net Unpaid Salary Owed" value={formatCurrency(data.total_unpaid_salary_dues)} color="card-rose" />
//       </div>

//       {/* ── Sub-navigation Tabs ── */}
//       <div className="rp-tabs" style={{ display: "flex", gap: "12px", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "20px" }}>
//         <button className={`rp-tab ${activeTab === "registry" ? "active" : ""}`} onClick={() => setActiveTab("registry")} style={{ padding: "8px 16px", border: "none", background: "none", fontWeight: "600", cursor: "pointer", color: activeTab === "registry" ? "#2563eb" : "#64748b", borderBottom: activeTab === "registry" ? "3px solid #2563eb" : "none" }}>
//           📁 Payroll Registry ({data.staff_rows.length})
//         </button>
//         <button className={`rp-tab ${activeTab === "advances" ? "active" : ""}`} onClick={() => setActiveTab("advances")} style={{ padding: "8px 16px", border: "none", background: "none", fontWeight: "600", cursor: "pointer", color: activeTab === "advances" ? "#2563eb" : "#64748b", borderBottom: activeTab === "advances" ? "3px solid #2563eb" : "none" }}>
//           ⏳ Chronological Advances ({data.advances.length})
//         </button>
//         <button className={`rp-tab ${activeTab === "payments" ? "active" : ""}`} onClick={() => setActiveTab("payments")} style={{ padding: "8px 16px", border: "none", background: "none", fontWeight: "600", cursor: "pointer", color: activeTab === "payments" ? "#2563eb" : "#64748b", borderBottom: activeTab === "payments" ? "3px solid #2563eb" : "none" }}>
//           💸 Chronological Settlements ({data.payments.length})
//         </button>
//       </div>

//       {/* ── TAB CONTENT ── */}
//       <div className="table-section">
//         {/* Tab 1: Staff Payroll Registry */}
//         {activeTab === "registry" && (
//           <div>
//             <div className="section-title" style={{ marginBottom: "12px", color: "#1e293b", fontWeight: "600" }}>Active Staff Payroll Registry</div>
//             <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
//                   <th style={{ padding: "12px 16px" }}>Staff Username</th>
//                   <th style={{ padding: "12px 16px" }}>Full Name</th>
//                   <th style={{ padding: "12px 16px" }}>Monthly Salary</th>
//                   <th style={{ padding: "12px 16px" }}>Months Worked</th>
//                   <th style={{ padding: "12px 16px" }}>Total Salary Accrued</th>
//                   <th style={{ padding: "12px 16px" }}>Total Paid</th>
//                   <th style={{ padding: "12px 16px" }}>Unsettled Advances</th>
//                   <th style={{ padding: "12px 16px", textAlign: "right" }}>Net Unpaid Dues Owed</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.staff_rows.map((r) => (
//                   <tr key={r.staff_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
//                     <td style={{ padding: "12px 16px", fontWeight: "600" }}>{r.username}</td>
//                     <td style={{ padding: "12px 16px" }}>{r.full_name || "—"}</td>
//                     <td style={{ padding: "12px 16px" }}>{formatCurrency(r.monthly_salary)}</td>
//                     <td style={{ padding: "12px 16px" }}>{r.months_worked}</td>
//                     <td style={{ padding: "12px 16px" }}>{formatCurrency(r.total_earned)}</td>
//                     <td style={{ padding: "12px 16px", color: "#16a34a" }}>{formatCurrency(r.total_paid)}</td>
//                     <td style={{ padding: "12px 16px", color: "#ea580c" }}>{formatCurrency(r.unsettled_advances)}</td>
//                     <td style={{ padding: "12px 16px", textAlign: "right", color: r.unpaid_dues > 0 ? "#dc2626" : "#16a34a", fontWeight: "700" }}>
//                       {formatCurrency(r.unpaid_dues)}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Tab 2: Chronological Advances */}
//         {activeTab === "advances" && (
//           <div>
//             <div className="section-title" style={{ marginBottom: "12px", color: "#1e293b", fontWeight: "600" }}>Salary Advances Journal Audit Trail</div>
//             <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
//                   <th style={{ padding: "12px 16px" }}>Date</th>
//                   <th style={{ padding: "12px 16px" }}>Employee</th>
//                   <th style={{ padding: "12px 16px" }}>Payment Mode</th>
//                   <th style={{ padding: "12px 16px" }}>Amount</th>
//                   <th style={{ padding: "12px 16px" }}>Clearance Status</th>
//                   <th style={{ padding: "12px 16px" }}>Audit Remarks</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.advances.map((a) => (
//                   <tr key={a.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
//                     <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.85rem" }}>{a.advance_date}</td>
//                     <td style={{ padding: "12px 16px", fontWeight: "600" }}>{a.staff_name}</td>
//                     <td style={{ padding: "12px 16px" }}>{a.payment_mode}</td>
//                     <td style={{ padding: "12px 16px", fontWeight: "700" }}>{formatCurrency(a.amount)}</td>
//                     <td style={{ padding: "12px 16px" }}>
//                       <span style={{ fontWeight: "600", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "20px", background: a.status === "CLEARED" ? "#f0fdf4" : "#fff7ed", color: a.status === "CLEARED" ? "#16a34a" : "#d97706" }}>
//                         {a.status}
//                       </span>
//                     </td>
//                     <td style={{ padding: "12px 16px", color: "#475569", fontSize: "0.9rem" }}>{a.remarks || "—"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Tab 3: Chronological Payroll Settlements */}
//         {activeTab === "payments" && (
//           <div>
//             <div className="section-title" style={{ marginBottom: "12px", color: "#1e293b", fontWeight: "600" }}>Payroll Payout Settlement Log</div>
//             <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
//                   <th style={{ padding: "12px 16px" }}>Paid At</th>
//                   <th style={{ padding: "12px 16px" }}>Salary Month</th>
//                   <th style={{ padding: "12px 16px" }}>Employee</th>
//                   <th style={{ padding: "12px 16px" }}>Gross Salary</th>
//                   <th style={{ padding: "12px 16px" }}>Advances Deducted</th>
//                   <th style={{ padding: "12px 16px" }}>Net Disbursed</th>
//                   <th style={{ padding: "12px 16px" }}>Mode</th>
//                   <th style={{ padding: "12px 16px" }}>Remarks</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.payments.map((p) => (
//                   <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
//                     <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.85rem" }}>{formatTransactionTimestamp(p.paid_at)}</td>
//                     <td style={{ padding: "12px 16px", fontWeight: "600" }}>{p.salary_month}</td>
//                     <td style={{ padding: "12px 16px" }}>{p.staff_name}</td>
//                     <td style={{ padding: "12px 16px" }}>{formatCurrency(p.gross_salary)}</td>
//                     <td style={{ padding: "12px 16px", color: "#ea580c" }}>{p.advance_amount > 0 ? `-${formatCurrency(p.advance_amount)}` : "—"}</td>
//                     <td style={{ padding: "12px 16px", color: "#16a34a", fontWeight: "700" }}>{formatCurrency(p.net_salary)}</td>
//                     <td style={{ padding: "12px 16px" }}>{p.payment_mode}</td>
//                     <td style={{ padding: "12px 16px", color: "#475569", fontSize: "0.9rem" }}>{p.remarks || "—"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }








import React, { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import { getStaffSalaryReport } from "../services/staffSalaryReportApi";
import { formatTransactionTimestamp } from "../utils/timeFormatter";
import { ArrowLeft, Printer } from "lucide-react";

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

export default function StaffSalaryReportPage({ setActiveMenu }) {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("registry"); // "registry" | "advances" | "payments"

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = () => {
    setLoading(true);
    getStaffSalaryReport()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  if (loading) return <div className="page-loader" style={{ textAlign: "center", padding: "80px" }}>{t("updating_ledger", "Compiling Payroll Audit Logs...")}</div>;
  if (!data) return <div className="page-error" style={{ textAlign: "center", padding: "80px" }}>{t("dashboard_error", "Failed to load salary reports.")}</div>;

  return (
    <div className="salary-report-container" style={{ padding: "24px" }}>
      {/* ── Header ── */}
      <div className="report-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <button onClick={() => setActiveMenu("reports")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
            <ArrowLeft size={16} /> {t("back_to_list", "Back to Reports")}
          </button>
          <h2 style={{ marginTop: "12px", color: "#1e293b", fontWeight: "700" }}>{t("staff_salary_report_lbl")}</h2>
          <p style={{ color: "#64748b", margin: 0 }}>{t("staff_salary_report_desc")}</p>
        </div>
        <button onClick={() => window.print()} className="btn-print" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1e293b", color: "#fff", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
          <Printer size={16} /> {t("print_report", "Print Report")}
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
        <StatCard icon="👥" label={t("active_monthly_payroll_lbl", "Active Monthly Payroll")} value={formatCurrency(data.total_monthly_payroll)} color="card-blue" />
        <StatCard icon="✅" label={t("total_settled_payments_lbl", "Total Settled Payments")} value={formatCurrency(data.total_paid_to_date)} color="card-green" />
        <StatCard icon="⏳" label={t("unsettled_advance_balance_lbl", "Unsettled Advance Balance")} value={formatCurrency(data.total_unsettled_advances)} color="card-orange" />
        <StatCard icon="⚠️" label={t("net_unpaid_salary_owed_lbl", "Net Unpaid Salary Owed")} value={formatCurrency(data.total_unpaid_salary_dues)} color="card-rose" />
      </div>

      {/* ── Sub-navigation Tabs ── */}
      <div className="rp-tabs" style={{ display: "flex", gap: "12px", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "20px" }}>
        <button className={`rp-tab ${activeTab === "registry" ? "active" : ""}`} onClick={() => setActiveTab("registry")} style={{ padding: "8px 16px", border: "none", background: "none", fontWeight: "600", cursor: "pointer", color: activeTab === "registry" ? "#2563eb" : "#64748b", borderBottom: activeTab === "registry" ? "3px solid #2563eb" : "none" }}>
          📁 {t("payroll_registry_tab", "Payroll Registry")} ({data.staff_rows.length})
        </button>
        <button className={`rp-tab ${activeTab === "advances" ? "active" : ""}`} onClick={() => setActiveTab("advances")} style={{ padding: "8px 16px", border: "none", background: "none", fontWeight: "600", cursor: "pointer", color: activeTab === "advances" ? "#2563eb" : "#64748b", borderBottom: activeTab === "advances" ? "3px solid #2563eb" : "none" }}>
          ⏳ {t("chronological_advances_tab", "Chronological Advances")} ({data.advances.length})
        </button>
        <button className={`rp-tab ${activeTab === "payments" ? "active" : ""}`} onClick={() => setActiveTab("payments")} style={{ padding: "8px 16px", border: "none", background: "none", fontWeight: "600", cursor: "pointer", color: activeTab === "payments" ? "#2563eb" : "#64748b", borderBottom: activeTab === "payments" ? "3px solid #2563eb" : "none" }}>
          💸 {t("chronological_settlements_tab", "Chronological Settlements")} ({data.payments.length})
        </button>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="table-section">
        {/* Tab 1: Staff Payroll Registry */}
        {activeTab === "registry" && (
          <div>
            <div className="section-title" style={{ marginBottom: "12px", color: "#1e293b", fontWeight: "600" }}>{t("payroll_registry_tab", "Active Staff Payroll Registry")}</div>
            <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px" }}>{t("username", "Staff Username")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("full_name", "Full Name")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("monthly_salary_hdr", "Monthly Salary")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("months_worked_hdr", "Months Worked")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("total_salary_accrued_hdr", "Total Salary Accrued")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("collected", "Total Paid")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("unsettled_advances_hdr", "Unsettled Advances")}</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>{t("net_unpaid_dues_hdr", "Net Unpaid Dues Owed")}</th>
                </tr>
              </thead>
              <tbody>
                {data.staff_rows.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: "24px 16px", textAlign: "center", color: "#64748b" }}>{t("no_matching_records")}</td>
                  </tr>
                ) : (
                  data.staff_rows.map((r) => (
                    <tr key={r.staff_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "600" }}>{r.username}</td>
                      <td style={{ padding: "12px 16px" }}>{r.full_name || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>{formatCurrency(r.monthly_salary)}</td>
                      <td style={{ padding: "12px 16px" }}>{r.months_worked}</td>
                      <td style={{ padding: "12px 16px" }}>{formatCurrency(r.total_earned)}</td>
                      <td style={{ padding: "12px 16px", color: "#16a34a" }}>{formatCurrency(r.total_paid)}</td>
                      <td style={{ padding: "12px 16px", color: "#ea580c" }}>{formatCurrency(r.unsettled_advances)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: r.unpaid_dues > 0 ? "#dc2626" : "#16a34a", fontWeight: "700" }}>
                        {formatCurrency(r.unpaid_dues)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Chronological Advances */}
        {activeTab === "advances" && (
          <div>
            <div className="section-title" style={{ marginBottom: "12px", color: "#1e293b", fontWeight: "600" }}>{t("advances_journal_title_lbl", "Salary Advances Journal Audit Trail")}</div>
            <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px" }}>{t("date")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("staff_member", "Employee")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("payment_method", "Payment Mode")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("amount")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("status")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("narration", "Audit Remarks")}</th>
                </tr>
              </thead>
              <tbody>
                {data.advances.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "24px 16px", textAlign: "center", color: "#64748b" }}>{t("no_matching_records")}</td>
                  </tr>
                ) : (
                  data.advances.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.85rem" }}>{a.advance_date}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600" }}>{a.staff_name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {a.payment_mode === "CASH" ? t("cash") : a.payment_mode === "UPI" ? t("upi") : a.payment_mode === "BANK" ? t("bank") : a.payment_mode}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "700" }}>{formatCurrency(a.amount)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: "600", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "20px", background: a.status === "CLEARED" ? "#f0fdf4" : "#fff7ed", color: a.status === "CLEARED" ? "#16a34a" : "#d97706" }}>
                          {a.status === "CLEARED" ? t("closed") : a.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569", fontSize: "0.9rem" }}>{a.remarks || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Chronological Payroll Settlements */}
        {activeTab === "payments" && (
          <div>
            <div className="section-title" style={{ marginBottom: "12px", color: "#1e293b", fontWeight: "600" }}>{t("settlement_log_title_lbl", "Payroll Payout Settlement Log")}</div>
            <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px" }}>{t("timestamp", "Paid At")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("month", "Salary Month")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("staff_member", "Employee")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("gross_salary_hdr", "Gross Salary")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("advances_deducted_hdr", "Advances Deducted")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("net_disbursed", "Net Disbursed")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("mode")}</th>
                  <th style={{ padding: "12px 16px" }}>{t("narration", "Remarks")}</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: "24px 16px", textAlign: "center", color: "#64748b" }}>{t("no_matching_records")}</td>
                  </tr>
                ) : (
                  data.payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.85rem" }}>{formatTransactionTimestamp(p.paid_at)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600" }}>{p.salary_month}</td>
                      <td style={{ padding: "12px 16px" }}>{p.staff_name}</td>
                      <td style={{ padding: "12px 16px" }}>{formatCurrency(p.gross_salary)}</td>
                      <td style={{ padding: "12px 16px", color: "#ea580c" }}>{p.advance_amount > 0 ? `-${formatCurrency(p.advance_amount)}` : "—"}</td>
                      <td style={{ padding: "12px 16px", color: "#16a34a", fontWeight: "700" }}>{formatCurrency(p.net_salary)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {p.payment_mode === "CASH" ? t("cash") : p.payment_mode === "UPI" ? t("upi") : p.payment_mode === "BANK" ? t("bank") : p.payment_mode}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569", fontSize: "0.9rem" }}>{p.remarks || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}