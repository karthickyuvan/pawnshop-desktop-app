import React, { useEffect, useState } from "react";
import { getDaybook } from "../services/daybookApi";
import AuditBlock from "../components/daybook/AuditBlock";
import  DenominationTable from "../components/daybook/DenominationTable";
import "./daybook.css";
import { useLanguage } from "../context/LanguageContext";


const CATEGORY_MAP = {
  PLEDGE: "PLEDGE_DISBURSEMENT",
  PAYMENT: "PAYMENT DETAILS",
  EXPENSE: "BRANCH_EXPENSE",
  CAPITAL: "OWNER_FUND",
  BANK_MAPPING: "BANK_MAPPING",
  FEE: "PROCESSING_FEE", 
  INTEREST: "INTEREST_COLLECTION",
  CLOSURE: "PLEDGE_REDEEM/CLOSURE",
};

export default function DaybookPage({user}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { t } = useLanguage();
  const isStaff = user?.role === "STAFF";

  useEffect(() => {
    const fetchDaybook = async () => {
      setLoading(true);
      try {
        const res = await getDaybook(date);
        console.log("📊 Daybook data:", res);
      console.log("📊 Transaction denominations:", res.transaction_denominations);
      console.log("📊 Physical denominations:", res.denominations);
        setData(res);
      } catch (err) {
        console.error("Error fetching daybook:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDaybook();
  }, [date]);

  if (loading) return <div className="loader">{t("loading_daily_audit")}</div>;
  if (!data) return <div className="error">{t("no_data_for_date")} {date}</div>;

  // Logic: Group entries by category
  const grouped = data.entries.reduce((acc, entry) => {
    const cat = CATEGORY_MAP[entry.module_type] || "OTHER";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(entry);
    return acc;
  }, {});

  const actualCash = data.denominations?.reduce((s, d) => s + d.total, 0) || 0;
  const expectedCash = data.opening_balance + data.total_in - data.total_out;
  const variance = actualCash - expectedCash;

  const formatDisplayDate = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="audit-container">
      <header className="audit-header">
        <div className="header-info">
        <h1>{t("daily_cash_audit")}</h1>
        <p className="subtitle">{t("business_date")}: <strong>{formatDisplayDate(date)}</strong> </p>
        </div>
        <div className="header-actions">
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
          <button className="btn-print" onClick={() => window.print()}>
          {t("print_report")}
          </button>
        </div>
      </header>

      <div className="audit-layout">
        {/* Left Section: Details */}
        <main className="audit-main">
        {Object.entries(grouped).map(([category, entries]) => {

// 🔒 Hide owner capital transactions from staff
if (isStaff && category === "OWNER_FUND") {
  return null;
}

return (
  <AuditBlock
    key={category}
    type={category}
    entries={entries}
    transactionDenominations={data.transaction_denominations}
  />
);

})}
        </main>

        {/* Right Section: Summaries */}
        <aside className="audit-sidebar">

<section className="card recon-card">
  <h3>{t("cash_reconciliation")}</h3>

  {!isStaff && (
    <div className="stat-row">
      <span>{t("opening_balance")}</span>
      <span>₹ {data.opening_balance}</span>
    </div>
  )}

  <div className="stat-row green">
    <span>{t("total_inflow")} (+)</span>
    <span>₹ {data.total_in}</span>
  </div>

  <div className="stat-row red">
    <span>{t("total_outflow")} (-)</span>
    <span>₹ {data.total_out}</span>
  </div>

  <div className="stat-row total-line">
    <span>{t("expected_cash")}</span>
    <span>₹ {expectedCash}</span>
  </div>

  <div className="stat-row total-line highlight">
    <span>{t("actual_physical_cash")}</span>
    <span>₹ {actualCash}</span>
  </div>

  <div className={`stat-row variance ${variance === 0 ? "ok" : "mismatch"}`}>
    <span>{t("difference")}</span>
    <span>₹ {variance}</span>
  </div>
</section>


<section className="card dark-card">
  <h3>{t("digital_balances")}</h3>

  <div className="stat-row">
    <span>{t("upi")}</span>
    <span>₹ {data.breakdown.upi}</span>
  </div>

  <div className="stat-row">
    <span>{t("bank_transfer")}</span>
    <span>₹ {data.breakdown.bank}</span>
  </div>
</section>


{!isStaff && (
  <section className="card denom-card">
    <DenominationTable denominations={data.denominations} />
  </section>
)}

</aside>
      </div>
    </div>
  );
}