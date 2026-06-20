// import React, { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import {
//   Users,
//   UserPlus,
//   ShieldCheck,
//   ShieldAlert,
//   DollarSign,
//   Search, 
// } from "lucide-react";
// import { useLanguage } from "../context/LanguageContext";
// import "./staffPage.css";
// import { useAuthStore } from "../auth/authStore";
// import { autoFillDenominations } from "../utils/cashDenominationManager";
// import CashDenominationInput, {
//   calcDenomTotal,
//   emptyDenominations,
// } from "../constants/CashDenominationInput";
// import {formatDateToDMY} from "../utils/timeFormatter";

// export default function StaffPage() {
//   const { t } = useLanguage();
//   const user = useAuthStore((s) => s.user);

//   const [staff, setStaff] = useState([]);
//   const [searchQuery, setSearchQuery] = useState(""); // <-- State for filter text
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [msg, setMsg] = useState("");

//   const [fullName, setFullName] = useState("");
//   const [monthlySalary, setMonthlySalary] = useState("");
//   const [joiningDate, setJoiningDate] = useState("");

//   const [showAdvanceModal, setShowAdvanceModal] = useState(false);
//   const [selectedStaff, setSelectedStaff] = useState(null);

//   const [advanceAmount, setAdvanceAmount] = useState("");
//   const [paymentMode, setPaymentMode] = useState("CASH");
//   const [transactionRef, setTransactionRef] = useState("");
//   const [remarks, setRemarks] = useState("");

//   const [advanceDate, setAdvanceDate] = useState(
//     new Date().toISOString().split("T")[0],
//   );

//   const [denominations, setDenominations] = useState(emptyDenominations());
//   const [denomError, setDenomError] = useState("");

//   const [showHistoryModal, setShowHistoryModal] = useState(false);
//   const [advanceHistory, setAdvanceHistory] = useState([]);
//   const [selectedStaffHistory, setSelectedStaffHistory] = useState(null);

//   const [showSalaryModal, setShowSalaryModal] = useState(false);
//   const [salarySummary, setSalarySummary] = useState(null);
//   const [selectedSalaryStaff, setSelectedSalaryStaff] = useState(null);

//   const [salaryPaymentMode, setSalaryPaymentMode] = useState("CASH");
//   const [salaryTxnRef, setSalaryTxnRef] = useState("");
//   const [salaryRemarks, setSalaryRemarks] = useState("");
//   const [salaryDate, setSalaryDate] = useState(
//     new Date().toISOString().split("T")[0],
//   );

//   const [salaryDenominations, setSalaryDenominations] =
//     useState(emptyDenominations());
//   const [salaryDenomError, setSalaryDenomError] = useState("");
//   const salaryDenomTotal = calcDenomTotal(salaryDenominations);

//   const [advanceDenominations, setAdvanceDenominations] = useState({});

//   const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

//   const showToast = (msg, type = "success") => {
//     setToast({ show: true, msg, type });
//     setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3500);
//   };

//   const [pastPayments, setPastPayments] = useState([]);

//   const denomTotal = calcDenomTotal(denominations);

//   const loadStaff = async () => {
//     try {
//       const result = await invoke("get_staff_cmd");
//       setStaff(result);
//     } catch (err) {
//       console.error("Failed to load staff:", err);
//     }
//   };

//   useEffect(() => {
//     loadStaff();
//   }, []);

//   // Filter staff down locally on user input matching name or handle
//   const filteredStaff = staff.filter((s) => {
//     const query = searchQuery.toLowerCase().trim();
//     if (!query) return true;
    
//     const nameMatch = s.full_name ? s.full_name.toLowerCase().includes(query) : false;
//     const usernameMatch = s.username ? s.username.toLowerCase().includes(query) : false;
    
//     return nameMatch || usernameMatch;
//   });

//   const createStaff = async () => {
//     if (
//       !username.trim() ||
//       !password.trim() ||
//       !fullName.trim() ||
//       !monthlySalary ||
//       !joiningDate
//     ) {
//       setMsg("Please fill all fields");
//       return;
//     }

//     try {
//       await invoke("create_staff_cmd", {
//         username,
//         password,
//         fullName,
//         monthlySalary: Number(monthlySalary),
//         joiningDate,
//         actorUserId: user.user_id,
//       });

//       setMsg(t("staff_created_success"));
//       setUsername("");
//       setPassword("");
//       setFullName("");
//       setMonthlySalary("");
//       setJoiningDate("");

//       loadStaff();
//     } catch (err) {
//       setMsg(String(err));
//     }
//   };

//   const toggleStatus = async (id, isActive) => {
//     try {
//       await invoke("toggle_staff_cmd", {
//         staffId: id,
//         isActive: !isActive,
//         actorUserId: user.user_id,
//       });
//       loadStaff();
//     } catch (err) {
//       showToast(String(err), "error");
//     }
//   };

//   const handleAutoFill = async () => {
//     const amount = Number(advanceAmount);

//     if (!amount || amount <= 0) {
//       setDenomError("Enter amount first");
//       return;
//     }

//     const result = await autoFillDenominations(amount);

//     if (!result.success) {
//       setDenomError(
//         `Unable to make exact amount. Remaining ₹${result.remaining}`,
//       );
//       return;
//     }

//     const filled = emptyDenominations();
//     Object.entries(result.denominations).forEach(([note, qty]) => {
//       filled[note] = qty;
//     });

//     setDenominations(filled);
//     setDenomError("");
//   };

//   const handleSaveAdvance = async () => {
//     if (!advanceAmount) {
//       showToast("Enter amount", "error");
//       return;
//     }

//     if (paymentMode === "CASH") {
//       const total = calcDenomTotal(denominations);
//       if (total !== Number(advanceAmount)) {
//         showToast(
//           `Denomination Total ₹${total} does not match Amount ₹${advanceAmount}`,
//           "error",
//         );

//         return;
//       }
//     }

//     try {
//       const denomArray =
//         paymentMode === "CASH"
//           ? Object.entries(denominations)
//               .map(([note, qty]) => [Number(note), Number(qty)])
//               .filter(([, qty]) => qty > 0)
//           : [];

//       await invoke("create_salary_advance_cmd", {
//         userId: selectedStaff.id,
//         advanceDate,
//         amount: Number(advanceAmount),
//         paymentMode,
//         transactionRef: paymentMode === "CASH" ? null : transactionRef,
//         remarks,
//         denominations: denomArray,
//         actorUserId: user.user_id,
//       });

//       showToast("Salary advance saved");

//       setShowAdvanceModal(false);
//       loadStaff();
//     } catch (err) {
//       showToast(String(err), "error");
//     }
//   };

//   const openAdvanceHistory = async (staffMember) => {
//     try {
//       const history = await invoke("get_salary_advances_cmd", {
//         userId: staffMember.id,
//       });
//       setSelectedStaffHistory(staffMember);
//       setAdvanceHistory(history);

//       const denomMap = {};
//       await Promise.all(
//         history
//           .filter((item) => item.payment_mode === "CASH")
//           .map(async (item) => {
//             try {
//               const denoms = await invoke("get_advance_denominations_cmd", {
//                 advanceId: item.id,
//               });
//               denomMap[item.id] = denoms;
//             } catch {
//               denomMap[item.id] = [];
//             }
//           }),
//       );

//       setAdvanceDenominations(denomMap);
//       setShowHistoryModal(true);
//     } catch (err) {
//       console.error("Advance History Error:", err);
//       showToast(String(err), "error");
//     }
//   };

//   // const openSalaryPaymentModal = async (staffMember) => {
//   //   try {
//   //     const summary = await invoke("get_salary_summary_cmd", {
//   //       userId: staffMember.id,
//   //     });
//   //     setSelectedSalaryStaff(staffMember);
//   //     setSalarySummary(summary);
//   //     setSalaryPaymentMode("CASH");
//   //     setSalaryTxnRef("");
//   //     setSalaryRemarks("");
//   //     setSalaryDate(new Date().toISOString().split("T")[0]);
//   //     setShowSalaryModal(true);
//   //   } catch (err) {
//   //     console.error(err);
//   //     showToast("Failed to load salary summary.", "error");
//   //   }
//   // };


//   const openSalaryPaymentModal = async (staffMember) => {
//   try {
//     const summary = await invoke("get_salary_summary_cmd", {
//       userId: staffMember.id,
//     });
    
//     // Fetch historical payroll table rows concurrently
//     const historicalPayments = await invoke("get_past_salary_payments_cmd", {
//       userId: staffMember.id,
//     });
    
//     setSelectedSalaryStaff(staffMember);
//     setSalarySummary(summary);
//     setPastPayments(historicalPayments); // Keep history array updated in state
    
//     setSalaryPaymentMode("CASH");
//     setSalaryTxnRef("");
//     setSalaryRemarks("");
//     setSalaryDate(new Date().toISOString().split("T")[0]);
//     setShowSalaryModal(true);
//   } catch (err) {
//     console.error(err);
//     showToast("Failed to load salary context summary parameters.", "error");
//   }
// };


//   const handleConfirmSalaryPayment = async () => {
//     try {
//       if (!salarySummary || salarySummary.net_payable <= 0) {
//         showToast("No outstanding balance due for processing.", "error");
//         return;
//       }

//       if (salaryPaymentMode === "CASH") {
//         const total = calcDenomTotal(salaryDenominations);
//         if (total !== salarySummary.net_payable) {
//           showToast(
//             `Denomination total ₹${total} does not match Net Payable ₹${salarySummary.net_payable}`,
//             "error",
//           );
//           return;
//         }
//       }

//       const denomArray =
//         salaryPaymentMode === "CASH"
//           ? Object.entries(salaryDenominations)
//               .map(([note, qty]) => [Number(note), Number(qty)])
//               .filter(([, qty]) => qty > 0)
//           : [];

//       await invoke("create_salary_payment_cmd", {
//         userId: selectedSalaryStaff.id,
//         salaryMonth: salaryDate,
//         paymentMode: salaryPaymentMode,
//         transactionRef: salaryPaymentMode === "CASH" ? null : salaryTxnRef,
//         remarks: salaryRemarks,
//         denominations: denomArray,
//         actorUserId: user.user_id,
//       });

//       showToast("Monthly payroll payment completed.");
//       setShowSalaryModal(false);
//       loadStaff();
//     } catch (err) {
//       showToast(String(err), "error");
//     }
//   };

//   const totalOutstanding = advanceHistory
//     .filter((row) => !row.salary_payment_id)
//     .reduce((sum, row) => sum + Number(row.amount), 0);

//   const totalAdvanceAllTime = advanceHistory.reduce(
//     (sum, row) => sum + Number(row.amount),
//     0,
//   );

//   const handleSalaryAutoFill = async () => {
//     const amount = salarySummary?.net_payable;
//     if (!amount || amount <= 0) return;

//     const result = await autoFillDenominations(amount);
//     if (!result.success) {
//       setSalaryDenomError(
//         `Unable to make exact amount. Remaining ₹${result.remaining}`,
//       );
//       return;
//     }

//     const filled = emptyDenominations();
//     Object.entries(result.denominations).forEach(([note, qty]) => {
//       filled[note] = qty;
//     });
//     setSalaryDenominations(filled);
//     setSalaryDenomError("");
//   };

//   return (
//     <div className="staff-container">
//       {toast.show && (
//         <div
//           className={`staff-toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}
//         >
//           {toast.msg}
//         </div>
//       )}
//       <header className="page-header">
//         <div className="title-group">
//           <Users className="icon-main" />
//           <div className="title-text">
//             <h1>{t("staff_management")}</h1>
//             <p>{t("staff_management_desc")}</p>
//           </div>
//         </div>
//       </header>

//       <div className="staff-grid">
//         {/* Add Staff */}
//         {/* Add Staff */}
// <section className="admin-card" style={{ paddingBottom: "10px" }}>
//   <div className="card-header">
//     <h3>
//       <UserPlus size={18} /> {t("add_new_staff")}
//     </h3>
//   </div>

//   {/* Added tight gap styling directly here */}
//   <div className="form-content" style={{ gap: "10px", padding: "14px" }}>
    
//     <div className="form-group" style={{ gap: "2px" }}>
//       <label>{t("full_name")}</label>
//       <input
//         style={{ height: "32px", fontSize: "13px" }}
//         placeholder="Full Name"
//         value={fullName}
//         onChange={(e) => setFullName(e.target.value)}
//       />
//     </div>

//     <div className="form-group" style={{ gap: "2px" }}>
//       <label>{t("username")}</label>
//       <input
//         style={{ height: "32px", fontSize: "13px" }}
//         placeholder="e.g. john_doe"
//         value={username}
//         onChange={(e) => setUsername(e.target.value)}
//       />
//     </div>

//     <div className="form-group" style={{ gap: "2px" }}>
//       <label>{t("monthly_salary")}</label>
//       <input
//         type="number"
//         style={{ height: "32px", fontSize: "13px" }}
//         placeholder="Monthly Salary"
//         value={monthlySalary}
//         onChange={(e) => setMonthlySalary(e.target.value)}
//       />
//     </div>

//     <div className="form-group" style={{ gap: "2px" }}>
//       <label>{t("joining_date")}</label>
//       <input
//         type="date"
//         style={{ height: "32px", fontSize: "13px" }}
//         value={joiningDate}
//         onChange={(e) => setJoiningDate(e.target.value)}
//       />
//     </div>

//     <div className="form-group" style={{ gap: "2px" }}>
//       <label>{t("security_pin")}</label>
//       <input
//         type="password"
//         style={{ height: "32px", fontSize: "13px" }}
//         placeholder="••••••"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         onKeyDown={(e) => e.key === "Enter" && createStaff()}
//       />
//     </div>

//     <button 
//       className="btn-primary-staff" 
//       style={{ marginTop: "6px", padding: "6px 12px", fontSize: "13px" }}
//       onClick={createStaff}
//     >
//       {t("create_account")}
//     </button>

//     {msg && (
//       <div
//         className={`status-msg ${
//           msg.toLowerCase().includes("success") ? "success" : "error"
//         }`}
//         style={{ padding: "6px 10px", marginTop: "4px" }}
//       >
//         {msg.toLowerCase().includes("success") ? (
//           <ShieldCheck size={16} />
//         ) : (
//           <ShieldAlert size={16} />
//         )}
//         <span>{msg}</span>
//       </div>
//     )}
//   </div>
// </section>
//         {/* <section className="admin-card add-staff-card">
//           <div className="card-header">
//             <h3>
//               <UserPlus size={18} /> {t("add_new_staff")}
//             </h3>
//           </div>

//           <div className="form-content">
//             <div className="form-group">
//               <label>{t("full_name")}</label>
//               <input
//                 placeholder="Full Name"
//                 value={fullName}
//                 onChange={(e) => setFullName(e.target.value)}
//               />
//             </div>

//             <div className="form-group">
//               <label>{t("username")}</label>
//               <input
//                 placeholder="e.g. john_doe"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//               />
//             </div>

//             <div className="form-group">
//               <label>{t("monthly_salary")}</label>
//               <input
//                 type="number"
//                 placeholder="Monthly Salary"
//                 value={monthlySalary}
//                 onChange={(e) => setMonthlySalary(e.target.value)}
//               />
//             </div>

//             <div className="form-group">
//               <label>{t("joining_date")}</label>
//               <input
//                 type="date"
//                 value={joiningDate}
//                 onChange={(e) => setJoiningDate(e.target.value)}
//               />
//             </div>

//             <div className="form-group">
//               <label>{t("security_pin")}</label>
//               <input
//                 type="password"
//                 placeholder="••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && createStaff()}
//               />
//             </div>

//             <button className="btn-primary-staff" onClick={createStaff}>
//               {t("create_account")}
//             </button>

//             {msg && (
//               <div
//                 className={`status-msg ${
//                   msg.toLowerCase().includes("success") ? "success" : "error"
//                 }`}
//               >
//                 {msg.toLowerCase().includes("success") ? (
//                   <ShieldCheck size={16} />
//                 ) : (
//                   <ShieldAlert size={16} />
//                 )}
//                 <span>{msg}</span>
//               </div>
//             )}
//           </div>
//         </section> */}

//         {/* Staff List */}
//         <section className="table-card">
//           {/* Enhanced Layout with Flexbox and Search bar input container */}
//           <div className="table-header staff-search-header">
//             <h3>{t("active_team_members")}</h3>
//             <div className="search-bar-wrapper">
//               <Search className="search-icon" size={16} />
//               <input
//                 type="text"
//                 className="staff-search-input"
//                 placeholder="Search staff by name or handle..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="table-wrapper">
//             <table className="staff-table">
//               <thead>
//                 <tr>
//                   <th>{t("user_details")}</th>
//                   <th>{t("status")}</th>
//                   <th className="text-right">{t("actions")}</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filteredStaff.map((s) => (
//                   <tr key={s.id}>
//                     <td>
//                       <div className="user-info">
//                         <div className="avatar">
//                           {s.username.charAt(0).toUpperCase()}
//                         </div>
// <div className="user-meta">
//   <span className="username">
//     {s.full_name || s.username}
//   </span>
//   <span className="user-role-uid">@{s.username}</span>
  
//   {/* Restructured layout row to implement block level grouping details */}
//   <div className="user-sub-details">
//     <div className="sub-detail-row">
//       Salary: ₹{s.monthly_salary?.toLocaleString("en-IN")}
//     </div>
//     <div className="sub-detail-row joined-date">
//       Joined: {formatDateToDMY(s.joining_date)}
//     </div>
//   </div>
// </div>
//                       </div>
//                     </td>

//                     <td>
//                       <span
//                         className={`pill ${
//                           s.is_active ? "pill-active" : "pill-disabled"
//                         }`}
//                       >
//                         {s.is_active ? t("active") : t("disabled")}
//                       </span>
//                     </td>

//                     <td className="text-right">
//                       <div className="action-cell">
//                         <button
//                           className="btn-advance"
//                           onClick={() => {
//                             setSelectedStaff(s);
//                             setAdvanceAmount("");
//                             setPaymentMode("CASH");
//                             setTransactionRef("");
//                             setRemarks("");
//                             setDenominations(emptyDenominations());
//                             setShowAdvanceModal(true);
//                           }}
//                         >
//                           <DollarSign size={14} />
//                           Salary Advance
//                         </button>

//                         <button
//                           className="btn-action-toggle btn-activate"
//                           onClick={() => openAdvanceHistory(s)}
//                         >
//                           View Advances
//                         </button>

//                         <button
//                           className="btn-pay-salary"
//                           onClick={() => openSalaryPaymentModal(s)}
//                         >
//                           Pay Salary
//                         </button>

//                         <button
//                           className={`btn-action-toggle ${
//                             s.is_active ? "btn-deactivate" : "btn-activate"
//                           }`}
//                           onClick={() => toggleStatus(s.id, s.is_active)}
//                         >
//                           {s.is_active ? t("deactivate") : t("activate")}
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}

//                 {filteredStaff.length === 0 && (
//                   <tr>
//                     <td colSpan="3" className="empty-state">
//                       {searchQuery ? "No matched staff records found." : t("no_staff_accounts")}
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </section>
//       </div>

//       {/* SALARY ADVANCE MODAL */}
//       {showAdvanceModal && (
//         <div className="modal-overlay" role="dialog" aria-modal="true">
//           <div className="modal-content salary-advance-modal">
//             <div className="modal-header">
//               <h2>Salary Advance</h2>
//               <p>
//                 Record financial disbursements or advance pay for staff entries.
//               </p>
//             </div>

//             <div className="modal-body">
//               <div className="modal-row three-cols">
//                 <div className="form-group">
//                   <label>Staff Member</label>
//                   <input
//                     value={
//                       selectedStaff?.full_name || selectedStaff?.username || ""
//                     }
//                     disabled
//                     className="input-disabled"
//                   />
//                 </div>

//                 <div className="form-group">
//                   <label>Advance Amount (₹)</label>
//                   <input
//                     type="number"
//                     placeholder="0.00"
//                     value={advanceAmount}
//                     onChange={(e) => {
//                       setAdvanceAmount(e.target.value);
//                       setDenominations(emptyDenominations());
//                       setDenomError("");
//                     }}
//                   />
//                 </div>

//                 <div className="form-group">
//                   <label>Payment Method</label>
//                   <select
//                     value={paymentMode}
//                     onChange={(e) => {
//                       setPaymentMode(e.target.value);
//                       if (e.target.value !== "CASH") {
//                         setDenominations(emptyDenominations());
//                         setDenomError("");
//                       }
//                     }}
//                   >
//                     <option value="CASH">Cash Payment</option>
//                     <option value="UPI">UPI Transfer</option>
//                     <option value="BANK_TRANSFER">Direct Bank Transfer</option>
//                   </select>
//                 </div>
//               </div>

//               {paymentMode === "CASH" && (
//                 <div className="denomination-container">
//                   <div className="denom-header">
//                     <label>Cash Breakdown</label>
//                     <button
//                       type="button"
//                       className="btn-link"
//                       onClick={handleAutoFill}
//                     >
//                       Auto-calculate
//                     </button>
//                   </div>

//                   {denomError && (
//                     <div className="error-banner">{denomError}</div>
//                   )}

//                   <div className="denom-input-wrapper">
//                     <CashDenominationInput
//                       data={denominations}
//                       setData={setDenominations}
//                       showTotal={false}
//                     />
//                   </div>

//                   <div className="denom-summary-bar">
//                     <span>Total Allocated Cash:</span>
//                     <strong
//                       className={
//                         denomTotal === Number(advanceAmount) && denomTotal > 0
//                           ? "match"
//                           : "mismatch"
//                       }
//                     >
//                       ₹{denomTotal.toLocaleString("en-IN")}
//                     </strong>
//                   </div>
//                 </div>
//               )}

//               {paymentMode !== "CASH" && (
//                 <div className="form-group">
//                   <label>Transaction Reference Number</label>
//                   <input
//                     type="text"
//                     placeholder="e.g. TXN10293847"
//                     value={transactionRef}
//                     onChange={(e) => setTransactionRef(e.target.value)}
//                   />
//                 </div>
//               )}

//               <div className="modal-row two-cols">
//                 <div className="form-group">
//                   <label>Disbursement Date</label>
//                   <input
//                     type="date"
//                     value={advanceDate}
//                     onChange={(e) => setAdvanceDate(e.target.value)}
//                   />
//                 </div>

//                 <div className="form-group">
//                   <label>Internal Remarks</label>
//                   <textarea
//                     rows="1"
//                     placeholder="Add notes relating to advance pay..."
//                     value={remarks}
//                     onChange={(e) => setRemarks(e.target.value)}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="modal-actions">
//               <button
//                 className="btn-corporate-secondary"
//                 onClick={() => {
//                   setShowAdvanceModal(false);
//                   setAdvanceAmount("");
//                   setPaymentMode("CASH");
//                   setTransactionRef("");
//                   setRemarks("");
//                   setDenominations(emptyDenominations());
//                   setDenomError("");
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="btn-corporate-primary"
//                 onClick={handleSaveAdvance}
//               >
//                 Confirm Transaction
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ADVANCE HISTORY MODAL */}
//       {showHistoryModal && (
//         <div className="modal-overlay" role="dialog" aria-modal="true">
//           <div className="modal-content advance-history-modal">
//             <div className="modal-header">
//               <h2>Advance History Log</h2>
//               <p>Historical salary advances issued to this staff member.</p>
//             </div>

//             <div className="modal-body">
//               <div className="history-summary-strip">
//                 <div className="summary-block">
//                   <span className="label">Employee Name</span>
//                   <span className="value">
//                     {selectedStaffHistory?.full_name ||
//                       selectedStaffHistory?.username}
//                   </span>
//                 </div>

//                 <div className="summary-block highlight">
//                   <span className="label">Outstanding Balance</span>
//                   <span className="value text-danger">
//                     ₹{totalOutstanding.toLocaleString("en-IN")}
//                   </span>
//                 </div>

//                 <div className="summary-block">
//                   <span className="label">All-time Advances</span>
//                   <span className="value">
//                     ₹{totalAdvanceAllTime.toLocaleString("en-IN")}
//                   </span>
//                 </div>
//               </div>

//               <div className="table-wrapper embedded-history-table">
//                 <table className="staff-table">
//                   <thead>
//                     <tr>
//                       <th>Date</th>
//                       <th>Amount</th>
//                       <th>Mode</th>
//                       <th>Status</th>
//                       <th>Ref / Denominations</th>
//                       <th>Remarks</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {advanceHistory.length > 0 ? (
//                       advanceHistory.map((item) => {
//                         const isCash = item.payment_mode === "CASH";
//                         const denoms = advanceDenominations[item.id] || [];

//                         return (
//                           <React.Fragment key={item.id}>
//                             <tr>
//                               <td className="font-medium">
//                                 {item.advance_date}
//                               </td>
//                               <td className="font-semibold color-dark">
//                                 ₹{Number(item.amount).toLocaleString("en-IN")}
//                               </td>
//                               <td>
//                                 <span className="pill pill-mode">
//                                   {item.payment_mode}
//                                 </span>
//                               </td>
//                               <td>
//                                 <span
//                                   className={`pill ${
//                                     item.salary_payment_id
//                                       ? "pill-settled"
//                                       : "pill-active"
//                                   }`}
//                                 >
//                                   {item.salary_payment_id
//                                     ? "Settled"
//                                     : "Outstanding"}
//                                 </span>
//                               </td>
//                               <td className="text-muted text-remarks">
//                                 {isCash ? (
//                                   denoms.length > 0 ? (
//                                     <div className="denom-audit-list">
//                                       {denoms.map(([note, qty]) => (
//                                         <span
//                                           key={note}
//                                           className="denom-audit-chip"
//                                         >
//                                           ₹{note} × {qty} = ₹
//                                           {(note * qty).toLocaleString("en-IN")}
//                                         </span>
//                                       ))}
//                                     </div>
//                                   ) : (
//                                     <span className="text-muted">
//                                       No denomination data
//                                     </span>
//                                   )
//                                 ) : item.transaction_ref ? (
//                                   <span className="txn-ref-tag">
//                                     Ref: {item.transaction_ref}
//                                   </span>
//                                 ) : (
//                                   <span className="text-muted">—</span>
//                                 )}
//                               </td>
//                               <td
//                                 style={{
//                                   fontSize: "13px",
//                                   color: "#64748b",
//                                   wordBreak: "break-word",
//                                   whiteSpace: "normal",
//                                 }}
//                               >
//                                 {item.remarks || "—"}
//                               </td>
//                             </tr>
//                           </React.Fragment>
//                         );
//                       })
//                     ) : (
//                       <tr>
//                         <td colSpan="5" className="empty-state">
//                           No advance entries for this staff member.
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <div className="modal-actions">
//               <button
//                 className="btn-corporate-secondary"
//                 onClick={() => setShowHistoryModal(false)}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* MONTHLY SALARY PAYMENT MODAL */}
//       {showSalaryModal && (
//         <div className="modal-overlay" role="dialog" aria-modal="true">
//           <div className="modal-content salary-payment-modal">
//             <div className="modal-header">
//               <h2>Process Monthly Payroll</h2>
//               <p>Review deductions and confirm monthly salary disbursement.</p>
//             </div>

//             <div className="modal-body">
//               <div className="salary-calc-grid">
//                 <div className="calc-item-card">
//                   <span className="label">Staff Member</span>
//                   <strong className="value-text">
//                     {selectedSalaryStaff?.full_name ||
//                       selectedSalaryStaff?.username}
//                   </strong>
//                 </div>

//                 <div className="calc-item-card">
//                   <span className="label">Monthly Salary</span>
//                   <strong className="value-text">
//                     ₹
//                     {salarySummary?.gross_salary?.toLocaleString("en-IN") ||
//                       "0"}
//                   </strong>
//                 </div>

//                 <div className="calc-item-card">
//                   <span className="label">Months Due</span>
//                   <strong className="value-text">
//                     {salarySummary?.months_worked ?? 0} months
//                   </strong>
//                 </div>

//                 <div className="calc-item-card">
//                   <span className="label">Total Salary Due</span>
//                   <strong className="value-text">
//                     ₹
//                     {salarySummary?.total_salary_due?.toLocaleString("en-IN") ||
//                       "0"}
//                   </strong>
//                 </div>

//                 <div className="calc-item-card negative">
//                   <span className="label">Already Paid</span>
//                   <strong className="value-text text-danger">
//                     - ₹
//                     {salarySummary?.total_paid?.toLocaleString("en-IN") || "0"}
//                   </strong>
//                 </div>

//                 <div className="calc-item-card negative">
//                   <span className="label">Advances Deducted</span>
//                   <strong className="value-text text-danger">
//                     - ₹
//                     {salarySummary?.advance_amount?.toLocaleString("en-IN") ||
//                       "0"}
//                   </strong>
//                 </div>

//                 <div
//                   className="calc-item-card net-payout"
//                   style={{ gridColumn: "span 2" }}
//                 >
//                   <span className="label">Net Payable Now</span>
//                   <strong
//                     className={`value-text ${
//                       (salarySummary?.net_payable ?? 0) > 0
//                         ? "text-success"
//                         : "text-danger"
//                     }`}
//                   >
//                     ₹
//                     {salarySummary?.net_payable?.toLocaleString("en-IN") || "0"}
//                   </strong>
//                 </div>
//               </div>

//               <div className="modal-row three-cols">
//                 <div className="form-group">
//                   <label>Payout Method</label>
//                   <select
//                     value={salaryPaymentMode}
//                     onChange={(e) => setSalaryPaymentMode(e.target.value)}
//                   >
//                     <option value="CASH">Cash Payment</option>
//                     <option value="UPI">UPI Transfer</option>
//                     <option value="BANK_TRANSFER">Direct Bank Transfer</option>
//                   </select>
//                 </div>

//                 <div className="form-group">
//                   <label>Disbursement Date</label>
//                   <input
//                     type="date"
//                     value={salaryDate}
//                     onChange={(e) => setSalaryDate(e.target.value)}
//                   />
//                 </div>

//                 <div className="form-group">
//                   <label>Transaction Reference</label>
//                   <input
//                     type="text"
//                     placeholder={
//                       salaryPaymentMode === "CASH"
//                         ? "N/A (Cash Settlement)"
//                         : "e.g. UPI8201934"
//                     }
//                     disabled={salaryPaymentMode === "CASH"}
//                     className={
//                       salaryPaymentMode === "CASH" ? "input-disabled" : ""
//                     }
//                     value={salaryTxnRef}
//                     onChange={(e) => setSalaryTxnRef(e.target.value)}
//                   />
//                 </div>
//               </div>
//               {salaryPaymentMode === "CASH" && (
//                 <div className="denomination-container">
//                   <div className="denom-header">
//                     <label>Cash Breakdown</label>
//                     <button
//                       type="button"
//                       className="btn-link"
//                       onClick={handleSalaryAutoFill}
//                     >
//                       Auto-calculate
//                     </button>
//                   </div>

//                   {salaryDenomError && (
//                     <div className="error-banner">{salaryDenomError}</div>
//                   )}

//                   <div className="denom-input-wrapper">
//                     <CashDenominationInput
//                       data={salaryDenominations}
//                       setData={setSalaryDenominations}
//                       showTotal={false}
//                     />
//                   </div>

//                   <div className="denom-summary-bar">
//                     <span>Total Allocated Cash:</span>
//                     <strong
//                       className={
//                         salaryDenomTotal === salarySummary?.net_payable &&
//                         salaryDenomTotal > 0
//                           ? "match"
//                           : "mismatch"
//                       }
//                     >
//                       ₹{salaryDenomTotal.toLocaleString("en-IN")}
//                     </strong>
//                   </div>
//                 </div>
//               )}
//               <div className="form-group">
//                 <label>Payout Remarks</label>
//                 <textarea
//                   rows="1"
//                   placeholder="Add notes for this payroll release..."
//                   value={salaryRemarks}
//                   onChange={(e) => setSalaryRemarks(e.target.value)}
//                 />
//               </div>
//               {/* HISTORICAL PAYROLL DATA LOG ENTRY MODULE */}
// <div className="payroll-history-block">
//   <div className="payroll-history-header">
//     <h4>Past Payroll Disbursements</h4>
//   </div>
//   <div className="table-wrapper embedded-history-table">
//     <table className="staff-table payroll-history-table">
//       <thead>
//         <tr>
//           <th>Month</th>
//           <th>Gross Pay</th>
//           <th>Advances Deducted</th>
//           <th>Net Paid</th>
//           <th>Method / Ref</th>
//           <th>Remarks</th>
//         </tr>
//       </thead>
//       <tbody>
//         {pastPayments.length > 0 ? (
//           pastPayments.map((p) => (
//             <tr key={p.id}>
//               <td className="font-semibold color-dark">{p.salary_month}</td>
//               <td>₹{p.gross_salary?.toLocaleString("en-IN")}</td>
//               <td className={p.advance_amount > 0 ? "text-danger" : ""}>
//                 {p.advance_amount > 0 ? `- ₹${p.advance_amount.toLocaleString("en-IN")}` : "₹0"}
//               </td>
//               <td className="font-bold text-success">₹{p.net_salary?.toLocaleString("en-IN")}</td>
//               <td>
//                 <span className="pill pill-mode">{p.payment_mode}</span>
//                 {p.transaction_ref && (
//                   <div className="txn-ref-tag" style={{ marginTop: "2px", display: "inline-block" }}>
//                     {p.transaction_ref}
//                   </div>
//                 )}
//               </td>
//               <td className="text-remarks" title={p.remarks}>{p.remarks || "—"}</td>
//             </tr>
//           ))
//         ) : (
//           <tr>
//             <td colSpan="6" className="empty-state" style={{ padding: "1.5rem !important" }}>
//               No historical payroll releases tracked for this profile entry.
//             </td>
//           </tr>
//         )}
//       </tbody>
//     </table>
//   </div>
// </div>
//             </div>

//             <div className="modal-actions">
//               <button
//                 className="btn-corporate-secondary"
//                 onClick={() => setShowSalaryModal(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="btn-corporate-primary"
//                 onClick={handleConfirmSalaryPayment}
//                 disabled={!salarySummary || salarySummary.net_payable <= 0}
//               >
//                 Confirm Payout
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






import React, { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import toast from "react-hot-toast"; // 🚀 Imported toast
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  Search, 
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import "./staffPage.css";
import { useAuthStore } from "../auth/authStore";
import { autoFillDenominations } from "../utils/cashDenominationManager";
import CashDenominationInput, {
  calcDenomTotal,
  emptyDenominations,
} from "../constants/CashDenominationInput";
import {formatDateToDMY} from "../utils/timeFormatter";

export default function StaffPage() {
  const { t } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const [staff, setStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [joiningDate, setJoiningDate] = useState("");

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [advanceAmount, setAdvanceAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [transactionRef, setTransactionRef] = useState("");
  const [remarks, setRemarks] = useState("");

  const [advanceDate, setAdvanceDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [denominations, setDenominations] = useState(emptyDenominations());
  const [denomError, setDenomError] = useState("");

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [advanceHistory, setAdvanceHistory] = useState([]);
  const [selectedStaffHistory, setSelectedStaffHistory] = useState(null);

  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salarySummary, setSalarySummary] = useState(null);
  const [selectedSalaryStaff, setSelectedSalaryStaff] = useState(null);

  const [salaryPaymentMode, setSalaryPaymentMode] = useState("CASH");
  const [salaryTxnRef, setSalaryTxnRef] = useState("");
  const [salaryRemarks, setSalaryRemarks] = useState("");
  const [salaryDate, setSalaryDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [salaryDenominations, setSalaryDenominations] =
    useState(emptyDenominations());
  const [salaryDenomError, setSalaryDenomError] = useState("");
  const salaryDenomTotal = calcDenomTotal(salaryDenominations);

  const [advanceDenominations, setAdvanceDenominations] = useState({});
  const [pastPayments, setPastPayments] = useState([]);

  const denomTotal = calcDenomTotal(denominations);

  const loadStaff = async () => {
    try {
      const result = await invoke("get_staff_cmd");
      setStaff(result || []);
    } catch (err) {
      console.error("Failed to load staff:", err);
      toast.error(t("failed_load_staff", "Failed to retrieve employee ledger list."));
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const filteredStaff = staff.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const nameMatch = s.full_name ? s.full_name.toLowerCase().includes(query) : false;
    const usernameMatch = s.username ? s.username.toLowerCase().includes(query) : false;
    
    return nameMatch || usernameMatch;
  });

  const createStaff = async () => {
    if (
      !username.trim() ||
      !password.trim() ||
      !fullName.trim() ||
      !monthlySalary ||
      !joiningDate
    ) {
      setMsg("Please fill all fields");
      toast.error(t("fill_all_fields", "Please fill all required profile parameters."));
      return;
    }

    try {
      setLoading(true);
      await invoke("create_staff_cmd", {
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        monthlySalary: Number(monthlySalary),
        joiningDate,
        actorUserId: user?.user_id || user?.id || 1,
      });

      toast.success(t("staff_created_success"));
      setMsg(t("staff_created_success"));
      setUsername("");
      setPassword("");
      setFullName("");
      setMonthlySalary("");
      setJoiningDate("");

      loadStaff();
    } catch (err) {
      setMsg(String(err));
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await invoke("toggle_staff_cmd", {
        staffId: id,
        isActive: !isActive,
        actorUserId: user?.user_id || user?.id || 1,
      });
      toast.success(t("status_updated", "Staff access privileges updated successfully."));
      loadStaff();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleAutoFill = async () => {
    const amount = Number(advanceAmount);

    if (!amount || amount <= 0) {
      setDenomError("Enter amount first");
      toast.error("Enter amount first");
      return;
    }

    const result = await autoFillDenominations(amount);

    if (!result.success) {
      const errorMsg = `Unable to make exact amount. Remaining ₹${result.remaining}`;
      setDenomError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const filled = emptyDenominations();
    Object.entries(result.denominations).forEach(([note, qty]) => {
      filled[note] = qty;
    });

    setDenominations(filled);
    setDenomError("");
    toast.success(t("denoms_allocated", "Optimal currency distribution computed."));
  };

  const handleSaveAdvance = async () => {
    if (!advanceAmount || Number(advanceAmount) <= 0) {
      toast.error("Enter a valid advance amount");
      return;
    }

    if (paymentMode === "CASH") {
      const total = calcDenomTotal(denominations);
      if (total !== Number(advanceAmount)) {
        toast.error(`Denomination Total ₹${total} does not match Amount ₹${advanceAmount}`);
        return;
      }
    }

    try {
      const denomArray =
        paymentMode === "CASH"
          ? Object.entries(denominations)
              .map(([note, qty]) => [Number(note), Number(qty)])
              .filter(([, qty]) => qty > 0)
          : [];

      await invoke("create_salary_advance_cmd", {
        userId: selectedStaff.id,
        advanceDate,
        amount: Number(advanceAmount),
        paymentMode,
        transactionRef: paymentMode === "CASH" ? null : transactionRef.trim(),
        remarks: remarks.trim(),
        denominations: denomArray,
        actorUserId: user?.user_id || user?.id || 1,
      });

      toast.success(t("advance_saved", "Salary advance registered in general ledger ledger."));
      setShowAdvanceModal(false);
      loadStaff();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const openAdvanceHistory = async (staffMember) => {
    try {
      const history = await invoke("get_salary_advances_cmd", {
        userId: staffMember.id,
      });
      setSelectedStaffHistory(staffMember);
      setAdvanceHistory(history || []);

      const denomMap = {};
      await Promise.all(
        (history || [])
          .filter((item) => item.payment_mode === "CASH")
          .map(async (item) => {
            try {
              const denoms = await invoke("get_advance_denominations_cmd", {
                advanceId: item.id,
              });
              denomMap[item.id] = denoms || [];
            } catch {
              denomMap[item.id] = [];
            }
          }),
      );

      setAdvanceDenominations(denomMap);
      setShowHistoryModal(true);
    } catch (err) {
      console.error("Advance History Error:", err);
      toast.error(String(err));
    }
  };

  const openSalaryPaymentModal = async (staffMember) => {
    try {
      const summary = await invoke("get_salary_summary_cmd", {
        userId: staffMember.id,
      });
      
      const historicalPayments = await invoke("get_past_salary_payments_cmd", {
        userId: staffMember.id,
      });
      
      setSelectedSalaryStaff(staffMember);
      setSalarySummary(summary);
      setPastPayments(historicalPayments || []); 
      
      setSalaryPaymentMode("CASH");
      setSalaryTxnRef("");
      setSalaryRemarks("");
      setSalaryDenominations(emptyDenominations());
      setSalaryDenomError("");
      setSalaryDate(new Date().toISOString().split("T")[0]);
      setShowSalaryModal(true);
    } catch (err) {
      console.error(err);
      toast.error(t("failed_load_salary_context", "Failed to load payroll parameters summary."));
    }
  };

  const handleConfirmSalaryPayment = async () => {
    try {
      if (!salarySummary || salarySummary.net_payable <= 0) {
        toast.error("No outstanding balance due for processing.");
        return;
      }

      if (salaryPaymentMode === "CASH") {
        const total = calcDenomTotal(salaryDenominations);
        if (total !== salarySummary.net_payable) {
          toast.error(`Denomination total ₹${total} does not match Net Payable ₹${salarySummary.net_payable}`);
          return;
        }
      }

      const denomArray =
        salaryPaymentMode === "CASH"
          ? Object.entries(salaryDenominations)
              .map(([note, qty]) => [Number(note), Number(qty)])
              .filter(([, qty]) => qty > 0)
          : [];

      await invoke("create_salary_payment_cmd", {
        userId: selectedSalaryStaff.id,
        salaryMonth: salaryDate,
        paymentMode: salaryPaymentMode,
        transactionRef: salaryPaymentMode === "CASH" ? null : salaryTxnRef.trim(),
        remarks: salaryRemarks.trim(),
        denominations: denomArray,
        actorUserId: user?.user_id || user?.id || 1,
      });

      toast.success(t("payroll_completed_toast", "Monthly employee payroll disbursement completed."));
      setShowSalaryModal(false);
      loadStaff();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const totalOutstanding = advanceHistory
    .filter((row) => !row.salary_payment_id)
    .reduce((sum, row) => sum + Number(row.amount), 0);

  const totalAdvanceAllTime = advanceHistory.reduce(
    (sum, row) => sum + Number(row.amount),
    0,
  );

  const handleSalaryAutoFill = async () => {
    const amount = salarySummary?.net_payable;
    if (!amount || amount <= 0) return;

    const result = await autoFillDenominations(amount);
    if (!result.success) {
      const errorMsg = `Unable to make exact amount. Remaining ₹${result.remaining}`;
      setSalaryDenomError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const filled = emptyDenominations();
    Object.entries(result.denominations).forEach(([note, qty]) => {
      filled[note] = qty;
    });
    setSalaryDenominations(filled);
    setSalaryDenomError("");
    toast.success(t("denoms_allocated", "Optimal currency distribution computed."));
  };

  return (
    <div className="staff-container">
      <header className="page-header">
        <div className="title-group">
          <Users className="icon-main" />
          <div className="title-text">
            <h1>{t("staff_management")}</h1>
            <p>{t("staff_management_desc")}</p>
          </div>
        </div>
      </header>

      <div className="staff-grid">
        {/* Add Staff */}
        <section className="admin-card" style={{ paddingBottom: "10px" }}>
          <div className="card-header">
            <h3>
              <UserPlus size={18} /> {t("add_new_staff")}
            </h3>
          </div>

          <div className="form-content" style={{ gap: "10px", padding: "14px" }}>
            <div className="form-group" style={{ gap: "2px" }}>
              <label>{t("full_name")}</label>
              <input
                style={{ height: "32px", fontSize: "13px" }}
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ gap: "2px" }}>
              <label>{t("username")}</label>
              <input
                style={{ height: "32px", fontSize: "13px" }}
                placeholder="e.g. john_doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ gap: "2px" }}>
              <label>{t("monthly_salary")}</label>
              <input
                type="number"
                style={{ height: "32px", fontSize: "13px" }}
                placeholder="Monthly Salary"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ gap: "2px" }}>
              <label>{t("joining_date")}</label>
              <input
                type="date"
                style={{ height: "32px", fontSize: "13px" }}
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ gap: "2px" }}>
              <label>{t("security_pin")}</label>
              <input
                type="password"
                style={{ height: "32px", fontSize: "13px" }}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createStaff()}
                disabled={loading}
              />
            </div>

            <button 
              className="btn-primary-staff" 
              style={{ marginTop: "6px", padding: "6px 12px", fontSize: "13px" }}
              onClick={createStaff}
              disabled={loading}
            >
              {loading ? t("processing", "Saving...") : t("create_account")}
            </button>

            {msg && (
              <div
                className={`status-msg ${
                  msg.toLowerCase().includes("success") ? "success" : "error"
                }`}
                style={{ padding: "6px 10px", marginTop: "4px" }}
              >
                {msg.toLowerCase().includes("success") ? (
                  <ShieldCheck size={16} />
                ) : (
                  <ShieldAlert size={16} />
                )}
                <span>{msg}</span>
              </div>
            )}
          </div>
        </section>

        {/* Staff List */}
        <section className="table-card">
          <div className="table-header staff-search-header">
            <h3>{t("active_team_members")}</h3>
            <div className="search-bar-wrapper">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                className="staff-search-input"
                placeholder="Search staff by name or handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>{t("user_details")}</th>
                  <th>{t("status")}</th>
                  <th className="text-right">{t("actions")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredStaff.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="user-info">
                        <div className="avatar">
                          {s.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-meta">
                          <span className="username">
                            {s.full_name || s.username}
                          </span>
                          <span className="user-role-uid">@{s.username}</span>
                          
                          <div className="user-sub-details">
                            <div className="sub-detail-row">
                              Salary: ₹{s.monthly_salary?.toLocaleString("en-IN")}
                            </div>
                            <div className="sub-detail-row joined-date">
                              Joined: {formatDateToDMY(s.joining_date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`pill ${
                          s.is_active ? "pill-active" : "pill-disabled"
                        }`}
                      >
                        {s.is_active ? t("active") : t("disabled")}
                      </span>
                    </td>

                    <td className="text-right">
                      <div className="action-cell">
                        <button
                          className="btn-advance"
                          onClick={() => {
                            setSelectedStaff(s);
                            setAdvanceAmount("");
                            setPaymentMode("CASH");
                            setTransactionRef("");
                            setRemarks("");
                            setDenominations(emptyDenominations());
                            setDenomError("");
                            setShowAdvanceModal(true);
                          }}
                        >
                          <DollarSign size={14} />
                          Salary Advance
                        </button>

                        <button
                          className="btn-action-toggle btn-activate"
                          onClick={() => openAdvanceHistory(s)}
                        >
                          View Advances
                        </button>

                        <button
                          className="btn-pay-salary"
                          onClick={() => openSalaryPaymentModal(s)}
                        >
                          Pay Salary
                        </button>

                        <button
                          className={`btn-action-toggle ${
                            s.is_active ? "btn-deactivate" : "btn-activate"
                          }`}
                          onClick={() => toggleStatus(s.id, s.is_active)}
                        >
                          {s.is_active ? t("deactivate") : t("activate")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan="3" className="empty-state">
                      {searchQuery ? "No matched staff records found." : t("no_staff_accounts")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* SALARY ADVANCE MODAL */}
      {showAdvanceModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content salary-advance-modal">
            <div className="modal-header">
              <h2>Salary Advance</h2>
              <p>
                Record financial disbursements or advance pay for staff entries.
              </p>
            </div>

            <div className="modal-body">
              <div className="modal-row three-cols">
                <div className="form-group">
                  <label>Staff Member</label>
                  <input
                    value={
                      selectedStaff?.full_name || selectedStaff?.username || ""
                    }
                    disabled
                    className="input-disabled"
                  />
                </div>

                <div className="form-group">
                  <label>Advance Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={advanceAmount}
                    onChange={(e) => {
                      setAdvanceAmount(e.target.value);
                      setDenominations(emptyDenominations());
                      setDenomError("");
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => {
                      setPaymentMode(e.target.value);
                      if (e.target.value !== "CASH") {
                        setDenominations(emptyDenominations());
                        setDenomError("");
                      }
                    }}
                  >
                    <option value="CASH">Cash Payment</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  </select>
                </div>
              </div>

              {paymentMode === "CASH" && (
                <div className="denomination-container">
                  <div className="denom-header">
                    <label>Cash Breakdown</label>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={handleAutoFill}
                    >
                      Auto-calculate
                    </button>
                  </div>

                  {denomError && (
                    <div className="error-banner">{denomError}</div>
                  )}

                  <div className="denom-input-wrapper">
                    <CashDenominationInput
                      data={denominations}
                      setData={setDenominations}
                      showTotal={false}
                    />
                  </div>

                  <div className="denom-summary-bar">
                    <span>Total Allocated Cash:</span>
                    <strong
                      className={
                        denomTotal === Number(advanceAmount) && denomTotal > 0
                          ? "match"
                          : "mismatch"
                      }
                    >
                      ₹{denomTotal.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              )}

              {paymentMode !== "CASH" && (
                <div className="form-group">
                  <label>Transaction Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN10293847"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                </div>
              )}

              <div className="modal-row two-cols">
                <div className="form-group">
                  <label>Disbursement Date</label>
                  <input
                    type="date"
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Internal Remarks</label>
                  <textarea
                    rows="1"
                    placeholder="Add notes relating to advance pay..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-corporate-secondary"
                onClick={() => {
                  setShowAdvanceModal(false);
                  setAdvanceAmount("");
                  setPaymentMode("CASH");
                  setTransactionRef("");
                  setRemarks("");
                  setDenominations(emptyDenominations());
                  setDenomError("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn-corporate-primary"
                onClick={handleSaveAdvance}
              >
                Confirm Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVANCE HISTORY MODAL */}
      {showHistoryModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content advance-history-modal">
            <div className="modal-header">
              <h2>Advance History Log</h2>
              <p>Historical salary advances issued to this staff member.</p>
            </div>

            <div className="modal-body">
              <div className="history-summary-strip">
                <div className="summary-block">
                  <span className="label">Employee Name</span>
                  <span className="value">
                    {selectedStaffHistory?.full_name ||
                      selectedStaffHistory?.username}
                  </span>
                </div>

                <div className="summary-block highlight">
                  <span className="label">Outstanding Balance</span>
                  <span className="value text-danger">
                    ₹{totalOutstanding.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="summary-block">
                  <span className="label">All-time Advances</span>
                  <span className="value">
                    ₹{totalAdvanceAllTime.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="table-wrapper embedded-history-table">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th>Ref / Denominations</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advanceHistory.length > 0 ? (
                      advanceHistory.map((item) => {
                        const isCash = item.payment_mode === "CASH";
                        const denoms = advanceDenominations[item.id] || [];

                        return (
                          <tr key={item.id}>
                            <td className="font-medium">
                              {item.advance_date}
                            </td>
                            <td className="font-semibold color-dark">
                              ₹{Number(item.amount).toLocaleString("en-IN")}
                            </td>
                            <td>
                              <span className="pill pill-mode">
                                {item.payment_mode}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`pill ${
                                  item.salary_payment_id
                                    ? "pill-settled"
                                    : "pill-active"
                                  }`}
                              >
                                {item.salary_payment_id
                                  ? "Settled"
                                  : "Outstanding"}
                              </span>
                            </td>
                            <td className="text-muted text-remarks">
                              {isCash ? (
                                denoms.length > 0 ? (
                                  <div className="denom-audit-list">
                                    {denoms.map(([note, qty]) => (
                                      <span
                                        key={note}
                                        className="denom-audit-chip"
                                      >
                                        ₹{note} × {qty} = ₹
                                        {(note * qty).toLocaleString("en-IN")}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted">
                                    No denomination data
                                  </span>
                                )
                              ) : item.transaction_ref ? (
                                <span className="txn-ref-tag">
                                  Ref: {item.transaction_ref}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td
                              style={{
                                fontSize: "13px",
                                color: "#64748b",
                                wordBreak: "break-word",
                                whiteSpace: "normal",
                              }}
                            >
                              {item.remarks || "—"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="empty-state">
                          No advance entries for this staff member.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-corporate-secondary"
                onClick={() => setShowHistoryModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY SALARY PAYMENT MODAL */}
      {showSalaryModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content salary-payment-modal">
            <div className="modal-header">
              <h2>Process Monthly Payroll</h2>
              <p>Review deductions and confirm monthly salary disbursement.</p>
            </div>

            <div className="modal-body">
              <div className="salary-calc-grid">
                <div className="calc-item-card">
                  <span className="label">Staff Member</span>
                  <strong className="value-text">
                    {selectedSalaryStaff?.full_name ||
                      selectedSalaryStaff?.username}
                  </strong>
                </div>

                <div className="calc-item-card">
                  <span className="label">Monthly Salary</span>
                  <strong className="value-text">
                    ₹
                    {salarySummary?.gross_salary?.toLocaleString("en-IN") ||
                      "0"}
                  </strong>
                </div>

                <div className="calc-item-card">
                  <span className="label">Months Due</span>
                  <strong className="value-text">
                    {salarySummary?.months_worked ?? 0} months
                  </strong>
                </div>

                <div className="calc-item-card">
                  <span className="label">Total Salary Due</span>
                  <strong className="value-text">
                    ₹
                    {salarySummary?.total_salary_due?.toLocaleString("en-IN") ||
                      "0"}
                  </strong>
                </div>

                <div className="calc-item-card negative">
                  <span className="label">Already Paid</span>
                  <strong className="value-text text-danger">
                    - ₹
                    {salarySummary?.total_paid?.toLocaleString("en-IN") || "0"}
                  </strong>
                </div>

                <div className="calc-item-card negative">
                  <span className="label">Advances Deducted</span>
                  <strong className="value-text text-danger">
                    - ₹
                    {salarySummary?.advance_amount?.toLocaleString("en-IN") ||
                      "0"}
                  </strong>
                </div>

                <div
                  className="calc-item-card net-payout"
                  style={{ gridColumn: "span 2" }}
                >
                  <span className="label">Net Payable Now</span>
                  <strong
                    className={`value-text ${
                      (salarySummary?.net_payable ?? 0) > 0
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    ₹
                    {salarySummary?.net_payable?.toLocaleString("en-IN") || "0"}
                  </strong>
                </div>
              </div>

              <div className="modal-row three-cols">
                <div className="form-group">
                  <label>Payout Method</label>
                  <select
                    value={salaryPaymentMode}
                    onChange={(e) => setSalaryPaymentMode(e.target.value)}
                  >
                    <option value="CASH">Cash Payment</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Disbursement Date</label>
                  <input
                    type="date"
                    value={salaryDate}
                    onChange={(e) => setSalaryDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Transaction Reference</label>
                  <input
                    type="text"
                    placeholder={
                      salaryPaymentMode === "CASH"
                        ? "N/A (Cash Settlement)"
                        : "e.g. UPI8201934"
                    }
                    disabled={salaryPaymentMode === "CASH"}
                    className={
                      salaryPaymentMode === "CASH" ? "input-disabled" : ""
                    }
                    value={salaryTxnRef}
                    onChange={(e) => setSalaryTxnRef(e.target.value)}
                  />
                </div>
              </div>
              {salaryPaymentMode === "CASH" && (
                <div className="denomination-container">
                  <div className="denom-header">
                    <label>Cash Breakdown</label>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={handleSalaryAutoFill}
                    >
                      Auto-calculate
                    </button>
                  </div>

                  {salaryDenomError && (
                    <div className="error-banner">{salaryDenomError}</div>
                  )}

                  <div className="denom-input-wrapper">
                    <CashDenominationInput
                      data={salaryDenominations}
                      setData={setSalaryDenominations}
                      showTotal={false}
                    />
                  </div>

                  <div className="denom-summary-bar">
                    <span>Total Allocated Cash:</span>
                    <strong
                      className={
                        salaryDenomTotal === salarySummary?.net_payable &&
                        salaryDenomTotal > 0
                          ? "match"
                          : "mismatch"
                      }
                    >
                      ₹{salaryDenomTotal.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>Payout Remarks</label>
                <textarea
                  rows="1"
                  placeholder="Add notes for this payroll release..."
                  value={salaryRemarks}
                  onChange={(e) => setSalaryRemarks(e.target.value)}
                />
              </div>

              <div className="payroll-history-block">
                <div className="payroll-history-header">
                  <h4>Past Payroll Disbursements</h4>
                </div>
                <div className="table-wrapper embedded-history-table">
                  <table className="staff-table payroll-history-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Gross Pay</th>
                        <th>Advances Deducted</th>
                        <th>Net Paid</th>
                        <th>Method / Ref</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastPayments.length > 0 ? (
                        pastPayments.map((p) => (
                          <tr key={p.id}>
                            <td className="font-semibold color-dark">{p.salary_month}</td>
                            <td>₹{p.gross_salary?.toLocaleString("en-IN")}</td>
                            <td className={p.advance_amount > 0 ? "text-danger" : ""}>
                              {p.advance_amount > 0 ? `- ₹${p.advance_amount.toLocaleString("en-IN")}` : "₹0"}
                            </td>
                            <td className="font-bold text-success">₹{p.net_salary?.toLocaleString("en-IN")}</td>
                            <td>
                              <span className="pill pill-mode">{p.payment_mode}</span>
                              {p.transaction_ref && (
                                <div className="txn-ref-tag" style={{ marginTop: "2px", display: "inline-block" }}>
                                  {p.transaction_ref}
                                </div>
                              )}
                            </td>
                            <td className="text-remarks" title={p.remarks}>{p.remarks || "—"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="empty-state" style={{ padding: "1.5rem !important" }}>
                            No historical payroll releases tracked for this profile entry.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-corporate-secondary"
                onClick={() => setShowSalaryModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-corporate-primary"
                onClick={handleConfirmSalaryPayment}
                disabled={!salarySummary || salarySummary.net_payable <= 0}
              >
                Confirm Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}