
// import React from "react";
// import "./ReportsPage.css";
// import {
//   FaChartLine, FaMoneyBillWave, FaFileInvoice, FaBoxOpen,
//   FaUsers, FaPercentage, FaUniversity, FaBalanceScale,
//   FaCalendarDay, FaCalendarAlt, FaCalendarCheck,
//   FaClipboardList, FaExchangeAlt, FaGavel, FaCoins, FaHistory, FaFolderPlus 
// } from "react-icons/fa";
// import { useLanguage } from "../context/LanguageContext";

// const REPORT_COLORS = [
//   { accent: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
//   { accent: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
//   { accent: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
//   { accent: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
//   { accent: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
//   { accent: "#06b6d4", bg: "#ecfeff", border: "#a5f3fc" },
//   { accent: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
//   { accent: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
//   { accent: "#14b8a6", bg: "#f0fdfa", border: "#99f6e4" },
//   { accent: "#ec4899", bg: "#fdf2f8", border: "#f9a8d4" },
//   { accent: "#84cc16", bg: "#f7fee7", border: "#d9f99d" },
//   { accent: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
//   { accent: "#a855f7", bg: "#faf5ff", border: "#e9d5ff" },
// ];

// export default function ReportsPage({ setActiveMenu }) {
//   const { t } = useLanguage();

//   const reports = [
//     { key: "branch-daily",        title: t("branch_daily_report"),        subtitle: t("branch_daily_report_desc"),        icon: <FaCalendarDay /> },
//     { key: "cash-flow",           title: t("cash_flow_report"),           subtitle: t("cash_flow_report_desc"),           icon: <FaExchangeAlt /> },
//     { key: "expense-audit",       title: t("expense_audit_report"),       subtitle: t("expense_audit_report_desc"),       icon: <FaClipboardList /> },
//     { key: "pledge-register",     title: t("pledge_register"),            subtitle: t("pledge_register_desc"),            icon: <FaFileInvoice /> },
//     { key: "stock-report",        title: t("gold_stock_report"),          subtitle: t("gold_stock_report_desc"),          icon: <FaBoxOpen /> },
//     { key: "customer-ledger",     title: t("customer_ledger"),            subtitle: t("customer_ledger_desc"),            icon: <FaUsers /> },
//     { key: "interest-analytics",  title: t("interest_analytics"),         subtitle: t("interest_analytics_desc"),         icon: <FaPercentage /> },
//     { key: "bankmapping-report",  title: t("bank_mapping_report"),        subtitle: t("bank_mapping_report_desc"),        icon: <FaUniversity /> },
//     { key: "profit-loss",         title: t("profit_loss_report"),         subtitle: t("profit_loss_report_desc"),         icon: <FaBalanceScale /> },
//     { key: "monthly-report",      title: t("monthly_business_report"),    subtitle: t("monthly_business_report_desc"),    icon: <FaCalendarAlt /> },
//     { key: "yearly-report",       title: t("yearly_business_report"),     subtitle: t("yearly_business_report_desc"),     icon: <FaCalendarCheck /> },
//     { key: "fund-ledger",         title: t("fund_ledger_report"),         subtitle: t("fund_ledger_report_desc"),         icon: <FaChartLine /> },
//     { key: "auction-report",      title: t("auction_report"),             subtitle: t("auction_report_subtitle"),         icon: <FaGavel /> },
    
//     // ── INVESTOR REPORTS ──
//     { key: "investor-capital",      title: "Investor Capital Report",       subtitle: "Aggregate total capital investments and active balances", icon: <FaCoins /> },
//     { key: "investor-statement",    title: "Investor Statement Report",     subtitle: "Printable chronological statement of accounts for any investor", icon: <FaFileInvoice /> },
//     { key: "investor-interest-due", title: "Investor Interest Due Report",   subtitle: "Outstanding interest due list, pending months and payouts", icon: <FaCalendarCheck /> },
//     { key: "investor-transactions", title: "Investor Transaction Log",     subtitle: "General transaction journal of investor capital movements", icon: <FaHistory /> },

//     // ── STAFF REPORTS ──
//     { key: "staff-salary-report", title: "Staff Salary & Payroll Report", subtitle: "Comprehensive audit of salary payouts, outstanding advances, and unpaid dues", icon: <FaMoneyBillWave /> },
//   ];

//   return (
//     <div className="reports-page">
//       <div className="reports-header">
//         <div className="reports-header-text">
//           <h2>{t("reports_center")}</h2>
//           <p>{t("reports_center_desc")}</p>
//         </div>
//         <div className="reports-count">
//           <span>{reports.length}</span>
//           <label>Reports Available</label>
//         </div>
//       </div>

//       <div className="reports-grid">
//         {reports.map((report, i) => {
//           const color = REPORT_COLORS[i % REPORT_COLORS.length];
//           return (
//             <div
//               key={report.key}
//               className="report-card"
//               style={{
//                 "--accent":  color.accent,
//                 "--card-bg": color.bg,
//                 "--card-border": color.border,
//               }}
//               onClick={() => setActiveMenu(report.key)}
//             >
//               <div className="report-card-icon-wrap">
//                 <div className="report-card-icon">{report.icon}</div>
//               </div>
//               <div className="report-card-body">
//                 <h3>{report.title}</h3>
//                 <p>{report.subtitle}</p>
//               </div>
//               <div className="report-card-arrow">›</div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }



import React from "react";
import "./ReportsPage.css";
import {
  FaChartLine, FaMoneyBillWave, FaFileInvoice, FaBoxOpen,
  FaUsers, FaPercentage, FaUniversity, FaBalanceScale,
  FaCalendarDay, FaCalendarAlt, FaCalendarCheck,
  FaClipboardList, FaExchangeAlt, FaGavel, FaCoins, FaHistory, FaFolderPlus 
} from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

const REPORT_COLORS = [
  { accent: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  { accent: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  { accent: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  { accent: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  { accent: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  { accent: "#06b6d4", bg: "#ecfeff", border: "#a5f3fc" },
  { accent: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
  { accent: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
  { accent: "#14b8a6", bg: "#f0fdfa", border: "#99f6e4" },
  { accent: "#ec4899", bg: "#fdf2f8", border: "#f9a8d4" },
  { accent: "#84cc16", bg: "#f7fee7", border: "#d9f99d" },
  { accent: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
  { accent: "#a855f7", bg: "#faf5ff", border: "#e9d5ff" },
];

export default function ReportsPage({ setActiveMenu }) {
  const { t } = useLanguage();

  const reports = [
    { key: "branch-daily",        title: t("branch_daily_report"),        subtitle: t("branch_daily_report_desc"),        icon: <FaCalendarDay /> },
    { key: "cash-flow",           title: t("cash_flow_report"),           subtitle: t("cash_flow_report_desc"),           icon: <FaExchangeAlt /> },
    { key: "expense-audit",       title: t("expense_audit_report"),       subtitle: t("expense_audit_report_desc"),       icon: <FaClipboardList /> },
    { key: "pledge-register",     title: t("pledge_register"),            subtitle: t("pledge_register_desc"),            icon: <FaFileInvoice /> },
    { key: "stock-report",        title: t("gold_stock_report"),          subtitle: t("gold_stock_report_desc"),          icon: <FaBoxOpen /> },
    { key: "customer-ledger",     title: t("customer_ledger"),            subtitle: t("customer_ledger_desc"),            icon: <FaUsers /> },
    { key: "interest-analytics",  title: t("interest_analytics"),         subtitle: t("interest_analytics_desc"),         icon: <FaPercentage /> },
    { key: "bankmapping-report",  title: t("bank_mapping_report"),        subtitle: t("bank_mapping_report_desc"),        icon: <FaUniversity /> },
    { key: "profit-loss",         title: t("profit_loss_report"),         subtitle: t("profit_loss_report_desc"),         icon: <FaBalanceScale /> },
    { key: "monthly-report",      title: t("monthly_business_report"),    subtitle: t("monthly_business_report_desc"),    icon: <FaCalendarAlt /> },
    { key: "yearly-report",       title: t("yearly_business_report"),     subtitle: t("yearly_business_report_desc"),     icon: <FaCalendarCheck /> },
    { key: "fund-ledger",         title: t("fund_ledger_report"),         subtitle: t("fund_ledger_report_desc"),         icon: <FaChartLine /> },
    { key: "auction-report",      title: t("auction_report"),             subtitle: t("auction_report_subtitle"),         icon: <FaGavel /> },
    
    // ── INVESTOR REPORTS ──
    { key: "investor-capital",      title: t("investor_capital_report_lbl", "Investor Capital Report"),       subtitle: t("investor_capital_report_desc", "Aggregate total capital investments and active balances"), icon: <FaCoins /> },
    { key: "investor-statement",    title: t("investor_statement_report_lbl", "Investor Statement Report"),     subtitle: t("investor_statement_report_desc", "Printable chronological statement of accounts for any investor"), icon: <FaFileInvoice /> },
    { key: "investor-interest-due", title: t("pending_interest_due_report_title", "Investor Interest Due Report"),   subtitle: t("investor_interest_due_desc", "Outstanding interest due list, pending months and payouts"), icon: <FaCalendarCheck /> },
    { key: "investor-transactions", title: t("investor_transaction_log_lbl", "Investor Transaction Log"),     subtitle: t("investor_transaction_log_desc", "General transaction journal of investor capital movements"), icon: <FaHistory /> },

    // ── STAFF REPORTS ──
    { key: "staff-salary-report", title: t("staff_salary_report_lbl", "Staff Salary & Payroll Report"), subtitle: t("staff_salary_report_desc", "Comprehensive audit of salary payouts, outstanding advances, and unpaid dues"), icon: <FaMoneyBillWave /> },
  ];

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="reports-header-text">
          <h2>{t("reports_center")}</h2>
          <p>{t("reports_center_desc")}</p>
        </div>
        <div className="reports-count">
          <span>{reports.length}</span>
          <label>{t("reports_available_lbl", "Reports Available")}</label>
        </div>
      </div>

      <div className="reports-grid">
        {reports.map((report, i) => {
          const color = REPORT_COLORS[i % REPORT_COLORS.length];
          return (
            <div
              key={report.key}
              className="report-card"
              style={{
                "--accent":  color.accent,
                "--card-bg": color.bg,
                "--card-border": color.border,
              }}
              onClick={() => setActiveMenu(report.key)}
            >
              <div className="report-card-icon-wrap">
                <div className="report-card-icon">{report.icon}</div>
              </div>
              <div className="report-card-body">
                <h3>{report.title}</h3>
                <p>{report.subtitle}</p>
              </div>
              <div className="report-card-arrow">›</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}