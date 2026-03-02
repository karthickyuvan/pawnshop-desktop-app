

import { useState, useEffect, useMemo } from "react";
import { createExpense, getExpenseCategories } from "../../services/expenseApi";
import DenominationTable from "../fund/DenominationTable";

export default function AddExpenseModal({ user, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [denominations, setDenominations] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null); // ← show errors in UI, not just alert
  const [form, setForm] = useState({
    category_id: "",
    description: "",
    payment_mode: "CASH",
    amount: 0,
    expense_date: new Date().toISOString().split("T")[0],
  });

  // Load categories on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getExpenseCategories();
        console.log("✅ Categories loaded:", data);
        setCategories(data);
      } catch (err) {
        console.error("❌ Failed to load categories:", err);
        setError("Failed to load categories: " + String(err));
      }
    };
    loadData();
  }, []);

  // Calculate Cash Total from denominations
  const cashTotal = useMemo(() => {
    return Object.entries(denominations).reduce((acc, [key, qty]) => {
      const value =
        key === "coins"
          ? Number(qty || 0)
          : Number(key) * Number(qty || 0);
      return acc + value;
    }, 0);
  }, [denominations]);

  // Sync amount field when in CASH mode
  useEffect(() => {
    if (form.payment_mode === "CASH") {
      setForm((prev) => ({ ...prev, amount: cashTotal }));
    }
  }, [cashTotal, form.payment_mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    console.log("🟡 Submit clicked");
    console.log("  user:", user);
    console.log("  form:", form);
    console.log("  denominations:", denominations);


    // --- BUILD THE CORRECT DATE WITH TIME ---
  let finalDate = form.expense_date;
  const now = new Date();
  const todayDateString = now.toISOString().split("T")[0];

  // If user is adding an expense for TODAY, use the current full timestamp
  if (finalDate === todayDateString) {
    finalDate = now.toISOString(); // Example: 2026-02-26T13:30:00.000Z
  } else {
    // If they picked a different day, save it as midnight for that day
    finalDate = `${finalDate}T00:00:00`;
  }

    // --- VALIDATION ---
    if (!user?.user_id) {
      setError("User session expired. Please log in again.");
      return;
    }

    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }

    if (Number(form.amount) <= 0) {
      setError(
        form.payment_mode === "CASH"
          ? "Please enter denomination quantities so the amount is greater than zero."
          : "Please enter an amount greater than zero."
      );
      return;
    }

    if (!form.expense_date) {
      setError("Please select an expense date.");
      return;
    }

    // --- BUILD PAYLOAD ---
    const payload = {
      category_id: Number(form.category_id),
      description: form.description || null,
      payment_mode: form.payment_mode,
      amount: Number(form.amount),
      expense_date: finalDate,
      created_by: Number(user.user_id),
      denominations:
        form.payment_mode === "CASH"
          ? Object.fromEntries(
              Object.entries(denominations).map(([k, v]) => [k, Number(v || 0)])
            )
          : null,
    };

    console.log("📦 Payload to send:", JSON.stringify(payload, null, 2));

    setIsSubmitting(true);

    try {
      const result = await createExpense(payload);
      console.log("✅ Expense created:", result);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("❌ Create Expense Error:", err);
      // Tauri errors come back as strings
      const message = typeof err === "string" ? err : JSON.stringify(err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Add New Expense</h2>
          <button className="close-x" onClick={onClose}>
            &times;
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body">

          {/* ERROR BANNER */}
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                color: "#b91c1c",
                borderRadius: "6px",
                padding: "10px 14px",
                marginBottom: "12px",
                fontSize: "14px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Row 1: Category and Payment Mode */}
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Payment Mode</label>
              <select
                name="payment_mode"
                value={form.payment_mode}
                onChange={handleChange}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI / Digital</option>
              </select>
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="form-group">
            <label>Description</label>
            <input
              name="description"
              placeholder="What was this for?"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          {/* Conditional Cash Table */}
          {form.payment_mode === "CASH" && (
            <div className="cash-breakdown">
              <label>Denomination Details</label>
              <DenominationTable
                data={denominations}
                setData={setDenominations}
              />
            </div>
          )}

          {/* Row 3: Amount and Date */}
          <div className="form-row">
            <div className="form-group">
              <label>Total Amount</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                disabled={form.payment_mode === "CASH"}
                className={
                  form.payment_mode === "CASH" ? "input-readonly" : ""
                }
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Expense Date</label>
              <input
                type="date"
                name="expense_date"
                value={form.expense_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <footer className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Expense"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}