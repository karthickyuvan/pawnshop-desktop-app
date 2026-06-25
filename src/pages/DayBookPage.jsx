// src/pages/DaybookPage.jsx
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast"; 
import { getDaybook } from "../services/daybookApi";
import AuditBlock from "../components/daybook/AuditBlock";
import DenominationTable from "../components/daybook/DenominationTable"; 
import "./daybook.css";
import { useLanguage } from "../context/LanguageContext";
import { formatTimeIST } from "../utils/timeFormatter";

const CATEGORY_MAP = {
  PLEDGE: "PLEDGE_DISBURSEMENT",
  PAYMENT: "PAYMENT DETAILS",
  EXPENSE: "BRANCH_EXPENSE",
  CAPITAL: "OWNER_FUND",
  BANK_MAPPING: "BANK_MAPPING",
  FEE: "PROCESSING_FEE",
  INTEREST: "INTEREST_COLLECTION",
  CLOSURE: "PLEDGE_REDEEM/CLOSURE",
  AUCTION: "AUCTION_RECOVERY",
  OTHER_INCOME: "AUCTION_RECOVERY",
};

export default function DaybookPage({ user }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [localDate, setLocalDate] = useState(date);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { t } = useLanguage();
  const isStaff = user?.role === "STAFF";

  // Fetch data only when the confirmed 'date' state changes
  useEffect(() => {
    const fetchDaybook = async () => {
      setLoading(true);
      try {
        const res = await getDaybook(date);
        setData(res);
      } catch (err) {
        console.error("Error fetching daybook:", err);
        toast.error(`${t("failed_load_daybook", "Failed to load daybook entries")} (${date})`);
      } finally {
        setLoading(false);
      }
    };
    fetchDaybook();
  }, [date, t]);

  useEffect(() => {
    setLocalDate(date);
  }, [date]);

  const handleDateChange = (e) => {
    const value = e.target.value;
    setLocalDate(value);

    if (!value) return;

    const parts = value.split("-");
    const year = parts[0];

    if (year && year.length === 4 && !year.startsWith("00")) {
      setDate(value);
    }
  };

  if (!data && loading)
    return <div className="loader">{t("loading_daily_audit")}</div>;
  if (!data)
    return (
      <div className="error">
        {t("no_data_for_date")} {date}
      </div>
    );

  const grouped = data.entries.reduce((acc, entry) => {
    const cat = CATEGORY_MAP[entry.module_type] || "OTHER";
    if (!acc[cat]) acc[cat] = [];

    const formattedEntry = {
      ...entry,
      time: formatTimeIST(entry.time),
      payment_method: t(entry.payment_method), // ── 🟢 Directly translate using standard i18n keys ──
    };

    acc[cat].push(formattedEntry);
    return acc;
  }, {});

  // Calculate totals from backend array
  const actualCash = data.denominations?.reduce((s, d) => s + d.total, 0) || 0;
  const expectedCash = data.opening_balance + data.total_in - data.total_out;
  const variance = actualCash - expectedCash;

  // Calculate Total Digital Balances
  const totalDigital =
    (Number(data.breakdown?.upi) || 0) +
    (Number(data.breakdown?.bank) || 0) +
    (Number(data.breakdown?.auction) || 0);

  // ── Calculate Grand Combined Total (Physical Cash + Digital Balances) ──
  const totalCombined = actualCash + totalDigital;

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="audit-container">
      {loading && (
        <div className="background-loading-bar">Updating Data...</div>
      )}

      <header className="audit-header">
        <div className="header-info">
          <h1>{t("daily_cash_audit")}</h1>
          <p className="subtitle">
            {t("business_date")}: <strong>{formatDisplayDate(date)}</strong>
          </p>
        </div>
        <div className="header-actions">
          <input type="date" value={localDate} onChange={handleDateChange} />
          <button className="btn-print" onClick={() => window.print()}>
            {t("print_report")}
          </button>
        </div>
      </header>

      <div className={`audit-layout ${loading ? "layout-loading" : ""}`}>
        {/* Left Section */}
        <main className="audit-main">
          {Object.entries(grouped).map(([category, entries]) => {
            if (isStaff && category === "OWNER_FUND") return null;
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

        {/* Right Section */}
        <aside className="audit-sidebar">
          {/* 1. Cash Reconciliation Card */}
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
            <div
              className={`stat-row variance ${variance === 0 ? "ok" : "mismatch"}`}
            >
              <span>{t("difference")}</span>
              <span>₹ {variance}</span>
            </div>
          </section>

          {/* 2. Digital Balances Card */}
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
            {data.breakdown.auction !== 0 && (
              <div className="stat-row">
                <span>🔨 {t("auction_recovery")}</span>
                <span>₹ {data.breakdown.auction}</span>
              </div>
            )}
            <div className="stat-row total-line">
              <span>{t("total_digital_balance", "Total Digital Balance")}</span>
              <span>₹ {totalDigital}</span>
            </div>
          </section>

          {/* 3. Combined Balance (Cash + Digital) */}
          <section className="card combined-balance-card" style={{
            background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
            border: "1px solid #a7f3d0",
            padding: "16px 20px",
            borderRadius: "14px",
            boxShadow: "var(--shadow-xs)",
            marginBottom: "16px"
          }}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: "700", color: "#065f46" }}>
              {t("combined_balances", "Combined Balances")}
            </h3>
            <div className="stat-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#374151" }}>
              <span>{t("cash_total_lbl", "Cash Total")}</span>
              <span style={{ fontWeight: "600" }}>₹ {actualCash.toLocaleString("en-IN")}</span>
            </div>
            <div className="stat-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", color: "#374151" }}>
              <span>{t("digital_total_lbl", "Digital Total")}</span>
              <span style={{ fontWeight: "600" }}>₹ {totalDigital.toLocaleString("en-IN")}</span>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid #cbd5e1", margin: "10px 0" }} />
            <div className="stat-row total-line" style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "17px", color: "#065f46" }}>
              <span>{t("combined_total", "Total Balance")}</span>
              <span>₹ {totalCombined.toLocaleString("en-IN")}</span>
            </div>
          </section>

          {/* 4. Restored Read-Only Denominations Display */}
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