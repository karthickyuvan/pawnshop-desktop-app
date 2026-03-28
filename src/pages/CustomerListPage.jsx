import { useEffect, useState } from "react";
import { searchCustomers } from "../services/customerApi";
import "./CustomerListPage.css";
import { useLanguage } from "../context/LanguageContext";

export default function CustomerListPage({ setActiveMenu }) {

  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    loadCustomers("");
  }, []);

  const loadCustomers = async (query) => {
    try {
      setLoading(true);
      const results = await searchCustomers(query);
      setCustomers(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadCustomers(searchText);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchText]);


return (
    <div className="customer-list-page">
  
      {/* HEADER */}
       <h2>{t("customers")}</h2>
<span>{t("review_registered_customers")}</span>
        
      {/* SEARCH + SUMMARY BAR */}
      <div className="toolbar">
        <div className="search-wrapper">
        <button className="primary-btn" onClick={() => setActiveMenu("customers")} >
        + {t("add_new_customer")}
        </button>
          <input className="search-input" placeholder={t("search_customer_placeholder")}value={searchText} onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="customer-count">
        {t("total_customer_count")}: <strong>{customers.length}</strong>
        </div>
      </div>
  
      {/* TABLE CONTAINER */}
      <div className="table-card">
  
        {loading && (
          <div className="loading-state">{t("loading_customers")}</div>
        )}
  
        <table className="customer-table">
          <thead>
            <tr>
            <th>{t("code")}</th>
            <th>{t("name")}</th>
            <th>{t("phone")}</th>
            <th>{t("address")}</th>
            <th>{t("id_proof")}</th>
            <th>{t("visits")}</th>
            </tr>
          </thead>
  
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="code">{c.customer_code}</td>
                <td className="name">
  {c.name}
  {c.relation_type && c.relation_name && (
    <div className="relation">
      {c.relation_type} {c.relation_name}
    </div>
  )}
</td>
                <td>{c.phone}</td>

                <td className="address">{c.address || "-"}</td>
                <td>
                  {c.id_proof_type
                    ? `${c.id_proof_type} - ${c.id_proof_number}`
                    : "-"}
                </td>
                <td>
                  <span
                    className={`visit-badge ${
                      c.visit_count > 3 ? "high" : "normal"
                    }`}
                  >
                    {c.visit_count}
                  </span>
                </td>
              </tr>
            ))}
  
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-state">
                {t("no_customers_found")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}