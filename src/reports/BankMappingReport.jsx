import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import "./BankMappingReport.css";

function StatCard({ icon, label, value, color, isCount = false }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">
          {isCount ? value : `₹${(value || 0).toLocaleString("en-IN")}`}
        </div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

export default function BankMappingReport() {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await invoke("get_bank_mapping_report_cmd");
      setRows(result.rows || []);
    } catch (err) {
      console.error("Bank Mapping Report Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalLoan    = rows.reduce((sum, r) => sum + (r.loan_amount   || 0), 0);
  const totalMapped  = rows.reduce((sum, r) => sum + (r.mapped_amount || 0), 0);
  const pendingCount = rows.filter(r => r.status === "PENDING").length;
  const mappedCount  = rows.filter(r => r.status === "MAPPED").length;

  if (loading) {
    return <div className="page-loader">{t("syncing", "Updating Ledger...")}</div>;
  }

  return (
    <div className="bank-report-page">

      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>{t("bank_mapping_report")}</h2>
          <p>{t("bank_mapping_report_desc")}</p>
        </div>
        <button onClick={loadData} className="refresh-btn">
          ↻ {t("refresh")}
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <StatCard icon="🏦" label={t("total_loan_amount")}    value={totalLoan}    color="card-blue"   />
        <StatCard icon="🔗" label={t("total_mapped_amount", "Total Mapped Amount")}  value={totalMapped}  color="card-teal"   />
        <StatCard icon="✅" label={t("completed_mappings_lbl", "Completed Mappings")}   value={mappedCount}  color="card-green"  isCount />
        <StatCard icon="⏳" label={t("pending_mappings_lbl", "Pending Mappings")}     value={pendingCount} color="card-yellow" isCount />
      </div>

      {/* ── Table ── */}
      <div className="table-section">
        <div className="section-title">{t("all_bank_mappings_title", "All Bank Mappings")}</div>
        <table className="report-table">
          <thead>
            <tr>
              <th>{t("pledge_no")}</th>
              <th>{t("customer")}</th>
              <th>{t("bank")}</th>
              <th>{t("loan_amount")}</th>
              <th>{t("mapped_amount_lbl", "Mapped Amount")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-empty-state" style={{ textAlign: "center", padding: "20px" }}>
                  {t("no_matching_records")}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i}>
                  <td className="pledge-no">{r.pledge_no}</td>
                  <td>{r.customer_name}</td>
                  <td>{r.bank_name}</td>
                  <td className="money">₹ {(r.loan_amount || 0).toLocaleString("en-IN")}</td>
                  <td className="money">₹ {(r.mapped_amount || 0).toLocaleString("en-IN")}</td>
                  <td>
                    <span className={`status-badge status-${r.status?.toLowerCase()}`}>
                      {r.status === "MAPPED" ? t("confirmed") : r.status === "PENDING" ? t("pending") : r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}