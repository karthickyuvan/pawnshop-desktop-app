

import { useEffect, useState, useCallback } from "react";
import { Clock, Download, Calendar, Filter, RefreshCw } from "lucide-react";
import { getTodayPaymentHistory, getPaymentHistory, exportPaymentsToCSV } from "../../services/paymentHistoryApi";
import "./PaymentHistory.css";

export default function PaymentHistoryCard() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filterMode, setFilterMode] = useState("today"); // today, custom, all
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  // Mode & Type filters
  const [selectedMode, setSelectedMode] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  // Pagination
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);

  // ✅ Accept explicit mode so we don't rely on stale closure state
  const fetchPayments = useCallback(async (mode, start, end) => {
    setLoading(true);
    try {
      let data;

      if (mode === "today") {
        data = await getTodayPaymentHistory();
      } else if (mode === "custom") {
        data = await getPaymentHistory({
          startDate: start || null,
          endDate: end || null,
        });
      } else {
        // All payments
        data = await getPaymentHistory({});
      }

      setPayments(data.payments);
      setTotal(data.total_collected);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Fetch on mount with current filterMode
  useEffect(() => {
    fetchPayments(filterMode, startDate, endDate);
  }, []); // intentionally runs once on mount

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMode, selectedType, payments]);

  function handleFilterChange(mode) {
    setFilterMode(mode);

    // Auto-apply immediately for "today" and "all" 
    if (mode === "today" || mode === "all") {
      fetchPayments(mode, "", "");
    }
  }

  function handleApplyCustomFilter() {
    fetchPayments("custom", startDate, endDate);
  }

  function handleRefresh() {
    fetchPayments(filterMode, startDate, endDate);
  }

  function handleExport() {
    exportPaymentsToCSV(payments);
  }

  const filteredPayments = payments.filter((p) => {
    const modeMatch =
      selectedMode === "ALL" || p.payment_mode === selectedMode;
  
    const typeMatch =
      selectedType === "ALL" || p.payment_type === selectedType;
  
    return modeMatch && typeMatch;
  });


  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);

const indexOfLast = currentPage * rowsPerPage;
const indexOfFirst = indexOfLast - rowsPerPage;

const paginatedPayments = filteredPayments.slice(
  indexOfFirst,
  indexOfLast
);


  return (
    <div className="history-card">
      {/* Header */}
      <div className="history-top">
        <div className="history-title">
          <Clock size={20} />
          <h3>Payment History</h3>
          <span className="payment-count">({payments.length} payments)</span>
        </div>

        <div className="history-actions">
          <button
            className="filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>

          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spinning" : ""} />
          </button>

          <button className="export-btn" onClick={handleExport}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterMode === "today" ? "active" : ""}`}
              onClick={() => handleFilterChange("today")}
            >
              Today
            </button>
            <button
              className={`filter-tab ${filterMode === "custom" ? "active" : ""}`}
              onClick={() => handleFilterChange("custom")}
            >
              Custom Range
            </button>
            <button
              className={`filter-tab ${filterMode === "all" ? "active" : ""}`}
              onClick={() => handleFilterChange("all")}
            >
              All Time
            </button>
            <div className="extra-filters">
          {/* Mode Filter */}
          <div className="filter-group">
            <label>Payment Mode</label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK">Bank</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="filter-group">
            <label>Payment Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="INTEREST">Interest</option>
              <option value="PRINCIPAL">Principal</option>
              <option value="CLOSURE">Closure</option>
            </select>
          </div>
        </div>
          </div>


          {filterMode === "custom" && (
            <div className="date-range-picker">
              <div className="date-input-group">
                <label>From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="date-input-group">
                <label>To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <button
                className="apply-filter-btn"
                onClick={handleApplyCustomFilter}
              >
                Apply Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="history-summary">
        <div className="summary-card">
          <p>Total Collected</p>
          <h2>₹{total.toLocaleString()}</h2>
        </div>

        <div className="summary-stats">
          <div className="stat-item">
            <span>Cash Payments</span>
            <strong>
            {filteredPayments.filter((p) => p.payment_mode === "CASH").length}
            </strong>
          </div>
          <div className="stat-item">
            <span>Digital Payments</span>
            <strong>
            {filteredPayments.filter((p) => p.payment_mode !== "CASH").length}
            </strong>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="payment-table">
          <thead>
            <tr>
              <th>Receipt No.</th>
              <th>Date & Time</th>
              <th>Pledge No.</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Mode</th>
              <th className="text-right">Amount</th>
              <th>Collected By</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="loading-cell">
                  Loading payments...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-cell">
                  No payments found for selected period
                </td>
              </tr>
            ) : (
              paginatedPayments.map((p, index) => (
                <tr key={index}>
                  <td className="receipt-cell">
                    <span className="receipt-no">{p.receipt_no}</span>
                  </td>

                  <td className="time-cell">{p.time}</td>

                  <td className="pledge-cell">{p.pledge_no}</td>

                  <td className="customer-cell">{p.customer_name}</td>

                  <td>
                    <span
                      className={`badge badge-type badge-${p.payment_type.toLowerCase()}`}
                    >
                      {p.payment_type}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`badge badge-mode badge-${p.payment_mode.toLowerCase()}`}
                    >
                      {p.payment_mode}
                    </span>
                  </td>

                  <td className="amount-cell text-right">
                    ₹{p.amount.toLocaleString()}
                  </td>

                  <td>
                    <span className="badge badge-staff">{p.collected_by}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="pagination-container">
        <div className="rows-selector">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          <span>
            Page {currentPage} of {totalPages || 1}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                prev < totalPages ? prev + 1 : prev
              )
            }
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}