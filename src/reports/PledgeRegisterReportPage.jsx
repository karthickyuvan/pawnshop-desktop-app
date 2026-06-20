

// // version 2 
// import React, { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import { formatTransactionTimestamp } from "../utils/timeFormatter"; // ✅ Reusing the centralized formatter
// import "./PledgeRegisterReportPage.css";

// const STATUS_META = {
//   ACTIVE:    { label: "Active",    cls: "status-active"    },
//   CLOSED:    { label: "Closed",    cls: "status-closed"    },
//   OVERDUE:   { label: "Overdue",   cls: "status-overdue"   },
//   DUE_SOON:  { label: "Due Soon",  cls: "status-due-soon"  },
//   AUCTIONED: { label: "Auctioned", cls: "status-auctioned" },
// };

// /* Single unified card — same layout for every stat */
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

// export default function PledgeRegisterReportPage({ setActiveMenu }) {
//   const today = new Date().toISOString().split("T")[0];

//   const [startDate, setStartDate] = useState(today);
//   const [endDate, setEndDate]     = useState(today);
//   const [rows, setRows]           = useState([]);
//   const [loading, setLoading]     = useState(false);

//   useEffect(() => { loadReport(); }, []);

//   async function loadReport() {
//     setLoading(true);
//     try {
//       const result = await invoke("get_pledge_register_report_cmd", { startDate, endDate });
//       setRows(result?.pledges || []);
//     } catch (err) {
//       console.error("Pledge Register Error:", err);
//     }
//     setLoading(false);
//   }

//   const metalTotals = rows.reduce((acc, row) => {
//     const metal = row?.metal_type?.toLowerCase()?.trim();
//     if (!metal) return acc;
//     if (!acc[metal]) acc[metal] = { gross: 0, net: 0 };
//     acc[metal].gross += Number(row?.gross_weight || 0);
//     acc[metal].net   += Number(row?.net_weight   || 0);
//     return acc;
//   }, {});

//   const totalLoan     = rows.reduce((sum, r) => sum + Number(r?.loan_amount || 0), 0);
//   const activePockets = rows.filter(r => r.pocket_number != null && r.status !== "CLOSED").length;
//   const closedPockets = rows.filter(r => r.pocket_number != null && r.status === "CLOSED").length;
//   const totalPockets  = rows.filter(r => r.pocket_number != null).length;

//   return (
//     <div className="pledge-register-page">
//       {/* ── Header ── */}
//       <div className="report-header">
//         <div>
//           <h2>Pledge Register</h2>
//           <p>Complete list of pledges issued in the selected period</p>
//         </div>
//         <div className="filters">
//           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
//           <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
//           <button onClick={loadReport}>Load</button>
//         </div>
//       </div>

//       {/* ── ALL stat cards — same component, same layout ── */}
//       <div className="stats-grid">
//         <StatCard icon="🗂"  label="Total Pockets"      value={totalPockets}                     color="card-blue"   />
//         <StatCard icon="🟢" label="Active Pockets"      value={activePockets}                    color="card-green"  />
//         <StatCard icon="🔒" label="Closed Pockets"      value={closedPockets}                    color="card-slate"  />
//         <StatCard icon="₹"  label="Total Loan Amount"   value={`₹${totalLoan.toLocaleString()}`} color="card-yellow" />
//         <StatCard icon="📋" label="Total Pledges"       value={rows.length}                      color="card-purple" />
//         {Object.entries(metalTotals).map(([metal, weights]) => (
//           <React.Fragment key={metal}>
//             <StatCard
//               icon="⚖️"
//               label={`${metal} Gross Wt`}
//               value={`${weights.gross.toFixed(2)} g`}
//               color="card-orange"
//             />
//             <StatCard
//               icon="🏅"
//               label={`${metal} Net Wt`}
//               value={`${weights.net.toFixed(2)} g`}
//               color="card-teal"
//             />
//           </React.Fragment>
//         ))}
//       </div>

//       {/* ── Table ── */}
//       <div className="table-section">
//         {loading ? (
//           <p className="loading-text">Loading report...</p>
//         ) : (
//           <table>
//             <thead>
//               <tr>
//                 <th>Pocket</th>
//                 <th>Pledge No</th>
//                 <th>Date</th>
//                 <th>Customer</th>
//                 <th>Metal</th>
//                 <th>Jewellery</th>
//                 <th>Gross (g)</th>
//                 <th>Net (g)</th>
//                 <th>Loan Amount</th>
//                 <th>Scheme</th>
//                 <th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map(row => {
//                 const meta = STATUS_META[row.status] || { label: row.status, cls: "" };
//                 return (
//                   <tr
//                     key={row.pledge_id}
//                     className="clickable-row"
//                     onDoubleClick={() =>
//                       setActiveMenu(`single-pledge-${row.pledge_id}-pledge-register`)
//                     }
//                   >
//                     <td className="pocket-cell">
//                       {row.pocket_number
//                         ? <span className="pocket-badge">#{row.pocket_number}</span>
//                         : <span className="pocket-empty">—</span>}
//                     </td>
//                     <td>{row.pledge_no}</td>
//                     {/* ✅ Standardized date and time display using the transaction timestamp formatter */}
//                     <td>{formatTransactionTimestamp(row.created_at)}</td>
//                     <td>{row.customer_name}</td>
//                     <td>{row.metal_type}</td>
//                     <td>{row.jewellery_type}</td>
//                     <td>{row.gross_weight}</td>
//                     <td>{row.net_weight}</td>
//                     <td className="loan">₹ {Number(row.loan_amount || 0).toLocaleString()}</td>
//                     <td>{row.scheme_name}</td>
//                     <td><span className={`status-badge ${meta.cls}`}>{meta.label}</span></td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }







import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import { formatTransactionTimestamp } from "../utils/timeFormatter"; // ✅ Reusing the centralized formatter
import "./PledgeRegisterReportPage.css";

/* Single unified card — same layout for every stat */
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

export default function PledgeRegisterReportPage({ setActiveMenu }) {
  const { t } = useLanguage(); // ✅ Initialized translation hook

  const STATUS_META = {
    ACTIVE:    { label: t("active"),    cls: "status-active"    },
    CLOSED:    { label: t("closed"),    cls: "status-closed"    },
    OVERDUE:   { label: t("overdue"),   cls: "status-overdue"   },
    DUE_SOON:  { label: t("due_soon", "Due Soon"),  cls: "status-due-soon"  },
    AUCTIONED: { label: t("auction_status_tag"), cls: "status-auctioned" },
  };

  const today = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]     = useState(today);
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const result = await invoke("get_pledge_register_report_cmd", { startDate, endDate });
      setRows(result?.pledges || []);
    } catch (err) {
      console.error("Pledge Register Error:", err);
    }
    setLoading(false);
  }

  const metalTotals = rows.reduce((acc, row) => {
    const metal = row?.metal_type?.toLowerCase()?.trim();
    if (!metal) return acc;
    if (!acc[metal]) acc[metal] = { gross: 0, net: 0 };
    acc[metal].gross += Number(row?.gross_weight || 0);
    acc[metal].net   += Number(row?.net_weight   || 0);
    return acc;
  }, {});

  const totalLoan     = rows.reduce((sum, r) => sum + Number(r?.loan_amount || 0), 0);
  const activePockets = rows.filter(r => r.pocket_number != null && r.status !== "CLOSED").length;
  const closedPockets = rows.filter(r => r.pocket_number != null && r.status === "CLOSED").length;
  const totalPockets  = rows.filter(r => r.pocket_number != null).length;

  return (
    <div className="pledge-register-page">
      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>{t("pledge_register")}</h2>
          <p>{t("pledge_register_desc")}</p>
        </div>
        <div className="filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadReport}>{t("search", "Load")}</button>
        </div>
      </div>

      {/* ── ALL stat cards — same component, same layout ── */}
      <div className="stats-grid">
        <StatCard icon="🗂"  label={t("total_pockets_lbl", "Total Pockets")} value={totalPockets} color="card-blue"   />
        <StatCard icon="🟢" label={t("active_pockets_lbl", "Active Pockets")} value={activePockets} color="card-green"  />
        <StatCard icon="🔒" label={t("closed_pockets_lbl", "Closed Pockets")} value={closedPockets} color="card-slate"  />
        <StatCard icon="₹"  label={t("total_loan_amount")} value={`₹${totalLoan.toLocaleString("en-IN")}`} color="card-yellow" />
        <StatCard icon="📋" label={t("total_pledges")} value={rows.length} color="card-purple" />
        {Object.entries(metalTotals).map(([metal, weights]) => {
          const localizedMetalName = metal === "gold" ? t("gold") : metal === "silver" ? t("silver") : metal;
          return (
            <React.Fragment key={metal}>
              <StatCard
                icon="⚖️"
                label={`${localizedMetalName} ${t("gross", "Gross")} ${t("weight", "Wt")}`}
                value={`${weights.gross.toFixed(2)} g`}
                color="card-orange"
              />
              <StatCard
                icon="🏅"
                label={`${localizedMetalName} ${t("net", "Net")} ${t("weight", "Wt")}`}
                value={`${weights.net.toFixed(2)} g`}
                color="card-teal"
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="table-section">
        {loading ? (
          <p className="loading-text">{t("loading_pledges", "Loading report...")}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t("pocket_tbl_hdr", "Pocket")}</th>
                <th>{t("pledge_no")}</th>
                <th>{t("date")}</th>
                <th>{t("customer")}</th>
                <th>{t("metal")}</th>
                <th>{t("jewellery_type")}</th>
                <th>{t("gross_weight_hdr", "Gross Wt")}</th>
                <th>{t("net_weight_hdr", "Net Wt")}</th>
                <th>{t("loan_amount")}</th>
                <th>{t("scheme")}</th>
                <th>{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="11" className="table-empty-state" style={{ textAlign: "center", padding: "20px" }}>
                    {t("no_matching_records")}
                  </td>
                </tr>
              ) : (
                rows.map(row => {
                  const meta = STATUS_META[row.status] || { label: row.status, cls: "" };
                  return (
                    <tr
                      key={row.pledge_id}
                      className="clickable-row"
                      onDoubleClick={() =>
                        setActiveMenu(`single-pledge-${row.pledge_id}-pledge-register`)
                      }
                    >
                      <td className="pocket-cell">
                        {row.pocket_number
                          ? <span className="pocket-badge">#{row.pocket_number}</span>
                          : <span className="pocket-empty">—</span>}
                      </td>
                      <td>{row.pledge_no}</td>
                      <td>{formatTransactionTimestamp(row.created_at)}</td>
                      <td>{row.customer_name}</td>
                      <td>{row.metal_type === "Gold" ? t("gold") : row.metal_type === "Silver" ? t("silver") : row.metal_type}</td>
                      <td>{row.jewellery_type}</td>
                      <td>{row.gross_weight}</td>
                      <td>{row.net_weight}</td>
                      <td className="loan">₹ {Number(row.loan_amount || 0).toLocaleString("en-IN")}</td>
                      <td>{row.scheme_name}</td>
                      <td><span className={`status-badge ${meta.cls}`}>{meta.label}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}