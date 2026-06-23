// src/pages/FundLedgerReportPage.jsx
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

  // ── DYNAMIC CELL TRANSLATORS ──
  
  // Translates modules (CAPITAL, EXPENSE, PLEDGE, FEE, etc.)
  const translateModuleType = (mod) => {
    if (!mod) return "—";
    const normalized = String(mod).toUpperCase();
    if (normalized === "CAPITAL") return t("owner_fund", "Capital");
    if (normalized === "EXPENSE") return t("expenses", "Expenses");
    if (normalized === "PLEDGE") return t("pledge", "Pledge");
    if (normalized === "FEE") return t("processing_fee", "Fee");
    if (normalized === "INTEREST") return t("interest", "Interest");
    if (normalized === "CLOSURE") return t("closures", "Closure");
    if (normalized === "BANK_MAPPING") return t("bank_mapping", "Bank Mapping");
    return t(mod);
  };

  // Translates transaction types (ADD, WITHDRAW)
  const translateTxType = (tx) => {
    if (!tx) return "—";
    const normalized = String(tx).toUpperCase();
    if (normalized === "ADD") return t("credit", "Credit");
    if (normalized === "WITHDRAW") return t("debit", "Debit");
    return t(tx);
  };

  // Translates dynamic narrations while keeping reference codes intact
// ── UPDATED DYNAMIC NARRATION TRANSLATOR ──
  const translateDescription = (desc) => {
    if (!desc) return "—";
    let translated = desc;

    if (desc.includes("Loan Disbursement")) {
      translated = desc.replace("Loan Disbursement", t("Loan Disbursement"));
    }
    if (desc.includes("Processing Fee")) {
      translated = translated.replace("Processing Fee", t("Processing Fee"));
    }
    if (desc.includes("First Month Interest")) {
      translated = translated.replace("First Month Interest", t("First Month Interest"));
    }
    if (desc.includes("Denomination Exchange (Inward)")) {
      translated = translated.replace("Denomination Exchange (Inward)", t("Denomination Exchange (Inward)"));
    }
    if (desc.includes("Denomination Exchange (Outward)")) {
      translated = translated.replace("Denomination Exchange (Outward)", t("Denomination Exchange (Outward)"));
    }
    if (desc.includes("🔨 [AUCTION RECOVERY]")) {
      translated = translated.replace("🔨 [AUCTION RECOVERY]", t("🔨 [AUCTION RECOVERY]"));
    }
    if (desc.includes("Opening Balance")) {
      translated = translated.replace("Opening Balance", t("opening_balance", "Opening Balance"));
    }
    if (desc.includes("Fund Added")) {
      translated = translated.replace("Fund Added", t("add_funds", "Fund Added"));
    }
    if (desc.includes("Fund Withdrawn")) {
      translated = translated.replace("Fund Withdrawn", t("withdraw_funds", "Fund Withdrawn"));
    }
    
    // ── Added Investor & Pledge Payment Translation Keys ──
    if (desc.includes("Investor Investment")) {
      translated = translated.replace("Investor Investment", t("Investor Investment"));
    }
    if (desc.includes("Investor Withdrawal")) {
      translated = translated.replace("Investor Withdrawal", t("Investor Withdrawal"));
    }
    if (desc.includes("Investor Profit Payment")) {
      translated = translated.replace("Investor Profit Payment", t("Investor Profit Payment"));
    }
    if (desc.includes("Payment for Pledge")) {
      translated = translated.replace("Payment for Pledge", t("Payment for Pledge"));
    }

    if (translated.includes("(CASH)")) {
      translated = translated.replace("(CASH)", `(${t("CASH")})`);
    }
    if (translated.includes("(UPI)")) {
      translated = translated.replace("(UPI)", `(${t("UPI")})`);
    }
    if (translated.includes("(BANK)")) {
      translated = translated.replace("(BANK)", `(${t("BANK")})`);
    }

    return translated;
  };

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
                  
                  {/* Dynamic translation layers added below */}
                  <td>{translateModuleType(r.module_type)}</td>
                  <td>{translateTxType(r.tx_type)}</td>
                  <td>{r.reference || "—"}</td>
                  <td>{translateDescription(r.description)}</td>
                  <td>{t(r.payment_method)}</td>
                  
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