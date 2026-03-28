// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import "./StockReportPage.css";
// import ChartRenderer
//  from "../components/charts/ChartRenderer";
// export default function StockReportPage(){

//   const [rows,setRows] = useState([]);

//   useEffect(()=>{
//     loadReport();
//   },[])

//   async function loadReport(){

//     try{

//       const result = await invoke("get_stock_report_cmd");

//       setRows(result.rows);

//     }catch(err){
//       console.error(err);
//     }

//   }

//   return(

//     <div className="stock-page">

//       <div className="report-header">
//         <h2>Metal Stock Report</h2>
//         <p>Current pledged jewellery inventory by metal type</p>
//       </div>

//       <table>

//         <thead>

//           <tr>
//             <th>Metal</th>
//             <th>Gross Weight</th>
//             <th>Net Weight</th>
//             <th>Items</th>
//             <th>Estimated Value</th>
//           </tr>

//         </thead>

//         <tbody>

//           {rows.map((row,index)=>(
//             <tr key={index}>

//               <td>{row.metal}</td>

//               <td>{row.gross_weight.toFixed(2)} g</td>

//               <td>{row.net_weight.toFixed(2)} g</td>

//               <td>{row.item_count}</td>

//               <td>₹ {row.estimated_value.toLocaleString()}</td>

//             </tr>
//           ))}

//         </tbody>

//       </table>


//       <ChartRenderer
//   type="pie"
//   data={rows}
//   xKey="metal"
//   dataKey="net_weight"
// />

//     </div>

//   )

// }


import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./StockReportPage.css";
import ChartRenderer from "../components/charts/ChartRenderer";

export default function StockReportPage() {
  const [rows, setRows] = useState([]);
  const [totalActivePockets, setTotalActivePockets] = useState(0);
  const [currentPocketRunning, setCurrentPocketRunning] = useState(0);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      const result = await invoke("get_stock_report_cmd");
      setRows(result.rows);
      setTotalActivePockets(result.total_active_pockets);
      setCurrentPocketRunning(result.current_pocket_running);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="stock-page">

      <div className="report-header">
        <h2>Metal Stock Report</h2>
        <p>Current pledged jewellery inventory by metal type</p>
      </div>

      {/* ── Pocket Summary Cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        marginBottom: "24px",
      }}>

        {/* Active Pockets */}
        <div style={{
          background: "var(--color-background-info, #eff6ff)",
          border: "1px solid var(--color-border-info, #93c5fd)",
          borderRadius: "12px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}>
          <div style={{
            width: "48px", height: "48px",
            borderRadius: "10px",
            background: "var(--color-text-info, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", flexShrink: 0,
          }}>
            📦
          </div>
          <div>
            <div style={{
              fontSize: "12px",
              color: "var(--color-text-info, #1d4ed8)",
              fontWeight: "500",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}>
              Active Pockets in Store
            </div>
            <div style={{
              fontSize: "32px",
              fontWeight: "600",
              color: "var(--color-text-info, #1d4ed8)",
              lineHeight: 1,
            }}>
              {totalActivePockets}
            </div>
            <div style={{
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              marginTop: "4px",
            }}>
              Pockets currently in locker
            </div>
          </div>
        </div>

        {/* Current Running Pocket Number */}
        <div style={{
          background: "var(--color-background-warning, #fffbeb)",
          border: "1px solid var(--color-border-warning, #fcd34d)",
          borderRadius: "12px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}>
          <div style={{
            width: "48px", height: "48px",
            borderRadius: "10px",
            background: "var(--color-text-warning, #b45309)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", flexShrink: 0,
          }}>
            🔢
          </div>
          <div>
            <div style={{
              fontSize: "12px",
              color: "var(--color-text-warning, #b45309)",
              fontWeight: "500",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}>
              Current Pocket Running No.
            </div>
            <div style={{
              fontSize: "32px",
              fontWeight: "600",
              color: "var(--color-text-warning, #b45309)",
              lineHeight: 1,
            }}>
              {currentPocketRunning}
            </div>
            <div style={{
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              marginTop: "4px",
            }}>
              Highest pocket number ever assigned
            </div>
          </div>
        </div>

      </div>

      {/* ── Stock Table ── */}
      <table>
        <thead>
          <tr>
            <th>Metal</th>
            <th>Gross Weight</th>
            <th>Net Weight</th>
            <th>Items</th>
            <th>Estimated Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>{row.metal}</td>
              <td>{row.gross_weight.toFixed(2)} g</td>
              <td>{row.net_weight.toFixed(2)} g</td>
              <td>{row.item_count}</td>
              <td>₹ {row.estimated_value.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ChartRenderer
        type="pie"
        data={rows}
        xKey="metal"
        dataKey="net_weight"
      />

    </div>
  );
}