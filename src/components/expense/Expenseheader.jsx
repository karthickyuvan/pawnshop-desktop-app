import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import AddExpenseModal from "./AddExpenseModal";

export default function ExpenseHeader({ user, reload }) {


  const [open, setOpen] = useState(false);
  const {t} = useLanguage();
  
  return (
    <>
      <div className="expense-header">
        <div>
          <h1 className="expense-title">{t("expense_management")}</h1>
        </div>

        <div className="expense-header-actions">
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + {t("add_expense")}
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
