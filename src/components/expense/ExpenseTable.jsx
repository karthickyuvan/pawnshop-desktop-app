import { useState, useMemo } from "react";
import { deleteExpense } from "../../services/expenseApi";
import {formatDateTimeIST} from "../../utils/timeFormatter";

export default function ExpenseTable({ expenses, user, reload }) {

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedMode, setSelectedMode] = useState("ALL");

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

      const matchesSearch =
        exp.expense_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "ALL" ||
        exp.category_name === selectedCategory;

      const matchesMode =
        selectedMode === "ALL" ||
        exp.payment_mode === selectedMode;

      return matchesSearch && matchesCategory && matchesMode;
    });
  }, [expenses, searchTerm, selectedCategory, selectedMode]);

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
