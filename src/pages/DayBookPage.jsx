import React, { useEffect, useState } from "react";
import { getDaybook } from "../services/daybookApi";
import AuditBlock from "../components/daybook/AuditBlock";
import  DenominationTable from "../components/daybook/DenominationTable";
import "./daybook.css";

const CATEGORY_MAP = {
  PLEDGE: "PLEDGE_DISBURSEMENT",
  PAYMENT: "PAYMENT",
  EXPENSE: "BRANCH_EXPENSE",
  CAPITAL: "OWNER_FUND",
  BANK_MAPPING: "BANK_MAPPING",
  FEE: "PROCESSING_FEE", 
  INTEREST: "INTEREST_COLLECTION",
  CLOSURE: "PLEDGE_REDEEM/CLOSURE",
};

export default function DaybookPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDaybook = async () => {
      setLoading(true);
      try {
        const res = await getDaybook(date);
        setData(res);
      } catch (err) {
        console.error("Error fetching daybook:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDaybook();
  }, [date]);

  if (loading) return <div className="loader">Loading Daily Audit...</div>;
  if (!data) return <div className="error">No data found for {date}</div>;

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

  return (
    <div className="audit-container">
      <header className="audit-header">
        <div className="header-info">
          <h1>Daily Cash Audit</h1>
          <p className="subtitle">Business Date: <strong>{date}</strong></p>
        </div>
        <div className="header-actions">
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
          <button className="btn-print" onClick={() => window.print()}>
            Print Report
          </button>
        </div>
      </header>

      <div className="audit-layout">
        {/* Left Section: Details */}
        <main className="audit-main">
          {Object.entries(grouped).map(([category, entries]) => (
            <AuditBlock 
              key={category} 
              type={category} 
              entries={entries}
              transactionDenominations={data.transaction_denominations}
            />
          ))}
        </main>

        {/* Right Section: Summaries */}
        <aside className="audit-sidebar">
          <section className="card recon-card">
            <h3>Cash Reconciliation</h3>
            <div className="stat-row">
              <span>Opening Balance</span>
              <span>₹ {data.opening_balance}</span>
            </div>
            <div className="stat-row green">
              <span>Total Inflow (+)</span>
              <span>₹ {data.total_in}</span>
            </div>
            <div className="stat-row red">
              <span>Total Outflow (-)</span>
              <span>₹ {data.total_out}</span>
            </div>
            <div className="stat-row total-line">
              <span>Expected Cash</span>
              <span>₹ {expectedCash}</span>
            </div>
            <div className="stat-row total-line highlight">
              <span>Actual Physical Cash</span>
              <span>₹ {actualCash}</span>
            </div>
            <div className={`stat-row variance ${variance === 0 ? 'ok' : 'mismatch'}`}>
              <span>Difference</span>
              <span>₹ {variance}</span>
            </div>
          </section>

          <section className="card dark-card">
            <h3>Digital Balances</h3>
            <div className="stat-row">
              <span>UPI</span>
              <span>₹ {data.breakdown.upi}</span>
            </div>
            <div className="stat-row">
              <span>Bank Transfer</span>
              <span>₹ {data.breakdown.bank}</span>
            </div>
          </section>

          {/* <section className="card denom-card">
            <h3>Denominations</h3>
            <table className="denom-table">
              <thead>
                <tr>
                  <th>Value</th>
                  <th>Qty</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.denominations.map((d, i) => (
                  <tr key={i}>
                    <td>₹ {d.denomination}</td>
                    <td>{d.quantity}</td>
                    <td className="text-right">₹ {d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section> */}

          <section className="card denom-card">
            <DenominationTable denominations={data.denominations} />
          </section>
        </aside>
      </div>
    </div>
  );
}