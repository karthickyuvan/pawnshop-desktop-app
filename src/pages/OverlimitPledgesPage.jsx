

import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useLanguage } from "../context/LanguageContext"; // custom language hook
import { AlertOctagon, Search, X, TrendingUp } from "lucide-react";
import "./overlimit.css";

export default function OverlimitPledgesPage() {
  const { t } = useLanguage(); 
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
      setPledges(data || []);
    } catch (error) {
      console.error("Error loading overlimit pledges:", error);
      // 🚀 Replaced native browser alert with non-disruptive error toast
      toast.error(t("failed_load_overlimit", "Failed to load overlimit pledges"));
    } finally {
      setLoading(false);
    }
  };

  const filteredPledges = pledges.filter((pledge) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    return (
      (pledge.pledge_no || "").toLowerCase().includes(query) ||
      (pledge.customer_name || "").toLowerCase().includes(query) ||
      (pledge.customer_code || "").toLowerCase().includes(query) ||
      (pledge.phone || "").includes(query)
    );
  });

  const totalOverlimit = filteredPledges.length;
  const avgLTV = filteredPledges.length > 0
    ? filteredPledges.reduce((sum, p) => sum + p.actual_loan_percentage, 0) / filteredPledges.length
    : 0;
  const totalExposure = filteredPledges.reduce((sum, p) => sum + p.loan_amount, 0);
  const totalOverlimitAmount = filteredPledges.reduce((sum, p) => sum + p.overlimit_amount, 0);

  if (loading) {
    return <div className="loading">{t("loading_pledges", "Loading pledges...")}</div>;
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
              <h1>⚠️ {t("overlimit_pledges")}</h1>
              <p>{t("overlimit_subtitle_desc", "Pledges exceeding 80% Loan-to-Value ratio")}</p>
            </div>
          </div>
          <div className="rp-search-bar">
            <Search size={17} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_auction", "Search by pledge no, customer name, code or phone")}
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
            <span>{t("eligible", "Eligible")} {t("over_limit")}</span>
            <strong className="red">{totalOverlimit}</strong>
          </div>
          <div className="rp-stat">
            <span>{t("average_ltv", "Average LTV")}</span>
            <strong className="orange">{avgLTV.toFixed(1)}%</strong>
          </div>
          <div className="rp-stat">
            <span>{t("total_loan_amount")}</span>
            <strong>₹{totalExposure.toLocaleString('en-IN')}</strong>
          </div>
          <div className="rp-stat">
            <span>{t("total_over_80", "Total Over 80%")}</span>
            <strong className="red">₹{totalOverlimitAmount.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="rp-overlimit-warning-banner">
          <AlertOctagon size={18} />
          <div>
            <strong>⚠️ {t("high_risk_pledges", "High Risk Pledges")}</strong>
            <p>
              {t("overlimit_warning_desc", "These pledges have exceeded the 80% LTV limit. The current loan amount is more than 80% of the gold's estimated value. These pledges cannot be repledged above the 80% threshold without collecting payments first.")}
            </p>
          </div>
        </div>

        {/* Pledge Table */}
        {filteredPledges.length === 0 ? (
          <div className="rp-empty overlimit-empty">
            <AlertOctagon size={50} strokeWidth={1.5} />
            <h3>{t("no_overlimit_found", "No Overlimit Pledges Found")}</h3>
            <p>
              {searchQuery
                ? `${t("no_search_results")} "${searchQuery}"`
                : t("all_pledges_safe_desc", "Great! All active pledges are within the 80% LTV limit.")}
            </p>
          </div>
        ) : (
          <div className="overlimit-table-container">
            <table className="overlimit-table">
              <thead>
                <tr>
                  <th>{t("pledge_no")}</th>
                  <th>{t("receipt_no")}</th>
                  <th>{t("customer")}</th>
                  <th>{t("phone")}</th>
                  <th>{t("scheme")}</th>
                  <th>{t("item_value")}</th>
                  <th>{t("loan_amount")}</th>
                  <th>{t("ltv_percentage", "LTV %")}</th>
                  <th>{t("overlimit_amt_header", "Overlimit Amt")}</th>
                  <th>{t("max_repledge", "Max Repledge")}</th>
                  <th>{t("date")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPledges.map((pledge) => (
                  <tr key={pledge.id}>
                    <td className="pledge-no">{pledge.pledge_no}</td>
                    <td>{pledge.receipt_number || t("na", "N/A")}</td>
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