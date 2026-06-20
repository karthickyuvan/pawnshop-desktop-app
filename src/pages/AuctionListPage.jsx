

// import { useState, useEffect, useCallback, useRef } from "react";
// import {
//   getAuctionList,
//   markPledgeAuctioned,
//   getAuctionedList,
// } from "../services/auctionApi";
// import "./auction.css";
// import {
//   Gavel,
//   Search,
//   AlertTriangle,
//   TrendingUp,
//   Clock,
//   Package,
//   Phone,
//   MapPin,
//   ChevronRight,
//   RefreshCw,
//   X,
//   CheckCircle,
// } from "lucide-react";
// import { useLanguage } from "../context/LanguageContext";
// import { formatDateToDMY } from "../utils/timeFormatter";

// // ─── Confirm Dialog ────────────────────────────────────────────────────────────
// function ConfirmAuctionDialog({
//   pledge,
//   onConfirm,
//   onCancel,
//   auctionAmount,
//   setAuctionAmount,
//   auctionNotes,
//   setAuctionNotes,
// }) {
//   const { t } = useLanguage();
//   const outstanding = pledge.outstanding_amount ?? 0;
//   const profitLoss = Number(auctionAmount || 0) - outstanding;

//   return (
//     <div className="auction-overlay">
//       <div className="auction-dialog">
//         <div className="dialog-icon-wrap">
//           <Gavel size={32} className="dialog-gavel" />
//         </div>
//         <h2 className="dialog-title">{t("confirm_auction")}</h2>
//         <p className="dialog-subtitle">{t("auction_irreversible")}</p>

//         <div className="dialog-pledge-card">
//           <div className="dlg-row">
//             <span className="dlg-label">{t("pledge_no")}</span>
//             <span className="dlg-value">{pledge.pledge_no}</span>
//           </div>
//           <div className="dlg-row">
//             <span className="dlg-label">{t("customer")}</span>
//             <span className="dlg-value">{pledge.customer_name}</span>
//           </div>
//           <div className="dlg-row">
//             <span className="dlg-label">{t("loan_amount")}</span>
//             <span className="dlg-value loan-amount-value">
//               ₹{(pledge.loan_amount ?? 0).toLocaleString("en-IN")}
//             </span>
//           </div>
//           <div className="dlg-row">
//             <span className="dlg-label">{t("pending_interest")}</span>
//             <span className="dlg-value interest-value">
//               ₹{(pledge.pending_interest ?? 0).toLocaleString("en-IN")}
//             </span>
//           </div>
//           <div className="dlg-row">
//             <span className="dlg-label">{t("outstanding_amount", "Outstanding Amount")}</span>
//             <span className="dlg-value outstanding-value">
//               ₹{outstanding.toLocaleString("en-IN")}
//             </span>
//           </div>
//           <div className="dlg-row">
//             <span className="dlg-label">{t("age")}</span>
//             <span className="dlg-value dlg-age">
//               {(pledge.years_elapsed ?? 0).toFixed(1)} {t("years")}
//             </span>
//           </div>

//           <div className="auction-form-group">
//             <label>{t("auction_amount_label", "Auction Amount")}</label>
//             <input
//               type="number"
//               value={auctionAmount}
//               onChange={(e) => setAuctionAmount(e.target.value)}
//               placeholder={t("enter_auction_amount_placeholder", "Enter auction amount")}
//             />
//             {auctionAmount && (
//               <div
//                 className={profitLoss >= 0 ? "auction-profit" : "auction-loss"}
//               >
//                 {profitLoss >= 0
//                   ? `${t("profit", "Profit")}: ₹${profitLoss.toLocaleString("en-IN")}`
//                   : `${t("loss", "Loss")}: ₹${Math.abs(profitLoss).toLocaleString("en-IN")}`}
//               </div>
//             )}
//           </div>

//           <div className="auction-form-group">
//             <label>{t("auction_notes_label", "Auction Notes")}</label>
//             <textarea
//               value={auctionNotes}
//               onChange={(e) => setAuctionNotes(e.target.value)}
//               placeholder={t("optional_notes_placeholder", "Optional notes")}
//             />
//           </div>
//         </div>

//         <div className="dialog-actions">
//           <button className="btn-cancel-dlg" onClick={onCancel}>
//             <X size={16} /> {t("cancel")}
//           </button>
//           <button
//             className="btn-confirm-dlg"
//             disabled={
//               !auctionAmount ||
//               Number(auctionAmount) <= 0 ||
//               Number(auctionAmount) < outstanding
//             }
//             onClick={() => onConfirm(pledge)}
//           >
//             <Gavel size={16} />
//             {t("confirm_auction_btn", "Confirm Auction")}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Auctioned Card ────────────────────────────────────────────────────────────
// function AuctionedCard({ pledge }) {
//   const { t } = useLanguage();
//   const profit =
//     (pledge.auction_amount ?? 0) -
//     (pledge.outstanding_amount ?? pledge.loan_amount ?? 0);
//   const profitPercent =
//     pledge.loan_amount > 0
//       ? ((profit / pledge.loan_amount) * 100).toFixed(2)
//       : 0;

//   return (
//     <div className="auctioned-grid-card">
//       <div className="auctioned-col">
//         <div className="auctioned-heading">{t("pledge_details_hdr", "PLEDGE DETAILS")}</div>
//         <span className="pledge-no-tag">{pledge.pledge_no}</span>
//       </div>

//       <div className="auctioned-col">
//         <div className="auctioned-heading">{t("customer_details_hdr", "CUSTOMER DETAILS")}</div>
//         <h3>{pledge.customer_name}</h3>
//         <div>{pledge.customer_code}</div>
//         <div>{pledge.phone}</div>
//       </div>

//       <div className="auctioned-col">
//         <div className="auctioned-heading">{t("loan_details_hdr", "LOAN DETAILS")}</div>
//         <div>
//           {t("loan_amount")}{" "}
//           <strong>₹{(pledge.loan_amount ?? 0).toLocaleString("en-IN")}</strong>
//         </div>
//         <div>
//           {t("interest_pending_lbl", "Interest Pending")}{" "}
//           <strong>
//             ₹{(pledge.pending_interest ?? 0).toLocaleString("en-IN")}
//           </strong>
//         </div>
//         <div>
//           {t("outstanding_lbl", "Outstanding")}{" "}
//           <strong>
//             ₹{(pledge.outstanding_amount ?? 0).toLocaleString("en-IN")}
//           </strong>
//         </div>
//       </div>

//       <div className="auctioned-col">
//         <div className="auctioned-heading">{t("auction_details_hdr", "AUCTION DETAILS")}</div>
//         <div>{pledge.auctioned_at?.slice(0, 16)}</div>
//         <div className="auction-price">
//           ₹{(pledge.auction_amount ?? 0).toLocaleString("en-IN")}
//         </div>
//         <div className="auction-note">{pledge.auction_notes}</div>
//       </div>

//       <div className="auctioned-col">
//         <div className="auctioned-heading">{t("profit_loss_hdr", "PROFIT / LOSS")}</div>
//         <div className={profit >= 0 ? "profit-value" : "loss-value"}>
//           {profit >= 0 ? t("profit", "Profit") : t("loss", "Loss")}
//           <br />₹{Math.abs(profit).toLocaleString("en-IN")}
//           <br />({profitPercent}%)
//         </div>
//       </div>

//       <div className="auctioned-col">
//         <div className="auctioned-heading">{t("items_summary_hdr", "ITEMS SUMMARY")}</div>
//         <div>{t("gross")}: {(pledge.total_gross_weight ?? 0).toFixed(3)} g</div>
//         <div>{t("net")}: {(pledge.total_net_weight ?? 0).toFixed(3)} g</div>
//       </div>

//       <div className="auctioned-col action-col">
//         <span className="auctioned-status">{t("auction_status_tag", "AUCTIONED")}</span>
//       </div>
//     </div>
//   );
// }

// // ─── Eligible Card ─────────────────────────────────────────────────────────────
// function AuctionCard({ pledge, onAuction }) {
//   const yearsElapsed = pledge.years_elapsed ?? 0;
//   const urgency =
//     yearsElapsed >= 5 ? "critical" : yearsElapsed >= 4 ? "high" : "medium";
//   const { t } = useLanguage();

//   return (
//     <div className={`auction-card urgency-${urgency}`}>
//       <div className="auction-card-left">
//         <div className="urgency-strip" />
//         <div className="card-main">
//           <div className="card-top-row">
//             <span className="pledge-no-tag">{pledge.pledge_no}</span>
//             <span className={`urgency-badge badge-${urgency}`}>
//               {urgency === "critical"
//                 ? `⚠ ${t("urgency_critical", "Critical")}`
//                 : urgency === "high"
//                   ? `↑ ${t("urgency_high", "High Priority")}`
//                   : t("eligible", "Eligible")}
//             </span>
//           </div>

//           <div className="card-customer-info">
//             <h3 className="card-customer-name">{pledge.customer_name}</h3>
//             <span className="card-customer-code">{pledge.customer_code}</span>
//           </div>

//           <div className="card-meta-grid">
//             <div className="meta-item">
//               <Phone size={13} />
//               <span>{pledge.phone}</span>
//             </div>
//             {pledge.address && (
//               <div className="meta-item">
//                 <MapPin size={13} />
//                 <span className="meta-truncate">{pledge.address}</span>
//               </div>
//             )}
//             <div className="meta-item">
//               <Package size={13} />
//               <span>
//                 {pledge.items_count ?? 0} {t("item", "item")}
//                 {(pledge.items_count ?? 0) !== 1 ? "s" : ""} ·{" "}
//                 {(pledge.total_net_weight ?? 0).toFixed(2)}g {t("net", "Net")} {t("weight", "Wt.")}
//               </span>
//             </div>
//           </div>

//           <div className="card-scheme-row">
//             <span className="scheme-chip">{pledge.scheme_name}</span>
//             <span className="loan-type-chip">{pledge.loan_type}</span>
//             <span className="rate-chip">{pledge.interest_rate}% {t("per_month")}</span>
//           </div>
//         </div>
//       </div>

//       <div className="auction-card-right">
//         <div className="loan-amount-block">
//           <span className="loan-label">{t("loan_amount")}</span>
//           <span className="loan-value">
//             ₹{(pledge.loan_amount ?? 0).toLocaleString("en-IN")}
//           </span>
//           <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px" }}>
//             {t("interest_due_lbl", "Interest Due")}: ₹
//             {(pledge.pending_interest ?? 0).toLocaleString("en-IN")}
//           </div>
//           <div
//             style={{
//               fontSize: "14px",
//               fontWeight: "700",
//               color: "#16a34a",
//               marginTop: "4px",
//             }}
//           >
//             {t("outstanding_lbl", "Outstanding")}: ₹
//             {(pledge.outstanding_amount ?? 0).toLocaleString("en-IN")}
//           </div>
//         </div>

//         <div className="age-block">
//           <Clock size={18} className="age-icon" />
//           <div>
//             <span className="age-years">{yearsElapsed.toFixed(1)}</span>
//             <span className="age-unit"> {t("yrs")}</span>
//           </div>
//           <span className="age-sub">{t("since_pledge")}</span>
//         </div>

//         <div className="pledged-on">
//           {t("pledged_on")} {formatDateToDMY(pledge.pledged_date)}
//         </div>

//         <button
//           className="btn-auction-action"
//           onClick={() => onAuction(pledge)}
//         >
//           <Gavel size={15} />
//           {t("auction")}
//           <ChevronRight size={14} />
//         </button>
//       </div>
//     </div>
//   );
// }

// // ─── Main Page ─────────────────────────────────────────────────────────────────
// export default function AuctionListPage({ user }) {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchInput, setSearchInput] = useState("");
//   const [confirmPledge, setConfirmPledge] = useState(null);
//   const [successMsg, setSuccessMsg] = useState("");
//   const [error, setError] = useState("");
//   const [activeTab, setActiveTab] = useState("eligible");
//   const [auctionAmount, setAuctionAmount] = useState("");
//   const [auctionNotes, setAuctionNotes] = useState("");
//   const { t } = useLanguage();

//   const activeRequestTab = useRef(activeTab);

//   const fetchData = useCallback(
//     async (searchTerm = "", targetTab = activeTab) => {
//       setLoading(true);
//       setError("");
//       activeRequestTab.current = targetTab;

//       try {
//         const trimmedQuery = searchTerm.trim() || null;
//         const res =
//           targetTab === "eligible"
//             ? await getAuctionList(trimmedQuery)
//             : await getAuctionedList(trimmedQuery);

//         if (activeRequestTab.current === targetTab) {
//           setData(res);
//         }
//       } catch (e) {
//         if (activeRequestTab.current === targetTab) {
//           setError(t("failed_load_auction_list_err", "Failed to load auction list: ") + e.message);
//         }
//       } finally {
//         if (activeRequestTab.current === targetTab) {
//           setLoading(false);
//         }
//       }
//     },
//     [activeTab, t],
//   );

//   useEffect(() => {
//     if (searchInput.trim() === "") {
//       fetchData("", activeTab);
//       return;
//     }

//     const timer = setTimeout(() => {
//       fetchData(searchInput, activeTab);
//     }, 400);

//     return () => clearTimeout(timer);
//   }, [searchInput, activeTab, fetchData]);

//   const handleTabChange = (tab) => {
//     setSearchInput("");
//     setActiveTab(tab);
//   };

//   const closeDialog = () => {
//     setConfirmPledge(null);
//     setAuctionAmount("");
//     setAuctionNotes("");
//   };

//   const handleAuction = async (pledge) => {
//     try {
//       if (!auctionAmount || Number(auctionAmount) <= 0) {
//         setError(t("valid_auction_amount_err", "Please enter a valid auction amount"));
//         return;
//       }
//       const outstanding = pledge.outstanding_amount ?? 0;
//       if (Number(auctionAmount) < outstanding) {
//         setError(
//           `${t("auction_less_outstanding_err", "Auction amount cannot be less than outstanding amount")} (₹${outstanding.toLocaleString("en-IN")})`,
//         );
//         return;
//       }

//       await markPledgeAuctioned(
//         pledge.pledge_id,
//         Number(auctionAmount),
//         auctionNotes || null,
//       );

//       closeDialog();
//       setSuccessMsg(
//         `${t("pledge_word", "Pledge")} ${pledge.pledge_no} ${t("auction_success")}`,
//       );
//       setTimeout(() => setSuccessMsg(""), 4000);
//       fetchData(searchInput, activeTab);
//     } catch (e) {
//       setError(t("failed_to_auction_err", "Failed to auction: ") + e.message);
//       closeDialog();
//     }
//   };

//   const auctionMonths = data?.summary?.auction_after_months ?? 36;

//   const auctionPeriodText =
//     auctionMonths % 12 === 0
//       ? `${auctionMonths / 12}+ ${t("years")}`
//       : `${auctionMonths}+ ${t("months")}`;

//   return (
//     <div className="auction-page">
//       <div className="auction-tabs">
//         <button
//           className={activeTab === "eligible" ? "active" : ""}
//           onClick={() => handleTabChange("eligible")}
//         >
//           {t("eligible", "Eligible")}
//         </button>
//         <button
//           className={activeTab === "auctioned" ? "active" : ""}
//           onClick={() => handleTabChange("auctioned")}
//         >
//           {t("auction_status_tag", "Auctioned")}
//         </button>
//       </div>

//       {confirmPledge && (
//         <ConfirmAuctionDialog
//           pledge={confirmPledge}
//           onConfirm={handleAuction}
//           onCancel={closeDialog}
//           auctionAmount={auctionAmount}
//           setAuctionAmount={setAuctionAmount}
//           auctionNotes={auctionNotes}
//           setAuctionNotes={setAuctionNotes}
//         />
//       )}

//       <div className="auction-header">
//         <div className="auction-header-left">
//           <div className="auction-title-row">
//             <Gavel size={26} className="header-gavel" />
//             <h1 className="auction-title">
//               {activeTab === "eligible"
//                 ? t("auction_eligible_pledges")
//                 : t("auctioned_pledges_title", "Auctioned Pledges")}
//             </h1>
//           </div>
//           {activeTab === "eligible" && (
//             <div className="auction-rule-badge">
//               {t("auction_rule_lbl", "Auction Rule")}: {auctionPeriodText}
//             </div>
//           )}

//           <p className="auction-subtitle">
//             {activeTab === "eligible"
//               ? `${t("pledges_inactive_prefix", "Pledges inactive for")} ${auctionPeriodText} ${t("pledges_inactive_suffix", "with no interest or principal payments")}`
//               : t("auction_history_subtitle", "History of auctioned pledges")}
//           </p>
//         </div>
//         <button
//           className="btn-refresh"
//           onClick={() => fetchData(searchInput, activeTab)}
//           disabled={loading}
//         >
//           <RefreshCw size={15} className={loading ? "spin" : ""} />
//           {t("refresh")}
//         </button>
//       </div>

//       {successMsg && (
//         <div className="auction-toast">
//           <CheckCircle size={16} /> {successMsg}
//         </div>
//       )}
//       {error && (
//         <div className="auction-error">
//           <AlertTriangle size={16} /> {error}
//         </div>
//       )}

//       {data && (
//         <div className="auction-summary-row">
//           <div className="summary-card sc-red">
//             <div className="sc-icon">
//               <AlertTriangle size={22} />
//             </div>
//             <div className="sc-body">
//               <span className="sc-value">
//                 {activeTab === "eligible"
//                   ? data.summary.total_eligible
//                   : data.summary.total_auctioned}
//               </span>
//               <span className="sc-label">
//                 {activeTab === "eligible"
//                   ? t("eligible_for_auction")
//                   : t("total_auctioned_lbl", "Total Auctioned")}
//               </span>
//             </div>
//           </div>

//           <div className="summary-card sc-amber">
//             <div className="sc-icon">
//               <TrendingUp size={22} />
//             </div>
//             <div className="sc-body">
//               <span className="sc-value">
//                 ₹
//                 {(data.summary.total_loan_value ?? 0).toLocaleString("en-IN", {
//                   maximumFractionDigits: 0,
//                 })}
//               </span>
//               <span className="sc-label">{t("loan_value_at_risk")}</span>
//             </div>
//           </div>

//           {activeTab === "eligible" && (
//             <div className="summary-card sc-slate">
//               <div className="sc-icon">
//                 <Clock size={22} />
//               </div>
//               <div className="sc-body">
//                 <span className="sc-value">
//                   {(data.summary.oldest_pledge_years ?? 0).toFixed(1)} {t("yrs")}
//                 </span>
//                 <span className="sc-label">{t("oldest_inactive_pledge")}</span>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       <div className="auction-search-bar">
//         <Search size={18} className="asb-icon" />
//         <input
//           className="asb-input"
//           placeholder={t("search_auction")}
//           value={searchInput}
//           onChange={(e) => setSearchInput(e.target.value)}
//         />
//         {searchInput && (
//           <button className="asb-clear" onClick={() => setSearchInput("")}>
//             <X size={16} />
//           </button>
//         )}
//       </div>

//       {loading ? (
//         <div className="auction-loading">
//           <RefreshCw size={28} className="spin" />
//           <p>{t("loading_auction_candidates")}</p>
//         </div>
//       ) : data?.pledges.length === 0 ? (
//         <div className="auction-empty">
//           <Gavel size={48} className="empty-gavel" />
//           <h3>
//             {activeTab === "eligible"
//               ? t("no_eligible_pledges")
//               : t("no_auctioned_pledges_fallback", "No Auctioned Pledges")}
//           </h3>
//           <p>
//             {activeTab === "eligible"
//               ? searchInput
//                 ? t("no_search_results")
//                 : t("all_pledges_active")
//               : t("no_auctioned_records_desc", "No auctioned pledges found.")}
//           </p>
//         </div>
//       ) : (
//         <div className="auction-list">
//           {activeTab === "eligible"
//             ? data.pledges.map((pledge) => (
//                 <AuctionCard
//                   key={pledge.pledge_id}
//                   pledge={pledge}
//                   onAuction={(p) => {
//                     setConfirmPledge(p);
//                     setAuctionAmount((p.outstanding_amount ?? 0).toFixed(2));
//                     setAuctionNotes(
//                       `${t("auctioned_after_note", "Auctioned after")} ${(p.years_elapsed ?? 0).toFixed(1)} ${t("years_of_inactivity_note", "years of inactivity")}`,
//                     );
//                   }}
//                 />
//               ))
//             : data.pledges.map((pledge) => (
//                 <AuctionedCard key={pledge.pledge_id} pledge={pledge} />
//               ))}
//         </div>
//       )}
//     </div>
//   );
// }








import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import {
  getAuctionList,
  markPledgeAuctioned,
  getAuctionedList,
} from "../services/auctionApi";
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
import { formatDateToDMY } from "../utils/timeFormatter";

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmAuctionDialog({
  pledge,
  onConfirm,
  onCancel,
  auctionAmount,
  setAuctionAmount,
  auctionNotes,
  setAuctionNotes,
}) {
  const { t } = useLanguage();
  const outstanding = pledge.outstanding_amount ?? 0;
  const profitLoss = Number(auctionAmount || 0) - outstanding;

  return (
    <div className="auction-overlay">
      <div className="auction-dialog">
        <div className="dialog-icon-wrap">
          <Gavel size={32} className="dialog-gavel" />
        </div>
        <h2 className="dialog-title">{t("confirm_auction")}</h2>
        <p className="dialog-subtitle">{t("auction_irreversible")}</p>

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
            <span className="dlg-label">{t("loan_amount")}</span>
            <span className="dlg-value loan-amount-value">
              ₹{(pledge.loan_amount ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="dlg-row">
            <span className="dlg-label">{t("pending_interest")}</span>
            <span className="dlg-value interest-value">
              ₹{(pledge.pending_interest ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="dlg-row">
            <span className="dlg-label">{t("outstanding_amount", "Outstanding Amount")}</span>
            <span className="dlg-value outstanding-value">
              ₹{outstanding.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="dlg-row">
            <span className="dlg-label">{t("age")}</span>
            <span className="dlg-value dlg-age">
              {(pledge.years_elapsed ?? 0).toFixed(1)} {t("years")}
            </span>
          </div>

          <div className="auction-form-group">
            <label>{t("auction_amount_label", "Auction Amount")}</label>
            <input
              type="number"
              value={auctionAmount}
              onChange={(e) => setAuctionAmount(e.target.value)}
              placeholder={t("enter_auction_amount_placeholder", "Enter auction amount")}
            />
            {auctionAmount && (
              <div
                className={profitLoss >= 0 ? "auction-profit" : "auction-loss"}
              >
                {profitLoss >= 0
                  ? `${t("profit", "Profit")}: ₹${profitLoss.toLocaleString("en-IN")}`
                  : `${t("loss", "Loss")}: ₹${Math.abs(profitLoss).toLocaleString("en-IN")}`}
              </div>
            )}
          </div>

          <div className="auction-form-group">
            <label>{t("auction_notes_label", "Auction Notes")}</label>
            <textarea
              value={auctionNotes}
              onChange={(e) => setAuctionNotes(e.target.value)}
              placeholder={t("optional_notes_placeholder", "Optional notes")}
            />
          </div>
        </div>

        <div className="dialog-actions">
          <button className="btn-cancel-dlg" onClick={onCancel}>
            <X size={16} /> {t("cancel")}
          </button>
          <button
            className="btn-confirm-dlg"
            disabled={
              !auctionAmount ||
              Number(auctionAmount) <= 0 ||
              Number(auctionAmount) < outstanding
            }
            onClick={() => onConfirm(pledge)}
          >
            <Gavel size={16} />
            {t("confirm_auction_btn", "Confirm Auction")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Auctioned Card ────────────────────────────────────────────────────────────
function AuctionedCard({ pledge }) {
  const { t } = useLanguage();
  const profit =
    (pledge.auction_amount ?? 0) -
    (pledge.outstanding_amount ?? pledge.loan_amount ?? 0);
  const profitPercent =
    pledge.loan_amount > 0
      ? ((profit / pledge.loan_amount) * 100).toFixed(2)
      : 0;

  return (
    <div className="auctioned-grid-card">
      <div className="auctioned-col">
        <div className="auctioned-heading">{t("pledge_details_hdr", "PLEDGE DETAILS")}</div>
        <span className="pledge-no-tag">{pledge.pledge_no}</span>
      </div>

      <div className="auctioned-col">
        <div className="auctioned-heading">{t("customer_details_hdr", "CUSTOMER DETAILS")}</div>
        <h3>{pledge.customer_name}</h3>
        <div>{pledge.customer_code}</div>
        <div>{pledge.phone}</div>
      </div>

      <div className="auctioned-col">
        <div className="auctioned-heading">{t("loan_details_hdr", "LOAN DETAILS")}</div>
        <div>
          {t("loan_amount")}{" "}
          <strong>₹{(pledge.loan_amount ?? 0).toLocaleString("en-IN")}</strong>
        </div>
        <div>
          {t("interest_pending_lbl", "Interest Pending")}{" "}
          <strong>
            ₹{(pledge.pending_interest ?? 0).toLocaleString("en-IN")}
          </strong>
        </div>
        <div>
          {t("outstanding_lbl", "Outstanding")}{" "}
          <strong>
            ₹{(pledge.outstanding_amount ?? 0).toLocaleString("en-IN")}
          </strong>
        </div>
      </div>

      <div className="auctioned-col">
        <div className="auctioned-heading">{t("auction_details_hdr", "AUCTION DETAILS")}</div>
        <div>{pledge.auctioned_at?.slice(0, 16)}</div>
        <div className="auction-price">
          ₹{(pledge.auction_amount ?? 0).toLocaleString("en-IN")}
        </div>
        <div className="auction-note">{pledge.auction_notes}</div>
      </div>

      <div className="auctioned-col">
        <div className="auctioned-heading">{t("profit_loss_hdr", "PROFIT / LOSS")}</div>
        <div className={profit >= 0 ? "profit-value" : "loss-value"}>
          {profit >= 0 ? t("profit", "Profit") : t("loss", "Loss")}
          <br />₹{Math.abs(profit).toLocaleString("en-IN")}
          <br />({profitPercent}%)
        </div>
      </div>

      <div className="auctioned-col">
        <div className="auctioned-heading">{t("items_summary_hdr", "ITEMS SUMMARY")}</div>
        <div>{t("gross")}: {(pledge.total_gross_weight ?? 0).toFixed(3)} g</div>
        <div>{t("net")}: {(pledge.total_net_weight ?? 0).toFixed(3)} g</div>
      </div>

      <div className="auctioned-col action-col">
        <span className="auctioned-status">{t("auction_status_tag", "AUCTIONED")}</span>
      </div>
    </div>
  );
}

// ─── Eligible Card ─────────────────────────────────────────────────────────────
function AuctionCard({ pledge, onAuction }) {
  const yearsElapsed = pledge.years_elapsed ?? 0;
  const urgency =
    yearsElapsed >= 5 ? "critical" : yearsElapsed >= 4 ? "high" : "medium";
  const { t } = useLanguage();

  return (
    <div className={`auction-card urgency-${urgency}`}>
      <div className="auction-card-left">
        <div className="urgency-strip" />
        <div className="card-main">
          <div className="card-top-row">
            <span className="pledge-no-tag">{pledge.pledge_no}</span>
            <span className={`urgency-badge badge-${urgency}`}>
              {urgency === "critical"
                ? `⚠ ${t("urgency_critical", "Critical")}`
                : urgency === "high"
                  ? `↑ ${t("urgency_high", "High Priority")}`
                  : t("eligible", "Eligible")}
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
                {pledge.items_count ?? 0} {t("item", "item")}
                {(pledge.items_count ?? 0) !== 1 ? "s" : ""} ·{" "}
                {(pledge.total_net_weight ?? 0).toFixed(2)}g {t("net", "Net")} {t("weight", "Wt.")}
              </span>
            </div>
          </div>

          <div className="card-scheme-row">
            <span className="scheme-chip">{pledge.scheme_name}</span>
            <span className="loan-type-chip">{pledge.loan_type}</span>
            <span className="rate-chip">{pledge.interest_rate}% {t("per_month")}</span>
          </div>
        </div>
      </div>

      <div className="auction-card-right">
        <div className="loan-amount-block">
          <span className="loan-label">{t("loan_amount")}</span>
          <span className="loan-value">
            ₹{(pledge.loan_amount ?? 0).toLocaleString("en-IN")}
          </span>
          <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px" }}>
            {t("interest_due_lbl", "Interest Due")}: ₹
            {(pledge.pending_interest ?? 0).toLocaleString("en-IN")}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#16a34a",
              marginTop: "4px",
            }}
          >
            {t("outstanding_lbl", "Outstanding")}: ₹
            {(pledge.outstanding_amount ?? 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="age-block">
          <Clock size={18} className="age-icon" />
          <div>
            <span className="age-years">{yearsElapsed.toFixed(1)}</span>
            <span className="age-unit"> {t("yrs")}</span>
          </div>
          <span className="age-sub">{t("since_pledge")}</span>
        </div>

        <div className="pledged-on">
          {t("pledged_on")} {formatDateToDMY(pledge.pledged_date)}
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
  const [searchInput, setSearchInput] = useState("");
  const [confirmPledge, setConfirmPledge] = useState(null);
  const [activeTab, setActiveTab] = useState("eligible");
  const [auctionAmount, setAuctionAmount] = useState("");
  const [auctionNotes, setAuctionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // 🚀 Track submission state
  const { t } = useLanguage();

  const activeRequestTab = useRef(activeTab);

  const fetchData = useCallback(
    async (searchTerm = "", targetTab = activeTab) => {
      setLoading(true);
      activeRequestTab.current = targetTab;

      try {
        const trimmedQuery = searchTerm.trim() || null;
        const res =
          targetTab === "eligible"
            ? await getAuctionList(trimmedQuery)
            : await getAuctionedList(trimmedQuery);

        if (activeRequestTab.current === targetTab) {
          setData(res);
        }
      } catch (e) {
        if (activeRequestTab.current === targetTab) {
          console.error(e);
          toast.error(t("failed_load_auction_list_err", "Failed to load auction list: ") + e.message); // 🚀 Upgraded block error to toast
        }
      } finally {
        if (activeRequestTab.current === targetTab) {
          setLoading(false);
        }
      }
    },
    [activeTab, t],
  );

  useEffect(() => {
    if (searchInput.trim() === "") {
      fetchData("", activeTab);
      return;
    }

    const timer = setTimeout(() => {
      fetchData(searchInput, activeTab);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, activeTab, fetchData]);

  const handleTabChange = (tab) => {
    setSearchInput("");
    setActiveTab(tab);
  };

  const closeDialog = () => {
    setConfirmPledge(null);
    setAuctionAmount("");
    setAuctionNotes("");
  };

  const handleAuction = async (pledge) => {
    if (!auctionAmount || Number(auctionAmount) <= 0) {
      toast.error(t("valid_auction_amount_err", "Please enter a valid auction amount")); // 🚀 Upgraded to toast
      return;
    }
    
    const outstanding = pledge.outstanding_amount ?? 0;
    if (Number(auctionAmount) < outstanding) {
      toast.error(
        `${t("auction_less_outstanding_err", "Auction amount cannot be less than outstanding amount")} (₹${outstanding.toLocaleString("en-IN")})`, // 🚀 Upgraded to toast
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await markPledgeAuctioned(
        pledge.pledge_id,
        Number(auctionAmount),
        auctionNotes || null,
      );

      closeDialog();
      // 🚀 Global instant toast notification
      toast.success(
        `${t("pledge_word", "Pledge")} ${pledge.pledge_no} ${t("auction_success", "successfully liquidated via auction!")}`,
      );
      fetchData(searchInput, activeTab);
    } catch (e) {
      toast.error(t("failed_to_auction_err", "Failed to auction: ") + e.message); // 🚀 Upgraded to toast
      closeDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualRefresh = () => {
    fetchData(searchInput, activeTab);
    toast.success(t("list_refreshed", "Auction registry records updated.")); // 🚀 User action validation
  };

  const auctionMonths = data?.summary?.auction_after_months ?? 36;

  const auctionPeriodText =
    auctionMonths % 12 === 0
      ? `${auctionMonths / 12}+ ${t("years")}`
      : `${auctionMonths}+ ${t("months")}`;

  return (
    <div className="auction-page">
      <div className="auction-tabs">
        <button
          className={activeTab === "eligible" ? "active" : ""}
          onClick={() => handleTabChange("eligible")}
        >
          {t("eligible", "Eligible")}
        </button>
        <button
          className={activeTab === "auctioned" ? "active" : ""}
          onClick={() => handleTabChange("auctioned")}
        >
          {t("auction_status_tag", "Auctioned")}
        </button>
      </div>

      {confirmPledge && (
        <ConfirmAuctionDialog
          pledge={confirmPledge}
          onConfirm={handleAuction}
          onCancel={closeDialog}
          auctionAmount={auctionAmount}
          setAuctionAmount={setAuctionAmount}
          auctionNotes={auctionNotes}
          setAuctionNotes={setAuctionNotes}
          disabled={isSubmitting}
        />
      )}

      <div className="auction-header">
        <div className="auction-header-left">
          <div className="auction-title-row">
            <Gavel size={26} className="header-gavel" />
            <h1 className="auction-title">
              {activeTab === "eligible"
                ? t("auction_eligible_pledges")
                : t("auctioned_pledges_title", "Auctioned Pledges")}
            </h1>
          </div>
          {activeTab === "eligible" && (
            <div className="auction-rule-badge">
              {t("auction_rule_lbl", "Auction Rule")}: {auctionPeriodText}
            </div>
          )}

          <p className="auction-subtitle">
            {activeTab === "eligible"
              ? `${t("pledges_inactive_prefix", "Pledges inactive for")} ${auctionPeriodText} ${t("pledges_inactive_suffix", "with no interest or principal payments")}`
              : t("auction_history_subtitle", "History of auctioned pledges")}
          </p>
        </div>
        <button
          className="btn-refresh"
          onClick={handleManualRefresh}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? "spin" : ""} />
          {t("refresh")}
        </button>
      </div>

      {data && (
        <div className="auction-summary-row">
          <div className="summary-card sc-red">
            <div className="sc-icon">
              <AlertTriangle size={22} />
            </div>
            <div className="sc-body">
              <span className="sc-value">
                {activeTab === "eligible"
                  ? data.summary.total_eligible
                  : data.summary.total_auctioned}
              </span>
              <span className="sc-label">
                {activeTab === "eligible"
                  ? t("eligible_for_auction")
                  : t("total_auctioned_lbl", "Total Auctioned")}
              </span>
            </div>
          </div>

          <div className="summary-card sc-amber">
            <div className="sc-icon">
              <TrendingUp size={22} />
            </div>
            <div className="sc-body">
              <span className="sc-value">
                ₹
                {(data.summary.total_loan_value ?? 0).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className="sc-label">{t("loan_value_at_risk")}</span>
            </div>
          </div>

          {activeTab === "eligible" && (
            <div className="summary-card sc-slate">
              <div className="sc-icon">
                <Clock size={22} />
              </div>
              <div className="sc-body">
                <span className="sc-value">
                  {(data.summary.oldest_pledge_years ?? 0).toFixed(1)} {t("yrs")}
                </span>
                <span className="sc-label">{t("oldest_inactive_pledge")}</span>
              </div>
            </div>
          )}
        </div>
      )}

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

      {loading ? (
        <div className="auction-loading">
          <RefreshCw size={28} className="spin" />
          <p>{t("loading_auction_candidates")}</p>
        </div>
      ) : data?.pledges.length === 0 ? (
        <div className="auction-empty">
          <Gavel size={48} className="empty-gavel" />
          <h3>
            {activeTab === "eligible"
              ? t("no_eligible_pledges")
              : t("no_auctioned_pledges_fallback", "No Auctioned Pledges")}
          </h3>
          <p>
            {activeTab === "eligible"
              ? searchInput
                ? t("no_search_results")
                : t("all_pledges_active")
              : t("no_auctioned_records_desc", "No auctioned pledges found.")}
          </p>
        </div>
      ) : (
        <div className="auction-list">
          {activeTab === "eligible"
            ? data.pledges.map((pledge) => (
                <AuctionCard
                  key={pledge.pledge_id}
                  pledge={pledge}
                  onAuction={(p) => {
                    setConfirmPledge(p);
                    setAuctionAmount((p.outstanding_amount ?? 0).toFixed(2));
                    setAuctionNotes(
                      `${t("auctioned_after_note", "Auctioned after")} ${(p.years_elapsed ?? 0).toFixed(1)} ${t("years_of_inactivity_note", "years of inactivity")}`,
                    );
                  }}
                />
              ))
            : data.pledges.map((pledge) => (
                <AuctionedCard key={pledge.pledge_id} pledge={pledge} />
              ))}
        </div>
      )}
    </div>
  );
}