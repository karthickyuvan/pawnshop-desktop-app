// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import "./ExpenseAuditReportPage.css";

// export default function ExpenseAuditReportPage() {

//   const today = new Date().toISOString().split("T")[0];

//   const [startDate,setStartDate] = useState(today);
//   const [endDate,setEndDate] = useState(today);

//   const [rows,setRows] = useState([]);
//   const [summary,setSummary] = useState([]);

//   const [loading,setLoading] = useState(false);


//   useEffect(()=>{
//     loadReport();
//   },[])


//   async function loadReport(){

//     setLoading(true);

//     try{

//       const result = await invoke("get_expense_audit_report_cmd",{
//         startDate,
//         endDate
//       });

//       setRows(result.expenses || []);
//       setSummary(result.summary || []);

//     }catch(err){
//       console.error("Expense Audit Error:",err);
//     }

//     setLoading(false);
//   }


//   const totalExpense = (rows || []).reduce(
//     (sum,r)=> sum + (r.amount || 0),
//     0
//   );


//   return (

//     <div className="expense-audit-page">

//       {/* HEADER */}

//       <div className="report-header">

//         <div>
//           <h2>Expense Audit Report</h2>
//           <p>Detailed audit trail of all business expenses</p>
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


//       {/* TOTAL SUMMARY */}

//       <div className="summary-card">

//         <span>Total Expense</span>

//         <strong>₹ {totalExpense.toLocaleString()}</strong>

//       </div>



//       {/* CATEGORY SUMMARY */}

//       <div className="category-summary">

//         <h3>Expense by Category</h3>

//         <table>

//           <thead>
//             <tr>
//               <th>Category</th>
//               <th>Total Amount</th>
//             </tr>
//           </thead>

//           <tbody>

//             {summary.map((row,index)=>(
//               <tr key={index}>

//                 <td>{row.category}</td>

//                 <td className="amount">
//                   ₹ {row.total_amount.toLocaleString()}
//                 </td>

//               </tr>
//             ))}

//           </tbody>

//         </table>

//       </div>



//       {/* EXPENSE TABLE */}

//       <div className="table-section">

//         <table>

//           <thead>

//             <tr>
//               <th>Date</th>
//               <th>Category</th>
//               <th>Description</th>
//               <th>Amount</th>
//               <th>Created By</th>
//             </tr>

//           </thead>

//           <tbody>

//             {rows.map((row,index)=>(
//               <tr key={index}>

//                 <td>{row.date}</td>

//                 <td>{row.category}</td>

//                 <td>{row.description}</td>

//                 <td className="amount">
//                   ₹ {row.amount.toLocaleString()}
//                 </td>

//                 <td>{row.created_by}</td>

//               </tr>
//             ))}

//           </tbody>

//         </table>

//       </div>

//     </div>

//   );
// }





import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./ExpenseAuditReportPage.css";

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

export default function ExpenseAuditReportPage() {

  const today = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState(today);
  const [rows,      setRows]      = useState([]);
  const [summary,   setSummary]   = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const result = await invoke("get_expense_audit_report_cmd", { startDate, endDate });
      setRows(result.expenses || []);
      setSummary(result.summary || []);
    } catch (err) {
      console.error("Expense Audit Error:", err);
    }
    setLoading(false);
  }

  const totalExpense  = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalEntries  = rows.length;
  const topCategory   = summary.length > 0
    ? summary.reduce((a, b) => a.total_amount > b.total_amount ? a : b).category
    : "—";
  const categoryCount = summary.length;

  return (
    <div className="expense-audit-page">

      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>Expense Audit Report</h2>
          <p>Detailed audit trail of all business expenses</p>
        </div>
        <div className="filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadReport}>Load</button>
        </div>
      </div>

      {/* ── Stat cards — same style as Pledge Register ── */}
      <div className="stats-grid">
        <StatCard icon="💸" label="Total Expense"    value={`₹${totalExpense.toLocaleString()}`} color="card-rose"   />
        <StatCard icon="📋" label="Total Entries"    value={totalEntries}                        color="card-blue"   />
        <StatCard icon="🏷️" label="Categories"       value={categoryCount}                       color="card-purple" />
        <StatCard icon="🔝" label="Top Category"     value={topCategory}                         color="card-orange" />
      </div>

      {/* ── Category Summary ── */}
      <div className="table-section" style={{ marginBottom: 20 }}>
        <div className="section-title">Expense by Category</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row, index) => (
              <tr key={index}>
                <td>{row.category}</td>
                <td className="amount">₹ {row.total_amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Expense Table ── */}
      <div className="table-section">
        <div className="section-title">All Expenses</div>
        {loading ? (
          <p className="loading-text">Loading report...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>{row.date}</td>
                  <td>{row.category}</td>
                  <td>{row.description}</td>
                  <td className="amount">₹ {row.amount.toLocaleString()}</td>
                  <td>{row.created_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}