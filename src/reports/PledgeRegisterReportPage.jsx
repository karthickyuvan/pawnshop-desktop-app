// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import "./PledgeRegisterReportPage.css";

// export default function PledgeRegisterReportPage({ setActiveMenu }) {

//   const today = new Date().toISOString().split("T")[0];

//   const [startDate, setStartDate] = useState(today);
//   const [endDate, setEndDate] = useState(today);

//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadReport();
//   }, []);

//   async function loadReport() {

//     setLoading(true);

//     try {

//       const result = await invoke("get_pledge_register_report_cmd", {
//         startDate,
//         endDate
//       });

//       setRows(result?.pledges || []);

//     } catch (err) {
//       console.error("Pledge Register Error:", err);
//     }

//     setLoading(false);
//   }


//   /* =============================
//       METAL TOTAL CALCULATION
//   ==============================*/

//   const metalTotals = rows.reduce((acc, row) => {

//     const metal = row?.metal_type?.toLowerCase()?.trim();

//     if (!metal) return acc;

//     if (!acc[metal]) {
//       acc[metal] = { gross: 0, net: 0 };
//     }

//     acc[metal].gross += Number(row?.gross_weight || 0);
//     acc[metal].net += Number(row?.net_weight || 0);

//     return acc;

//   }, {});


//   const totalLoan = rows.reduce(
//     (sum, r) => sum + Number(r?.loan_amount || 0),
//     0
//   );

//   const goldGross = metalTotals?.gold?.gross || 0;
//   const goldNet = metalTotals?.gold?.net || 0;

//   const silverGross = metalTotals?.silver?.gross || 0;
//   const silverNet = metalTotals?.silver?.net || 0;


//   return (

//     <div className="pledge-register-page">

//       {/* ================= HEADER ================= */}

//       <div className="report-header">

//         <div>
//           <h2>Pledge Register</h2>
//           <p>Complete list of pledges issued in the selected period</p>
//         </div>

//         <div className="filters">

//           <input
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//           />

//           <input
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//           />

//           <button onClick={loadReport}>
//             Load
//           </button>

//         </div>

//       </div>


//       {/* ================= SUMMARY ================= */}

//       <div className="summary-grid">

//         <Summary title="Total Pledges" value={rows.length} />

//         <Summary
//           title="Total Loan Amount"
//           value={`₹ ${totalLoan.toLocaleString()}`}
//         />

//         <Summary
//           title="Gold Gross Weight"
//           value={`${goldGross.toFixed(2)} g`}
//         />

//         <Summary
//           title="Gold Net Weight"
//           value={`${goldNet.toFixed(2)} g`}
//         />

//         <Summary
//           title="Silver Gross Weight"
//           value={`${silverGross.toFixed(2)} g`}
//         />

//         <Summary
//           title="Silver Net Weight"
//           value={`${silverNet.toFixed(2)} g`}
//         />

//       </div>


//       {/* ================= TABLE ================= */}

//       <div className="table-section">

//         {loading ? (
//           <p>Loading report...</p>
//         ) : (

//           <table>

//             <thead>
//               <tr>
//                 <th>Pledge No</th>
//                 <th>Date</th>
//                 <th>Customer</th>
//                 <th>Metal</th>
//                 <th>Jewellery Type</th>
//                 <th>Gross Wt (g)</th>
//                 <th>Net Wt (g)</th>
//                 <th>Loan Amount</th>
//                 <th>Scheme</th>
//                 <th>Status</th>
//               </tr>
//             </thead>

//             <tbody>

//               {rows.map((row) => (

//                 <tr
//                   key={row.pledge_id}
//                   className="clickable-row"
//                   onDoubleClick={() =>
//                     setActiveMenu(`single-pledge-${row.pledge_id}-pledge-register`)
//                   }
//                 >

//                   <td>{row.pledge_no}</td>

//                   <td>{row.created_at}</td>

//                   <td>{row.customer_name}</td>

//                   <td>{row.metal_type}</td>

//                   <td>{row.jewellery_type}</td>

//                   <td>{row.gross_weight}</td>

//                   <td>{row.net_weight}</td>

//                   <td className="loan">
//                     ₹ {Number(row.loan_amount || 0).toLocaleString()}
//                   </td>

//                   <td>{row.scheme_name}</td>

//                   <td>{row.status}</td>

//                 </tr>

//               ))}

//             </tbody>

//           </table>

//         )}

//       </div>

//     </div>

//   );
// }


// /* ================= SUMMARY CARD ================= */

// function Summary({ title, value }) {

//   return (
//     <div className="summary-card">
//       <span>{title}</span>
//       <strong>{value}</strong>
//     </div>
//   );
// }




import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./PledgeRegisterReportPage.css";

const STATUS_META = {
  ACTIVE:    { label: "Active",    cls: "status-active"    },
  CLOSED:    { label: "Closed",    cls: "status-closed"    },
  OVERDUE:   { label: "Overdue",   cls: "status-overdue"   },
  DUE_SOON:  { label: "Due Soon",  cls: "status-due-soon"  },
  AUCTIONED: { label: "Auctioned", cls: "status-auctioned" },
};

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
  const goldGross     = metalTotals?.gold?.gross   || 0;
  const goldNet       = metalTotals?.gold?.net     || 0;
  const silverGross   = metalTotals?.silver?.gross || 0;
  const silverNet     = metalTotals?.silver?.net   || 0;

  return (
    <div className="pledge-register-page">

      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>Pledge Register</h2>
          <p>Complete list of pledges issued in the selected period</p>
        </div>
        <div className="filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadReport}>Load</button>
        </div>
      </div>

      {/* ── ALL stat cards — same component, same layout ── */}
      <div className="stats-grid">
        <StatCard icon="🗂"  label="Total Pockets"      value={totalPockets}                     color="card-blue"   />
        <StatCard icon="🟢" label="Active Pockets"      value={activePockets}                    color="card-green"  />
        <StatCard icon="🔒" label="Closed Pockets"      value={closedPockets}                    color="card-slate"  />
        <StatCard icon="₹"  label="Total Loan Amount"   value={`₹${totalLoan.toLocaleString()}`} color="card-yellow" />
        <StatCard icon="📋" label="Total Pledges"       value={rows.length}                      color="card-purple" />
        <StatCard icon="🥇" label="Gold Gross Wt"       value={`${goldGross.toFixed(2)} g`}      color="card-orange" />
        <StatCard icon="🥇" label="Gold Net Wt"         value={`${goldNet.toFixed(2)} g`}        color="card-teal"   />
        <StatCard icon="🥈" label="Silver Gross Wt"     value={`${silverGross.toFixed(2)} g`}    color="card-slate"  />
        <StatCard icon="🥈" label="Silver Net Wt"       value={`${silverNet.toFixed(2)} g`}      color="card-rose"   />
      </div>

      {/* ── Table ── */}
      <div className="table-section">
        {loading ? (
          <p className="loading-text">Loading report...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Pocket</th>
                <th>Pledge No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Metal</th>
                <th>Jewellery</th>
                <th>Gross (g)</th>
                <th>Net (g)</th>
                <th>Loan Amount</th>
                <th>Scheme</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
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
                    <td>{row.created_at}</td>
                    <td>{row.customer_name}</td>
                    <td>{row.metal_type}</td>
                    <td>{row.jewellery_type}</td>
                    <td>{row.gross_weight}</td>
                    <td>{row.net_weight}</td>
                    <td className="loan">₹ {Number(row.loan_amount || 0).toLocaleString()}</td>
                    <td>{row.scheme_name}</td>
                    <td><span className={`status-badge ${meta.cls}`}>{meta.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}