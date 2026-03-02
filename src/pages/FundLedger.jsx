// version 5 - corrected & consistent
import { useEffect, useState, useMemo, useCallback } from "react";
import { getFundLedger } from "../services/fundServiceApi";
import "./fundLedger.css";
import { formatDateTimeIST } from "../utils/timeFormatter";

export default function FundLedger({ refreshTrigger }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 10;

  /* =============================
     DATA FETCH
  ============================= */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFundLedger();
      setRows(data || []);
    } catch (err) {
      console.error("Ledger Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  /* =============================
     HELPERS
  ============================= */
  const normalizeType = (raw) => {
    const t = String(raw).toUpperCase();
    if (t === "ADD") return "CREDIT";
    if (t === "WITHDRAW") return "DEBIT";
    return t;
  };

  const formatMoney = (amount) =>
    Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  /* =============================
     FILTERED DATA
  ============================= */
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const transactionDate = new Date(r[4]);
      const typeKey = normalizeType(r[1]);
      const mode = (r[5] || "CASH").toUpperCase();

      if (fromDate && transactionDate < new Date(fromDate)) return false;

      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59);
        if (transactionDate > endDate) return false;
      }

      if (modeFilter !== "ALL" && mode !== modeFilter) return false;

      if (typeFilter !== "ALL" && typeKey !== typeFilter) return false;

      return true;
    });
  }, [rows, fromDate, toDate, modeFilter, typeFilter]);

  /* =============================
     TOTALS
  ============================= */
  const totals = useMemo(() => {
    let credit = 0;
    let debit = 0;

    filteredRows.forEach((r) => {
      const typeKey = normalizeType(r[1]);
      if (typeKey === "CREDIT") credit += Number(r[2]);
      if (typeKey === "DEBIT") debit += Number(r[2]);
    });

    return { credit, debit };
  }, [filteredRows]);

  /* =============================
     PAGINATION
  ============================= */
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage]);

  /* =============================
     RESET FILTERS
  ============================= */
  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setModeFilter("ALL");
    setTypeFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <div className="fund-card">
      <div className="card-header-row">
        <h3>Transaction History</h3>
        <button className="page-btn" onClick={loadData} disabled={loading}>
          {loading ? "Syncing..." : "Refresh"}
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Type</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Types</option>
            <option value="CREDIT">Credit (+)</option>
            <option value="DEBIT">Debit (-)</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Mode</label>
          <select
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Modes</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK">Bank</option>
          </select>
        </div>

        <button className="page-btn" onClick={resetFilters}>
          Reset
        </button>
      </div>

      {/* SUMMARY */}
      <div className="summary-container">
        <div className="text-muted">
          Found <b>{filteredRows.length}</b> transactions
        </div>

        <div className="totals-bar">
          <div className="stat-pill pill-success">
            In: ₹{formatMoney(totals.credit)}
          </div>
          <div className="stat-pill pill-danger">
            Out: ₹{formatMoney(totals.debit)}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Method</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th>Narration</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "60px" }}>
                  Updating Ledger...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                  No matching records.
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const typeKey = normalizeType(r[1]);
                return (
                  <tr key={r[0]}>
                    <td style={{ color: "#64748b", fontSize: "13px" }}>
                      {formatDateTimeIST(r[4])}
                    </td>

                    <td>
                      <span className={`status-badge ${
                        typeKey === "CREDIT" ? "badge-success" : "badge-danger"
                      }`}>
                        {typeKey}
                      </span>
                    </td>

                    <td style={{ fontWeight: 600 }}>
                      {r[5] || "CASH"}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      {typeKey === "CREDIT" ? (
                        <span className="text-success">
                          + ₹{formatMoney(r[2])}
                        </span>
                      ) : (
                        <span className="text-danger">
                          − ₹{formatMoney(r[2])}
                        </span>
                      )}
                    </td>

                    <td style={{ color: "#475569" }}>
                      {r[3]}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="pagination-bar">
        <div className="text-muted" style={{ fontSize: "14px" }}>
          Page <b>{currentPage}</b> of <b>{totalPages || 1}</b>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </button>

          <button
            className="page-btn"
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}