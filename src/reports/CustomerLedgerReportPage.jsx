// import { useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import "./CustomerLedgerReportPage.css";

// export default function CustomerLedgerReportPage({ setActiveMenu }) {

//   const [customerCode,setCustomerCode] = useState("");
//   const [report,setReport] = useState(null);

//   async function loadLedger(){

//     if(!customerCode) return;

//     try{

//       const result = await invoke("get_customer_ledger_report_cmd",{
//         customerCode: customerCode.trim()
//       });

//       setReport(result);

//     }catch(err){
//       console.error("Ledger Error:",err);
//     }

//   }

//   const totalDebit =
//     report?.rows.reduce((sum,r)=>sum+r.debit,0) || 0;

//   const totalCredit =
//     report?.rows.reduce((sum,r)=>sum+r.credit,0) || 0;

//   const closingBalance =
//     report?.rows.length
//       ? report.rows[report.rows.length-1].balance
//       : 0;

//       const groupedRows = report?.rows.reduce((acc,row)=>{

//         if(!acc[row.pledge_no]){
//           acc[row.pledge_no] = []
//         }
      
//         acc[row.pledge_no].push(row)
      
//         return acc
      
//       },{})

//   return(

//     <div className="ledger-page">

//       <div className="report-header">

//         <div>
//           <h2>Customer Ledger</h2>
//           <p>Complete financial history of the customer</p>
//         </div>

//         <div className="ledger-filter">

//           <input
//             type="text"
//             placeholder="Enter Customer Code (A0001)"
//             value={customerCode}
//             onChange={(e)=>setCustomerCode(e.target.value)}
//             onKeyDown={(e)=>{
//               if(e.key==="Enter"){
//                 loadLedger()
//               }
//             }}
//           />

//           <button onClick={loadLedger}>
//             Load Ledger
//           </button>

//         </div>

//       </div>

//       {!report && (
//  <div className="ledger-empty">
//     Enter a Customer ID and click <strong>Load Ledger</strong>
//   </div>
// )}


//       {report && (

//         <>
        
//         <div className="customer-info">

//           <div>
//             <span>Customer Name</span>
//             <strong>{report.customer_name}</strong>
//           </div>

//           <div>
//             <span>Customer Code</span>
//             <strong>{report.customer_code}</strong>
//           </div>

//         </div>


//         <div className="ledger-table">

//           <table>

//             <thead>

//               <tr>
//                 <th>Date</th>
//                 <th>Description</th>
//                 <th>Debit</th>
//                 <th>Credit</th>
//                 <th>Balance</th>
//               </tr>

//             </thead>

//             <tbody>

// {Object.entries(groupedRows || {}).map(([pledgeNo,rows])=>(
  
//   <>
  
//   <tr className="pledge-group-row">
//   <td colSpan="5">

//     <span
//       className="pledge-link"
//       onClick={() =>
//         setActiveMenu(`single-pledge-${rows[0].pledge_id}-customer-ledger`)
//       }
//     >
//       🔗 Pledge : {pledgeNo}
//     </span>

//   </td>
// </tr>

//   {rows.map((row,index)=>(
//     <tr key={index}>

//       <td>{row.date}</td>

//       <td>{row.description}</td>

//       <td className="debit">
//         {row.debit ? `₹ ${row.debit.toLocaleString()}` : "-"}
//       </td>

//       <td className="credit">
//         {row.credit ? `₹ ${row.credit.toLocaleString()}` : "-"}
//       </td>

//       <td className="balance">
//         ₹ {row.balance.toLocaleString()}
//       </td>

//     </tr>
//   ))}

//   </>

// ))}

// </tbody>

//           </table>

//         </div>


//         <div className="ledger-summary">

//           <div>
//             <span>Total Debit</span>
//             <strong>₹ {totalDebit.toLocaleString()}</strong>
//           </div>

//           <div>
//             <span>Total Credit</span>
//             <strong>₹ {totalCredit.toLocaleString()}</strong>
//           </div>

//           <div>
//             <span>Closing Balance</span>
//             <strong>₹ {closingBalance.toLocaleString()}</strong>
//           </div>

//         </div>

//         </>

//       )}

//     </div>

//   )

// }





import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./CustomerLedgerReportPage.css";

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

export default function CustomerLedgerReportPage({ setActiveMenu }) {

  const [customerCode, setCustomerCode] = useState("");
  const [report,       setReport]       = useState(null);

  async function loadLedger() {
    if (!customerCode) return;
    try {
      const result = await invoke("get_customer_ledger_report_cmd", {
        customerCode: customerCode.trim(),
      });
      setReport(result);
    } catch (err) {
      console.error("Ledger Error:", err);
    }
  }

  const totalDebit      = report?.rows.reduce((sum, r) => sum + r.debit,  0) || 0;
  const totalCredit     = report?.rows.reduce((sum, r) => sum + r.credit, 0) || 0;
  const closingBalance  = report?.rows.length
    ? report.rows[report.rows.length - 1].balance
    : 0;
  const totalPledges    = report
    ? Object.keys(report.rows.reduce((acc, r) => { acc[r.pledge_no] = 1; return acc; }, {})).length
    : 0;

  const groupedRows = report?.rows.reduce((acc, row) => {
    if (!acc[row.pledge_no]) acc[row.pledge_no] = [];
    acc[row.pledge_no].push(row);
    return acc;
  }, {});

  return (
    <div className="ledger-page">

      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>Customer Ledger</h2>
          <p>Complete financial history of the customer</p>
        </div>
        <div className="ledger-filter">
          <input
            type="text"
            placeholder="Enter Customer Code (A0001)"
            value={customerCode}
            onChange={e => setCustomerCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadLedger()}
          />
          <button onClick={loadLedger}>Load Ledger</button>
        </div>
      </div>

      {!report && (
        <div className="ledger-empty">
          Enter a Customer ID and click <strong>Load Ledger</strong>
        </div>
      )}

      {report && (
        <>
          {/* ── Customer info ── */}
          <div className="customer-info">
            <div>
              <span>Customer Name</span>
              <strong>{report.customer_name}</strong>
            </div>
            <div>
              <span>Customer Code</span>
              <strong>{report.customer_code}</strong>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="stats-grid">
            <StatCard icon="📋" label="Total Pledges"    value={totalPledges}                        color="card-blue"   />
            <StatCard icon="📉" label="Total Debit"      value={`₹${totalDebit.toLocaleString()}`}   color="card-rose"   />
            <StatCard icon="📈" label="Total Credit"     value={`₹${totalCredit.toLocaleString()}`}  color="card-green"  />
            <StatCard icon="💰" label="Closing Balance"  value={`₹${closingBalance.toLocaleString()}`} color={closingBalance >= 0 ? "card-teal" : "card-orange"} />
          </div>

          {/* ── Ledger table ── */}
          <div className="ledger-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedRows || {}).map(([pledgeNo, rows]) => (
                  <>
                    <tr className="pledge-group-row" key={`group-${pledgeNo}`}>
                      <td colSpan="5">
                        <span
                          className="pledge-link"
                          onClick={() =>
                            setActiveMenu(`single-pledge-${rows[0].pledge_id}-customer-ledger`)
                          }
                        >
                          🔗 Pledge: {pledgeNo}
                        </span>
                      </td>
                    </tr>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        <td>{row.date}</td>
                        <td>{row.description}</td>
                        <td className="debit">{row.debit  ? `₹ ${row.debit.toLocaleString()}`  : "—"}</td>
                        <td className="credit">{row.credit ? `₹ ${row.credit.toLocaleString()}` : "—"}</td>
                        <td className="balance">₹ {row.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}