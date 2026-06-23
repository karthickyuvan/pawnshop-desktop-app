
// version 3
// src/components/expense/AddExpenseModal.jsx
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { createExpense, getExpenseCategories } from "../../services/expenseApi";
import DenominationTable from "../fund/DenominationTable";
// import "./AddExpenseModal.css"; 
import "../../pages/expense.css";

export default function AddExpenseModal({ user, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [denominations, setDenominations] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    category_id: "",
    description: "",
    payment_mode: "CASH",
    amount: 0,
    expense_date: new Date().toISOString().split("T")[0],
    transaction_ref: "",
  });

  // Load categories on mount
  useEffect(() => {
    getExpenseCategories()
      .then(setCategories)
      .catch((err) => {
        toast.error("Failed to load categories: " + String(err));
      });
  }, []);

  // Calculate cash total from denominations
  const cashTotal = useMemo(() => {
    return Object.entries(denominations).reduce((acc, [key, qty]) => {
      const value = key === "coins"
        ? Number(qty || 0)
        : Number(key) * Number(qty || 0);
      return acc + value;
    }, 0);
  }, [denominations]);

  // Sync amount when in CASH mode
  useEffect(() => {
    if (form.payment_mode === "CASH") {
      setForm((prev) => ({ ...prev, amount: cashTotal }));
    }
  }, [cashTotal, form.payment_mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "payment_mode") {
      setForm((prev) => ({
        ...prev,
        payment_mode: value,
        transaction_ref: "",
        amount: value === "CASH" ? cashTotal : prev.amount,
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const finalDate = form.expense_date === todayStr
      ? now.toISOString()
      : `${form.expense_date}T00:00:00`;

    if (!user?.user_id) { 
      toast.error("User session expired. Please log in again."); 
      return; 
    }
    if (!form.category_id) { 
      toast.error("Please select a category."); 
      return; 
    }
    if (Number(form.amount) <= 0) {
      toast.error(
        form.payment_mode === "CASH"
          ? "Please enter denomination quantities so the amount is greater than zero."
          : "Please enter an amount greater than zero."
      );
      return;
    }
    if (!form.expense_date) { 
      toast.error("Please select an expense date."); 
      return; 
    }

    const needsRef = form.payment_mode === "UPI" || form.payment_mode === "BANK_TRANSFER";
    if (needsRef && !form.transaction_ref.trim()) {
      toast.error(
        form.payment_mode === "UPI"
          ? "Please enter the UPI Transaction ID."
          : "Please enter the Bank Transfer Reference Number."
      );
      return;
    }

    const payload = {
      category_id: Number(form.category_id),
      description: form.description || null,
      payment_mode: form.payment_mode,
      amount: Number(form.amount),
      expense_date: finalDate,
      created_by: Number(user.user_id),
      transaction_ref: form.transaction_ref.trim() || null,
      denominations:
        form.payment_mode === "CASH"
          ? Object.fromEntries(
              Object.entries(denominations).map(([k, v]) => [k, Number(v || 0)])
            )
          : null,
    };

    setIsSubmitting(true);
    try {
      await createExpense(payload);
      toast.success("Expense added successfully!"); // 🚀 Success Feedback
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to create expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUPI    = form.payment_mode === "UPI";
  const isBank   = form.payment_mode === "BANK_TRANSFER";
  const isCash   = form.payment_mode === "CASH";
  const needsRef = isUPI || isBank;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Fixed Header */}
        <header className="modal-header">
          <h2>Add New Expense</h2>
          <button className="close-x" onClick={onClose}>&times;</button>
        </header>

        {/* Main Form container supporting flex */}
        <form onSubmit={handleSubmit}>

          {/* Scrollable Body wrapper */}
          <div className="modal-body-scroll">

            {/* Row 1: Category + Payment Mode */}
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Category *</label>
                <select 
                  name="category_id" 
                  value={form.category_id} 
                  onChange={handleChange} 
                  required 
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Payment Mode</label>
                <select 
                  name="payment_mode" 
                  value={form.payment_mode} 
                  onChange={handleChange}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
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

            {/* UPI / Bank reference input */}
            {needsRef && (
              <div className="form-group flex-column">
                <label>
                  {isUPI ? "UPI Transaction ID *" : "Bank Transfer Reference No *"}
                </label>
                <input
                  name="transaction_ref"
                  placeholder={isUPI ? "e.g. 4123456789012345" : "e.g. NEFT/RTGS reference"}
                  value={form.transaction_ref}
                  onChange={handleChange}
                  className="input-monospace"
                />
                <small>
                  {isUPI
                    ? "Enter the 12-digit UPI transaction reference number"
                    : "Enter the bank transfer reference / UTR number"}
                </small>
              </div>
            )}

            {/* Cash denomination table */}
            {isCash && (
              <div className="cash-breakdown flex-column">
                <label>Denomination Details</label>
                <DenominationTable data={denominations} setData={setDenominations} />
              </div>
            )}

            {/* Row 3: Amount + Date */}
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Total Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  disabled={isCash}
                  className={isCash ? "input-readonly" : ""}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>Expense Date</label>
                <input
                  type="date"
                  name="expense_date"
                  value={form.expense_date}
                  onChange={handleChange}
                  disabled={user?.role === "STAFF"} 
                  className={user?.role === "STAFF" ? "input-readonly" : ""}
                />
              </div>
            </div>

          </div>

          {/* Fixed Footer pinned to the bottom */}
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