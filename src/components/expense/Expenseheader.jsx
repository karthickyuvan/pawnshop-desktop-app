import { useState } from "react";

import AddExpenseModal from "./AddExpenseModal";

export default function ExpenseHeader({ user, reload }) {

  const [open, setOpen] = useState(false);

  
  return (
    <>
      <div className="expense-header">
        <div>
          <h1 className="expense-title">Expense Management</h1>
        </div>

        <div className="expense-header-actions">
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Add Expense
          </button>
        </div>
      </div>

      {open && (
        <AddExpenseModal
          user={user}
          onClose={() => setOpen(false)}
          onSuccess={reload}
        />
      )}
    </>
  );
}
