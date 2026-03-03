import { useState, useMemo ,useEffect} from "react";
import { deleteExpense } from "../../services/expenseApi";
import {formatDateTimeIST} from "../../utils/timeFormatter";

export default function ExpenseTable({ expenses, user, reload ,onFilter }) {

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedMode, setSelectedMode] = useState("ALL");

  const [dateFilterType, setDateFilterType] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;

    try {
      await deleteExpense(id, user.id);
      reload();
    } catch (err) {
      alert(err);
    }
  };

  /* ---------------- UNIQUE CATEGORY LIST ---------------- */
  const categoryOptions = useMemo(() => {
    const unique = [...new Set(expenses.map(e => e.category_name))];
    return unique;
  }, [expenses]);


      /* ---------------- FILTER LOGIC ---------------- */
    const filteredExpenses = useMemo(() => {
      return expenses.filter((exp) => {

        const expenseDate = new Date(exp.expense_date);

        // 🔎 Search Filter
        const matchesSearch =
          exp.expense_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (exp.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.category_name.toLowerCase().includes(searchTerm.toLowerCase());

        // 📂 Category Filter
        const matchesCategory =
          selectedCategory === "ALL" ||
          exp.category_name === selectedCategory;

        // 💳 Mode Filter
        const matchesMode =
          selectedMode === "ALL" ||
          exp.payment_mode === selectedMode;

        // 📅 Date Filter
        let matchesDate = true;

        if (dateFilterType === "MONTH") {
          matchesDate =
            expenseDate.getMonth() + 1 === selectedMonth &&
            expenseDate.getFullYear() === selectedYear;
        }

        if (dateFilterType === "YEAR") {
          matchesDate =
            expenseDate.getFullYear() === selectedYear;
        }

        if (dateFilterType === "CUSTOM") {
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            matchesDate = expenseDate >= start && expenseDate <= end;
          }
        }

        return (
          matchesSearch &&
          matchesCategory &&
          matchesMode &&
          matchesDate
        );
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
      endDate
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
        <h3>Expense Transactions List</h3>

        <div className="table-filters">
          <input
            type="text"
            placeholder="Search code, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categoryOptions.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
          >
            <option value="ALL">All Modes</option>
            <option value="CASH">CASH</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            <option value="UPI">UPI</option>
          </select>
          <select
          value={dateFilterType}
          onChange={(e) => setDateFilterType(e.target.value)}
        >
          <option value="ALL">All Dates</option>
          <option value="MONTH">Month</option>
          <option value="YEAR">Year</option>
          <option value="CUSTOM">Custom Range</option>
        </select>

        {dateFilterType === "MONTH" && (
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

        {dateFilterType === "YEAR" && (
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
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </>
        )}
        </div>
      </div>

      {/* TABLE */}
      <table className="expense-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th>Mode</th>
            <th>Amount</th>
            <th>Role</th>
            {user?.role === "OWNER" && <th>Action</th>}
          </tr>
        </thead>

        <tbody>
          {filteredExpenses.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                No expenses found
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
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(exp.id)}
                    >
                      Delete
                    </button>
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
