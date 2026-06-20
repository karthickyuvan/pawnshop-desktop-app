

// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
// import "./BranchDailyReportPage.css";
// import { formatDateTimeIST } from "../utils/timeFormatter";

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

// export default function BranchDailyReportPage() {
//   const { t } = useLanguage(); // ✅ Initialized translation hook
//   const today = new Date().toISOString().split("T")[0];

//   const [date, setDate] = useState(today);
//   const [report, setReport] = useState(null);
//   const [transactions, setTransactions] = useState([]);

//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadReport();
//   }, []);

//   async function loadReport() {
//     setLoading(true);
//     try {
//       const [data, tx] = await Promise.all([
//         invoke("get_branch_daily_report_cmd", { reportDate: date }),
//         invoke("get_transaction_details_cmd", { reportDate: date }),
//       ]);

//       setReport(data);
//       setTransactions(tx);
//     } catch (err) {
//       console.error("Report load error:", err);
//     }
//     setLoading(false);
//   }

//   return (
//     <div className="branch-report-page">
//       {/* ── Header ── */}
//       <div className="report-header">
//         <div>
//           <h2>{t("branch_daily_report")}</h2>
//           <p>{t("daily_cash_position_desc", "Daily cash position and transactions")}</p>
//         </div>
//         <div className="report-controls">
//           <input
//             type="date"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//           />
//           <button onClick={loadReport}>{t("load_report_btn", "Load Report")}</button>
//         </div>
//       </div>

//       {loading && <p className="loading-text">{t("loading_pledges", "Loading report...")}</p>}

//       {report && (
//         <>
//           {/* ── All stat cards ── */}
//           <div className="stats-grid">
//             {/* Pocket stats */}
//             <StatCard
//               icon="🗂"
//               label={t("total_pockets_lbl", "Total Pockets")}
//               value={report.total_pockets}
//               color="card-blue"
//             />

//             <StatCard
//               icon="🟢"
//               label={t("active_pockets_lbl", "Active Pockets")}
//               value={report.active_pockets}
//               color="card-green"
//             />

//             <StatCard
//               icon="🔒"
//               label={t("closed_pockets_lbl", "Closed Pockets")}
//               value={report.closed_pockets}
//               color="card-slate"
//             />

//             {/* Financial stats */}
//             <StatCard
//               icon="🏦"
//               label={t("opening_balance")}
//               value={`₹${report.opening_balance?.toLocaleString("en-IN")}`}
//               color="card-blue"
//             />
//             <StatCard
//               icon="📤"
//               label={t("loans_issued_lbl", "Loans Issued")}
//               value={`₹${report.loans_issued?.toLocaleString("en-IN")}`}
//               color="card-rose"
//             />
//             <StatCard
//               icon="📥"
//               label={t("loan_repayments_lbl", "Loan Repayments")}
//               value={`₹${report.loan_repayments?.toLocaleString("en-IN")}`}
//               color="card-green"
//             />
//             <StatCard
//               icon="📅"
//               label={t("todays_interest")}
//               value={`₹${report.interest_collected?.toLocaleString("en-IN")}`}
//               color="card-teal"
//             />
//             <StatCard
//               icon="🏷️"
//               label={t("processing_fee")}
//               value={`₹${report.processing_fees?.toLocaleString("en-IN")}`}
//               color="card-purple"
//             />
//             <StatCard
//               icon="💹"
//               label={t("other_income_lbl", "Other Income")}
//               value={`₹${report.other_income?.toLocaleString("en-IN")}`}
//               color="card-yellow"
//             />
//             <StatCard
//               icon="🧾"
//               label={t("total_expense")}
//               value={`₹${report.expenses?.toLocaleString("en-IN")}`}
//               color="card-orange"
//             />
//             <StatCard
//               icon="📈"
//               label={t("total_inflow")}
//               value={`₹${report.total_inflow?.toLocaleString("en-IN")}`}
//               color="card-green"
//             />
//             <StatCard
//               icon="📉"
//               label={t("total_outflow")}
//               value={`₹${report.total_outflow?.toLocaleString("en-IN")}`}
//               color="card-rose"
//             />
//             <StatCard
//               icon="💰"
//               label={t("net_cash_flow_lbl", "Net Cash Flow")}
//               value={`₹${report.net_cash_flow?.toLocaleString("en-IN")}`}
//               color={report.net_cash_flow >= 0 ? "card-teal" : "card-orange"}
//             />
//             <StatCard
//               icon="🏧"
//               label={t("cash_in_hand")}
//               value={`₹${report.closing_balance?.toLocaleString("en-IN")}`}
//               color="card-blue"
//             />

//             <StatCard
//               icon="📥"
//               label={t("metal_in_gross_lbl", "Metal In Gross")}
//               value={`${Number(report.metal_in_gross || 0).toFixed(2)} g`}
//               color="card-green"
//             />

//             <StatCard
//               icon="📥"
//               label={t("metal_in_net_lbl", "Metal In Net")}
//               value={`${Number(report.metal_in_net || 0).toFixed(2)} g`}
//               color="card-teal"
//             />

//             <StatCard
//               icon="📤"
//               label={t("metal_out_gross_lbl", "Metal Out Gross")}
//               value={`${Number(report.metal_out_gross || 0).toFixed(2)} g`}
//               color="card-orange"
//             />

//             <StatCard
//               icon="📤"
//               label={t("metal_out_net_lbl", "Metal Out Net")}
//               value={`${Number(report.metal_out_net || 0).toFixed(2)} g`}
//               color="card-rose"
//             />
//           </div>

//           {/* Metal Movement Segment */}
//           <div className="metal-movement-section">
//             <h3>{t("metal_movement_lbl", "Metal Movement")}</h3>

//             <table className="metal-movement-table">
//               <thead>
//                 <tr>
//                   <th>{t("metal")}</th>
//                   <th>{t("in_gross_tbl_hdr", "In Gross")}</th>
//                   <th>{t("in_net_tbl_hdr", "In Net")}</th>
//                   <th>{t("out_gross_tbl_hdr", "Out Gross")}</th>
//                   <th>{t("out_net_tbl_hdr", "Out Net")}</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {report.metal_movements?.length === 0 ? (
//                   <tr>
//                     <td colSpan="5" style={{ textAlign: "center", padding: "12px" }}>
//                       {t("no_matching_records")}
//                     </td>
//                   </tr>
//                 ) : (
//                   report.metal_movements?.map((m, index) => (
//                     <tr key={index}>
//                       <td>{m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal}</td>
//                       <td>{Number(m.in_gross).toFixed(2)} g</td>
//                       <td>{Number(m.in_net).toFixed(2)} g</td>
//                       <td>{Number(m.out_gross).toFixed(2)} g</td>
//                       <td>{Number(m.out_net).toFixed(2)} g</td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* ── Transaction Details Table ── */}
//           <div className="table-section">
//             <div className="section-title">{t("transaction_audit_trail")}</div>
//             <table>
//               <thead>
//                 <tr>
//                   <th>{t("code", "ID")}</th>
//                   <th>{t("date")}</th>
//                   <th>{t("category", "Module")}</th>
//                   <th>{t("type")}</th>
//                   <th>{t("amount")}</th>
//                   <th>{t("reference")}</th>
//                   <th>{t("description")}</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {transactions.length === 0 ? (
//                   <tr>
//                     <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
//                       {t("no_matching_records")}
//                     </td>
//                   </tr>
//                 ) : (
//                   transactions.map((tx) => (
//                     <tr key={tx.id}>
//                       <td>{tx.id}</td>
//                       <td>{formatDateTimeIST(tx.transaction_date)}</td>
//                       <td>{tx.module_type}</td>
//                       <td className={tx.transaction_type === "ADD" ? "add" : "withdraw"}>
//                         {tx.transaction_type === "ADD" ? t("credit") : t("debit")}
//                       </td>
//                       <td>₹ {tx.amount.toFixed(2)}</td>
//                       <td>{tx.reference || "—"}</td>
//                       <td>{tx.description || "—"}</td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }





import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext";
import "./BranchDailyReportPage.css";
import { formatDateTimeIST } from "../utils/timeFormatter";

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

export default function BranchDailyReportPage() {
  const { t } = useLanguage();
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [report, setReport] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const [data, tx] = await Promise.all([
        invoke("get_branch_daily_report_cmd", { reportDate: date }),
        invoke("get_transaction_details_cmd", { reportDate: date }),
      ]);

      setReport(data);
      setTransactions(tx);
    } catch (err) {
      console.error("Report load error:", err);
    }
    setLoading(false);
  }

  return (
    <div className="branch-report-page">
      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>{t("branch_daily_report")}</h2>
          <p>{t("daily_cash_position_desc", "Daily cash position and transactions")}</p>
        </div>
        <div className="report-controls">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button onClick={loadReport}>{t("load_report_btn", "Load Report")}</button>
        </div>
      </div>

      {loading && <p className="loading-text">{t("loading_pledges", "Loading report...")}</p>}

      {report && (
        <>
          {/* ── All stat cards ── */}
          <div className="stats-grid">
            <StatCard icon="🗂" label={t("total_pockets_lbl", "Total Pockets")} value={report.total_pockets} color="card-blue" />
            <StatCard icon="🟢" label={t("active_pockets_lbl", "Active Pockets")} value={report.active_pockets} color="card-green" />
            <StatCard icon="🔒" label={t("closed_pockets_lbl", "Closed Pockets")} value={report.closed_pockets} color="card-slate" />

            <StatCard icon="🏦" label={t("opening_balance")} value={`₹${report.opening_balance?.toLocaleString("en-IN")}`} color="card-blue" />
            <StatCard icon="📤" label={t("loans_issued_lbl", "Loans Issued")} value={`₹${report.loans_issued?.toLocaleString("en-IN")}`} color="card-rose" />
            <StatCard icon="📥" label={t("loan_repayments_lbl", "Loan Repayments")} value={`₹${report.loan_repayments?.toLocaleString("en-IN")}`} color="card-green" />
            <StatCard icon="📅" label={t("todays_interest")} value={`₹${report.interest_collected?.toLocaleString("en-IN")}`} color="card-teal" />
            <StatCard icon="🏷️" label={t("processing_fee")} value={`₹${report.processing_fees?.toLocaleString("en-IN")}`} color="card-purple" />
            <StatCard icon="💹" label={t("other_income_lbl", "Other Income")} value={`₹${report.other_income?.toLocaleString("en-IN")}`} color="card-yellow" />
            <StatCard icon="🧾" label={t("total_expense")} value={`₹${report.expenses?.toLocaleString("en-IN")}`} color="card-orange" />
            
            <StatCard icon="👥" label="Investor Capital Additions" value={`₹${report.investor_investments?.toLocaleString("en-IN")}`} color="card-green" />
            <StatCard icon="💸" label="Investor Withdrawals" value={`₹${report.investor_withdrawals?.toLocaleString("en-IN")}`} color="card-rose" />
            <StatCard icon="🏛️" label="Bank Refinance Inflow" value={`₹${report.bank_refinance_inflow?.toLocaleString("en-IN")}`} color="card-green" />
            <StatCard icon="🏦" label="Bank Repayments Paid" value={`₹${report.bank_refinance_outflow?.toLocaleString("en-IN")}`} color="card-rose" />

            <StatCard icon="📈" label={t("total_inflow")} value={`₹${report.total_inflow?.toLocaleString("en-IN")}`} color="card-green" />
            <StatCard icon="📉" label={t("total_outflow")} value={`₹${report.total_outflow?.toLocaleString("en-IN")}`} color="card-rose" />
            <StatCard icon="💰" label={t("net_cash_flow_lbl", "Net Cash Flow")} value={`₹${report.net_cash_flow?.toLocaleString("en-IN")}`} color={report.net_cash_flow >= 0 ? "card-teal" : "card-orange"} />
            <StatCard icon="🏧" label={t("cash_in_hand")} value={`₹${report.closing_balance?.toLocaleString("en-IN")}`} color="card-blue" />
          </div>

          {/* ✅ UPDATED SECTION: Complete, Itemized Vault Commodity Balance Sheet */}
          <div className="metal-movement-section">
            <h3>⚖️ Vault Commodity Balance Sheet (Itemized Per Metal)</h3>
            <table className="metal-movement-table">
              <thead>
                <tr>
                  <th>{t("metal")}</th>
                  <th>In Gross (Customer)</th>
                  <th>In Net (Customer)</th>
                  <th>Out Gross (Released)</th>
                  <th>Out Net (Released)</th>
                  <th>Store ➔ Bank (Gross)</th>
                  <th>Store ➔ Bank (Net)</th>
                  <th>Bank ➔ Store (Gross)</th>
                  <th>Bank ➔ Store (Net)</th>
                </tr>
              </thead>
              <tbody>
                {report.metal_movements?.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "12px" }}>
                      {t("no_matching_records")}
                    </td>
                  </tr>
                ) : (
                  report.metal_movements?.map((m, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: "700", color: "#1e293b" }}>
                        {m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal}
                      </td>
                      <td style={{ color: "#15803d" }}>{Number(m.in_gross).toFixed(2)} g</td>
                      <td style={{ color: "#15803d", fontWeight: "600" }}>{Number(m.in_net).toFixed(2)} g</td>
                      <td style={{ color: "#b91c1c" }}>{Number(m.out_gross).toFixed(2)} g</td>
                      <td style={{ color: "#b91c1c", fontWeight: "600" }}>{Number(m.out_net).toFixed(2)} g</td>
                      
                      {/* Bank Mapping Inflow/Outflow Transits */}
                      <td style={{ color: "#d97706" }}>{Number(m.to_bank_gross).toFixed(2)} g</td>
                      <td style={{ color: "#d97706", fontWeight: "600" }}>{Number(m.to_bank_net).toFixed(2)} g</td>
                      <td style={{ color: "#0f766e" }}>{Number(m.from_bank_gross).toFixed(2)} g</td>
                      <td style={{ color: "#0f766e", fontWeight: "600" }}>{Number(m.from_bank_net).toFixed(2)} g</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Transaction Details Table ── */}
          <div className="table-section">
            <div className="section-title">{t("transaction_audit_trail")}</div>
            <table>
              <thead>
                <tr>
                  <th>{t("code", "ID")}</th>
                  <th>{t("date")}</th>
                  <th>{t("category", "Module")}</th>
                  <th>{t("type")}</th>
                  <th>{t("amount")}</th>
                  <th>{t("reference")}</th>
                  <th>{t("description")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                      {t("no_matching_records")}
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.id}</td>
                      <td>{formatDateTimeIST(tx.transaction_date)}</td>
                      <td>{tx.module_type}</td>
                      <td className={tx.transaction_type === "ADD" ? "add" : "withdraw"}>
                        {tx.transaction_type === "ADD" ? t("credit") : t("debit")}
                      </td>
                      <td>₹ {tx.amount.toFixed(2)}</td>
                      <td>{tx.reference || "—"}</td>
                      <td>{tx.description || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}