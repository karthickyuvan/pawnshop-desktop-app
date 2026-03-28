import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AlertOctagon, Search, X, TrendingUp } from "lucide-react";
import "./overlimit.css";

export default function OverlimitPledgesPage() {
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPledges();
  }, []);

  const loadPledges = async () => {
    try {
      setLoading(true);
      const data = await invoke("get_overlimit_pledges_cmd");
      setPledges(data);
    } catch (error) {
      console.error("Error loading overlimit pledges:", error);
      alert("Failed to load overlimit pledges");
    } finally {
      setLoading(false);
    }
  };

  const filteredPledges = pledges.filter((pledge) => {
    const query = searchQuery.toLowerCase();
    return (
      pledge.pledge_no.toLowerCase().includes(query) ||
      pledge.customer_name.toLowerCase().includes(query) ||
      pledge.phone.includes(query)
    );
  });

  const totalOverlimit = filteredPledges.length;
  const avgLTV = filteredPledges.length > 0
    ? filteredPledges.reduce((sum, p) => sum + p.actual_loan_percentage, 0) / filteredPledges.length
    : 0;
  const totalExposure = filteredPledges.reduce((sum, p) => sum + p.loan_amount, 0);
  const totalOverlimitAmount = filteredPledges.reduce((sum, p) => sum + p.overlimit_amount, 0);

  if (loading) {
    return <div className="loading">Loading overlimit pledges...</div>;
  }

  return (
    <div className="rp-page">
      <div className="rp-list-layout">
        {/* Header */}
        <div className="rp-list-header">
          <div className="rp-list-title-group">
            <div className="rp-list-icon overlimit-icon">
              <AlertOctagon size={22} />
            </div>
            <div>
              <h1>⚠️ Overlimit Pledges</h1>
              <p>Pledges exceeding 80% Loan-to-Value ratio</p>
            </div>
          </div>
          <div className="rp-search-bar">
            <Search size={17} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by pledge no, customer, phone..."
            />
            {searchQuery && (
              <button className="rp-clear-search" onClick={() => setSearchQuery("")}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Statistics Strip */}
        <div className="rp-stats-strip overlimit-stats">
          <div className="rp-stat">
            <span>Total Overlimit</span>
            <strong className="red">{totalOverlimit}</strong>
          </div>
          <div className="rp-stat">
            <span>Average LTV</span>
            <strong className="orange">{avgLTV.toFixed(1)}%</strong>
          </div>
          <div className="rp-stat">
            <span>Total Exposure</span>
            <strong>₹{totalExposure.toLocaleString('en-IN')}</strong>
          </div>
          <div className="rp-stat">
            <span>Total Over 80%</span>
            <strong className="red">₹{totalOverlimitAmount.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="rp-overlimit-warning-banner">
          <AlertOctagon size={18} />
          <div>
            <strong>⚠️ High Risk Pledges</strong>
            <p>
              These pledges have exceeded the 80% LTV limit. The current loan amount is more than 80%
              of the gold's estimated value. These pledges <strong>cannot be repledged</strong> above
              the 80% threshold without collecting payments first.
            </p>
          </div>
        </div>

        {/* Pledge Table */}
        {filteredPledges.length === 0 ? (
          <div className="rp-empty overlimit-empty">
            <AlertOctagon size={50} strokeWidth={1.5} />
            <h3>No Overlimit Pledges Found</h3>
            <p>
              {searchQuery
                ? `No overlimit pledges match "${searchQuery}"`
                : "Great! All active pledges are within the 80% LTV limit."}
            </p>
          </div>
        ) : (
          <div className="overlimit-table-container">
            <table className="overlimit-table">
              <thead>
                <tr>
                  <th>Pledge No</th>
                  <th>Receipt No</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Scheme</th>
                  <th>Item Value</th>
                  <th>Loan Amount</th>
                  <th>LTV %</th>
                  <th>Overlimit Amt</th>
                  <th>Max Repledge</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPledges.map((pledge) => (
                  <tr key={pledge.id}>
                    <td className="pledge-no">{pledge.pledge_no}</td>
                    <td>{pledge.receipt_number || "N/A"}</td>
                    <td>
                      <div className="customer-cell">
                        <div className="name">{pledge.customer_name}</div>
                        <div className="code">{pledge.customer_code}</div>
                      </div>
                    </td>
                    <td>{pledge.phone}</td>
                    <td>{pledge.scheme_name}</td>
                    <td className="amount">₹{pledge.total_value.toLocaleString('en-IN')}</td>
                    <td className="amount">₹{pledge.loan_amount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`ltv-badge ${pledge.actual_loan_percentage > 85 ? 'critical' : 'warning'}`}>
                        {pledge.actual_loan_percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="overlimit-amt">
                      <TrendingUp size={14} />
                      ₹{pledge.overlimit_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="max-repledge">
                      ₹{pledge.max_repledge_amount.toLocaleString('en-IN')}
                    </td>
                    <td>{new Date(pledge.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}