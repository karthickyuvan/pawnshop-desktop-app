import { useLanguage } from "../../context/LanguageContext";

export default function PaymentHeader() {

  const { t } = useLanguage();

  return (
    <div className="payment-header">
      <div>
        <h1 className="payment-title">{t("payment_collection")}</h1>

        <p className="payment-subtitle">
          {t("collect_payments_active_pledges")}
        </p>
      </div>
    </div>
  );
}