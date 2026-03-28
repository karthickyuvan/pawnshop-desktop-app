import { useLanguage } from "../../context/LanguageContext";
export default function PaymentTabs({ activeTab, setActiveTab }) {
  const { t } = useLanguage();

    return (
      <div className="payment-tabs">
        <button
          className={`tab-btn ${activeTab === "collect" ? "active" : ""}`}
          onClick={() => setActiveTab("collect")}
        >
          {t("collect_payment")}
        </button>
  
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          {t("payment_history")}
        </button>
      </div>
    );
  }
  