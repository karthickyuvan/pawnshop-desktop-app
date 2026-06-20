// // src/components/fund/FundLedger.jsx

// import React, { useEffect, useState, useMemo, useCallback } from "react";
// import { getFundLedger } from "../services/fundServiceApi";
// import "./fundLedger.css";
// import { formatTransactionTimestamp } from "../utils/timeFormatter";
// import { useLanguage } from "../context/LanguageContext";
// import { useAuthStore } from "../auth/authStore"; 

// export default function FundLedger({ refreshTrigger, user }) {
//   const storeUser = useAuthStore((s) => s.user);
//   const activeUser = user || storeUser; 
//   const isStaff = activeUser?.role === "STAFF"; // Evaluates user role

//   const { t } = useLanguage();
//   const rowsPerPage = 10;

//   // Helper date calculation functions
//   const getTodayStr = () => new Date().toISOString().split("T")[0];
//   const getOneWeekAgoStr = () => {
//     const d = new Date();
//     d.setDate(d.getDate() - 7);
//     return d.toISOString().split("T")[0];
//   };

//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Initialize dates with staff 1-week constraints
//   const [fromDate, setFromDate] = useState(isStaff ? getOneWeekAgoStr() : "");
//   const [toDate, setToDate] = useState(isStaff ? getTodayStr() : "");
//   const [modeFilter, setModeFilter] = useState("ALL");
//   const [typeFilter, setTypeFilter] = useState("ALL");
//   const [currentPage, setCurrentPage] = useState(1);

//   // Sync state if user role resolves asynchronously
//   useEffect(() => {
//     if (isStaff) {
//       setFromDate(getOneWeekAgoStr());
//       setToDate(getTodayStr());
//     }
//   }, [isStaff]);

//   /* =============================
//      DATA FETCH
//   ============================= */
//   const loadData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const data = await getFundLedger();
//       setRows(data || []);
//     } catch (err) {
//       console.error("Ledger Fetch Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData, refreshTrigger]);

//   /* =============================
//      HELPERS
//   ============================= */
//   const normalizeType = (raw) => {
//     const t = String(raw).toUpperCase();
//     if (t === "ADD") return "CREDIT";
//     if (t === "WITHDRAW") return "DEBIT";
//     return t;
//   };

//   const formatMoney = (amount) =>
//     Number(amount).toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });

//   // ✅ NEW: Dynamic range clamping to prevent staff from selecting > 7 days
//   const handleFromDateChange = (val) => {
//     setFromDate(val);
//     if (isStaff && val) {
//       const start = new Date(val);
//       const end = toDate ? new Date(toDate) : new Date();
//       const diffTime = Math.abs(end - start);
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
//       // If the selected range exceeds 7 days or is inverted, clamp the end date
//       if (diffDays > 7 || end < start) {
//         const newEnd = new Date(start);
//         newEnd.setDate(newEnd.getDate() + 7);
//         setToDate(newEnd.toISOString().split("T")[0]);
//       }
//     }
//   };

//   const handleToDateChange = (val) => {
//     setToDate(val);
//     if (isStaff && val) {
//       const end = new Date(val);
//       const start = fromDate ? new Date(fromDate) : new Date();
//       const diffTime = Math.abs(end - start);
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
//       // If selected range exceeds 7 days or is inverted, clamp the start date
//       if (diffDays > 7 || end < start) {
//         const newStart = new Date(end);
//         newStart.setDate(newStart.getDate() - 7);
//         setFromDate(newStart.toISOString().split("T")[0]);
//       }
//     }
//   };

//   /* =============================
//      FILTERED DATA VIA SNAPSHOTS MAPS
//   ============================= */
//   const filteredRows = useMemo(() => {
//     return rows.filter((r) => {
//       if (!r[5]) return false;

//       // SECURITY FILTER: Dynamically hide investor and payroll-sensitive transactions from staff
//       if (isStaff) {
//         const ref = (r[3] || "").toUpperCase();    // Index 3: Reference (String)
//         const desc = (r[4] || "").toUpperCase();   // Index 4: Description (String)
//         const method = (r[6] || "").toUpperCase(); // Index 6: Payment Method (String)
        
//         // 1. Hide all Owner & Investor Capital moves
//         if (
//           ref.startsWith("INV") ||
//           ref.startsWith("CAPITAL") ||
//           desc.includes("INVESTOR") ||
//           desc.includes("CAPITAL") ||
//           method === "AUCTION" // Auction recovery is owner-only
//         ) {
//           return false;
//         }

//         // 2. Hide all Salary, Advances, and Payroll payouts
//         if (
//           desc.includes("SALARY") ||
//           desc.includes("PAYROLL") ||
//           desc.includes("ADVANCE") ||
//           ref.includes("ADVANCE") ||
//           ref.includes("PAYROLL")
//         ) {
//           return false;
//         }
//       }
      
//       const transactionDate = new Date(r[5]);
//       const typeKey = String(r[1]).toUpperCase(); 
//       const normalizedTypeKey = typeKey === "ADD" ? "CREDIT" : typeKey === "WITHDRAW" ? "DEBIT" : typeKey;
//       const mode = (r[6] || "CASH").toUpperCase();

//       if (fromDate) {
//         const start = new Date(fromDate);
//         start.setHours(0, 0, 0, 0);
//         const txCheck = new Date(transactionDate);
//         txCheck.setHours(0, 0, 0, 0);
//         if (txCheck < start) return false;
//       }

//       if (toDate) {
//         const end = new Date(toDate);
//         end.setHours(23, 59, 59, 999);
//         const txCheck = new Date(transactionDate);
//         if (txCheck > end) return false;
//       }

//       if (modeFilter !== "ALL" && mode !== modeFilter) return false;
//       if (typeFilter !== "ALL" && normalizedTypeKey !== typeFilter) return false;

//       return true;
//     });
//   }, [rows, fromDate, toDate, modeFilter, typeFilter, isStaff]);

//   /* =============================
//      TOTALS
//   ============================= */
//   const totals = useMemo(() => {
//     let credit = 0;
//     let debit = 0;

//     filteredRows.forEach((r) => {
//       const typeKey = normalizeType(r[1]);
//       if (typeKey === "CREDIT") credit += Number(r[2]);
//       if (typeKey === "DEBIT") debit += Number(r[2]);
//     });

//     return { credit, debit };
//   }, [filteredRows]);

//   /* =============================
//      PAGINATION
//   ============================= */
//   const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

//   const paginatedRows = useMemo(() => {
//     const start = (currentPage - 1) * rowsPerPage;
//     return filteredRows.slice(start, start + rowsPerPage);
//   }, [filteredRows, currentPage]);

//   const resetFilters = () => {
//     // ✅ Re-apply 1-week safety window upon reset if user is staff
//     if (isStaff) {
//       setFromDate(getOneWeekAgoStr());
//       setToDate(getTodayStr());
//     } else {
//       setFromDate("");
//       setToDate("");
//     }
//     setModeFilter("ALL");
//     setTypeFilter("ALL");
//     setCurrentPage(1);
//   };

//   return (
//     <div className="fund-card">
//       <div className="card-header-row">
//         <h3>{t("transaction_history")}</h3>
//         <button className="page-btn" onClick={loadData} disabled={loading}>
//           {loading ? t("syncing") : t("refresh")}
//         </button>
//       </div>

//       {/* FILTER BAR */}
//       <div className="filter-bar">
//         <div className="filter-group">
//           <label>{t("from_date")}</label>
//           {/* ✅ Uses custom clamped input handler */}
//           <input type="date" value={fromDate} onChange={(e) => handleFromDateChange(e.target.value)} />
//         </div>

//         <div className="filter-group">
//           <label>{t("to_date")}</label>
//           {/* ✅ Uses custom clamped input handler */}
//           <input type="date" value={toDate} onChange={(e) => handleToDateChange(e.target.value)} />
//         </div>

//         <div className="filter-group">
//           <label>{t("type")}</label>
//           <select
//             value={typeFilter}
//             onChange={(e) => {
//               setTypeFilter(e.target.value);
//               setCurrentPage(1);
//             }}
//           >
//             <option value="ALL">{t("all_types")}</option>
//             <option value="CREDIT">{t("credit")} (+)</option>
//             <option value="DEBIT">{t("debit")} (-)</option>
//           </select>
//         </div>

//         <div className="filter-group">
//           <label>{t("mode")}</label>
//           <select
//             value={modeFilter}
//             onChange={(e) => {
//               setModeFilter(e.target.value);
//               setCurrentPage(1);
//             }}
//           >
//             <option value="ALL">{t("all_modes")}</option>
//             <option value="CASH">{t("cash")}</option>
//             <option value="UPI">{t("upi")}</option>
//             <option value="BANK">{t("bank")}</option>
//           </select>
//         </div>

//         <button className="page-btn" onClick={resetFilters}>
//           {t("reset")}
//         </button>
//       </div>

//       {/* SUMMARY CONTAINER */}
//       <div className="summary-container">
//         <div className="text-muted">
//           {t("found")} <b>{filteredRows.length}</b> {t("transactions")}
//         </div>

//         {/* HIDE: Total inflows/outflows pills are hidden for staff to protect ledger metrics */}
//         {!isStaff && (
//           <div className="totals-bar">
//             <div className="stat-pill pill-success">
//               {t("money_in")}: ₹{formatMoney(totals.credit)}
//             </div>
//             <div className="stat-pill pill-danger">
//               {t("money_out")}: ₹{formatMoney(totals.debit)}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* TABLE WORKFLOW SHEET */}
//       <div className="table-wrapper">
//         <table className="ledger-table">
//           <thead>
//             <tr>
//               <th>{t("timestamp")}</th>
//               <th>{t("type")}</th>
//               <th>{t("method")}</th>
//               <th>{t("amount")}</th>
//               <th>{t("narration")}</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan="5" style={{ textAlign: "center", padding: "60px" }}>
//                   {t("updating_ledger")}
//                 </td>
//               </tr>
//             ) : paginatedRows.length === 0 ? (
//               <tr>
//                 <td colSpan="5" style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
//                   {t("no_matching_records")}
//                 </td>
//               </tr>
//             ) : (
//               paginatedRows.map((r) => {
//                 const typeKey = normalizeType(r[1]);
//                 const isAuctionItem = String(r[4]).startsWith("🔨");
                
//                 return (
//                   <tr key={r[0]} className={isAuctionItem ? "auction-ledger-row" : ""}>
//                     <td style={{ color: "#64748b", fontSize: "13px", whiteSpace: "nowrap" }}>
//                       {formatTransactionTimestamp(r[5])}
//                     </td>

//                     <td>
//                       <span className={`status-badge ${typeKey === "CREDIT" ? "badge-success" : "badge-danger"}`}>
//                         {typeKey}
//                       </span>
//                     </td>

//                     <td style={{ fontWeight: 600 }}>{r[6] || "CASH"}</td>

//                     <td style={{ textAlign: "right" }}>
//                       {typeKey === "CREDIT" ? (
//                         <span className="text-success">+ ₹{formatMoney(r[2])}</span>
//                       ) : (
//                         <span className="text-danger">− ₹{formatMoney(r[2])}</span>
//                       )}
//                     </td>

//                     <td style={{ color: isAuctionItem ? "#b45309" : "#475569", fontWeight: isAuctionItem ? 600 : 400 }}>
//                       {r[4]}
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* PAGINATION PANEL CONTROLS */}
//       <div className="pagination-bar">
//         <div className="text-muted" style={{ fontSize: "14px" }}>
//           {t("page")} <b>{currentPage}</b> {t("of")} <b>{totalPages || 1}</b>
//         </div>

//         <div style={{ display: "flex", gap: "8px" }}>
//           <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
//             Previous
//           </button>
//           <button className="page-btn" disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => p + 1)}>
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



// src/components/fund/FundLedger.jsx

import React, { useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { getFundLedger } from "../services/fundServiceApi";
import "./fundLedger.css";
import { formatTransactionTimestamp } from "../utils/timeFormatter";
import { useLanguage } from "../context/LanguageContext";
import { useAuthStore } from "../auth/authStore"; 

export default function FundLedger({ refreshTrigger, user }) {
  const storeUser = useAuthStore((s) => s.user);
  const activeUser = user || storeUser; 
  const isStaff = activeUser?.role === "STAFF"; // Evaluates user role

  const { t } = useLanguage();
  const rowsPerPage = 10;

  // Helper date calculation functions
  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getOneWeekAgoStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  };

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize dates with staff 1-week constraints
  const [fromDate, setFromDate] = useState(isStaff ? getOneWeekAgoStr() : "");
  const [toDate, setToDate] = useState(isStaff ? getTodayStr() : "");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Sync state if user role resolves asynchronously
  useEffect(() => {
    if (isStaff) {
      setFromDate(getOneWeekAgoStr());
      setToDate(getTodayStr());
    }
  }, [isStaff]);

  /* =============================
     DATA FETCH
  ============================= */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFundLedger();
      setRows(data || []);
    } catch (err) {
      console.error("Ledger Fetch Error:", err);
      toast.error(t("ledger_fetch_failed", "Failed to retrieve baseline ledger registries.")); // 🚀 Async Load failure toast
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const handleManualRefresh = async () => {
    await loadData();
    toast.success(t("ledger_refreshed", "Ledger statement updated successfully!")); // 🚀 Success trigger response
  };

  /* =============================
     HELPERS
  ============================= */
  const normalizeType = (raw) => {
    const t = String(raw).toUpperCase();
    if (t === "ADD") return "CREDIT";
    if (t === "WITHDRAW") return "DEBIT";
    return t;
  };

  const formatMoney = (amount) =>
    Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ✅ NEW: Dynamic range clamping to prevent staff from selecting > 7 days
  const handleFromDateChange = (val) => {
    setFromDate(val);
    if (isStaff && val) {
      const start = new Date(val);
      const end = toDate ? new Date(toDate) : new Date();
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If the selected range exceeds 7 days or is inverted, clamp the end date
      if (diffDays > 7 || end < start) {
        const newEnd = new Date(start);
        newEnd.setDate(newEnd.getDate() + 7);
        setToDate(newEnd.toISOString().split("T")[0]);
        toast.error(t("staff_range_clamped_from", "Staff access limited to a 7-day range threshold. Adjusted End Date.")); // 🚀 Rule Clamp Alert Toast
      }
    }
  };

  const handleToDateChange = (val) => {
    setToDate(val);
    if (isStaff && val) {
      const end = new Date(val);
      const start = fromDate ? new Date(fromDate) : new Date();
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If selected range exceeds 7 days or is inverted, clamp the start date
      if (diffDays > 7 || end < start) {
        const newStart = new Date(end);
        newStart.setDate(newStart.getDate() - 7);
        setFromDate(newStart.toISOString().split("T")[0]);
        toast.error(t("staff_range_clamped_to", "Staff access limited to a 7-day range threshold. Adjusted Start Date.")); // 🚀 Rule Clamp Alert Toast
      }
    }
  };

  /* =============================
     FILTERED DATA VIA SNAPSHOTS MAPS
  ============================= */
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (!r[5]) return false;

      // SECURITY FILTER: Dynamically hide investor and payroll-sensitive transactions from staff
      if (isStaff) {
        const ref = (r[3] || "").toUpperCase();    // Index 3: Reference (String)
        const desc = (r[4] || "").toUpperCase();   // Index 4: Description (String)
        const method = (r[6] || "").toUpperCase(); // Index 6: Payment Method (String)
        
        // 1. Hide all Owner & Investor Capital moves
        if (
          ref.startsWith("INV") ||
          ref.startsWith("CAPITAL") ||
          desc.includes("INVESTOR") ||
          desc.includes("CAPITAL") ||
          method === "AUCTION" // Auction recovery is owner-only
        ) {
          return false;
        }

        // 2. Hide all Salary, Advances, and Payroll payouts
        if (
          desc.includes("SALARY") ||
          desc.includes("PAYROLL") ||
          desc.includes("ADVANCE") ||
          ref.includes("ADVANCE") ||
          ref.includes("PAYROLL")
        ) {
          return false;
        }
      }
      
      const transactionDate = new Date(r[5]);
      const typeKey = String(r[1]).toUpperCase(); 
      const normalizedTypeKey = typeKey === "ADD" ? "CREDIT" : typeKey === "WITHDRAW" ? "DEBIT" : typeKey;
      const mode = (r[6] || "CASH").toUpperCase();

      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const txCheck = new Date(transactionDate);
        txCheck.setHours(0, 0, 0, 0);
        if (txCheck < start) return false;
      }

      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        const txCheck = new Date(transactionDate);
        if (txCheck > end) return false;
      }

      if (modeFilter !== "ALL" && mode !== modeFilter) return false;
      if (typeFilter !== "ALL" && normalizedTypeKey !== typeFilter) return false;

      return true;
    });
  }, [rows, fromDate, toDate, modeFilter, typeFilter, isStaff]);

  /* =============================
     TOTALS
  ============================= */
  const totals = useMemo(() => {
    let credit = 0;
    let debit = 0;

    filteredRows.forEach((r) => {
      const typeKey = normalizeType(r[1]);
      if (typeKey === "CREDIT") credit += Number(r[2]);
      if (typeKey === "DEBIT") debit += Number(r[2]);
    });

    return { credit, debit };
  }, [filteredRows]);

  /* =============================
     PAGINATION
  ============================= */
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage]);

  const resetFilters = () => {
    // Re-apply 1-week safety window upon reset if user is staff
    if (isStaff) {
      setFromDate(getOneWeekAgoStr());
      setToDate(getTodayStr());
    } else {
      setFromDate("");
      setToDate("");
    }
    setModeFilter("ALL");
    setTypeFilter("ALL");
    setCurrentPage(1);
    toast.success(t("filters_reset", "Ledger query limits dropped back to defaults.")); // 🚀 Reset Confirmation Toast
  };

  return (
    <div className="fund-card">
      <div className="card-header-row">
        <h3>{t("transaction_history")}</h3>
        <button className="page-btn" onClick={handleManualRefresh} disabled={loading}>
          {loading ? t("syncing") : t("refresh")}
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>{t("from_date")}</label>
          <input type="date" value={fromDate} onChange={(e) => handleFromDateChange(e.target.value)} />
        </div>

        <div className="filter-group">
          <label>{t("to_date")}</label>
          <input type="date" value={toDate} onChange={(e) => handleToDateChange(e.target.value)} />
        </div>

        <div className="filter-group">
          <label>{t("type")}</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">{t("all_types")}</option>
            <option value="CREDIT">{t("credit")} (+)</option>
            <option value="DEBIT">{t("debit")} (-)</option>
          </select>
        </div>

        <div className="filter-group">
          <label>{t("mode")}</label>
          <select
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">{t("all_modes")}</option>
            <option value="CASH">{t("cash")}</option>
            <option value="UPI">{t("upi")}</option>
            <option value="BANK">{t("bank")}</option>
          </select>
        </div>

        <button className="page-btn" onClick={resetFilters}>
          {t("reset")}
        </button>
      </div>

      {/* SUMMARY CONTAINER */}
      <div className="summary-container">
        <div className="text-muted">
          {t("found")} <b>{filteredRows.length}</b> {t("transactions")}
        </div>

        {/* HIDE: Total inflows/outflows pills are hidden for staff to protect ledger metrics */}
        {!isStaff && (
          <div className="totals-bar">
            <div className="stat-pill pill-success">
              {t("money_in")}: ₹{formatMoney(totals.credit)}
            </div>
            <div className="stat-pill pill-danger">
              {t("money_out")}: ₹{formatMoney(totals.debit)}
            </div>
          </div>
        )}
      </div>

      {/* TABLE WORKFLOW SHEET */}
      <div className="table-wrapper">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>{t("timestamp")}</th>
              <th>{t("type")}</th>
              <th>{t("method")}</th>
              <th>{t("amount")}</th>
              <th>{t("narration")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "60px" }}>
                  {t("updating_ledger")}
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                  {t("no_matching_records")}
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const typeKey = normalizeType(r[1]);
                const isAuctionItem = String(r[4]).startsWith("🔨");
                
                return (
                  <tr key={r[0]} className={isAuctionItem ? "auction-ledger-row" : ""}>
                    <td style={{ color: "#64748b", fontSize: "13px", whiteSpace: "nowrap" }}>
                      {formatTransactionTimestamp(r[5])}
                    </td>

                    <td>
                      <span className={`status-badge ${typeKey === "CREDIT" ? "badge-success" : "badge-danger"}`}>
                        {typeKey}
                      </span>
                    </td>

                    <td style={{ fontWeight: 600 }}>{r[6] || "CASH"}</td>

                    <td style={{ textAlign: "right" }}>
                      {typeKey === "CREDIT" ? (
                        <span className="text-success">+ ₹{formatMoney(r[2])}</span>
                      ) : (
                        <span className="text-danger">− ₹{formatMoney(r[2])}</span>
                      )}
                    </td>

                    <td style={{ color: isAuctionItem ? "#b45309" : "#475569", fontWeight: isAuctionItem ? 600 : 400 }}>
                      {r[4]}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION PANEL CONTROLS */}
      <div className="pagination-bar">
        <div className="text-muted" style={{ fontSize: "14px" }}>
          {t("page")} <b>{currentPage}</b> {t("of")} <b>{totalPages || 1}</b>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
            Previous
          </button>
          <button className="page-btn" disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}