import { useLanguage } from "../../context/LanguageContext";

export default function PledgeSummaryCards({ summary }) {
  const { t } = useLanguage();

  const cards = [
    { label: t("total_pledges"), value: summary.total_pledges, icon: "📋", type: "blue" },
    { label: t("total_amount"), value: `₹${summary.total_amount.toLocaleString()}`, icon: "₹", type: "gold" },
    { label: t("active"), value: summary.active_count, icon: "⏱️", type: "green" },
    { label: t("overdue"), value: summary.overdue_count, icon: "⚠️", type: "red" },
  ];

  return (
    <div className="summary-grid">
      {cards.map((card, index) => (
        <div className="summary-card" key={index}>
          <div className="summary-info">
          <span className="summary-label">{card.label}</span>
          </div>
          {/* <div className={`icon-box icon-${card.type}`}>
            {card.icon}
          </div> */}
          <h2 className="summary-value">{card.value}</h2>
        </div>
      ))}
    </div>
  );
}