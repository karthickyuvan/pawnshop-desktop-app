import { useLanguage } from "../../context/LanguageContext";

export default function ExpenseStatsCards({ stats }) {

  const {t} = useLanguage();

  if (!stats) {
    return <div className="stats-grid">{t("loading_stats")}</div>;
  }

  return (
    <div className="stats-grid">

      <div className="stat-card">
        <div className="stat-title">{t("total_expenses")}</div>
        <div className="stat-value">
          ₹{stats.total_expense.toLocaleString()}
        </div>
        <div className="stat-sub">{t("all_time")}</div>
      </div>

      <div className="stat-card">
        <div className="stat-title">{t("this_month")}</div>
        <div className="stat-value">
          ₹{stats.this_month_expense.toLocaleString()}
        </div>
        <div className="stat-sub">{t("current_month")}</div>
      </div>

      <div className="stat-card">
        <div className="stat-title">{t("total_categories")}</div>
        <div className="stat-value">
          {stats.total_categories}
        </div>
        <div className="stat-sub">{t("active_categories")}</div>
      </div>

      <div className="stat-card">
        <div className="stat-title">{t("total_transactions")}</div>
        <div className="stat-value">
          {stats.total_transactions}
        </div>
        <div className="stat-sub">{t("all_expenses_recorded")}</div>
      </div>

    </div>
  );
}
