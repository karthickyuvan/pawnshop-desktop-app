import PledgeTableRow from "./PledgeTableRow";
import { useLanguage } from "../../context/LanguageContext";


export default function PledgeTable({ pledges,setActiveMenu ,onPrint}) {

  const {t} = useLanguage();

  return (
    <div className="table-container">
      <table className="pledge-table">
        <thead>
          <tr>
            <th>{t("pledge_number")}</th>
            <th>{t("customer")}</th>
            <th>{t("principal_amount")}</th>
            <th>{t("created_date")}</th>
            <th>{t("due_date")}</th>
            <th>{t("status")}</th>
            <th>{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
        {pledges.map((pledge) => (
        <PledgeTableRow  key={pledge.id}  pledge={pledge} 
        setActiveMenu={setActiveMenu}  onPrint={onPrint} /> ))}

        </tbody>
      </table>
    </div>
  );
}
