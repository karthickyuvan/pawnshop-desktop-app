

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import {
  createExpenseCategory,
  getExpenseCategories,
  updateExpenseCategory,
  toggleExpenseCategoryStatus,
} from "../services/expenseApi";

import "./expenseCategories.css";

function ExpenseCategories() {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [name, setName] = useState("");
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false); // 🚀 Added to prevent double submissions

  const loadCategories = async () => {
    try {
      const data = await getExpenseCategories();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
      toast.error(t("failed_load_categories", "Failed to load expense categories."));
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error(t("category_name_required", "Please enter a category name."));
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        await updateExpenseCategory(editId, name.trim());
        toast.success(t("category_updated_success", "Category updated successfully!"));
        setEditId(null);
      } else {
        await createExpenseCategory(name.trim());
        toast.success(t("category_created_success", "New category added successfully!"));
      }

      setName("");
      await loadCategories();
    } catch (err) {
      console.error(err);
      toast.error(t("operation_failed", "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat) => {
    setName(cat.name);
    setEditId(cat.id);
    toast.success(t("edit_mode_active", "Category loaded into input field."));
  };

  const handleToggle = async (cat) => {
    const newStatus = cat.is_active === 1 ? 0 : 1;
    try {
      await toggleExpenseCategoryStatus(cat.id, newStatus);
      toast.success(
        newStatus === 1 
          ? t("category_enabled", "Category enabled successfully!") 
          : t("category_disabled", "Category disabled successfully!")
      );
      await loadCategories();
    } catch (err) {
      console.error(err);
      toast.error(t("status_update_failed", "Failed to update category status."));
    }
  };

  return (
    <div className="expense-page">

      {/* Page Header */}
      <div className="expense-header">
        <h1>{t("expense_categories")}</h1>
        <p>{t("expense_categories_desc", "Manage your pawnshop expense categories")}</p>
      </div>

      {/* Card */}
      <div className="expense-card">

        <div className="add-section">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("enter_category_placeholder", "Enter category name")}
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />

          <button onClick={handleAdd} disabled={loading}>
            {editId ? t("update_category", "Update Category") : t("add_category", "Add Category")}
          </button>
        </div>

        <table className="expense-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t("category")}</th>
              <th>{t("status")}</th>
              <th>{t("action")}</th>
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
                    {Number(cat.is_active) === 1 ? t("active") : t("disabled")}
                  </span>
                </td>

                <td className="actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(cat)}
                  >
                    {t("edit")}
                  </button>

                  <button
                    className="disable-btn"
                    onClick={() => handleToggle(cat)}
                  >
                    {Number(cat.is_active) === 1 ? t("disable") : t("enable")}
                  </button>
                </td>
              </tr>
            ))}

            {categories.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                  {t("no_categories_found", "No expense categories found.")}
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}

export default ExpenseCategories;