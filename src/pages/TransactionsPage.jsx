import FundLedger from "./FundLedger";
import { useLanguage } from "../context/LanguageContext";


export default function HomePage() {
    const { t } = useLanguage();
    return (

        <>
            <h2>{t("transactions")}</h2>
            <FundLedger />
        </>
    );
  }
  