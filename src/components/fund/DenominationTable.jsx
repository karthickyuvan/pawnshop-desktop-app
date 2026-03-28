// import "../../pages/fundManagement.css";

// const NOTES_LEFT = [500, 200, 100];
// const NOTES_RIGHT = [50, 20, 10];

// export default function DenominationTable({ data = {}, setData }) {
//   // Helper to update quantity for specific notes
//   const updateQty = (denom, qty) => {
//     setData((prev = {}) => ({
//       ...prev,
//       [denom]: Number(qty),
//     }));
//   };

//   const renderCard = (denom) => (
//     <div className="denom-card" key={denom}>
//       <div className="denom-label">₹{denom}</div>

//       <input
//         type="number"
//         min="0"
//         placeholder="0"
//         value={data[denom] ?? ""}
//         onChange={(e) => updateQty(denom, e.target.value)}
//         onWheel={(e) => e.target.blur()}
//       />

//       <div className="denom-amount">
//         ₹{((data[denom] || 0) * denom).toLocaleString("en-IN")}
//       </div>
//     </div>
//   );

//   return (
//     <div className="denom-container">
//       <div className="modal-section-title">Cash Denominations</div>

//       <div className="denom-grid">
//         {/* Left Column (Big Notes) */}
//         <div className="denom-column">
//           {NOTES_LEFT.map(renderCard)}
//         </div>

//         {/* Right Column (Small Notes + Coins) */}
//         <div className="denom-column">
//           {NOTES_RIGHT.map(renderCard)}

//           {/* Manual Coin Input (Lump Sum) */}
//           <div className="denom-card coin-card">
//             <div className="denom-label">Coins</div>
//             <input
//               type="number"
//               min="0"
//               placeholder="Total Value"
//               value={data.coins ?? ""}
//               onChange={(e) =>
//                 setData((prev = {}) => ({
//                   ...prev,
//                   coins: Number(e.target.value),
//                 }))
//               }
//               onWheel={(e) => e.target.blur()}
//             />
//             <div className="denom-amount">
//               ₹{(data.coins || 0).toLocaleString("en-IN")}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// src/components/fundManagement/DenominationTable.jsx
// import CashDenominationInput from "../common/CashDenominationInput";
import CashDenominationInput from "../../constants/CashDenominationInput";

export default function DenominationTable({ data = {}, setData }) {
  return <CashDenominationInput data={data} setData={setData} />;
}