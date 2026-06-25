

//version 3 
// src/components/expense/ExpenseTable.jsx

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { deleteExpense } from "../../services/expenseApi";
import { formatDateTimeIST } from "../../utils/timeFormatter";
import { useLanguage } from "../../context/LanguageContext";

export default function ExpenseTable({ expenses, user, reload, onFilter }) {
  const { t } = useLanguage();
  const isStaff = user?.role === "STAFF";

  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getOneWeekAgoStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedMode, setSelectedMode] = useState("ALL");

  // Forces staff into a CUSTOM rolling 7-day date filter range by default
  const [dateFilterType, setDateFilterType] = useState(isStaff ? "CUSTOM" : "ALL");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(isStaff ? getOneWeekAgoStr() : "");
  const [endDate, setEndDate] = useState(isStaff ? getTodayStr() : "");

  // Sync state if user session details load asynchronously
  useEffect(() => {
    if (isStaff) {
      setDateFilterType("CUSTOM");
      setStartDate(getOneWeekAgoStr());
      setEndDate(getTodayStr());
    }
  }, [isStaff]);

  // Track which expense ID is currently pending deletion confirmation
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id) => {
    const actorId = user?.user_id || user?.id;
    if (!actorId) {
      console.error("Delete cancelled: Active User Session ID is missing.");
      toast.error(t("session_expired") || "Session expired. Please log in again."); // 🚀 Guard Toast
      return;
    }

    setIsDeleting(true);
    try {
      await deleteExpense(id, actorId); 
      toast.success(t("expense_deleted_success") || "Expense deleted successfully."); // 🚀 Success Toast
      setPendingDeleteId(null);
      reload();
    } catch (err) {
      console.error("Failed to process transaction deletion:", err);
      toast.error(t("failed_to_delete") || "Failed to delete expense record."); // 🚀 Error Toast
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ NEW: Dynamic range clamping to prevent staff from selecting > 7 days
  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (isStaff && val) {
      const start = new Date(val);
      const end = endDate ? new Date(endDate) : new Date();
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7 || end < start) {
        toast.warning(t("staff_date_restriction") || "Staff are restricted to viewing 7 days max."); // 🚀 Restriction Alert
        const newEnd = new Date(start);
        newEnd.setDate(newEnd.getDate() + 7);
        setEndDate(newEnd.toISOString().split("T")[0]);
      }
    }
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    if (isStaff && val) {
      const end = new Date(val);
      const start = startDate ? new Date(startDate) : new Date();
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7 || end < start) {
        toast.warning(t("staff_date_restriction") || "Staff are restricted to viewing 7 days max."); // 🚀 Restriction Alert
        const newStart = new Date(end);
        newStart.setDate(newStart.getDate() - 7);
        setStartDate(newStart.toISOString().split("T")[0]);
      }
    }
  };

/* ---------------- UNIQUE CATEGORY LIST ---------------- */
  const categoryOptions = useMemo(() => {
    const unique = [...new Set(expenses.map((e) => e.category_name))];
    
    // ✅ NEW: Filter out sensitive category names from the select options for staff
    if (isStaff) {
      return unique.filter((cat) => {
        const lowerCat = cat.toLowerCase();
        return (
          !lowerCat.includes("salary") &&
          !lowerCat.includes("payroll") &&
          !lowerCat.includes("advance") &&
          !lowerCat.includes("investor")
        );
      });
    }
    
    return unique;
  }, [expenses, isStaff]);

  /* ---------------- FILTER LOGIC ---------------- */
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // 🛡️ SECURITY FILTER: Completely hide sensitive payroll, salary, and investor payouts from staff
      if (isStaff) {
        const cat = (exp.category_name || "").toLowerCase();
        const desc = (exp.description || "").toLowerCase();

        if (
          cat.includes("salary") ||
          cat.includes("payroll") ||
          cat.includes("advance") ||
          cat.includes("investor") ||
          desc.includes("salary") ||
          desc.includes("payroll") ||
          desc.includes("advance") ||
          desc.includes("investor")
        ) {
          return false;
        }
      }

      const expenseDate = new Date(exp.expense_date);

      // 🔎 Search Filter
      const matchesSearch =
        exp.expense_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category_name.toLowerCase().includes(searchTerm.toLowerCase());

      // 📂 Category Filter
      const matchesCategory =
        selectedCategory === "ALL" || exp.category_name === selectedCategory;

      // 💳 Mode Filter
      const matchesMode = selectedMode === "ALL" || exp.payment_mode === selectedMode;

      // 📅 Date Filter
      let matchesDate = true;

      if (dateFilterType === "MONTH") {
        matchesDate =
          expenseDate.getMonth() + 1 === selectedMonth &&
          expenseDate.getFullYear() === selectedYear;
      }

      if (dateFilterType === "YEAR") {
        matchesDate = expenseDate.getFullYear() === selectedYear;
      }

      if (dateFilterType === "CUSTOM") {
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);

          matchesDate = expenseDate >= start && expenseDate <= end;
        }
      }

      return matchesSearch && matchesCategory && matchesMode && matchesDate;
    });
  }, [
    expenses,
    searchTerm,
    selectedCategory,
    selectedMode,
    dateFilterType,
    selectedMonth,
    selectedYear,
    startDate,
    endDate,
    isStaff,
  ]);

  useEffect(() => {
    if (onFilter) {
      onFilter(filteredExpenses);
    }
  }, [filteredExpenses, onFilter]);

  return (
    <div className="table-section">
      {/* HEADER */}
      <div className="table-header">
        <h3>{t("expense_transaction_list")}</h3>

        <div className="table-filters">
          <input
            type="text"
            placeholder={t("search_expense")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">{t("all_categories")}</option>
            {categoryOptions.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select value={selectedMode} onChange={(e) => setSelectedMode(e.target.value)}>
            <option value="ALL">{t("all_modes")}</option>
            <option value="CASH">CASH</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            <option value="UPI">UPI</option>
          </select>
          
          <select
            value={dateFilterType}
            onChange={(e) => setDateFilterType(e.target.value)}
          >
            {!isStaff && <option value="ALL">{t("all_dates")}</option>}
            {!isStaff && <option value="MONTH">{t("month")}</option>}
            {!isStaff && <option value="YEAR">{t("year")}</option>}
            <option value="CUSTOM">{t("custom_range")}</option>
          </select>

          {dateFilterType === "MONTH" && !isStaff && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </>
          )}

          {dateFilterType === "YEAR" && !isStaff && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2023, 2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}

          {dateFilterType === "CUSTOM" && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </>
          )}
        </div>
      </div>

      {/* TABLE */}
      <table className="expense-table">
        <thead>
          <tr>
            <th>{t("code")}</th>
            <th>{t("date")}</th>
            <th>{t("category")}</th>
            <th>{t("description")}</th>
            <th>{t("mode")}</th>
            <th>{t("amount")}</th>
            <th>{t("role")}</th>
            {user?.role === "OWNER" && <th>{t("action")}</th>}
          </tr>
        </thead>

        <tbody>
          {filteredExpenses.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                {t("no_expenses_found")}
              </td>
            </tr>
          ) : (
            filteredExpenses.map((exp) => (
              <tr key={exp.id}>
                <td>{exp.expense_code}</td>
                <td>{formatDateTimeIST(exp.expense_date)}</td>
                <td>{exp.category_name}</td>
                <td>{exp.description}</td>
                <td>{exp.payment_mode}</td>
                <td>₹ {exp.amount}</td>
                <td>{exp.created_by_role}</td>

                {user?.role === "OWNER" && (
                  <td>
                    {pendingDeleteId === exp.id ? (
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button
                          className="delete-btn"
                          style={{ background: "#dc2626", padding: "2px 8px", fontSize: "12px" }}
                          disabled={isDeleting}
                          onClick={() => handleDelete(exp.id)}
                        >
                          {isDeleting ? "..." : "Confirm"}
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: "2px 8px", fontSize: "12px" }}
                          disabled={isDeleting}
                          onClick={() => setPendingDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="delete-btn"
                        onClick={() => setPendingDeleteId(exp.id)}
                      >
                        {t("delete")}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}







