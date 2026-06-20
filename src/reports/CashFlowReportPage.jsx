import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import "./CashFlowReportPage.css";
import ChartRenderer from "../components/charts/ChartRenderer";

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

export default function CashFlowReportPage() {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const today    = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate,   setEndDate]   = useState(today.toISOString().split("T")[0]);
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const result = await invoke("get_cash_flow_report_cmd", { startDate, endDate });
      setRows(result.rows || []);
    } catch (err) {
      console.error("Cash Flow Error:", err);
    }
    setLoading(false);
  }

  const totalIn  = rows.reduce((sum, r) => sum + r.cash_in,  0);
  const totalOut = rows.reduce((sum, r) => sum + r.cash_out, 0);
  const net      = totalIn - totalOut;

  return (
    <div className="cashflow-page">

      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>{t("cash_flow_report")}</h2>
          <p>{t("cash_flow_report_desc")}</p>
        </div>
        <div className="filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadReport}>{t("search", "Load")}</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <StatCard icon="📈" label={t("total_inflow", "Total Cash In")}  value={`₹${totalIn.toLocaleString("en-IN")}`}  color="card-green"  />
        <StatCard icon="📉" label={t("total_outflow", "Total Cash Out")} value={`₹${totalOut.toLocaleString("en-IN")}`} color="card-rose"   />
        <StatCard icon="💰" label={t("net_cash_flow_lbl", "Net Cash Flow")}  value={`₹${net.toLocaleString("en-IN")}`}      color={net >= 0 ? "card-blue" : "card-orange"} />
      </div>

      {/* ── Table ── */}
      <div className="table-section">
        {loading ? (
          <p className="loading-text">{t("loading_pledges", "Loading report...")}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t("month", "Period")}</th>
                <th>{t("money_in", "Cash In")}</th>
                <th>{t("money_out", "Cash Out")}</th>
                <th>{t("balance", "Net")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="table-empty-state" style={{ textAlign: "center", padding: "20px" }}>
                    {t("no_matching_records")}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={index}>
                    <td>{row.period}</td>
                    <td className="in">₹ {row.cash_in.toLocaleString("en-IN")}</td>
                    <td className="out">₹ {row.cash_out.toLocaleString("en-IN")}</td>
                    <td className={row.net >= 0 ? "in" : "out"}>₹ {row.net.toLocaleString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Chart ── */}
      <ChartRenderer type="bar" data={rows} xKey="period" yKey="net" />

    </div>
  );
}