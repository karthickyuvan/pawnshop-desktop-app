import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./BankMappingReport.css";

function StatCard({ icon, label, value, color, isCount = false }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">
          {isCount ? value : `₹${(value || 0).toLocaleString()}`}
        </div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

export default function BankMappingReport() {

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

  if (loading) return <div className="page-loader">Loading Bank Mapping Report...</div>;

  return (
    <div className="bank-report-page">

      {/* ── Header ── */}
      <div className="report-header">
        <div>
          <h2>Bank Mapping Report</h2>
          <p>Track pledges mapped to bank funding</p>
        </div>
        <button onClick={loadData} className="refresh-btn">
          ↻ Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <StatCard icon="🏦" label="Total Loan Amount"    value={totalLoan}    color="card-blue"   />
        <StatCard icon="🔗" label="Total Mapped Amount"  value={totalMapped}  color="card-teal"   />
        <StatCard icon="✅" label="Completed Mappings"   value={mappedCount}  color="card-green"  isCount />
        <StatCard icon="⏳" label="Pending Mappings"     value={pendingCount} color="card-yellow" isCount />
      </div>

      {/* ── Table ── */}
      <div className="table-section">
        <div className="section-title">All Bank Mappings</div>
        <table className="report-table">
          <thead>
            <tr>
              <th>Pledge No</th>
              <th>Customer</th>
              <th>Bank</th>
              <th>Loan Amount</th>
              <th>Mapped Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="pledge-no">{r.pledge_no}</td>
                <td>{r.customer_name}</td>
                <td>{r.bank_name}</td>
                <td className="money">₹ {(r.loan_amount   || 0).toLocaleString()}</td>
                <td className="money">₹ {(r.mapped_amount || 0).toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-${r.status?.toLowerCase()}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}