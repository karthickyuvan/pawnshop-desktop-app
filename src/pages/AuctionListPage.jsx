import { useState, useEffect, useCallback } from "react";
import { getAuctionList, markPledgeAuctioned } from "../services/auctionApi";
import "./auction.css";
import {
  Gavel,
  Search,
  AlertTriangle,
  TrendingUp,
  Clock,
  Package,
  Phone,
  MapPin,
  ChevronRight,
  RefreshCw,
  X,
  CheckCircle,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmAuctionDialog({ pledge, onConfirm, onCancel }) {

  const { t } = useLanguage();
  return (
    <div className="auction-overlay">
      <div className="auction-dialog">
        <div className="dialog-icon-wrap">
          <Gavel size={32} className="dialog-gavel" />
        </div>
        <h2 className="dialog-title">{t("confirm_auction")}</h2>
        <p className="dialog-subtitle">
        {t("auction_irreversible")}
        </p>

        <div className="dialog-pledge-card">
          <div className="dlg-row">
            <span className="dlg-label">{t("pledge_no")}</span>
            <span className="dlg-value">{pledge.pledge_no}</span>
          </div>
          <div className="dlg-row">
            <span className="dlg-label">{t("customer")}</span>
            <span className="dlg-value">{pledge.customer_name}</span>
          </div>
          <div className="dlg-row">
            <span className="dlg-label">{t("laon_amount")}</span>
            <span className="dlg-value dlg-amount">
              ₹ {pledge.loan_amount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="dlg-row">
            <span className="dlg-label">{t("age")}</span>
            <span className="dlg-value dlg-age">
              {pledge.years_elapsed.toFixed(1)} {t("years")}
            </span>
          </div>
        </div>

        <div className="dialog-actions">
          <button className="btn-cancel-dlg" onClick={onCancel}>
            <X size={16} /> {t("cancel")}
          </button>
          <button className="btn-confirm-dlg" onClick={() => onConfirm(pledge)}>
            <Gavel size={16} /> {t("confirm_auction")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pledge Row Card ───────────────────────────────────────────────────────────
function AuctionCard({ pledge, onAuction }) {
  const yearsInt = Math.floor(pledge.years_elapsed);
  const urgency =
    pledge.years_elapsed >= 5 ? "critical" :
    pledge.years_elapsed >= 4 ? "high" : "medium";
  const {t}=useLanguage;
  return (
    <div className={`auction-card urgency-${urgency}`}>
      <div className="auction-card-left">
        <div className="urgency-strip" />
        <div className="card-main">
          <div className="card-top-row">
            <span className="pledge-no-tag">{pledge.pledge_no}</span>
            <span className={`urgency-badge badge-${urgency}`}>
              {urgency === "critical" ? "⚠ Critical" :
               urgency === "high" ? "↑ High Priority" : "Eligible"}
            </span>
          </div>

          <div className="card-customer-info">
            <h3 className="card-customer-name">{pledge.customer_name}</h3>
            <span className="card-customer-code">{pledge.customer_code}</span>
          </div>

          <div className="card-meta-grid">
            <div className="meta-item">
              <Phone size={13} />
              <span>{pledge.phone}</span>
            </div>
            {pledge.address && (
              <div className="meta-item">
                <MapPin size={13} />
                <span className="meta-truncate">{pledge.address}</span>
              </div>
            )}
            <div className="meta-item">
              <Package size={13} />
              <span>
                {pledge.items_count}{t("item")}{pledge.items_count !== 1 ? "s" : ""} ·
                {" "}{pledge.total_net_weight.toFixed(2)}g net wt
              </span>
            </div>
          </div>

          <div className="card-scheme-row">
            <span className="scheme-chip">{pledge.scheme_name}</span>
            <span className="loan-type-chip">{pledge.loan_type}</span>
            <span className="rate-chip">{pledge.interest_rate}% p.m.</span>
          </div>
        </div>
      </div>

      <div className="auction-card-right">
        <div className="loan-amount-block">
          <span className="loan-label">{t("loab_amount")}</span>
          <span className="loan-value">
            ₹{pledge.loan_amount.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="age-block">
          <Clock size={18} className="age-icon" />
          <div>
            <span className="age-years">{pledge.years_elapsed.toFixed(1)}</span>
            <span className="age-unit"> {t("yrs")}</span>
          </div>
          <span className="age-sub">{t("since_pledge")}</span>
        </div>

        <div className="pledged-on">
          {t("pledged_on")} {pledge.pledged_date.slice(0, 10)}
        </div>

        <button
          className="btn-auction-action"
          onClick={() => onAuction(pledge)}
        >
          <Gavel size={15} />
          {t("auction")}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AuctionListPage({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [confirmPledge, setConfirmPledge] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const { t } = useLanguage();
  const fetchData = useCallback(async (searchTerm = null) => {
    setLoading(true);
    setError("");
    try {
      const res = await getAuctionList(searchTerm || null);
      setData(res);
    } catch (e) {
      setError("Failed to load auction list: " + e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      fetchData(searchInput || null);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleAuction = async (pledge) => {
    try {
      await markPledgeAuctioned(pledge.pledge_id, user.user_id || user.id);
      setConfirmPledge(null);
      setSuccessMsg(`Pledge ${pledge.pledge_no} successfully marked as AUCTIONED.`);
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchData(search || null);
    } catch (e) {
      setError("Failed to auction: " + e);
      setConfirmPledge(null);
    }
  };

  return (
    <div className="auction-page">

      {/* ── Confirm Dialog ── */}
      {confirmPledge && (
        <ConfirmAuctionDialog
          pledge={confirmPledge}
          onConfirm={handleAuction}
          onCancel={() => setConfirmPledge(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="auction-header">
        <div className="auction-header-left">
          <div className="auction-title-row">
            <Gavel size={26} className="header-gavel" />
            <h1 className="auction-title">{t("auction_eligible_pledges")}</h1>
          </div>
          <p className="auction-subtitle">
            {t("auction_rule_description")}
          </p>
        </div>
        <button
          className="btn-refresh"
          onClick={() => fetchData(search || null)}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? "spin" : ""} />
          {t("refresh")}
        </button>
      </div>

      {/* ── Success Toast ── */}
      {successMsg && (
        <div className="auction-toast">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="auction-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* ── Summary Cards ── */}
      {data && (
        <div className="auction-summary-row">
          <div className="summary-card sc-red">
            <div className="sc-icon"><AlertTriangle size={22} /></div>
            <div className="sc-body">
              <span className="sc-value">{data.summary.total_eligible}</span>
              <span className="sc-label">{t("eligible_for_auction")}</span>
            </div>
          </div>
          <div className="summary-card sc-amber">
            <div className="sc-icon"><TrendingUp size={22} /></div>
            <div className="sc-body">
              <span className="sc-value">
                ₹{data.summary.total_loan_value.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className="sc-label">{t("loan_value_at_risk")}</span>
            </div>
          </div>
          <div className="summary-card sc-slate">
            <div className="sc-icon"><Clock size={22} /></div>
            <div className="sc-body">
              <span className="sc-value">
                {data.summary.oldest_pledge_years.toFixed(1)} yrs
              </span>
              <span className="sc-label">{t("oldest_inactive_pledge")}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="auction-search-bar">
        <Search size={18} className="asb-icon" />
        <input
          className="asb-input"
          placeholder={t("search_auction")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput && (
          <button className="asb-clear" onClick={() => setSearchInput("")}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="auction-loading">
          <RefreshCw size={28} className="spin" />
          <p>{t("loading_auction_candidates")}</p>
        </div>
      ) : data?.pledges.length === 0 ? (
        <div className="auction-empty">
          <Gavel size={48} className="empty-gavel" />
          <h3>{t("no_eligible_pledges")}</h3>
          <p>
          {search
  ? t("no_search_results")
  : t("all_pledges_active")}
          </p>
        </div>
      ) : (
        <div className="auction-list">
          {data.pledges.map((pledge) => (
            <AuctionCard
              key={pledge.pledge_id}
              pledge={pledge}
              onAuction={(p) => setConfirmPledge(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}