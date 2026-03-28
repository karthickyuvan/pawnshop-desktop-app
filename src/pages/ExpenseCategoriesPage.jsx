import React, { useState, useEffect } from "react";
import {
  createExpenseCategory,
  getExpenseCategories,
  updateExpenseCategory,
  toggleExpenseCategoryStatus,
} from "../services/expenseApi";

import "./expenseCategories.css";

function ExpenseCategories() {
  const [name, setName] = useState("");
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);

  const loadCategories = async () => {
    const data = await getExpenseCategories();
    setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;

    if (editId) {
      await updateExpenseCategory(editId, name);
      setEditId(null);
    } else {
      await createExpenseCategory(name);
    }

    setName("");
    loadCategories();
  };

  const handleEdit = (cat) => {
    setName(cat.name);
    setEditId(cat.id);
  };

  const handleToggle = async (cat) => {
    const newStatus = cat.is_active === 1 ? 0 : 1;
    await toggleExpenseCategoryStatus(cat.id, newStatus);
    loadCategories();
  };

  return (
    <div className="expense-page">

      {/* Page Header */}
      <div className="expense-header">
        <h1>Expense Categories</h1>
        <p>Manage your pawnshop expense categories</p>
      </div>

      {/* Card */}
      <div className="expense-card">

        <div className="add-section">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
          />

          <button onClick={handleAdd}>
            {editId ? "Update Category" : "Add Category"}
          </button>
        </div>

        <table className="expense-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((cat, index) => (
              <tr key={cat.id}>
                <td>{index + 1}</td>

                <td>{cat.name}</td>

                <td>
                  <span
                    className={
                      Number(cat.is_active) === 1
                        ? "status active"
                        : "status inactive"
                    }
                  >
                    {Number(cat.is_active) === 1 ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(cat)}
                  >
                    Edit
                  </button>

                  <button
                    className="disable-btn"
                    onClick={() => handleToggle(cat)}
                  >
                    {cat.is_active === 1 ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}

export default ExpenseCategories;