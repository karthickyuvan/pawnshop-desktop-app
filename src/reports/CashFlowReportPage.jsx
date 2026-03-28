// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import "./CashFlowReportPage.css";
// import ChartRenderer from "../components/charts/ChartRenderer";

// export default function CashFlowReportPage() {

//   const today = new Date();
//   const firstDay = new Date(today.getFullYear(), 0, 1)
//     .toISOString()
//     .split("T")[0];

//   const [startDate, setStartDate] = useState(firstDay);
//   const [endDate, setEndDate] = useState(
//     new Date().toISOString().split("T")[0]
//   );

//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadReport();
//   }, []);

//   async function loadReport() {
//     setLoading(true);

//     try {

//       const result = await invoke("get_cash_flow_report_cmd", {
//         startDate,
//         endDate
//       });

//       setRows(result.rows);

//     } catch (err) {
//       console.error("Cash Flow Error:", err);
//     }

//     setLoading(false);
//   }

//   const totalIn = rows.reduce((sum, r) => sum + r.cash_in, 0);
//   const totalOut = rows.reduce((sum, r) => sum + r.cash_out, 0);
//   const net = totalIn - totalOut;

//   return (
//     <div className="cashflow-page">

//       <div className="report-header">

//         <div>
//           <h2>Cash Flow Report</h2>
//           <p>Track cash inflow and outflow over time</p>
//         </div>

//         <div className="filters">

//           <input
//             type="date"
//             value={startDate}
//             onChange={(e)=>setStartDate(e.target.value)}
//           />

//           <input
//             type="date"
//             value={endDate}
//             onChange={(e)=>setEndDate(e.target.value)}
//           />

//           <button onClick={loadReport}>
//             Load
//           </button>

//         </div>

//       </div>

//       {/* SUMMARY CARDS */}

//       <div className="summary-grid">

//         <Card title="Total Cash In" value={totalIn} color="green"/>

//         <Card title="Total Cash Out" value={totalOut} color="red"/>

//         <Card title="Net Cash Flow" value={net} color="blue"/>

//       </div>


//       {/* TABLE */}

//       <div className="table-section">

//         <table>

//           <thead>
//             <tr>
//               <th>Period</th>
//               <th>Cash In</th>
//               <th>Cash Out</th>
//               <th>Net</th>
//             </tr>
//           </thead>

//           <tbody>

//             {rows.map((row,index)=>(
//               <tr key={index}>

//                 <td>{row.period}</td>

//                 <td className="in">
//                   ₹ {row.cash_in.toLocaleString()}
//                 </td>

//                 <td className="out">
//                   ₹ {row.cash_out.toLocaleString()}
//                 </td>

//                 <td className={row.net >= 0 ? "in" : "out"}>
//                   ₹ {row.net.toLocaleString()}
//                 </td>

//               </tr>
//             ))}

//           </tbody>

//         </table>

//       </div>
//       <ChartRenderer
//   type="bar"
//   data={rows}
//   xKey="period"
//   yKey="net"
// />

//     </div>
//   );
// }

// function Card({title,value,color}){

//   return(
//     <div className="summary-card">

//       <span className="card-title">{title}</span>

//       <span className={`card-value ${color}`}>
//         ₹ {value.toLocaleString()}
//       </span>

//     </div>
//   )
// }



import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./CashFlowReportPage.css";
import ChartRenderer from "../components/charts/ChartRenderer";

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

export default function CashFlowReportPage() {

  const today    = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate,   setEndDate]   = useState(today.toISOString().split("T")[0]);
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const result = await invoke("get_cash_flow_report_cmd", { startDate, endDate });
      setRows(result.rows);
    } catch (err) {
      console.error("Cash Flow Error:", err);
    }
    setLoading(false);
  }

  const totalIn  = rows.reduce((sum, r) => sum + r.cash_in,  0);
  const totalOut = rows.reduce((sum, r) => sum + r.cash_out, 0);
  const net      = totalIn - totalOut;

  return (
    <div className="cashflow-page">

      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>Cash Flow Report</h2>
          <p>Track cash inflow and outflow over time</p>
        </div>
        <div className="filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadReport}>Load</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <StatCard icon="📈" label="Total Cash In"  value={`₹${totalIn.toLocaleString()}`}  color="card-green"  />
        <StatCard icon="📉" label="Total Cash Out" value={`₹${totalOut.toLocaleString()}`} color="card-rose"   />
        <StatCard icon="💰" label="Net Cash Flow"  value={`₹${net.toLocaleString()}`}      color={net >= 0 ? "card-blue" : "card-orange"} />
      </div>

      {/* ── Table ── */}
      <div className="table-section">
        {loading ? (
          <p className="loading-text">Loading report...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Cash In</th>
                <th>Cash Out</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>{row.period}</td>
                  <td className="in">₹ {row.cash_in.toLocaleString()}</td>
                  <td className="out">₹ {row.cash_out.toLocaleString()}</td>
                  <td className={row.net >= 0 ? "in" : "out"}>₹ {row.net.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Chart ── */}
      <ChartRenderer type="bar" data={rows} xKey="period" yKey="net" />

    </div>
  );
}