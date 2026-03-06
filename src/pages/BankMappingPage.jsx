// import { useEffect, useState } from "react";
// import { useAuthStore } from "../auth/authStore";
// import { getBanks } from "../services/bankApi";
// import { 
//   getPledgeByNumber, 
//   mapBankToPledge,
//   unmapBankFromPledge,
//   searchPledgesForMapping
// } from "../services/bankMappingApi";
// import { 
//   Link2, 
//   Fingerprint, 
//   Landmark, 
//   IndianRupee, 
//   ReceiptText, 
//   ShieldCheck, 
//   Search,
//   CheckCircle2,
//   XCircle,
//   AlertCircle,
//   User,
//   Calendar,
//   Wallet,
//   TrendingUp,
//   TrendingDown,
//   AlertTriangle,
//   Hash
// } from "lucide-react";
// import "./bankMapping.css";

// // ─── Helper: convert {500: 2, 100: 3} → [{denomination:500,quantity:2}, ...] ──
// // Backend expects Vec<DenominationEntry> not a plain object
// const denomObjectToArray = (denomObj) =>
//   Object.entries(denomObj)
//     .map(([d, qty]) => ({ denomination: Number(d), quantity: Number(qty) }))
//     .filter((e) => e.quantity > 0);

// // ─── Cash Denominations Component ────────────────────────────────────────────
// function CashDenominations({ denominations, onChange, label = "Note Breakup" }) {
//   const denoms = [500, 200, 100, 50, 20, 10];
//   const total = denoms.reduce((sum, d) => sum + d * (denominations[d] || 0), 0);

//   return (
//     <div className="denom-section">
//       <div className="denom-section-header">
//         <span>{label}</span>
//         {total > 0 && (
//           <span className="denom-count-label">Count: ₹{total.toLocaleString()}</span>
//         )}
//       </div>
//       <div className="denom-grid">
//         {denoms.map((d) => (
//           <div key={d} className="denom-item">
//             <span className="denom-label">₹{d}</span>
//             <input
//               type="number"
//               min="0"
//               className="denom-input"
//               value={denominations[d] || 0}
//               onChange={(e) =>
//                 onChange({
//                   ...denominations,
//                   [d]: Math.max(0, parseInt(e.target.value) || 0),
//                 })
//               }
//             />
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── Reference Number Input Component ────────────────────────────────────────
// function ReferenceInput({ method, value, onChange }) {
//   return (
//     <div className="input-group" style={{ marginTop: "12px" }}>
//       <label>
//         <Hash size={14} />{" "}
//         {method === "UPI" ? "UPI" : "Bank Transfer"} Reference Number{" "}
//         <span className="req">*</span>
//       </label>
//       <input
//         type="text"
//         placeholder={
//           method === "UPI"
//             ? "Enter UPI Transaction ID / UTR number"
//             : "Enter Bank Transfer reference / UTR number"
//         }
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className="reference-input"
//       />
//       <small>
//         {method === "UPI"
//           ? "12-digit UPI transaction reference"
//           : "NEFT / IMPS / RTGS UTR number"}
//       </small>
//     </div>
//   );
// }

// // ─── Default denomination state ───────────────────────────────────────────────
// const emptyDenominations = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 };

// // ─── Helper: calculate denom total ───────────────────────────────────────────
// const calcDenomTotal = (denoms) =>
//   Object.entries(denoms).reduce((sum, [d, qty]) => sum + Number(d) * qty, 0);

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function BankMappingPage() {
//   const user = useAuthStore((s) => s.user);

//   const [banks, setBanks] = useState([]);
//   const [pledgeNumber, setPledgeNumber] = useState("");
//   const [pledgeDetails, setPledgeDetails] = useState(null);
//   const [pledgeConfirmed, setPledgeConfirmed] = useState(false);
//   const [searchResults, setSearchResults] = useState([]);

//   // ── Mapping fields ──
//   const [bankId, setBankId] = useState("");
//   const [bankLoanAmount, setBankLoanAmount] = useState("");
//   const [actualReceived, setActualReceived] = useState("");
//   const [bankCharges, setBankCharges] = useState("");
//   const [paymentMethod, setPaymentMethod] = useState("CASH");
//   const [mapDenominations, setMapDenominations] = useState({ ...emptyDenominations });
//   const [mapReference, setMapReference] = useState("");

//   // ── Unmapping fields ──
//   const [bankInterest, setBankInterest] = useState("");
//   const [bankSettleMethod, setBankSettleMethod] = useState("CASH");
//   const [bankSettleDenominations, setBankSettleDenominations] = useState({ ...emptyDenominations });
//   const [bankSettleReference, setBankSettleReference] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [searching, setSearching] = useState(false);
//   const [mode, setMode] = useState(null);
//   const [confirmModal, setConfirmModal] = useState(null); // {message, onConfirm}

//   useEffect(() => {
//     getBanks().then(setBanks);
//   }, []);

//   // ── Debounced live search ─────────────────────────────────────────────────
//   useEffect(() => {
//     if (pledgeNumber.trim().length < 3 || pledgeConfirmed) {
//       setSearchResults([]);
//       return;
//     }
//     const timer = setTimeout(async () => {
//       try {
//         setSearching(true);
//         const results = await searchPledgesForMapping(pledgeNumber.trim());
//         setSearchResults(results);
//       } catch {
//         setSearchResults([]);
//       } finally {
//         setSearching(false);
//       }
//     }, 400);
//     return () => clearTimeout(timer);
//   }, [pledgeNumber, pledgeConfirmed]);

//   const searchPledge = async () => {
//     if (!pledgeNumber.trim()) {
//       alert("Please enter a pledge number");
//       return;
//     }
//     try {
//       setSearching(true);
//       const details = await getPledgeByNumber(pledgeNumber);
//       setPledgeDetails(details);
//       setSearchResults([]);
//       setPledgeConfirmed(false);
//       setMode(details.is_bank_mapped ? "unmap" : "map");
//     } catch {
//       alert("Pledge not found. Please check the pledge number.");
//       setPledgeDetails(null);
//       setPledgeConfirmed(false);
//       setMode(null);
//     } finally {
//       setSearching(false);
//     }
//   };

//   const confirmPledge = () => setPledgeConfirmed(true);

//   const cancelPledge = () => {
//     setPledgeDetails(null);
//     setPledgeConfirmed(false);
//     setPledgeNumber("");
//     setSearchResults([]);
//     setBankId("");
//     setBankLoanAmount("");
//     setActualReceived("");
//     setBankCharges("");
//     setPaymentMethod("CASH");
//     setMapDenominations({ ...emptyDenominations });
//     setMapReference("");
//     setBankInterest("");
//     setBankSettleMethod("CASH");
//     setBankSettleDenominations({ ...emptyDenominations });
//     setBankSettleReference("");
//     setMode(null);
//   };

//   // ── Mapping calculations ──────────────────────────────────────────────────
//   const calculateNetReceived = () => {
//     const received = parseFloat(actualReceived) || 0;
//     const charges  = parseFloat(bankCharges)    || 0;
//     return received - charges;
//   };

//   const calculateDifference = () => {
//     if (!pledgeDetails) return 0;
//     return calculateNetReceived() - pledgeDetails.loan_amount;
//   };

//   const isSurplus = () => calculateDifference() > 0;

//   // ── Submit Mapping ────────────────────────────────────────────────────────
//   const submitMapping = async () => {
//     if (!pledgeConfirmed || !bankId || !bankLoanAmount || !actualReceived) {
//       alert("Please fill in all required fields and confirm the pledge.");
//       return;
//     }
//     if (paymentMethod !== "CASH" && !mapReference.trim()) {
//       alert(`Please enter the ${paymentMethod} reference number.`);
//       return;
//     }
//     if (paymentMethod === "CASH") {
//       const denomTotal = calcDenomTotal(mapDenominations);
//       if (denomTotal === 0) {
//         alert("Please enter cash denominations before confirming.");
//         return;
//       }
//       if (Math.abs(denomTotal - parseFloat(actualReceived)) > 0.01) {
//         alert(
//           `Cash denomination total (₹${denomTotal.toFixed(2)}) does not match Actual Received (₹${parseFloat(actualReceived).toFixed(2)}).\n\nPlease fix the denominations before continuing.`
//         );
//         return;
//       }
//     }

//     const difference  = calculateDifference();
//     const netReceived = calculateNetReceived();
//     const confirmMsg  = isSurplus()
//       ? `Bank gave MORE than needed.\n\nSURPLUS of ₹${difference.toFixed(2)} via ${paymentMethod}.\n\nContinue?`
//       : difference < 0
//       ? `Bank gave LESS than needed.\n\nDEFICIT of ₹${Math.abs(difference).toFixed(2)} via ${paymentMethod}.\n\nContinue?`
//       : `Exact match. No surplus or deficit.\n\nContinue?`;

//     setConfirmModal({
//       message: confirmMsg,
//       onConfirm: async () => {
//         setConfirmModal(null);
//         try {
//           setLoading(true);
//           await mapBankToPledge({
//         pledgeId:        pledgeDetails.pledge_id,
//         bankId:          Number(bankId),
//         bankLoanAmount:  Number(bankLoanAmount),
//         actualReceived:  Number(actualReceived),
//         bankCharges:     Number(bankCharges || 0),
//         paymentMethod,
//         referenceNumber: paymentMethod !== "CASH" ? mapReference : null,
//         // ✅ Convert object → array for Rust backend
//         denominations:   paymentMethod === "CASH" ? denomObjectToArray(mapDenominations) : null,
//         actorUserId:     user.user_id,
//       });

//           alert(
//             `✅ Bank Mapping Successful!\n\nNet Received: ₹${netReceived.toFixed(2)}\n${
//               isSurplus()
//                 ? `Surplus: +₹${difference.toFixed(2)}`
//                 : difference < 0
//                 ? `Deficit: -₹${Math.abs(difference).toFixed(2)}`
//                 : "Exact Match"
//             }`
//           );
//           cancelPledge();
//         } catch (err) {
//           alert("Mapping failed. Please try again.");
//           console.error(err);
//         } finally {
//           setLoading(false);
//         }
//       },
//     });
//   };

//   // ── Submit Unmapping ──────────────────────────────────────────────────────
//   const submitUnmapping = async () => {
//     if (!pledgeConfirmed) {
//       alert("Please confirm the pledge first.");
//       return;
//     }

//     const totalToPay =
//       (pledgeDetails?.bank_loan_amount || pledgeDetails?.loan_amount || 0) +
//       (parseFloat(bankInterest) || 0);

//     if (bankSettleMethod !== "CASH" && !bankSettleReference.trim()) {
//       alert(`Please enter the ${bankSettleMethod} reference number.`);
//       return;
//     }
//     if (bankSettleMethod === "CASH") {
//       const denomTotal = calcDenomTotal(bankSettleDenominations);
//       if (denomTotal === 0) {
//         alert("Please enter denominations.");
//         return;
//       }
//       if (Math.abs(denomTotal - totalToPay) > 0.01) {
//         alert(
//           `Denomination total (₹${denomTotal.toFixed(2)}) does not match Total to Pay Bank (₹${totalToPay.toFixed(2)}).`
//         );
//         return;
//       }
//     }

//     setConfirmModal({
//       message: `Pay ₹${totalToPay.toLocaleString()} to bank and close pledge?\n\nThis action cannot be undone.`,
//       onConfirm: async () => {
//         setConfirmModal(null);
//         try {
//           setLoading(true);
//           await unmapBankFromPledge({
//         mappingId:       pledgeDetails.bank_mapping_id,
//         pledgeId:        pledgeDetails.pledge_id,
//         customerPayment: totalToPay,
//         bankRepayment:   totalToPay,
//         bankInterest:    Number(bankInterest || 0),
//         customerInterest: 0,
//         paymentMethod:   bankSettleMethod,
//         referenceNumber: bankSettleMethod !== "CASH" ? bankSettleReference : null,
//         // ✅ Convert object → array for Rust backend
//         denominations:   bankSettleMethod === "CASH" ? denomObjectToArray(bankSettleDenominations) : null,
//         actorUserId:     user.user_id,
//       });

//           alert(`✅ Bank Unmapping & Closure Successful!\n\nTotal Paid: ₹${totalToPay.toLocaleString()}`);
//           cancelPledge();
//         } catch (err) {
//           alert("Unmapping failed: " + err);
//           console.error(err);
//         } finally {
//           setLoading(false);
//         }
//       },
//     });
//   };

//   // ── Derived: denom match status ───────────────────────────────────────────
//   const mapDenomTotal   = calcDenomTotal(mapDenominations);
//   const mapDenomMatched =
//     mapDenomTotal > 0 &&
//     Math.abs(mapDenomTotal - parseFloat(actualReceived || 0)) < 0.01;

//   const totalToPayBank =
//     (pledgeDetails?.bank_loan_amount || pledgeDetails?.loan_amount || 0) +
//     (parseFloat(bankInterest) || 0);

//   const bankSettleDenomTotal = calcDenomTotal(bankSettleDenominations);  // ✅ declared here
//   const bankSettleMatched    =
//     bankSettleDenomTotal > 0 &&
//     Math.abs(bankSettleDenomTotal - totalToPayBank) < 0.01;

//   // ─────────────────────────────────────────────────────────────────────────
//   return (
//     <div className="mapping-container">
//       <header className="mapping-header">
//         <div className="title-group">
//           <div className="icon-wrapper">
//             <Link2 className="icon-main" />
//           </div>
//           <div>
//             <h1>Bank Mapping &amp; Unmapping</h1>
//             <p>Manage bank-backed pledges with complete fund tracking.</p>
//           </div>
//         </div>
//       </header>

//       {/* ── SEARCH SECTION ── */}
//       <div className="mapping-card">
//         <div className="card-section-title">
//           <Search size={18} /> Search Pledge
//         </div>
//         <div className="search-section">
//           <div className="input-group">
//             <label>
//               <Fingerprint size={14} /> Pledge Number <span className="req">*</span>
//             </label>
//             <div className="search-input-group" style={{ position: "relative" }}>
//               <input
//                 type="text"
//                 placeholder="Type pledge number to search..."
//                 value={pledgeNumber}
//                 onChange={(e) => {
//                   const val = e.target.value;
//                   setPledgeNumber(val);
//                   if (val.trim().length < 3) {
//                     setPledgeDetails(null);
//                     setSearchResults([]);
//                     setMode(null);
//                     setPledgeConfirmed(false);
//                   }
//                 }}
//                 onKeyDown={(e) => e.key === "Enter" && searchPledge()}
//                 disabled={pledgeConfirmed}
//               />
//               <button
//                 className="search-btn"
//                 onClick={searchPledge}
//                 disabled={searching || pledgeConfirmed}
//               >
//                 {searching ? "Searching..." : "Search"}
//               </button>

//               {/* ── Dropdown results ── */}
//               {searchResults.length > 0 && !pledgeConfirmed && (
//                 <div
//                   style={{
//                     position: "absolute", top: "100%", left: 0, right: "90px",
//                     background: "#fff", border: "1px solid #e2e8f0",
//                     borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
//                     zIndex: 100, maxHeight: "260px", overflowY: "auto",
//                   }}
//                 >
//                   {searchResults.map((r) => (
//                     <div
//                       key={r.pledge_id}
//                       onClick={() => {
//                         setPledgeNumber(r.pledge_no);
//                         setPledgeDetails(r);
//                         setSearchResults([]);
//                         setPledgeConfirmed(false);
//                         setMode(r.is_bank_mapped ? "unmap" : "map");
//                       }}
//                       style={{
//                         padding: "10px 14px", cursor: "pointer",
//                         borderBottom: "1px solid #f1f5f9",
//                         display: "flex", justifyContent: "space-between", alignItems: "center",
//                       }}
//                       onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
//                       onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
//                     >
//                       <div>
//                         <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "#1e293b" }}>
//                           {r.pledge_no}
//                         </div>
//                         <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
//                           {r.customer_name} · ₹{r.loan_amount.toLocaleString()}
//                         </div>
//                       </div>
//                       {r.is_bank_mapped && (
//                         <span
//                           style={{
//                             fontSize: "0.7rem", background: "#fef3c7", color: "#d97706",
//                             padding: "2px 8px", borderRadius: "20px", fontWeight: "600",
//                           }}
//                         >
//                           Bank Mapped
//                         </span>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ── Pledge Details Card ── */}
//         {pledgeDetails && (
//           <div className={`pledge-details-card ${pledgeConfirmed ? "confirmed" : ""}`}>
//             <div className="details-header">
//               <h3>Pledge Details</h3>
//               <div style={{ display: "flex", gap: "0.5rem" }}>
//                 {pledgeDetails.is_bank_mapped && (
//                   <span className="status-badge warning">
//                     <AlertTriangle size={16} /> Bank Mapped
//                   </span>
//                 )}
//                 {pledgeConfirmed ? (
//                   <span className="status-badge confirmed">
//                     <CheckCircle2 size={16} /> Confirmed
//                   </span>
//                 ) : (
//                   <span className="status-badge pending">
//                     <AlertCircle size={16} /> Pending
//                   </span>
//                 )}
//               </div>
//             </div>

//             <div className="details-grid">
//               <div className="detail-item">
//                 <User size={16} />
//                 <div>
//                   <span className="label">Customer Name</span>
//                   <span className="value">{pledgeDetails.customer_name}</span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <Fingerprint size={16} />
//                 <div>
//                   <span className="label">Pledge Number</span>
//                   <span className="value">{pledgeDetails.pledge_no}</span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <IndianRupee size={16} />
//                 <div>
//                   <span className="label">Loan Amount</span>
//                   <span className="value loan-amt">
//                     ₹{pledgeDetails.loan_amount.toFixed(2)}
//                   </span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <Calendar size={16} />
//                 <div>
//                   <span className="label">Created</span>
//                   <span className="value">{pledgeDetails.created_at}</span>
//                 </div>
//               </div>
//             </div>

//             {/* ── Bank Mapped Amount (only when already mapped) ── */}
//             {pledgeDetails.is_bank_mapped && pledgeDetails.bank_loan_amount && (
//               <div
//                 style={{
//                   marginTop: "12px", background: "#fff7ed",
//                   border: "1px solid #fed7aa", borderRadius: "8px",
//                   padding: "12px 16px", display: "flex",
//                   alignItems: "center", justifyContent: "space-between",
//                 }}
//               >
//                 <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                   <Landmark size={16} style={{ color: "#d97706" }} />
//                   <span style={{ fontWeight: "600", color: "#92400e", fontSize: "0.9rem" }}>
//                     Bank Mapped Amount
//                   </span>
//                 </div>
//                 <span style={{ fontWeight: "800", fontSize: "1.1rem", color: "#b45309" }}>
//                   ₹{pledgeDetails.bank_loan_amount.toLocaleString()}
//                 </span>
//               </div>
//             )}

//             {!pledgeConfirmed && (
//               <div className="details-actions">
//                 <button className="btn-cancel" onClick={cancelPledge}>
//                   <XCircle size={16} /> Cancel
//                 </button>
//                 <button className="btn-confirm" onClick={confirmPledge}>
//                   <CheckCircle2 size={16} /> Confirm &amp; Continue
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* ── BANK MAPPING FORM ── */}
//       {pledgeConfirmed && mode === "map" && (
//         <div className="mapping-card">
//           <div className="card-section-title">
//             <ShieldCheck size={18} /> Bank Mapping Details
//           </div>

//           <div className="mapping-grid">
//             <div className="input-group">
//               <label>
//                 <Landmark size={14} /> Bank <span className="req">*</span>
//               </label>
//               <select value={bankId} onChange={(e) => setBankId(e.target.value)}>
//                 <option value="">Select Bank</option>
//                 {banks.map((b) => (
//                   <option key={b.id} value={b.id}>
//                     {b.bank_name} - {b.account_number.slice(-4)}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="input-group">
//               <label>
//                 <IndianRupee size={14} /> Bank Loan Amount <span className="req">*</span>
//               </label>
//               <input
//                 type="number" step="0.01" placeholder="Amount bank agreed"
//                 value={bankLoanAmount} onChange={(e) => setBankLoanAmount(e.target.value)}
//               />
//             </div>
//             <div className="input-group">
//               <label>
//                 <IndianRupee size={14} /> Actual Received <span className="req">*</span>
//               </label>
//               <input
//                 type="number" step="0.01" placeholder="Amount actually received"
//                 value={actualReceived} onChange={(e) => setActualReceived(e.target.value)}
//               />
//             </div>
//             <div className="input-group">
//               <label><ReceiptText size={14} /> Bank Charges</label>
//               <input
//                 type="number" step="0.01" placeholder="0.00"
//                 value={bankCharges} onChange={(e) => setBankCharges(e.target.value)}
//               />
//             </div>
//             <div className="input-group">
//               <label>
//                 <Wallet size={14} /> Payment Method <span className="req">*</span>
//               </label>
//               <select
//                 value={paymentMethod}
//                 onChange={(e) => {
//                   setPaymentMethod(e.target.value);
//                   setMapReference("");
//                   setMapDenominations({ ...emptyDenominations });
//                 }}
//               >
//                 <option value="CASH">Cash</option>
//                 <option value="UPI">UPI</option>
//                 <option value="BANK">Bank Transfer</option>
//               </select>
//             </div>
//           </div>

//           {paymentMethod === "CASH" ? (
//             <CashDenominations
//               denominations={mapDenominations}
//               onChange={setMapDenominations}
//               label="Note Breakup (Received)"
//             />
//           ) : (
//             <ReferenceInput
//               method={paymentMethod}
//               value={mapReference}
//               onChange={setMapReference}
//             />
//           )}

//           {actualReceived && pledgeDetails && (
//             <div className="calculation-summary">
//               <div className="calc-row">
//                 <span>Actual Received:</span>
//                 <span>₹{parseFloat(actualReceived).toFixed(2)}</span>
//               </div>
//               <div className="calc-row">
//                 <span>Bank Charges:</span>
//                 <span className="negative">- ₹{parseFloat(bankCharges || 0).toFixed(2)}</span>
//               </div>
//               <div className="calc-row divider">
//                 <span><strong>Net Received:</strong></span>
//                 <span className="net-amount"><strong>₹{calculateNetReceived().toFixed(2)}</strong></span>
//               </div>
//               <div className="calc-row">
//                 <span>Customer Loan Amount:</span>
//                 <span>₹{pledgeDetails.loan_amount.toFixed(2)}</span>
//               </div>
//               {paymentMethod === "CASH" && (
//                 <div className="calc-row">
//                   <span>Denomination Total:</span>
//                   <span className={mapDenomMatched ? "positive" : "negative"}>
//                     ₹{mapDenomTotal.toFixed(2)}{" "}
//                     {mapDenomMatched ? "✅ Matched" : "❌ Must match Actual Received"}
//                   </span>
//                 </div>
//               )}
//               {Math.abs(calculateDifference()) > 0.01 && (
//                 <div className={`calc-row ${isSurplus() ? "surplus" : "deficit"}`}>
//                   <span>
//                     <strong>
//                       {isSurplus() ? (
//                         <><TrendingUp size={16} /> Surplus (You Get)</>
//                       ) : (
//                         <><TrendingDown size={16} /> Deficit (You Add)</>
//                       )}:
//                     </strong>
//                   </span>
//                   <span className={isSurplus() ? "surplus-amt" : "deficit-amt"}>
//                     <strong>₹{Math.abs(calculateDifference()).toFixed(2)}</strong>
//                     <span className="method-badge">{paymentMethod}</span>
//                   </span>
//                 </div>
//               )}
//             </div>
//           )}

//           <div className="mapping-footer">
//             <div className="footer-actions">
//               <button className="btn-secondary" onClick={cancelPledge}>Cancel</button>
//               <button
//                 className="submit-btn"
//                 onClick={submitMapping}
//                 disabled={loading || (paymentMethod === "CASH" && !mapDenomMatched)}
//               >
//                 {loading ? "Processing..." : "Confirm Bank Mapping"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── BANK UNMAPPING FORM ── */}
//       {pledgeConfirmed && mode === "unmap" && (
//         <div className="mapping-card">
//           <div className="card-section-title">
//             <ShieldCheck size={18} /> Unmap &amp; Retrieve Gold
//           </div>

//           {/* ── Total to Pay Bank (big red box) ── */}
//           <div className="unmap-total-box">
//             <div className="unmap-total-label">🔒 TOTAL TO PAY BANK:</div>
//             <div className="unmap-total-amount">
//               ₹{totalToPayBank.toLocaleString()}
//             </div>
//             <div className="unmap-total-sub">
//               Principal: ₹{(
//                 pledgeDetails?.bank_loan_amount || pledgeDetails?.loan_amount || 0
//               ).toLocaleString()}
//               {parseFloat(bankInterest) > 0 &&
//                 ` + Interest: ₹${parseFloat(bankInterest).toLocaleString()}`}
//             </div>
//           </div>

//           {/* ── Interest/Charges input ── */}
//           <div className="input-group" style={{ marginTop: "20px" }}>
//             <label><ReceiptText size={14} /> Interest/Charges Paid to Bank</label>
//             <input
//               type="number"
//               step="0.01"
//               placeholder="0"
//               value={bankInterest}
//               onChange={(e) => setBankInterest(e.target.value)}
//             />
//             <small>
//               Principal: ₹{(
//                 pledgeDetails?.bank_loan_amount || pledgeDetails?.loan_amount || 0
//               ).toLocaleString()}
//               {parseFloat(bankInterest) > 0
//                 ? ` + Interest: ₹${parseFloat(bankInterest).toLocaleString()}`
//                 : " + Interest: (enter above)"}
//             </small>
//           </div>

//           {/* ── Settlement Method ── */}
//           <div className="input-group" style={{ marginTop: "16px" }}>
//             <label><Wallet size={14} /> Settlement Method</label>
//             <select
//               value={bankSettleMethod}
//               onChange={(e) => {
//                 setBankSettleMethod(e.target.value);
//                 setBankSettleReference("");
//                 setBankSettleDenominations({ ...emptyDenominations });
//               }}
//             >
//               <option value="CASH">Cash from Drawer</option>
//               <option value="UPI">UPI</option>
//               <option value="BANK">Bank Transfer</option>
//             </select>
//           </div>

//           {/* ── Cash: denomination grid ── */}
//           {bankSettleMethod === "CASH" && (
//             <>
//               <CashDenominations
//                 denominations={bankSettleDenominations}
//                 onChange={setBankSettleDenominations}
//                 label="Note Breakup (Paying Bank)"
//               />
//               <div
//                 className={`denom-match-status ${bankSettleMatched ? "matched" : "unmatched"}`}
//                 style={{ marginTop: "10px" }}
//               >
//                 {bankSettleMatched
//                   ? `✅ Count: ₹${bankSettleDenomTotal.toLocaleString()} — Matched`
//                   : `❌ Count: ₹${bankSettleDenomTotal.toLocaleString()} — Must match ₹${totalToPayBank.toLocaleString()}`}
//               </div>
//             </>
//           )}

//           {/* ── UPI/Bank: reference number ── */}
//           {bankSettleMethod !== "CASH" && (
//             <ReferenceInput
//               method={bankSettleMethod}
//               value={bankSettleReference}
//               onChange={setBankSettleReference}
//             />
//           )}

//           <div className="mapping-footer">
//             <div className="footer-actions">
//               <button className="btn-secondary" onClick={cancelPledge}>Cancel</button>
//               <button
//                 className="submit-btn danger"
//                 onClick={submitUnmapping}
//                 disabled={
//                   loading ||
//                   (bankSettleMethod === "CASH" && !bankSettleMatched) ||
//                   (bankSettleMethod !== "CASH" && !bankSettleReference.trim())
//                 }
//               >
//                 {loading
//                   ? "Processing..."
//                   : `Pay ₹${totalToPayBank.toLocaleString()} & Close Pledge`}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {/* ── Inline Confirm Modal (replaces window.confirm for Tauri) ── */}
//       {confirmModal && (
//         <div style={{
//           position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
//           display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
//         }}>
//           <div style={{
//             background: "#fff", borderRadius: "12px", padding: "28px 32px",
//             maxWidth: "400px", width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
//           }}>
//             <p style={{
//               margin: "0 0 24px", fontSize: "0.95rem", color: "#1e293b",
//               lineHeight: "1.6", whiteSpace: "pre-line"
//             }}>
//               {confirmModal.message}
//             </p>
//             <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
//               <button
//                 onClick={() => setConfirmModal(null)}
//                 style={{
//                   padding: "8px 20px", borderRadius: "8px", border: "1px solid #e2e8f0",
//                   background: "#f8fafc", cursor: "pointer", fontWeight: "600", color: "#64748b"
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmModal.onConfirm}
//                 style={{
//                   padding: "8px 20px", borderRadius: "8px", border: "none",
//                   background: "#2563eb", color: "#fff", cursor: "pointer",
//                   fontWeight: "600", fontSize: "0.95rem"
//                 }}
//               >
//                 OK
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { getBanks } from "../services/bankApi";
import { 
  getPledgeByNumber, 
  mapBankToPledge,
  unmapBankFromPledge,
  searchPledgesForMapping
} from "../services/bankMappingApi";
import { 
  Link2, 
  Fingerprint, 
  Landmark, 
  IndianRupee, 
  ReceiptText, 
  ShieldCheck, 
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Hash
} from "lucide-react";
import "./bankMapping.css";

// ─── Helper: convert {500: 2, 100: 3} → [{denomination:500,quantity:2}, ...] ──
// Backend expects Vec<DenominationEntry> not a plain object
const denomObjectToArray = (denomObj) =>
  Object.entries(denomObj)
    .map(([d, qty]) => ({ denomination: Number(d), quantity: Number(qty) }))
    .filter((e) => e.quantity > 0);

// ─── Cash Denominations Component ────────────────────────────────────────────
function CashDenominations({ denominations, onChange, label = "Note Breakup" }) {
  const denoms = [500, 200, 100, 50, 20, 10];
  const total = denoms.reduce((sum, d) => sum + d * (denominations[d] || 0), 0);

  return (
    <div className="denom-section">
      <div className="denom-section-header">
        <span>{label}</span>
        {total > 0 && (
          <span className="denom-count-label">Count: ₹{total.toLocaleString()}</span>
        )}
      </div>
      <div className="denom-grid">
        {denoms.map((d) => (
          <div key={d} className="denom-item">
            <span className="denom-label">₹{d}</span>
            <input
              type="number"
              min="0"
              className="denom-input"
              value={denominations[d] || 0}
              onChange={(e) =>
                onChange({
                  ...denominations,
                  [d]: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reference Number Input Component ────────────────────────────────────────
function ReferenceInput({ method, value, onChange }) {
  return (
    <div className="input-group" style={{ marginTop: "12px" }}>
      <label>
        <Hash size={14} />{" "}
        {method === "UPI" ? "UPI" : "Bank Transfer"} Reference Number{" "}
        <span className="req">*</span>
      </label>
      <input
        type="text"
        placeholder={
          method === "UPI"
            ? "Enter UPI Transaction ID / UTR number"
            : "Enter Bank Transfer reference / UTR number"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="reference-input"
      />
      <small>
        {method === "UPI"
          ? "12-digit UPI transaction reference"
          : "NEFT / IMPS / RTGS UTR number"}
      </small>
    </div>
  );
}

// ─── Default denomination state ───────────────────────────────────────────────
const emptyDenominations = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 };

// ─── Helper: calculate denom total ───────────────────────────────────────────
const calcDenomTotal = (denoms) =>
  Object.entries(denoms).reduce((sum, [d, qty]) => sum + Number(d) * qty, 0);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BankMappingPage() {
  const user = useAuthStore((s) => s.user);

  const [banks, setBanks] = useState([]);
  const [pledgeNumber, setPledgeNumber] = useState("");
  const [pledgeDetails, setPledgeDetails] = useState(null);
  const [pledgeConfirmed, setPledgeConfirmed] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // ── Mapping fields ──
  const [bankId, setBankId] = useState("");
  const [bankLoanAmount, setBankLoanAmount] = useState("");
  const [actualReceived, setActualReceived] = useState("");
  const [bankCharges, setBankCharges] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [mapDenominations, setMapDenominations] = useState({ ...emptyDenominations });
  const [mapReference, setMapReference] = useState("");

  // ── Unmapping fields ──
  const [bankInterest, setBankInterest] = useState("");
  const [bankSettleMethod, setBankSettleMethod] = useState("CASH");
  const [bankSettleDenominations, setBankSettleDenominations] = useState({ ...emptyDenominations });
  const [bankSettleReference, setBankSettleReference] = useState("");

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // {message, onConfirm}

  useEffect(() => {
    getBanks().then(setBanks);
  }, []);

  // ── Debounced live search ─────────────────────────────────────────────────
  useEffect(() => {
    if (pledgeNumber.trim().length < 3 || pledgeConfirmed || pledgeDetails) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await searchPledgesForMapping(pledgeNumber.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [pledgeNumber, pledgeConfirmed]);

  const searchPledge = async () => {
    if (!pledgeNumber.trim()) {
      alert("Please enter a pledge number");
      return;
    }
    try {
      setSearching(true);
      const details = await getPledgeByNumber(pledgeNumber);
      setPledgeDetails(details);
      setSearchResults([]);
      setPledgeConfirmed(false);
      setMode(details.is_bank_mapped ? "unmap" : "map");
    } catch {
      alert("Pledge not found. Please check the pledge number.");
      setPledgeDetails(null);
      setPledgeConfirmed(false);
      setMode(null);
    } finally {
      setSearching(false);
    }
  };

  const confirmPledge = () => setPledgeConfirmed(true);

  const cancelPledge = () => {
    setPledgeDetails(null);
    setPledgeConfirmed(false);
    setPledgeNumber("");
    setSearchResults([]);
    setBankId("");
    setBankLoanAmount("");
    setActualReceived("");
    setBankCharges("");
    setPaymentMethod("CASH");
    setMapDenominations({ ...emptyDenominations });
    setMapReference("");
    setBankInterest("");
    setBankSettleMethod("CASH");
    setBankSettleDenominations({ ...emptyDenominations });
    setBankSettleReference("");
    setMode(null);
  };

  // ── Mapping calculations ──────────────────────────────────────────────────
  const calculateNetReceived = () => {
    const received = parseFloat(actualReceived) || 0;
    const charges  = parseFloat(bankCharges)    || 0;
    return received - charges;
  };

  const calculateDifference = () => {
    if (!pledgeDetails) return 0;
    return calculateNetReceived() - pledgeDetails.loan_amount;
  };

  const isSurplus = () => calculateDifference() > 0;

  // ── Submit Mapping ────────────────────────────────────────────────────────
  const submitMapping = async () => {
    if (!pledgeConfirmed || !bankId || !bankLoanAmount || !actualReceived) {
      alert("Please fill in all required fields and confirm the pledge.");
      return;
    }
    if (paymentMethod !== "CASH" && !mapReference.trim()) {
      alert(`Please enter the ${paymentMethod} reference number.`);
      return;
    }
    if (paymentMethod === "CASH") {
      const denomTotal = calcDenomTotal(mapDenominations);
      if (denomTotal === 0) {
        alert("Please enter cash denominations before confirming.");
        return;
      }
      if (Math.abs(denomTotal - parseFloat(actualReceived)) > 0.01) {
        alert(
          `Cash denomination total (₹${denomTotal.toFixed(2)}) does not match Actual Received (₹${parseFloat(actualReceived).toFixed(2)}).\n\nPlease fix the denominations before continuing.`
        );
        return;
      }
    }

    const difference  = calculateDifference();
    const netReceived = calculateNetReceived();
    const confirmMsg  = isSurplus()
      ? `Bank gave MORE than needed.\n\nSURPLUS of ₹${difference.toFixed(2)} via ${paymentMethod}.\n\nContinue?`
      : difference < 0
      ? `Bank gave LESS than needed.\n\nDEFICIT of ₹${Math.abs(difference).toFixed(2)} via ${paymentMethod}.\n\nContinue?`
      : `Exact match. No surplus or deficit.\n\nContinue?`;

    setConfirmModal({
      message: confirmMsg,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          setLoading(true);
          await mapBankToPledge({
        pledgeId:        pledgeDetails.pledge_id,
        bankId:          Number(bankId),
        bankLoanAmount:  Number(bankLoanAmount),
        actualReceived:  Number(actualReceived),
        bankCharges:     Number(bankCharges || 0),
        paymentMethod,
        referenceNumber: paymentMethod !== "CASH" ? mapReference : null,
        // ✅ Convert object → array for Rust backend
        denominations:   paymentMethod === "CASH" ? denomObjectToArray(mapDenominations) : null,
        actorUserId:     user.user_id,
      });

          alert(
            `✅ Bank Mapping Successful!\n\nNet Received: ₹${netReceived.toFixed(2)}\n${
              isSurplus()
                ? `Surplus: +₹${difference.toFixed(2)}`
                : difference < 0
                ? `Deficit: -₹${Math.abs(difference).toFixed(2)}`
                : "Exact Match"
            }`
          );
          cancelPledge();
        } catch (err) {
          alert("Mapping failed. Please try again.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // ── Submit Unmapping ──────────────────────────────────────────────────────
  const submitUnmapping = async () => {
    if (!pledgeConfirmed) {
      alert("Please confirm the pledge first.");
      return;
    }

    const totalToPay =
      (pledgeDetails?.bank_loan_amount || pledgeDetails?.loan_amount || 0) +
      (parseFloat(bankInterest) || 0);

    if (bankSettleMethod !== "CASH" && !bankSettleReference.trim()) {
      alert(`Please enter the ${bankSettleMethod} reference number.`);
      return;
    }
    if (bankSettleMethod === "CASH") {
      const denomTotal = calcDenomTotal(bankSettleDenominations);
      if (denomTotal === 0) {
        alert("Please enter denominations.");
        return;
      }
      if (Math.abs(denomTotal - totalToPay) > 0.01) {
        alert(
          `Denomination total (₹${denomTotal.toFixed(2)}) does not match Total to Pay Bank (₹${totalToPay.toFixed(2)}).`
        );
        return;
      }
    }

    setConfirmModal({
      message: `Pay ₹${totalToPay.toLocaleString()} to bank and close pledge?\n\nThis action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          setLoading(true);
          await unmapBankFromPledge({
        mappingId:       pledgeDetails.bank_mapping_id,
        pledgeId:        pledgeDetails.pledge_id,
        customerPayment: totalToPay,
        bankRepayment:   totalToPay,
        bankInterest:    Number(bankInterest || 0),
        customerInterest: 0,
        paymentMethod:   bankSettleMethod,
        referenceNumber: bankSettleMethod !== "CASH" ? bankSettleReference : null,
        // ✅ Convert object → array for Rust backend
        denominations:   bankSettleMethod === "CASH" ? denomObjectToArray(bankSettleDenominations) : null,
        actorUserId:     user.user_id,
      });

          alert(`✅ Bank Unmapping & Closure Successful!\n\nTotal Paid: ₹${totalToPay.toLocaleString()}`);
          cancelPledge();
        } catch (err) {
          alert("Unmapping failed: " + err);
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // ── Derived: denom match status ───────────────────────────────────────────
  const mapDenomTotal   = calcDenomTotal(mapDenominations);
  const mapDenomMatched =
    mapDenomTotal > 0 &&
    Math.abs(mapDenomTotal - parseFloat(actualReceived || 0)) < 0.01;

  const totalToPayBank =
    (pledgeDetails?.bank_loan_amount || pledgeDetails?.loan_amount || 0) +
    (parseFloat(bankInterest) || 0);

  const bankSettleDenomTotal = calcDenomTotal(bankSettleDenominations);  // ✅ declared here
  const bankSettleMatched    =
    bankSettleDenomTotal > 0 &&
    Math.abs(bankSettleDenomTotal - totalToPayBank) < 0.01;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="mapping-container">
      <header className="mapping-header">
        <div className="title-group">
          <div className="icon-wrapper">
            <Link2 className="icon-main" />
          </div>
          <div>
            <h1>Bank Mapping &amp; Unmapping</h1>
            <p>Manage bank-backed pledges with complete fund tracking.</p>
          </div>
        </div>
      </header>

      {/* ── SEARCH SECTION ── */}
      <div className="mapping-card">
        <div className="card-section-title">
          <Search size={18} /> Search Pledge
        </div>
        <div className="search-section">
          <div className="input-group">
            <label>
              <Fingerprint size={14} /> Pledge Number <span className="req">*</span>
            </label>
            <div className="search-input-group" style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Type pledge number to search..."
                value={pledgeNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  setPledgeNumber(val);
                  // Any typing = clear current selection so live search re-activates
                  setPledgeDetails(null);
                  setMode(null);
                  setPledgeConfirmed(false);
                  if (val.trim().length < 3) {
                    setSearchResults([]);
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && searchPledge()}
                disabled={pledgeConfirmed}
              />
              <button
                className="search-btn"
                onClick={searchPledge}
                disabled={searching || pledgeConfirmed}
              >
                {searching ? "Searching..." : "Search"}
              </button>

              {/* ── Dropdown results ── */}
              {searchResults.length > 0 && !pledgeConfirmed && (
                <div
                  style={{
                    position: "absolute", top: "100%", left: 0, right: "90px",
                    background: "#fff", border: "1px solid #e2e8f0",
                    borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    zIndex: 100, maxHeight: "260px", overflowY: "auto",
                  }}
                >
                  {searchResults.map((r) => (
                    <div
                      key={r.pledge_id}
                      onClick={() => {
                        setPledgeNumber(r.pledge_no);
                        setPledgeDetails(r);
                        setSearchResults([]);
                        setPledgeConfirmed(false);
                        setMode(r.is_bank_mapped ? "unmap" : "map");
                      }}
                      style={{
                        padding: "10px 14px", cursor: "pointer",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    >
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "#1e293b" }}>
                          {r.pledge_no}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {r.customer_name} · ₹{r.loan_amount.toLocaleString()}
                        </div>
                      </div>
                      {r.is_bank_mapped && (
                        <span
                          style={{
                            fontSize: "0.7rem", background: "#fef3c7", color: "#d97706",
                            padding: "2px 8px", borderRadius: "20px", fontWeight: "600",
                          }}
                        >
                          Bank Mapped
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Pledge Details Card ── */}
        {pledgeDetails && (
          <div className={`pledge-details-card ${pledgeConfirmed ? "confirmed" : ""}`}>
            <div className="details-header">
              <h3>Pledge Details</h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {pledgeDetails.is_bank_mapped && (
                  <span className="status-badge warning">
                    <AlertTriangle size={16} /> Bank Mapped
                  </span>
                )}
                {pledgeConfirmed ? (
                  <span className="status-badge confirmed">
                    <CheckCircle2 size={16} /> Confirmed
                  </span>
                ) : (
                  <span className="status-badge pending">
                    <AlertCircle size={16} /> Pending
                  </span>
                )}
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <User size={16} />
                <div>
                  <span className="label">Customer Name</span>
                  <span className="value">{pledgeDetails.customer_name}</span>
                </div>
              </div>
              <div className="detail-item">
                <Fingerprint size={16} />
                <div>
                  <span className="label">Pledge Number</span>
                  <span className="value">{pledgeDetails.pledge_no}</span>
                </div>
              </div>
              <div className="detail-item">
                <IndianRupee size={16} />
                <div>
                  <span className="label">Loan Amount</span>
                  <span className="value loan-amt">
                    ₹{pledgeDetails.loan_amount.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <Calendar size={16} />
                <div>
                  <span className="label">Created</span>
                  <span className="value">{pledgeDetails.created_at}</span>
                </div>
              </div>
            </div>

            {/* ── Bank Mapped Amount (only when already mapped) ── */}
            {pledgeDetails.is_bank_mapped && pledgeDetails.bank_loan_amount && (
              <div
                style={{
                  marginTop: "12px", background: "#fff7ed",
                  border: "1px solid #fed7aa", borderRadius: "8px",
                  padding: "12px 16px", display: "flex",
                  alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Landmark size={16} style={{ color: "#d97706" }} />
                  <span style={{ fontWeight: "600", color: "#92400e", fontSize: "0.9rem" }}>
                    Bank Mapped Amount
                  </span>
                </div>
                <span style={{ fontWeight: "800", fontSize: "1.1rem", color: "#b45309" }}>
                  ₹{pledgeDetails.bank_loan_amount.toLocaleString()}
                </span>
              </div>
            )}

            {!pledgeConfirmed && (
              <div className="details-actions">
                <button className="btn-cancel" onClick={cancelPledge}>
                  <XCircle size={16} /> Cancel
                </button>
                <button className="btn-confirm" onClick={confirmPledge}>
                  <CheckCircle2 size={16} /> Confirm &amp; Continue
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BANK MAPPING FORM ── */}
      {pledgeConfirmed && mode === "map" && (
        <div className="mapping-card">
          <div className="card-section-title">
            <ShieldCheck size={18} /> Bank Mapping Details
          </div>

          <div className="mapping-grid">
            <div className="input-group">
              <label>
                <Landmark size={14} /> Bank <span className="req">*</span>
              </label>
              <select value={bankId} onChange={(e) => setBankId(e.target.value)}>
                <option value="">Select Bank</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bank_name} - {b.account_number.slice(-4)}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>
                <IndianRupee size={14} /> Bank Loan Amount <span className="req">*</span>
              </label>
              <input
                type="number" step="0.01" placeholder="Amount bank agreed"
                value={bankLoanAmount} onChange={(e) => setBankLoanAmount(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>
                <IndianRupee size={14} /> Actual Received <span className="req">*</span>
              </label>
              <input
                type="number" step="0.01" placeholder="Amount actually received"
                value={actualReceived} onChange={(e) => setActualReceived(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label><ReceiptText size={14} /> Bank Charges</label>
              <input
                type="number" step="0.01" placeholder="0.00"
                value={bankCharges} onChange={(e) => setBankCharges(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>
                <Wallet size={14} /> Payment Method <span className="req">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setMapReference("");
                  setMapDenominations({ ...emptyDenominations });
                }}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK">Bank Transfer</option>
              </select>
            </div>
          </div>

          {paymentMethod === "CASH" ? (
            <CashDenominations
              denominations={mapDenominations}
              onChange={setMapDenominations}
              label="Note Breakup (Received)"
            />
          ) : (
            <ReferenceInput
              method={paymentMethod}
              value={mapReference}
              onChange={setMapReference}
            />
          )}

          {actualReceived && pledgeDetails && (
            <div className="calculation-summary">
              <div className="calc-row">
                <span>Actual Received:</span>
                <span>₹{parseFloat(actualReceived).toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>Bank Charges:</span>
                <span className="negative">- ₹{parseFloat(bankCharges || 0).toFixed(2)}</span>
              </div>
              <div className="calc-row divider">
                <span><strong>Net Received:</strong></span>
                <span className="net-amount"><strong>₹{calculateNetReceived().toFixed(2)}</strong></span>
              </div>
              <div className="calc-row">
                <span>Customer Loan Amount:</span>
                <span>₹{pledgeDetails.loan_amount.toFixed(2)}</span>
              </div>
              {paymentMethod === "CASH" && (
                <div className="calc-row">
                  <span>Denomination Total:</span>
                  <span className={mapDenomMatched ? "positive" : "negative"}>
                    ₹{mapDenomTotal.toFixed(2)}{" "}
                    {mapDenomMatched ? "✅ Matched" : "❌ Must match Actual Received"}
                  </span>
                </div>
              )}
              {Math.abs(calculateDifference()) > 0.01 && (
                <div className={`calc-row ${isSurplus() ? "surplus" : "deficit"}`}>
                  <span>
                    <strong>
                      {isSurplus() ? (
                        <><TrendingUp size={16} /> Surplus (You Get)</>
                      ) : (
                        <><TrendingDown size={16} /> Deficit (You Add)</>
                      )}:
                    </strong>
                  </span>
                  <span className={isSurplus() ? "surplus-amt" : "deficit-amt"}>
                    <strong>₹{Math.abs(calculateDifference()).toFixed(2)}</strong>
                    <span className="method-badge">{paymentMethod}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mapping-footer">
            <div className="footer-actions">
              <button className="btn-secondary" onClick={cancelPledge}>Cancel</button>
              <button
                className="submit-btn"
                onClick={submitMapping}
                disabled={loading || (paymentMethod === "CASH" && !mapDenomMatched)}
              >
                {loading ? "Processing..." : "Confirm Bank Mapping"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BANK UNMAPPING FORM ── */}
      {pledgeConfirmed && mode === "unmap" && (
        <div className="mapping-card">
          <div className="card-section-title">
            <ShieldCheck size={18} /> Unmap &amp; Retrieve Gold
          </div>

          {/* ── Total to Pay Bank (big red box) ── */}
          <div className="unmap-total-box">
            <div className="unmap-total-label">🔒 TOTAL TO PAY BANK:</div>
            <div className="unmap-total-amount">
              ₹{totalToPayBank.toLocaleString()}
            </div>
            <div className="unmap-total-sub">
              Principal: ₹{(
                pledgeDetails?.bank_loan_amount || pledgeDetails?.loan_amount || 0
              ).toLocaleString()}
              {parseFloat(bankInterest) > 0 &&
                ` + Interest: ₹${parseFloat(bankInterest).toLocaleString()}`}
            </div>
          </div>

          {/* ── Interest/Charges input ── */}
          <div className="input-group" style={{ marginTop: "20px" }}>
            <label><ReceiptText size={14} /> Interest/Charges Paid to Bank</label>
            <input
              type="number"
              step="0.01"
              placeholder="0"
              value={bankInterest}
              onChange={(e) => setBankInterest(e.target.value)}
            />
            <small>
              Principal: ₹{(
                pledgeDetails?.bank_loan_amount || pledgeDetails?.loan_amount || 0
              ).toLocaleString()}
              {parseFloat(bankInterest) > 0
                ? ` + Interest: ₹${parseFloat(bankInterest).toLocaleString()}`
                : " + Interest: (enter above)"}
            </small>
          </div>

          {/* ── Settlement Method ── */}
          <div className="input-group" style={{ marginTop: "16px" }}>
            <label><Wallet size={14} /> Settlement Method</label>
            <select
              value={bankSettleMethod}
              onChange={(e) => {
                setBankSettleMethod(e.target.value);
                setBankSettleReference("");
                setBankSettleDenominations({ ...emptyDenominations });
              }}
            >
              <option value="CASH">Cash from Drawer</option>
              <option value="UPI">UPI</option>
              <option value="BANK">Bank Transfer</option>
            </select>
          </div>

          {/* ── Cash: denomination grid ── */}
          {bankSettleMethod === "CASH" && (
            <>
              <CashDenominations
                denominations={bankSettleDenominations}
                onChange={setBankSettleDenominations}
                label="Note Breakup (Paying Bank)"
              />
              <div
                className={`denom-match-status ${bankSettleMatched ? "matched" : "unmatched"}`}
                style={{ marginTop: "10px" }}
              >
                {bankSettleMatched
                  ? `✅ Count: ₹${bankSettleDenomTotal.toLocaleString()} — Matched`
                  : `❌ Count: ₹${bankSettleDenomTotal.toLocaleString()} — Must match ₹${totalToPayBank.toLocaleString()}`}
              </div>
            </>
          )}

          {/* ── UPI/Bank: reference number ── */}
          {bankSettleMethod !== "CASH" && (
            <ReferenceInput
              method={bankSettleMethod}
              value={bankSettleReference}
              onChange={setBankSettleReference}
            />
          )}

          <div className="mapping-footer">
            <div className="footer-actions">
              <button className="btn-secondary" onClick={cancelPledge}>Cancel</button>
              <button
                className="submit-btn danger"
                onClick={submitUnmapping}
                disabled={
                  loading ||
                  (bankSettleMethod === "CASH" && !bankSettleMatched) ||
                  (bankSettleMethod !== "CASH" && !bankSettleReference.trim())
                }
              >
                {loading
                  ? "Processing..."
                  : `Pay ₹${totalToPayBank.toLocaleString()} & Close Pledge`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Inline Confirm Modal (replaces window.confirm for Tauri) ── */}
      {confirmModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{
            background: "#fff", borderRadius: "12px", padding: "28px 32px",
            maxWidth: "400px", width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
          }}>
            <p style={{
              margin: "0 0 24px", fontSize: "0.95rem", color: "#1e293b",
              lineHeight: "1.6", whiteSpace: "pre-line"
            }}>
              {confirmModal.message}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: "8px 20px", borderRadius: "8px", border: "1px solid #e2e8f0",
                  background: "#f8fafc", cursor: "pointer", fontWeight: "600", color: "#64748b"
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{
                  padding: "8px 20px", borderRadius: "8px", border: "none",
                  background: "#2563eb", color: "#fff", cursor: "pointer",
                  fontWeight: "600", fontSize: "0.95rem"
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}