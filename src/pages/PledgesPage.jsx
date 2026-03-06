
// import { useState, useEffect} from "react";
// import { searchCustomers } from "../services/customerApi";
// import { getSchemes } from "../services/schemesApi";
// import { getJewelleryTypes } from "../services/jewelleryTypesApi";
// import { getPrices } from "../services/pricePerGramApi";
// import { getMetalTypes } from "../services/metalTypesApi"; 
// import { createPledge } from "../services/pledgeApi";
// import CameraModal from "../components/CameraModal"; 
// import "./pledge.css";
// import { Search, User, UserPlus, Trash2, Plus, Camera } from "lucide-react";
// import { convertFileSrc } from "@tauri-apps/api/core";
// import { FaPhoneAlt } from "react-icons/fa";
// import { autoFillDenominations } from "../utils/cashDenominationManager";


// export default function PledgesPage({ user,setActiveMenu }) {
//   // --- STATE ---
//   const [masterData, setMasterData] = useState({
//     schemes: [], jewelleryTypes: [], prices: [], metalTypes: [] 
//   });

//   const [customer, setCustomer] = useState(() => {
//     const stored = localStorage.getItem("selectedCustomerForPledge");
  
//     if (stored) {
//       localStorage.removeItem("selectedCustomerForPledge");
//       return JSON.parse(stored);
//     }
  
//     return null;
//   });
  
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [feeOptions, setFeeOptions] = useState([]);
//   // Loan Details
//   const [loanInfo, setLoanInfo] = useState({
//     loanType: "", schemeId: "", interestRate: 0, 
//     duration: 12, pricePerGram: 0, metalTypeId: 0 ,
//     processingFeeType: "", processingFeeValue: 0, requestedLoan: 0
//   });

//   const [items, setItems] = useState([]);
//   const [activeCameraItemId, setActiveCameraItemId] = useState(null);
//   const [paymentMethod, setPaymentMethod] = useState("CASH");
//   const [transactionRef, setTransactionRef] = useState("");
//   const [denominations, setDenominations] = useState({
//       // Notes
//      500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
//     });

//   // --- LOADING MASTER DATA ---
//   useEffect(() => {
//     Promise.all([
//       getSchemes(), getJewelleryTypes(), getPrices(), getMetalTypes()
//     ]).then(([schemes, jTypes, prices, metals]) => {
//       setMasterData({ schemes, jewelleryTypes: jTypes, prices, metalTypes: metals });
//     }).catch(console.error);
   
//   }, []);

  
//   // --- HELPERS (Search, Loan Logic, Calc) ---
//   const handleSearch = async (query) => {
//     // If the user clears the input, clear the results and stop
//     if (!query || query.trim() === "") {
//       setSearchResults([]);
//       return;
//     }
  
//     try {
//       const res = await searchCustomers(query);
//       setSearchResults(res);
//     } catch (err) {
//       console.error("Search error:", err);
//     }
//   };
  

//   const selectCustomer = (c) => {
//     setCustomer(c); setSearchResults([]); setSearchQuery("");
//   };

//   const handleLoanTypeChange = (e) => {
//     const selectedMetalName = e.target.value;
//     const selectedMetal = masterData.metalTypes.find(m => m.name === selectedMetalName);
//     setLoanInfo({
//         ...loanInfo, loanType: selectedMetalName, metalTypeId: selectedMetal ? selectedMetal.id : 0,
//         schemeId: "", interestRate: 0, pricePerGram: 0
//     });
//   };

//   const handleSchemeChange = (schemeId) => {
//     const scheme = masterData.schemes.find(
//       s => s.id === Number(schemeId)
//     );
//     if (!scheme) return;
  
//     const options = [
//       { type: "MANUAL", label: "Manual" },
//       { type: "PERCENT", label: "Percentage" },
//       { type: "FLAT", label: "Flat" }
//     ];
    
//     setFeeOptions(options);
  
//     const priceObj = masterData.prices.find(
//       p => p.metal_name === scheme.metal_name
//     );
//     const currentPrice = priceObj
//       ? priceObj.price_per_gram
//       : 0;
  
//     setLoanInfo({
//       ...loanInfo,
//       schemeId: scheme.id,
//       interestRate: scheme.interest_rate,
//       duration: 12,
//       pricePerGram: currentPrice,
//       metalTypeId: scheme.metal_type_id,
//       loanPercentage: scheme.loan_percentage,
//       processingFeeType: scheme.processing_fee_type || "MANUAL",
//       processingFeeValue: scheme.processing_fee_value || 0,
//       requestedLoan: 0
//     });
  
//     recalcAll(items, currentPrice);
//   };
  

//   const addItem = () => {
//     setItems([
//       ...items,
//       {
//         id: Date.now(),
//         jewellery_type_id: "",
//         purity: "22K",
//         gross: 0,
//         net: 0,
//         value: 0,
//         img: null
//       }
//     ]);
//   };

//   const updateItem = (id, field, value) => {
//     const newItems = items.map(item => {
//       if (item.id !== id) return item;
//       const updated = { ...item, [field]: value };
//       if (field === 'gross') updated.net = value;
//       if (field === 'gross' || field === 'net') {
//         updated.value = Number(updated.net) * loanInfo.pricePerGram;
//       }
//       return updated;
//     });
//     setItems(newItems);
//   };

//   const recalcAll = (currentItems, price) => {
//     const updated = currentItems.map(i => ({ ...i, value: Number(i.net) * price }));
//     setItems(updated);
//   };

//   const removeItem = (id) => setItems(items.filter(i => i.id !== id));

//   // ✅ CAMERA HANDLER
//   const handlePhotoCaptured = (base64Image) => {
//     if (activeCameraItemId) {
//       updateItem(activeCameraItemId, 'img', base64Image);
//       setActiveCameraItemId(null); // Close modal
//     }
//   };

//   // --- TOTALS ---
//   const totalNetWt = items.reduce((sum, i) => sum + Number(i.net || 0), 0);
//   const totalGrossWt = items.reduce((sum, i) => sum + Number(i.gross || 0), 0);
//   const totalValue = items.reduce((sum, i) => sum + i.value, 0);
//   const totalCash = Object.entries(denominations).reduce(
//     (sum, [note, count]) => sum + Number(note) * Number(count),
//     0
//   );
//   const selectedScheme = masterData.schemes.find(s => s.id === Number(loanInfo.schemeId));
//   const loanPct = selectedScheme ? selectedScheme.loan_percentage : 70;
// const eligibleLoan = Math.floor(totalValue * (loanPct / 100));

// const finalLoan =
//   loanInfo.requestedLoan > 0
//     ? loanInfo.requestedLoan
//     : eligibleLoan;

// // Interest calculated on final loan
// const interestAmt = Math.floor(
//   finalLoan * (loanInfo.interestRate / 100)
// );

// // Processing fee calculation
// let processingFeeAmount = 0;

// if (loanInfo.processingFeeType === "PERCENT") {
//   processingFeeAmount = Math.floor(
//     finalLoan * (loanInfo.processingFeeValue / 100)
//   );
// } else if (loanInfo.processingFeeType === "FLAT") {
//   processingFeeAmount = Math.floor(loanInfo.processingFeeValue || 0);
// } else {
//   // MANUAL
//   processingFeeAmount = Math.floor(loanInfo.processingFeeValue || 0);
// }


// // Net disbursed
// const netDisbursed = Math.max(
//   finalLoan - interestAmt - processingFeeAmount,
//   0
// );

// // Warning condition
// const isOverLimit =
//   loanInfo.requestedLoan > 0 &&
//   loanInfo.requestedLoan > eligibleLoan;

//   const updateDenomination = (note, value) => {
//     setDenominations({
//       ...denominations,
//       [note]: Number(value)
//     });
//   };

  
//   // --- SAVE ---
//   const handleSave = async () => {
//     if (!customer) return alert("Select Customer");
//     if (!loanInfo.schemeId) return alert("Select Scheme");
//     if (items.length === 0) return alert("Add Items");

//     const payload = {
//         customer_id: customer.id,
//         scheme_name: selectedScheme.scheme_name,
//         loan_type: loanInfo.loanType,
//         interest_rate: loanInfo.interestRate,
//         duration_months: loanInfo.duration,
//         price_per_gram: loanInfo.pricePerGram,
//         loan_amount: finalLoan,
//         created_by: user.user_id || user.id,


//         payment_method: paymentMethod,
//         transaction_ref:
//         paymentMethod === "CASH" ? null : transactionRef,
//         denominations: paymentMethod === "CASH"
//         ? denominations : null,

//         processing_fee_amount: processingFeeAmount,
//         first_interest_amount: interestAmt,


//         items: items.map(i => ({
//           jewellery_type_id: i.jewellery_type_id,
//           purity: i.purity,
//           gross_weight: Number(i.gross),
//           net_weight: Number(i.net),
//           item_value: i.value,
//           image_base64: i.img
//       }))
//     };

//     try {
//         console.log(payload);

//         const pledgeNo = await createPledge(payload);
//         alert(`Success! Pledge No: ${pledgeNo}`);
//         setCustomer(null);
//         setItems([]);
//         setFeeOptions([]);
        
//         setLoanInfo({
//           loanType: "",
//           schemeId: "",
//           interestRate: 0,
//           duration: 12,
//           pricePerGram: 0,
//           metalTypeId: 0,
//           processingFeeType: "",
//           processingFeeValue: 0,
//           requestedLoan: 0
//         });
//             } catch (e) { alert("Error: " + e); }
//   };

//   // Add this logic before your return statement
// const isPaymentMatched = paymentMethod === "CASH" 
// ? Math.round(totalCash) === Math.round(netDisbursed)
// : transactionRef.trim().length > 0;

// const canSave = !isOverLimit && isPaymentMatched;


// const handleAutoFill = async () => {
//   const response = await autoFillDenominations(netDisbursed);

//   if (!response.success) {
//     alert("Not enough cash in drawer.");
//     return;
//   }

//   setDenominations(response.denominations);
// };


//   return (
//     <div className="pledge-layout">
//       {/* --- CAMERA MODAL --- */}
//       {activeCameraItemId && (
//         <CameraModal 
//           onCapture={handlePhotoCaptured} 
//           onClose={() => setActiveCameraItemId(null)} 
//         />
//       )}

//       <div className="left-section">
//         {/* 1. CUSTOMER */}

//         <div className="pledge-card">
//           <div className="card-title">Customer Details</div>
//           {!customer ? (
//             <>
//               {/* Search Row */}
//               <div className="customer-search-container">
//               <div className={`search-input-wrapper ${searchQuery ? 'hide-icon' : ''}`}>
//               <Search className="search-icon-inner" size={18} />
//               <input
//                 className="form-input-clean"
//                 placeholder="Search by phone or name"
//                 value={searchQuery}
//                 onChange={(e) => {
//                   const val = e.target.value;
//                   setSearchQuery(val);
//                   handleSearch(val);
//                 }}
//                 onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
//               />

//                     {searchQuery && (
//                       <div className="search-results-dropdown">
//                         {searchResults.length > 0 ? (
//                           searchResults.map((c) => (
//                             <div
//                               key={c.id}
//                               className="search-item"
//                               onClick={() => selectCustomer(c)}
//                             >
//                               <div className="search-item-info">
//                                 <span className="search-item-name">{c.name}</span>
//                                 <span className="search-item-phone">{c.phone}</span>
//                               </div>
//                             </div>
//                           ))
//                         ) : (
//                           <div
//                             className="search-item no-result"
//                             style={{
//                               textAlign: "center",
//                               color: "#2563eb",
//                               fontWeight: "600",
//                               cursor: "pointer"
//                             }}
//                             onClick={() => {
//                               // 🔹 Store return page
//                               localStorage.setItem("returnTo", "pledges");

//                               // 🔹 Prefill phone for new customer
//                               localStorage.setItem(
//                                 "prefillCustomer",
//                                 JSON.stringify({ phone: searchQuery })
//                               );

//                               setActiveMenu("customers");
//                             }}
//                           >
//                             No customer found. Click here to add customer
//                           </div>
//                         )}
//                       </div>
//                     )}


//                 </div>

//                 <button
//                   className="btn-outline-primary"
//                   onClick={() => {
//                     localStorage.setItem("returnTo", "pledges");
//                     localStorage.removeItem("editCustomer"); // make sure fresh form
//                     setActiveMenu("customers");
//                   }}
//                 >
//                   <UserPlus size={16} /> Add New Customer
//                 </button>

//               </div>

//               {/* Empty State */}
//               <div className="customer-empty-state">
//                 <div className="empty-icon-wrapper">
//                   <User size={36} />
//                 </div>
//                 <p>Search and select a customer to continue</p>
//               </div>
//             </>
//           ) : (
//             /* Selected Customer Card */
//             <div className="customer-selected-card">
//                 {/* Left Section: Identity & Relations */}
//                 <div className="card-column-left">
//                   <div className="profile-top-row">
//                     <div className="customer-avatar-box">
//                       {customer.photo_path ? (
//                         <img src={convertFileSrc(customer.photo_path)} alt="customer" />
//                       ) : (
//                         <div className="avatar-placeholder">{customer.name.charAt(0)}</div>
//                       )}
//                     </div>
//                     <div className="identity-details">
//                     {/* 🔹 Customer Code Badge */}
                    
//                     <h4 className="customer-display-name">
//                       {customer.name}
//                     </h4>
//                     <div className="customer-code-badge">
//                       {customer.customer_code}
//                     </div>
//                     <p className="customer-relation">
//                       {customer.relation || "Self"}
//                     </p>

//                     <p className="customer-phone">
//                       <FaPhoneAlt /> {customer.phone}
//                     </p>
//                   </div>

//                   </div>
//                   <div className="pledge-count-box">
//                     <span className="pledge-label">Total Pledges of this Customer</span>
//                     <span className="pledge-value">{customer.visit_count ?? 0}</span>

//                   </div>
//                 </div>

//                 {/* Vertical Divider */}
//                 <div className="card-divider"></div>

//                 {/* Right Section: Address & Admin */}
//                 <div className="card-column-right">
//                   <div className="info-group">
//                     <label> Address</label>
//                     <p className="info-text"> {customer.address || "No address provided"}</p>
//                   </div>
                  
//                   <div className="info-group">
//                     <label>ID Proof</label>
//                     <p className="info-text">
//                       {customer.id_proof_type || "Aadhar"}: {customer.id_proof_number || "XXXX-XXXX-1234"}
//                     </p>
//                   </div>

//                   <div className="card-actions-row">
//                   <button
//                     className="btn-edit-link"
//                     onClick={() => {
//                       // store selected customer temporarily
//                       localStorage.setItem("editCustomer", JSON.stringify(customer));
//                       localStorage.setItem("returnTo", "pledges");
//                       setActiveMenu("customers");
//                     }}
//                   >
//                     Edit Profile
//                   </button>
//                                       <button className="btn-change-link" onClick={() => setCustomer(null)}>Change</button>
//                   </div>
//                 </div>
//               </div>
//           )}
//         </div>

//         {/* 2. LOAN INFO */}
//         <div className="pledge-card">
//             <div className="card-title">Loan Information</div>
//             <div className="form-grid">
//                 <div className="form-group">
//                   <label className="field-label">Loan Type</label>
//                   <select 
//                   className="form-select-clean" 
//                   value={loanInfo.loanType} 
//                   onChange={handleLoanTypeChange}>
//                     <option value="">Select</option>{masterData.metalTypes.map(m => <option key={m.id} value={m.name}>{m.name} Loan</option>)}
//                     </select>
//                     </div>
//                 <div className="form-group">
//                         <label className="field-label">Scheme</label>
//                         <select 
//                           className="form-select-clean" 
//                           value={loanInfo.schemeId} 
//                           onChange={(e) => handleSchemeChange(e.target.value)}
//                         >
//                           <option value="">Select</option>
//                           {/* Only filter and map if a metalTypeId is actually selected */}
//                           {loanInfo.metalTypeId > 0 && masterData.schemes
//                             .filter(s => s.metal_type_id === loanInfo.metalTypeId)
//                             .map(s => (
//                               <option key={s.id} value={s.id}>
//                                 {s.scheme_name}
//                               </option>
//                             ))
//                           }
//                         </select>
//                       </div>
//                 <div className="form-group"><label>Interest Rate</label><input className="form-input" disabled value={`${loanInfo.interestRate}%`} /></div>
//                 <div className="form-group"><label>Duration</label><input className="form-input" disabled value={`${loanInfo.duration} Months`} /></div>
//                 <div className="form-group"><label>Price/Gram</label><input className="form-input" disabled value={`₹ ${loanInfo.pricePerGram}`} /></div>
//                 <div className="form-group"><label>Loan %</label><input className="form-input" disabled value={`${loanInfo.loanPercentage || 0}%`} /></div>
//             </div>
//         </div>

//         {/* 3. ITEMS */}
//         <div className="pledge-card">
//             <div className="card-title">Pledged Jewellery</div>
//             <table className="pledge-table">
//                 <thead>
//                     <tr>
//                         <th width="20%">Type</th><th width="15%">Purity</th><th width="15%">Gross(g)</th><th width="15%">Net(g)</th><th width="10%">Image</th><th width="20%">Value</th><th></th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {items.map(item => (
//                         <tr key={item.id}>
//                             <td><select
//   className="form-select-clean"
//   value={item.jewellery_type_id}
//   onChange={(e) =>
//     updateItem(item.id, 'jewellery_type_id', Number(e.target.value))
//   }
// >
//   <option value="">Select</option>
//   {masterData.jewelleryTypes
//     .filter(t =>
//       loanInfo.metalTypeId
//         ? t.metal_type_id === loanInfo.metalTypeId
//         : true
//     )
//     .map(t => (
//       <option key={t.id} value={t.id}>
//         {t.name}
//       </option>
//     ))
//   }
// </select></td>
//                             <td><select className="form-select-clean" value={item.purity} onChange={(e) => updateItem(item.id, 'purity', e.target.value)}><option>22K</option><option>24K</option><option>18K</option><option>925</option></select></td>
//                             <td><input type="number" className="form-input" value={item.gross} onChange={(e) => updateItem(item.id, 'gross', e.target.value)} /></td>
//                             <td><input type="number" className="form-input" value={item.net} onChange={(e) => updateItem(item.id, 'net', e.target.value)} /></td>
                            
//                             {/* ✅ IMAGE CLICK TRIGGERS CAMERA */}
//                             <td style={{textAlign:'center'}}>
//                                 <div 
//                                     onClick={() => setActiveCameraItemId(item.id)} 
//                                     style={{cursor:'pointer', display:'flex', justifyContent:'center'}}
//                                 >
//                                     {item.img ? (
//                                         <img src={item.img} alt="item" className="image-preview-thumb" />
//                                     ) : (
//                                         <Camera size={20} className="text-gray-400 hover:text-blue-500"/>
//                                     )}
//                                 </div>
//                             </td>

//                             <td>₹ {item.value.toFixed(0)}</td>
//                             <td><button style={{color:'red', border:'none', background:'none', cursor:'pointer'}} onClick={() => removeItem(item.id)}><Trash2 size={16}/></button></td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//             <div className="add-item-row">
//                 <button className="btn btn-secondary" style={{width:'100%', borderStyle:'dashed', display:'flex', justifyContent:'center', alignItems:'center', gap:'5px'}} onClick={addItem}>
//                     <Plus size={16}/> Add Item
//                 </button>
//             </div>
//             <div className="items-summary-bar">
//                 <div className="mini-stat"><span className="mini-stat-label">Total Items:</span><span className="mini-stat-value">{items.length}</span></div>
//                 <div className="stat-divider"></div>
//                 <div className="mini-stat"><span className="mini-stat-label">Total Gross Wt:</span><span className="mini-stat-value">{totalGrossWt.toFixed(2)} g</span></div>
//                 <div className="stat-divider"></div>
//                 <div className="mini-stat"><span className="mini-stat-label">Total Net Wt:</span><span className="mini-stat-value">{totalNetWt.toFixed(2)} g</span></div>
//             </div>
//         </div>
//         {/* 4. LOAN DETAILS */}
//             <div className="pledge-card">
//               <div className="card-title">Loan Details</div>

//               <div className="form-grid">

//                 {/* Processing Fee Type */}
//                 <div className="form-group">
//                   <label className="field-label">Processing Fee</label>
//                   <select className="form-select-clean" value={loanInfo.processingFeeType}
//                       onChange={(e) =>
//                         setLoanInfo({
//                           ...loanInfo,
//                           processingFeeType: e.target.value,
//                           processingFeeValue: 0 // reset when type changes
//                         })
//                       }
//                     >
//                       <option value="">Select</option>
//                       {feeOptions.map((opt, idx) => (
//                         <option key={idx} value={opt.type}>
//                           {opt.label}
//                         </option>
//                       ))}
//                     </select>
//                 </div>

//                 {/* Fee Value */}
//                 <div className="form-group">
//                   <label className="field-label">Fee Value</label>
//                   <input type="number" className="form-input" value={loanInfo.processingFeeValue}
//                   onChange={(e) =>
//                     setLoanInfo({
//                       ...loanInfo,
//                       processingFeeValue: Number(e.target.value)
//                     })
//                   }
//                 />

//                 </div>

//                 {/* Eligible Loan */}
//                 <div className="form-group">
//                   <label className="field-label">Eligible Loan</label>
//                   <input
//                     className="form-input"
//                     disabled
//                     value={`₹ ${eligibleLoan.toLocaleString()}`}
//                   />
//                 </div>

//                 {/* Requested Loan */}
//                 <div className="form-group">
//                   <label className="field-label">Requested Loan</label>
//                   <input type="number" className="form-input" value={loanInfo.requestedLoan}
//                     onChange={(e) => setLoanInfo({ ...loanInfo, requestedLoan: Number(e.target.value) })}
//                     placeholder="Enter amount"
//                   />
//                   {isOverLimit && ( <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
//                       Requested loan exceeds eligible limit
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>

//       </div>
//       {/* RIGHT SECTION (STICKY) */}
//       <div className="summary-panel">
//          <div className="summary-header">Calculation Summary</div>
//          <div className="summary-body">
//           <div className="summary-row">
//             <span>Total Net Weight</span>
//             <strong>{totalNetWt.toFixed(2)} g</strong>
//           </div>

//           <div className="summary-row">
//             <span>Total Value</span>
//             <strong>₹ {totalValue.toLocaleString()}</strong>
//           </div>
//           <div className="summary-row">
//             <span>Eligible Loan</span>
//             <strong>₹ {eligibleLoan.toLocaleString()}</strong>
//           </div>

//           <hr />

          

//           <div className="summary-row">
//             <span>Requested Loan</span>
//             <strong>₹ {finalLoan.toLocaleString()}</strong>
//           </div>

//           <div className="summary-row">
//             <span>Interest</span>
//             <strong>₹ {interestAmt.toLocaleString()}</strong>
//           </div>

//           <div className="summary-row">
//             <span>Processing Fee</span>
//             <strong>₹ {processingFeeAmount.toLocaleString()}</strong>
//           </div>

//           <hr />

//           <div className="total-highlight">
//             <label>Net Disbursed</label>
//             <span>₹ {netDisbursed.toLocaleString()}</span>
//           </div>

//           <hr />

//           <div style={{ 
//   marginTop: "20px", 
//   padding: "16px", 
//   backgroundColor: "#f9fafb", 
//   borderRadius: "12px", 
//   border: "1px solid #e5e7eb" 
// }}>
//   <label style={{
//     fontWeight: "700",
//     fontSize: "14px",
//     display: "block",
//     marginBottom: "12px",
//     color: "#1f2937",
//     textTransform: "uppercase",
//     letterSpacing: "0.5px"
//   }}>
//     Payment Method
//   </label>


// {/* Method Selector */}
// <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
//   {["CASH", "UPI", "BANK"].map((method) => (
//     <button
//       key={method}
//       className="btn"
//       style={{
//         flex: 1,
//         padding: "10px 0",
//         cursor: "pointer",
//         borderRadius: "8px",
//         fontWeight: "600",
//         transition: "all 0.2s ease",
//         background: paymentMethod === method ? "#3b82f6" : "#fff",
//         color: paymentMethod === method ? "#fff" : "#4b5563",
//         border: paymentMethod === method ? "1px solid #2563eb" : "1px solid #d1d5db",
//       }}
//       onClick={() => setPaymentMethod(method)}
//     >
//       {method}
//     </button>
//   ))}
// </div>

// {/* AUTOFILL BUTTON - Only shows for Cash */}
// {paymentMethod === "CASH" && (
//   <button
//     onClick={handleAutoFill}
//     style={{
//       width: "100%",
//       marginBottom: "16px",
//       padding: "8px",
//       background: "#eff6ff",
//       color: "#1d4ed8",
//       border: "1px dashed #3b82f6",
//       borderRadius: "6px",
//       fontSize: "12px",
//       fontWeight: "700",
//       cursor: "pointer"
//     }}
//   >
//     ✨ AUTO-FILL CASH (₹{netDisbursed.toLocaleString()})
//   </button>
// )}


// {/* CASH DENOMINATIONS LIST */}
// {paymentMethod === "CASH" && (
//   <div style={{ 
//     background: "#fff", 
//     padding: "12px", 
//     borderRadius: "8px", 
//     border: "1px solid #e5e7eb" 
//   }}>
//     {Object.keys(denominations).sort((a, b) => b - a).map((note) => (
//       <div key={note} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
//         <span style={{ fontSize: "14px", color: "#374151" }}>₹ {note}</span>
//         <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//           <span style={{ fontSize: "12px", color: "#9ca3af" }}>x</span>
//           <input 
//             type="number" 
//             style={{ width: "60px", padding: "4px", textAlign: "right", borderRadius: "4px", border: "1px solid #d1d5db" }} 
//             value={denominations[note] || ""} 
//             onChange={(e) => updateDenomination(note, e.target.value)} 
//           />
//         </div>
//       </div>
//     ))}
    
//     {/* MATCH STATUS INDICATOR */}
//     <div style={{
//       marginTop: "10px",
//       padding: "8px",
//       fontSize: "12px",
//       borderRadius: "6px",
//       textAlign: "center",
//       background: totalCash === netDisbursed ? "#ecfdf5" : "#fff1f2",
//       color: totalCash === netDisbursed ? "#059669" : "#e11d48",
//       border: `1px solid ${totalCash === netDisbursed ? "#10b981" : "#f43f5e"}`
//     }}>
//       {totalCash === netDisbursed 
//         ? "✅ Cash Matches Disbursed Amount" 
//         : `Difference: ₹${(totalCash - netDisbursed).toLocaleString()}`}
//     </div>
//   </div>
// )}

//   {/* UPI / BANK */}
//   {(paymentMethod === "UPI" || paymentMethod === "BANK") && (
//     <div style={{ marginTop: "4px" }}>
//       <input 
//         type="text" 
//         className="form-input" 
//         placeholder={`Enter ${paymentMethod} transaction reference`}
//         style={{ 
//           width: "100%", 
//           padding: "10px 12px", 
//           borderRadius: "8px", 
//           border: "1px solid #d1d5db",
//           boxSizing: "border-box",
//           outlineColor: "#3b82f6"
//         }} 
//         value={transactionRef} 
//         onChange={(e) => setTransactionRef(e.target.value)}
//       />
//     </div>
//   )}
// </div>

// <div className="action-area">
//   <button
//     className="btn btn-primary"
//     onClick={handleSave}
//     disabled={!canSave} // Button is disabled if payment isn't matched
//     style={{
//       width: "100%",
//       cursor: canSave ? "pointer" : "not-allowed",
//       opacity: canSave ? 1 : 0.6,
//       backgroundColor: canSave ? "#10b981" : "#9ca3af", // Turns Green when matched
//     }}
//   >
//     {paymentMethod === "CASH" && !isPaymentMatched 
//       ? `Need ₹${(netDisbursed - totalCash).toLocaleString()} more` 
//       : "Save Pledge"}
//   </button>
//   <button className="btn btn-secondary" style={{ width: "100%", marginTop: "8px" }}>
//     Cancel
//   </button>
// </div>
//         </div>

//       </div>
//     </div>
//   );
// }









import { useState, useEffect } from "react";
import { searchCustomers } from "../services/customerApi";
import { getSchemes } from "../services/schemesApi";
import { getJewelleryTypes } from "../services/jewelleryTypesApi";
import { getPrices } from "../services/pricePerGramApi";
import { getMetalTypes } from "../services/metalTypesApi";
import { createPledge } from "../services/pledgeApi";
import CameraModal from "../components/CameraModal";
import PledgePrintModal from "../components/print/PledgePrintModal";
import "./pledge.css";
import { Search, User, UserPlus, Trash2, Plus, Camera } from "lucide-react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { FaPhoneAlt } from "react-icons/fa";
import { autoFillDenominations } from "../utils/cashDenominationManager";

export default function PledgesPage({ user, setActiveMenu }) {
  // ── Master Data ────────────────────────────────────────────────────────────
  const [masterData, setMasterData] = useState({
    schemes: [], jewelleryTypes: [], prices: [], metalTypes: [],
  });

  // ── Customer ───────────────────────────────────────────────────────────────
  const [customer, setCustomer] = useState(() => {
    const stored = localStorage.getItem("selectedCustomerForPledge");
    if (stored) {
      localStorage.removeItem("selectedCustomerForPledge");
      return JSON.parse(stored);
    }
    return null;
  });

  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // ── Loan / Scheme ──────────────────────────────────────────────────────────
  const [feeOptions, setFeeOptions] = useState([]);
  const [loanInfo, setLoanInfo] = useState({
    loanType: "", schemeId: "", interestRate: 0,
    duration: 12, pricePerGram: 0, metalTypeId: 0,
    processingFeeType: "", processingFeeValue: 0, requestedLoan: 0,
  });

  // ── Items ──────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [activeCameraItemId, setActiveCameraItemId] = useState(null);

  // ── Payment ────────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [transactionRef, setTransactionRef] = useState("");
  const [denominations, setDenominations] = useState({
    500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0,
  });

  // ── Print modal ────────────────────────────────────────────────────────────
  const [printData, setPrintData]     = useState(null);
  const [shopSettings, setShopSettings] = useState(null);

  // ── Load master data on mount ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getSchemes(), getJewelleryTypes(), getPrices(), getMetalTypes(),
    ]).then(([schemes, jTypes, prices, metals]) => {
      setMasterData({ schemes, jewelleryTypes: jTypes, prices, metalTypes: metals });
    }).catch(console.error);
  }, []);

  // ── Load shop settings for receipt ────────────────────────────────────────
  useEffect(() => {
    invoke("get_shop_settings").then(setShopSettings).catch(console.error);
  }, []);

  // ── Customer search ────────────────────────────────────────────────────────
  const handleSearch = async (query) => {
    if (!query || query.trim() === "") { setSearchResults([]); return; }
    try {
      const res = await searchCustomers(query);
      setSearchResults(res);
    } catch (err) { console.error("Search error:", err); }
  };

  const selectCustomer = (c) => {
    setCustomer(c); setSearchResults([]); setSearchQuery("");
  };

  // ── Loan helpers ───────────────────────────────────────────────────────────
  const handleLoanTypeChange = (e) => {
    const selectedMetalName = e.target.value;
    const selectedMetal = masterData.metalTypes.find(m => m.name === selectedMetalName);
    setLoanInfo({
      ...loanInfo,
      loanType: selectedMetalName,
      metalTypeId: selectedMetal ? selectedMetal.id : 0,
      schemeId: "", interestRate: 0, pricePerGram: 0,
    });
  };

  const handleSchemeChange = (schemeId) => {
    const scheme = masterData.schemes.find(s => s.id === Number(schemeId));
    if (!scheme) return;

    setFeeOptions([
      { type: "MANUAL",  label: "Manual" },
      { type: "PERCENT", label: "Percentage" },
      { type: "FLAT",    label: "Flat" },
    ]);

    const priceObj = masterData.prices.find(p => p.metal_name === scheme.metal_name);
    const currentPrice = priceObj ? priceObj.price_per_gram : 0;

    setLoanInfo({
      ...loanInfo,
      schemeId:           scheme.id,
      interestRate:       scheme.interest_rate,
      duration:           12,
      pricePerGram:       currentPrice,
      metalTypeId:        scheme.metal_type_id,
      loanPercentage:     scheme.loan_percentage,
      processingFeeType:  scheme.processing_fee_type || "MANUAL",
      processingFeeValue: scheme.processing_fee_value || 0,
      requestedLoan:      0,
    });

    recalcAll(items, currentPrice);
  };

  // ── Item helpers ───────────────────────────────────────────────────────────
  const addItem = () => {
    setItems([...items, {
      id: Date.now(), jewellery_type_id: "",
      purity: "22K", gross: 0, net: 0, value: 0, img: null,
    }]);
  };

  const updateItem = (id, field, value) => {
    const newItems = items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === "gross") updated.net = value;
      if (field === "gross" || field === "net") {
        updated.value = Number(updated.net) * loanInfo.pricePerGram;
      }
      return updated;
    });
    setItems(newItems);
  };

  const recalcAll = (currentItems, price) => {
    setItems(currentItems.map(i => ({ ...i, value: Number(i.net) * price })));
  };

  const removeItem = (id) => setItems(items.filter(i => i.id !== id));

  const handlePhotoCaptured = (base64Image) => {
    if (activeCameraItemId) {
      updateItem(activeCameraItemId, "img", base64Image);
      setActiveCameraItemId(null);
    }
  };

  // ── Denomination helpers ───────────────────────────────────────────────────
  const updateDenomination = (note, value) => {
    setDenominations({ ...denominations, [note]: Number(value) });
  };

  const handleAutoFill = async () => {
    const response = await autoFillDenominations(netDisbursed);
    if (!response.success) { alert("Not enough cash in drawer."); return; }
    setDenominations(response.denominations);
  };

  // ── Calculations ───────────────────────────────────────────────────────────
  const totalNetWt   = items.reduce((sum, i) => sum + Number(i.net   || 0), 0);
  const totalGrossWt = items.reduce((sum, i) => sum + Number(i.gross || 0), 0);
  const totalValue   = items.reduce((sum, i) => sum + i.value, 0);
  const totalCash    = Object.entries(denominations).reduce(
    (sum, [note, count]) => sum + Number(note) * Number(count), 0
  );

  const selectedScheme = masterData.schemes.find(s => s.id === Number(loanInfo.schemeId));
  const loanPct        = selectedScheme ? selectedScheme.loan_percentage : 70;
  const eligibleLoan   = Math.floor(totalValue * (loanPct / 100));
  const finalLoan      = loanInfo.requestedLoan > 0 ? loanInfo.requestedLoan : eligibleLoan;
  const interestAmt    = Math.floor(finalLoan * (loanInfo.interestRate / 100));

  let processingFeeAmount = 0;
  if (loanInfo.processingFeeType === "PERCENT") {
    processingFeeAmount = Math.floor(finalLoan * (loanInfo.processingFeeValue / 100));
  } else {
    processingFeeAmount = Math.floor(loanInfo.processingFeeValue || 0);
  }

  const netDisbursed = Math.max(finalLoan - interestAmt - processingFeeAmount, 0);
  const isOverLimit  = loanInfo.requestedLoan > 0 && loanInfo.requestedLoan > eligibleLoan;

  const isPaymentMatched = paymentMethod === "CASH"
    ? Math.round(totalCash) === Math.round(netDisbursed)
    : transactionRef.trim().length > 0;

  const canSave = !isOverLimit && isPaymentMatched;

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setCustomer(null);
    setItems([]);
    setFeeOptions([]);
    setLoanInfo({
      loanType: "", schemeId: "", interestRate: 0,
      duration: 12, pricePerGram: 0, metalTypeId: 0,
      processingFeeType: "", processingFeeValue: 0, requestedLoan: 0,
    });
    setDenominations({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 });
    setTransactionRef("");
    setPaymentMethod("CASH");
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!customer)          return alert("Select Customer");
    if (!loanInfo.schemeId) return alert("Select Scheme");
    if (items.length === 0) return alert("Add Items");

    const payload = {
      customer_id:           customer.id,
      scheme_name:           selectedScheme.scheme_name,
      loan_type:             loanInfo.loanType,
      interest_rate:         loanInfo.interestRate,
      duration_months:       loanInfo.duration,
      price_per_gram:        loanInfo.pricePerGram,
      loan_amount:           finalLoan,
      created_by:            user.user_id || user.id,
      payment_method:        paymentMethod,
      transaction_ref:       paymentMethod === "CASH" ? null : transactionRef,
      denominations:         paymentMethod === "CASH" ? denominations : null,
      processing_fee_amount: processingFeeAmount,
      first_interest_amount: interestAmt,
      items: items.map(i => ({
        jewellery_type_id: i.jewellery_type_id,
        purity:            i.purity,
        gross_weight:      Number(i.gross),
        net_weight:        Number(i.net),
        item_value:        i.value,
        image_base64:      i.img,
      })),
    };

    try {
      const pledgeNo = await createPledge(payload);

      // Enrich items with type names for the receipt
      const enrichedItems = items.map(item => ({
        ...item,
        _typeName: masterData.jewelleryTypes.find(
          t => t.id === item.jewellery_type_id
        )?.name || "—",
      }));

      // Open print modal — form resets when user closes it
      setPrintData({
        pledgeNo,
        payload,
        customer,
        selectedScheme,
        finalLoan,
        interestAmt,
        processingFeeAmount,
        netDisbursed,
        items:        enrichedItems,
        totalNetWt,
        totalGrossWt,
        totalValue,
      });

    } catch (e) {
      alert("Error: " + e);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pledge-layout">

      {/* ── Print Modal ── */}
      {printData && (
        <PledgePrintModal
          data={printData}
          shopSettings={shopSettings}
          onClose={() => { setPrintData(null); resetForm(); }}
        />
      )}

      {/* ── Camera Modal ── */}
      {activeCameraItemId && (
        <CameraModal
          onCapture={handlePhotoCaptured}
          onClose={() => setActiveCameraItemId(null)}
        />
      )}

      {/* ════════════════════════════════════
          LEFT SECTION
          ════════════════════════════════════ */}
      <div className="left-section">

        {/* 1. CUSTOMER */}
        <div className="pledge-card">
          <div className="card-title">Customer Details</div>

          {!customer ? (
            <>
              <div className="customer-search-container">
                <div className={`search-input-wrapper ${searchQuery ? "hide-icon" : ""}`}>
                  <Search className="search-icon-inner" size={18} />
                  <input
                    className="form-input-clean"
                    placeholder="Search by phone or name"
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      handleSearch(val);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                  />

                  {searchQuery && (
                    <div className="search-results-dropdown">
                      {searchResults.length > 0 ? (
                        searchResults.map((c) => (
                          <div key={c.id} className="search-item" onClick={() => selectCustomer(c)}>
                            <div className="search-item-info">
                              <span className="search-item-name">{c.name}</span>
                              <span className="search-item-phone">{c.phone}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          className="search-item no-result"
                          style={{ textAlign: "center", color: "#2563eb", fontWeight: "600", cursor: "pointer" }}
                          onClick={() => {
                            localStorage.setItem("returnTo", "pledges");
                            localStorage.setItem("prefillCustomer", JSON.stringify({ phone: searchQuery }));
                            setActiveMenu("customers");
                          }}
                        >
                          No customer found. Click here to add customer
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  className="btn-outline-primary"
                  onClick={() => {
                    localStorage.setItem("returnTo", "pledges");
                    localStorage.removeItem("editCustomer");
                    setActiveMenu("customers");
                  }}
                >
                  <UserPlus size={16} /> Add New Customer
                </button>
              </div>

              <div className="customer-empty-state">
                <div className="empty-icon-wrapper"><User size={36} /></div>
                <p>Search and select a customer to continue</p>
              </div>
            </>
          ) : (
            <div className="customer-selected-card">
              <div className="card-column-left">
                <div className="profile-top-row">
                  <div className="customer-avatar-box">
                    {customer.photo_path ? (
                      <img src={convertFileSrc(customer.photo_path)} alt="customer" />
                    ) : (
                      <div className="avatar-placeholder">{customer.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="identity-details">
                    <h4 className="customer-display-name">{customer.name}</h4>
                    <div className="customer-code-badge">{customer.customer_code}</div>
                    <p className="customer-relation">{customer.relation || "Self"}</p>
                    <p className="customer-phone"><FaPhoneAlt /> {customer.phone}</p>
                  </div>
                </div>
                <div className="pledge-count-box">
                  <span className="pledge-label">Total Pledges of this Customer</span>
                  <span className="pledge-value">{customer.visit_count ?? 0}</span>
                </div>
              </div>

              <div className="card-divider" />

              <div className="card-column-right">
                <div className="info-group">
                  <label>Address</label>
                  <p className="info-text">{customer.address || "No address provided"}</p>
                </div>
                <div className="info-group">
                  <label>ID Proof</label>
                  <p className="info-text">
                    {customer.id_proof_type || "Aadhar"}: {customer.id_proof_number || "XXXX-XXXX-1234"}
                  </p>
                </div>
                <div className="card-actions-row">
                  <button
                    className="btn-edit-link"
                    onClick={() => {
                      localStorage.setItem("editCustomer", JSON.stringify(customer));
                      localStorage.setItem("returnTo", "pledges");
                      setActiveMenu("customers");
                    }}
                  >
                    Edit Profile
                  </button>
                  <button className="btn-change-link" onClick={() => setCustomer(null)}>Change</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. LOAN INFO */}
        <div className="pledge-card">
          <div className="card-title">Loan Information</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="field-label">Loan Type</label>
              <select className="form-select-clean" value={loanInfo.loanType} onChange={handleLoanTypeChange}>
                <option value="">Select</option>
                {masterData.metalTypes.map(m => (
                  <option key={m.id} value={m.name}>{m.name} Loan</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="field-label">Scheme</label>
              <select
                className="form-select-clean"
                value={loanInfo.schemeId}
                onChange={(e) => handleSchemeChange(e.target.value)}
              >
                <option value="">Select</option>
                {loanInfo.metalTypeId > 0 && masterData.schemes
                  .filter(s => s.metal_type_id === loanInfo.metalTypeId)
                  .map(s => <option key={s.id} value={s.id}>{s.scheme_name}</option>)
                }
              </select>
            </div>

            <div className="form-group">
              <label>Interest Rate</label>
              <input className="form-input" disabled value={`${loanInfo.interestRate}%`} />
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input className="form-input" disabled value={`${loanInfo.duration} Months`} />
            </div>
            <div className="form-group">
              <label>Price/Gram</label>
              <input className="form-input" disabled value={`₹ ${loanInfo.pricePerGram}`} />
            </div>
            <div className="form-group">
              <label>Loan %</label>
              <input className="form-input" disabled value={`${loanInfo.loanPercentage || 0}%`} />
            </div>
          </div>
        </div>

        {/* 3. PLEDGED ITEMS */}
        <div className="pledge-card">
          <div className="card-title">Pledged Jewellery</div>
          <table className="pledge-table">
            <thead>
              <tr>
                <th width="20%">Type</th>
                <th width="15%">Purity</th>
                <th width="15%">Gross(g)</th>
                <th width="15%">Net(g)</th>
                <th width="10%">Image</th>
                <th width="20%">Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <select
                      className="form-select-clean"
                      value={item.jewellery_type_id}
                      onChange={(e) => updateItem(item.id, "jewellery_type_id", Number(e.target.value))}
                    >
                      <option value="">Select</option>
                      {masterData.jewelleryTypes
                        .filter(t => loanInfo.metalTypeId ? t.metal_type_id === loanInfo.metalTypeId : true)
                        .map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                      }
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select-clean"
                      value={item.purity}
                      onChange={(e) => updateItem(item.id, "purity", e.target.value)}
                    >
                      <option>22K</option>
                      <option>24K</option>
                      <option>18K</option>
                      <option>925</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number" className="form-input" value={item.gross}
                      onChange={(e) => updateItem(item.id, "gross", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number" className="form-input" value={item.net}
                      onChange={(e) => updateItem(item.id, "net", e.target.value)}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div
                      onClick={() => setActiveCameraItemId(item.id)}
                      style={{ cursor: "pointer", display: "flex", justifyContent: "center" }}
                    >
                      {item.img ? (
                        <img src={item.img} alt="item" className="image-preview-thumb" />
                      ) : (
                        <Camera size={20} className="text-gray-400 hover:text-blue-500" />
                      )}
                    </div>
                  </td>
                  <td>₹ {item.value.toFixed(0)}</td>
                  <td>
                    <button
                      style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="add-item-row">
            <button
              className="btn btn-secondary"
              style={{ width: "100%", borderStyle: "dashed", display: "flex", justifyContent: "center", alignItems: "center", gap: "5px" }}
              onClick={addItem}
            >
              <Plus size={16} /> Add Item
            </button>
          </div>

          <div className="items-summary-bar">
            <div className="mini-stat">
              <span className="mini-stat-label">Total Items:</span>
              <span className="mini-stat-value">{items.length}</span>
            </div>
            <div className="stat-divider" />
            <div className="mini-stat">
              <span className="mini-stat-label">Total Gross Wt:</span>
              <span className="mini-stat-value">{totalGrossWt.toFixed(2)} g</span>
            </div>
            <div className="stat-divider" />
            <div className="mini-stat">
              <span className="mini-stat-label">Total Net Wt:</span>
              <span className="mini-stat-value">{totalNetWt.toFixed(2)} g</span>
            </div>
          </div>
        </div>

        {/* 4. LOAN DETAILS */}
        <div className="pledge-card">
          <div className="card-title">Loan Details</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="field-label">Processing Fee</label>
              <select
                className="form-select-clean"
                value={loanInfo.processingFeeType}
                onChange={(e) => setLoanInfo({ ...loanInfo, processingFeeType: e.target.value, processingFeeValue: 0 })}
              >
                <option value="">Select</option>
                {feeOptions.map((opt, idx) => (
                  <option key={idx} value={opt.type}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="field-label">Fee Value</label>
              <input
                type="number" className="form-input" value={loanInfo.processingFeeValue}
                onChange={(e) => setLoanInfo({ ...loanInfo, processingFeeValue: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="field-label">Eligible Loan</label>
              <input className="form-input" disabled value={`₹ ${eligibleLoan.toLocaleString()}`} />
            </div>

            <div className="form-group">
              <label className="field-label">Requested Loan</label>
              <input
                type="number" className="form-input" value={loanInfo.requestedLoan}
                onChange={(e) => setLoanInfo({ ...loanInfo, requestedLoan: Number(e.target.value) })}
                placeholder="Enter amount"
              />
              {isOverLimit && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                  Requested loan exceeds eligible limit
                </p>
              )}
            </div>
          </div>
        </div>

      </div>{/* /left-section */}

      {/* ════════════════════════════════════
          RIGHT SECTION — STICKY SUMMARY
          ════════════════════════════════════ */}
      <div className="summary-panel">
        <div className="summary-header">Calculation Summary</div>
        <div className="summary-body">

          <div className="summary-row">
            <span>Total Net Weight</span>
            <strong>{totalNetWt.toFixed(2)} g</strong>
          </div>
          <div className="summary-row">
            <span>Total Value</span>
            <strong>₹ {totalValue.toLocaleString()}</strong>
          </div>
          <div className="summary-row">
            <span>Eligible Loan</span>
            <strong>₹ {eligibleLoan.toLocaleString()}</strong>
          </div>

          <hr />

          <div className="summary-row">
            <span>Requested Loan</span>
            <strong>₹ {finalLoan.toLocaleString()}</strong>
          </div>
          <div className="summary-row">
            <span>Interest</span>
            <strong>₹ {interestAmt.toLocaleString()}</strong>
          </div>
          <div className="summary-row">
            <span>Processing Fee</span>
            <strong>₹ {processingFeeAmount.toLocaleString()}</strong>
          </div>

          <hr />

          <div className="total-highlight">
            <label>Net Disbursed</label>
            <span>₹ {netDisbursed.toLocaleString()}</span>
          </div>

          <hr />

          {/* ── Payment Method ── */}
          <div style={{
            marginTop: "20px", padding: "16px",
            backgroundColor: "#f9fafb", borderRadius: "12px", border: "1px solid #e5e7eb",
          }}>
            <label style={{
              fontWeight: "700", fontSize: "14px", display: "block",
              marginBottom: "12px", color: "#1f2937",
              textTransform: "uppercase", letterSpacing: "0.5px",
            }}>
              Payment Method
            </label>

            {/* Method Selector */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              {["CASH", "UPI", "BANK"].map((method) => (
                <button
                  key={method}
                  className="btn"
                  style={{
                    flex: 1, padding: "10px 0", cursor: "pointer",
                    borderRadius: "8px", fontWeight: "600", transition: "all 0.2s ease",
                    background: paymentMethod === method ? "#3b82f6" : "#fff",
                    color:      paymentMethod === method ? "#fff"    : "#4b5563",
                    border:     paymentMethod === method ? "1px solid #2563eb" : "1px solid #d1d5db",
                  }}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Auto-fill button */}
            {paymentMethod === "CASH" && (
              <button
                onClick={handleAutoFill}
                style={{
                  width: "100%", marginBottom: "16px", padding: "8px",
                  background: "#eff6ff", color: "#1d4ed8",
                  border: "1px dashed #3b82f6", borderRadius: "6px",
                  fontSize: "12px", fontWeight: "700", cursor: "pointer",
                }}
              >
                ✨ AUTO-FILL CASH (₹{netDisbursed.toLocaleString()})
              </button>
            )}

            {/* Cash denomination grid */}
            {paymentMethod === "CASH" && (
              <div style={{ background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                {Object.keys(denominations).sort((a, b) => b - a).map((note) => (
                  <div
                    key={note}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}
                  >
                    <span style={{ fontSize: "14px", color: "#374151" }}>₹ {note}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>x</span>
                      <input
                        type="number"
                        style={{ width: "60px", padding: "4px", textAlign: "right", borderRadius: "4px", border: "1px solid #d1d5db" }}
                        value={denominations[note] || ""}
                        onChange={(e) => updateDenomination(note, e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                {/* Match indicator */}
                <div style={{
                  marginTop: "10px", padding: "8px", fontSize: "12px",
                  borderRadius: "6px", textAlign: "center",
                  background: totalCash === netDisbursed ? "#ecfdf5" : "#fff1f2",
                  color:      totalCash === netDisbursed ? "#059669" : "#e11d48",
                  border: `1px solid ${totalCash === netDisbursed ? "#10b981" : "#f43f5e"}`,
                }}>
                  {totalCash === netDisbursed
                    ? "✅ Cash Matches Disbursed Amount"
                    : `Difference: ₹${(totalCash - netDisbursed).toLocaleString()}`
                  }
                </div>
              </div>
            )}

            {/* UPI / BANK ref */}
            {(paymentMethod === "UPI" || paymentMethod === "BANK") && (
              <div style={{ marginTop: "4px" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Enter ${paymentMethod} transaction reference`}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "8px",
                    border: "1px solid #d1d5db", boxSizing: "border-box", outlineColor: "#3b82f6",
                  }}
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* ── Save / Cancel ── */}
          <div className="action-area">
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!canSave}
              style={{
                width: "100%",
                cursor:          canSave ? "pointer" : "not-allowed",
                opacity:         canSave ? 1 : 0.6,
                backgroundColor: canSave ? "#10b981" : "#9ca3af",
              }}
            >
              {paymentMethod === "CASH" && !isPaymentMatched
                ? `Need ₹${(netDisbursed - totalCash).toLocaleString()} more`
                : "Save Pledge"
              }
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: "100%", marginTop: "8px" }}
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>

        </div>{/* /summary-body */}
      </div>{/* /summary-panel */}

    </div>/* /pledge-layout */
  );
}