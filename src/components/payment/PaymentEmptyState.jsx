import { useLanguage } from "../../context/LanguageContext";

export default function PaymentEmptyState() {

  const { t } = useLanguage();


    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <h3>{t("search_select_pledge")}</h3>
        <p>
        {t("use_search_to_find_pledge")}
        </p>
      </div>
    );
  }
  