
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext";
import "./ProfitLossReport.css";

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

function Row({ label, value, highlight, isNegative = false }) {
  return (
    <div className={`row ${highlight ? "highlight" : ""}`}>
      <span>{label}</span>
      <strong style={{ color: isNegative ? "#dc2626" : "inherit" }}>
        {isNegative ? "- " : ""}₹ {(value || 0).toLocaleString("en-IN")}
      </strong>
    </div>
  );
}

export default function ProfitLossReport() {
  const { t } = useLanguage();
  const today = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate,   setEndDate]   = useState(today);
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    try {
      setLoading(true);
      const result = await invoke("get_profit_loss_report_cmd", { startDate, endDate });
      setData(result);
    } catch (err) {
      console.error("Report Error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="page-loader">{t("updating_ledger", "Loading financial report...")}</div>;
  if (!data)   return <div className="page-loader">{t("no_matching_records")}</div>;

  const totalIncome = (data.interest_income || 0)
    + (data.processing_fee_income || 0)
    + (data.other_income || 0);

  // Total expenses include standard business operating expenses and financing payouts
  const totalExpenses = (data.business_expenses || 0) + (data.investor_interest_paid || 0);

  const outstandingCapital = (data.pledge_loans_issued || 0)
    - (data.pledge_principal_received || 0);

  const isProfit = (data.net_profit || 0) >= 0;

  return (
    <div className="financial-dashboard">
      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1>{t("shop_overview", "Financial Dashboard")}</h1>
          <p>{t("profit_loss_report_desc")}</p>
        </div>
        <div className="filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadReport}>{t("refresh")}</button>
        </div>
      </div>

      {/* ── KPI stat cards ── */}
      <div className="stats-grid">
        <StatCard icon="📅" label={t("todays_interest", "Interest Income")} value={`₹${(data.interest_income || 0).toLocaleString("en-IN")}`} color="card-teal" />
        <StatCard icon="🏷️" label={t("processing_fee")} value={`₹${(data.processing_fee_income || 0).toLocaleString("en-IN")}`} color="card-blue" />
        <StatCard icon="💹" label={t("other_income_lbl", "Other Income")} value={`₹${(data.other_income || 0).toLocaleString("en-IN")}`} color="card-purple" />
        <StatCard icon="🧾" label={t("total_expense", "Total Expenses")} value={`₹${totalExpenses.toLocaleString("en-IN")}`} color="card-rose" />
        <StatCard icon={isProfit ? "📈" : "📉"}
                  label={t("net_profit_loss_lbl", "Net Profit")}
                  value={`₹${(data.net_profit || 0).toLocaleString("en-IN")}`}
                  color={isProfit ? "card-green" : "card-orange"} />
      </div>

      {/* ── Analytics panels ── */}
      <div className="analytics-grid">
        <div className="card">
          <h3>{t("settlement_summary", "Profit Summary")}</h3>
          <Row label={t("total_gross_revenue_lbl", "Total Income")} value={totalIncome} />
          <Row label={t("branch_expenses_lbl", "Operating Expenses")} value={data.business_expenses} isNegative />
          {/* ✅ Investor Interest payout registered as a financing expense */}
          <Row label="Investor Interest Paid" value={data.investor_interest_paid} isNegative />
          <div className="divider" />
          <Row label={t("net_profit_loss_lbl", "Net Profit")} value={data.net_profit} highlight />
        </div>

        <div className="card">
          <h3>{t("pledge_disbursement", "Pledge Movement")}</h3>
          <Row label={t("loans_issued_lbl", "Loans Issued")} value={data.pledge_loans_issued} />
          <Row label={t("principal_payment", "Principal Returned")} value={data.pledge_principal_received} />
          <div className="divider" />
          <Row label={t("remaining_principal", "Outstanding Capital")} value={outstandingCapital} highlight />
        </div>

        <div className="card">
          <h3>{t("interest_analytics")}</h3>
          <Row label={t("loan_portfolio_lbl", "Loan Portfolio")} value={data.loan_portfolio} />
          <Row label={t("interest_payment", "Interest Earned")} value={data.interest_income} />
          <div className="divider" />
          <div className="row highlight">
            <span>{t("yield_lbl", "Yield")}</span>
            <strong>{(data.interest_yield_percent || 0).toFixed(2)} %</strong>
          </div>
        </div>
      </div>

      {/* ── Metal Portfolio ── */}
      <div className="card metal-card">
        <h3>{t("stock_summary")}</h3>
        <table>
          <thead>
            <tr>
              <th>{t("metal")}</th>
              <th>{t("pledged_net_hdr", "Pledged Net")}</th>
              <th>{t("pledged_gross_hdr", "Pledged Gross")}</th>
              <th>{t("closed_net_hdr", "Total Closed Net")}</th>
              <th>{t("closed_gross_hdr", "Total Closed Gross")}</th>
            </tr>
          </thead>
          <tbody>
            {data.metals?.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", color: "#888", padding: "12px" }}>
                  {t("no_matching_records")}
                </td>
              </tr>
            ) : (
              (data.metals || []).map((m, i) => (
                <tr key={m.metal || i}>
                  <td>{m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal}</td>
                  <td>{m.pledged_net_weight.toFixed(2)} g</td>
                  <td>{m.pledged_gross_weight.toFixed(2)} g</td>
                  <td>{m.closed_net_weight.toFixed(2)} g</td>
                  <td>{m.closed_gross_weight.toFixed(2)} g</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}