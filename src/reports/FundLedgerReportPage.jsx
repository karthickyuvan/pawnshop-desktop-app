import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import { getFundLedgerReport } from "../services/fundLedgerApi";
import { formatTransactionTimestamp } from "../utils/timeFormatter"; // ✅ Reusing the centralized formatter
import "./FundLedgerReportPage.css";

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">₹{(value || 0).toLocaleString("en-IN")}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

export default function FundLedgerReportPage() {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [data,    setData]    = useState(null);
  const [filters, setFilters] = useState({
    year: "", month: "", week: "", module: "ALL",
  });

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    try {
      const result = await getFundLedgerReport({
        year:   filters.year   ? Number(filters.year)   : null,
        month:  filters.month  ? Number(filters.month)  : null,
        week:   filters.week   ? Number(filters.week)   : null,
        module: filters.module,
      });
      setData(result);
    } catch (err) {
      console.error(err);
    }
  }

  if (!data) return <div className="loader">{t("updating_ledger", "Loading Ledger...")}</div>;

  return (
    <div className="ledger-page">
      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>{t("fund_ledger_report")}</h2>
          <p>{t("fund_ledger_report_desc")}</p>
        </div>

        {/* ── Filters ── */}
        <div className="filters">
          <select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
            <option value="">{t("year", "Year")}</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>

          <select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
            <option value="">{t("month", "Month")}</option>
            <option value="01">{t("jan", "Jan")}</option>
            <option value="02">{t("feb", "Feb")}</option>
            <option value="03">{t("mar", "Mar")}</option>
            <option value="04">{t("apr", "Apr")}</option>
            <option value="05">{t("may", "May")}</option>
            <option value="06">{t("jun", "Jun")}</option>
            <option value="07">{t("jul", "Jul")}</option>
            <option value="08">{t("aug", "Aug")}</option>
            <option value="09">{t("sep", "Sep")}</option>
            <option value="10">{t("oct", "Oct")}</option>
            <option value="11">{t("nov", "Nov")}</option>
            <option value="12">{t("dec", "Dec")}</option>
          </select>

          <select value={filters.week} onChange={e => setFilters({ ...filters, week: e.target.value })}>
            <option value="">{t("week_lbl", "Week")}</option>
            <option value="01">{t("week_1_lbl", "Week 1")}</option>
            <option value="02">{t("week_2_lbl", "Week 2")}</option>
            <option value="03">{t("week_3_lbl", "Week 3")}</option>
            <option value="04">{t("week_4_lbl", "Week 4")}</option>
          </select>

          <select value={filters.module} onChange={e => setFilters({ ...filters, module: e.target.value })}>
            <option value="ALL">{t("all_types", "All Modules")}</option>
            <option value="PLEDGE">{t("pledge", "Pledge")}</option>
            <option value="EXPENSE">{t("expenses", "Expenses")}</option>
            <option value="INTEREST">{t("interest", "Interest")}</option>
            <option value="CAPITAL">{t("owner_fund", "Capital")}</option>
            <option value="BANK_MAPPING">{t("bank_mapping", "Bank Mapping")}</option>
            <option value="FEE">{t("processing_fee", "Fee")}</option>
            <option value="CLOSURE">{t("closures", "Closure")}</option>
          </select>

          <button onClick={loadReport}>{t("confirm_continue", "Apply")}</button>
        </div>
      </div>

      {/* ── Primary stat cards ── */}
      <div className="stats-grid">
        <StatCard icon="📈" label={t("money_in")}   value={data.total_in}        color="card-green"  />
        <StatCard icon="📉" label={t("money_out")}  value={data.total_out}       color="card-rose"   />
        <StatCard icon="💰" label={t("closing_balance", "Closing Balance")}  value={data.closing_balance} color={data.closing_balance >= 0 ? "card-blue" : "card-orange"} />
      </div>

      {/* ── Payment method breakdown ── */}
      <div className="stats-grid">
        <StatCard icon="💵" label={`${t("cash", "Cash")} ${t("money_in")}`}    value={data.cash_in}   color="card-teal"   />
        <StatCard icon="💸" label={`${t("cash", "Cash")} ${t("money_out")}`}   value={data.cash_out}  color="card-rose"   />
        <StatCard icon="📱" label={`${t("upi", "UPI")} ${t("money_in")}`}     value={data.upi_in}    color="card-teal"   />
        <StatCard icon="📲" label={`${t("upi", "UPI")} ${t("money_out")}`}    value={data.upi_out}   color="card-rose"   />
        <StatCard icon="🏦" label={`${t("bank", "Bank")} ${t("money_in")}`}    value={data.bank_in}   color="card-teal"   />
        <StatCard icon="🏦" label={`${t("bank", "Bank")} ${t("money_out")}`}   value={data.bank_out}  color="card-rose"   />
      </div>

      {/* ── Ledger table ── */}
      <div className="table-section">
        <div className="section-title">{t("fund_ledger", "Transaction Ledger")}</div>
        <table>
          <thead>
            <tr>
              <th>{t("date")}</th>
              <th>{t("category", "Module")}</th>
              <th>{t("type")}</th>
              <th>{t("reference")}</th>
              <th>{t("description")}</th>
              <th>{t("method")}</th>
              <th>{t("debit")}</th>
              <th>{t("credit")}</th>
              <th>{t("balance")}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan="9" className="table-empty-state" style={{ textAlign: "center", padding: "20px" }}>
                  {t("no_matching_records")}
                </td>
              </tr>
            ) : (
              data.rows.map(r => (
                <tr key={r.id}>
                  <td>{formatTransactionTimestamp(r.date)}</td>
                  <td>{r.module_type}</td>
                  <td>{r.tx_type}</td>
                  <td>{r.reference || "—"}</td>
                  <td>{r.description || "—"}</td>
                  <td>{r.payment_method}</td>
                  <td className="debit">{r.debit  > 0 ? `₹ ${r.debit.toLocaleString("en-IN")}`  : "—"}</td>
                  <td className="credit">{r.credit > 0 ? `₹ ${r.credit.toLocaleString("en-IN")}` : "—"}</td>
                  <td><strong>₹ {r.balance.toLocaleString("en-IN")}</strong></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}