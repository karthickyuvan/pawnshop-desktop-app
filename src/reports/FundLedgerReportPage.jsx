import { useEffect, useState } from "react";
import { getFundLedgerReport } from "../services/fundLedgerApi";
import "./FundLedgerReportPage.css";

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">₹{(value || 0).toLocaleString()}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

export default function FundLedgerReportPage() {

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

  if (!data) return <div className="loader">Loading Ledger...</div>;

  return (
    <div className="ledger-page">

      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>Fund Ledger Report</h2>
          <p>Complete fund inflow, outflow and balance tracking</p>
        </div>

        {/* ── Filters ── */}
        <div className="filters">
          <select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
            <option value="">Year</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>

          <select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
            <option value="">Month</option>
            <option value="01">Jan</option><option value="02">Feb</option>
            <option value="03">Mar</option><option value="04">Apr</option>
            <option value="05">May</option><option value="06">Jun</option>
            <option value="07">Jul</option><option value="08">Aug</option>
            <option value="09">Sep</option><option value="10">Oct</option>
            <option value="11">Nov</option><option value="12">Dec</option>
          </select>

          <select value={filters.week} onChange={e => setFilters({ ...filters, week: e.target.value })}>
            <option value="">Week</option>
            <option value="01">Week 1</option><option value="02">Week 2</option>
            <option value="03">Week 3</option><option value="04">Week 4</option>
          </select>

          <select value={filters.module} onChange={e => setFilters({ ...filters, module: e.target.value })}>
            <option value="ALL">All Modules</option>
            <option value="PLEDGE">Pledge</option>
            <option value="EXPENSE">Expenses</option>
            <option value="INTEREST">Interest</option>
            <option value="CAPITAL">Capital</option>
            <option value="BANK_MAPPING">Bank Mapping</option>
            <option value="FEE">Fee</option>
            <option value="CLOSURE">Closure</option>
          </select>

          <button onClick={loadReport}>Apply</button>
        </div>
      </div>

      {/* ── Primary stat cards ── */}
      <div className="stats-grid">
        <StatCard icon="📈" label="Total Money In"   value={data.total_in}        color="card-green"  />
        <StatCard icon="📉" label="Total Money Out"  value={data.total_out}       color="card-rose"   />
        <StatCard icon="💰" label="Closing Balance"  value={data.closing_balance} color={data.closing_balance >= 0 ? "card-blue" : "card-orange"} />
      </div>

      {/* ── Payment method breakdown ── */}
      <div className="stats-grid">
        <StatCard icon="💵" label="Cash In"    value={data.cash_in}   color="card-teal"   />
        <StatCard icon="💸" label="Cash Out"   value={data.cash_out}  color="card-rose"   />
        <StatCard icon="📱" label="UPI In"     value={data.upi_in}    color="card-teal"   />
        <StatCard icon="📲" label="UPI Out"    value={data.upi_out}   color="card-rose"   />
        <StatCard icon="🏦" label="Bank In"    value={data.bank_in}   color="card-teal"   />
        <StatCard icon="🏦" label="Bank Out"   value={data.bank_out}  color="card-rose"   />
      </div>

      {/* ── Ledger table ── */}
      <div className="table-section">
        <div className="section-title">Transaction Ledger</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Module</th>
              <th>Type</th>
              <th>Reference</th>
              <th>Description</th>
              <th>Method</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map(r => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>{r.module_type}</td>
                <td>{r.tx_type}</td>
                <td>{r.reference}</td>
                <td>{r.description}</td>
                <td>{r.payment_method}</td>
                <td className="debit">{r.debit  > 0 ? `₹ ${r.debit.toLocaleString()}`  : "—"}</td>
                <td className="credit">{r.credit > 0 ? `₹ ${r.credit.toLocaleString()}` : "—"}</td>
                <td><strong>₹ {r.balance.toLocaleString()}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}