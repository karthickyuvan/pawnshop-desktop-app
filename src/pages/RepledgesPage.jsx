
import { useEffect, useState, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useAuthStore } from "../auth/authStore";
import {
  RefreshCw, Search, Phone, Scale, Calendar, ChevronRight,
  AlertTriangle, CheckCircle2, ArrowRight, Gem, TrendingUp,
  TrendingDown, Info, X, AlertOctagon,
} from "lucide-react";
import "./repledgespage.css";
import { useLanguage } from "../context/LanguageContext";
import { formatDateIST } from "../utils/timeFormatter"; 

// ─── helpers ──────────────────────────────────────────────────────────────
function monthsAgo(dateStr) {
  if (!dateStr) return "—";
  let cleaned = dateStr.trim();
  if (cleaned.includes(" ") && !cleaned.includes("T") && !cleaned.includes("Z")) {
    cleaned = cleaned.replace(" ", "T") + "Z";
  }
  const d = new Date(cleaned), now = new Date();
  if (isNaN(d.getTime())) return "—";
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return months === 0 ? "This month" : `${months} month${months > 1 ? "s" : ""} ago`;
}

// ─── PledgeCard ────────────────────────────────────────────────────────────
function PledgeCard({ pledge, onSelect }) {
  const ltv    = pledge.loan_to_value_pct ?? 0;
  const isOver = pledge.is_overlimit;
  return (
    <div className={`rp-pledge-card eligible${isOver ? " overlimit" : ""}`} onClick={() => onSelect(pledge)}>
      <div className="rp-card-left">
        <div className="rp-avatar">
          {pledge.photo_path ? <img src={convertFileSrc(pledge.photo_path)} alt="" /> : <span>{pledge.customer_name?.charAt(0)}</span>}
        </div>
        <div className="rp-card-info">
          <div className="rp-pledge-no">{pledge.pledge_no}</div>
          <div className="rp-customer-name">{pledge.customer_name}</div>
          <div className="rp-meta">
            <Phone size={12} /> {pledge.phone}
            <span className="rp-dot">·</span>
            <Calendar size={12} /> {monthsAgo(pledge.created_at)}
          </div>
        </div>
      </div>
      <div className="rp-card-right">
        <div className="rp-amounts">
          <div>
            <div className="rp-amount-label">Current Loan</div>
            <div className="rp-amount-val">{Number(pledge.loan_amount).toLocaleString("en-IN")}</div>
          </div>
          <div>
            <div className="rp-amount-label">Est. Value</div>
            <div className="rp-amount-val">{Number(pledge.total_estimated_value).toLocaleString("en-IN")}</div>
          </div>
          <div>
            <div className="rp-amount-label">LTV</div>
            <div className={`rp-amount-val${isOver ? " red" : " green"}`}>{ltv.toFixed(1)}%</div>
          </div>
          <div>
            <div className="rp-amount-label">Pending Interest</div>
            <div className="rp-amount-val orange">₹{Number(pledge.pending_interest).toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          {isOver && <span className="rp-tag overlimit-tag"><AlertOctagon size={12} /> Over Limit</span>}
          {pledge.is_bank_mapped && <span className="rp-tag bank-mapped"><AlertTriangle size={12} /> Bank Mapped</span>}
          <button className="rp-select-btn">Repledge <ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function RepledgePage({ defaultTab = "all", defaultPledgeId }) {
  const user = useAuthStore((s) => s.user);
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [query, setQuery]         = useState("");
  const [list, setList]           = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const debounceRef = useRef(null);

  // detail / form
  const [selectedId, setSelectedId]       = useState(null);
  const [detail, setDetail]               = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [newLoanAmount, setNewLoanAmount] = useState("");
  const [newRate, setNewRate]             = useState("");
  const [newScheme, setNewScheme]         = useState("");
  const [newDuration, setNewDuration]     = useState("");
  const [processingFee, setProcessingFee] = useState("0");
  const [firstInterest, setFirstInterest] = useState("0");
  const [payMethod, setPayMethod]         = useState("CASH");
  const [reference, setReference]         = useState("");
  const [denominations, setDenominations] = useState({});

  const [result, setResult]         = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const overlimitList = list.filter((p) => p.is_overlimit);
  const visibleList   = activeTab === "overlimit" ? overlimitList : list;

  const loadList = useCallback(async (q) => {
    setListLoading(true);
    try {
      const data = await invoke("get_eligible_pledges_for_repledge_cmd", { query: q || "" });
      setList(data || []);
    } catch (err) {
      console.error(err);
      toast.error(t("load_failed", "Failed to retrieve active repledge candidates list."));
    } finally {
      setListLoading(false);
    }
  }, [t]);

  useEffect(() => { loadList(""); }, []);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadList(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, loadList]);

  useEffect(() => {
    if (!defaultPledgeId) return;
  
    async function loadPledge() {
      try {
        const pledges = await invoke("get_eligible_pledges_for_repledge_cmd", { query: "" });
        const found = pledges.find(p => p.id === Number(defaultPledgeId));
        if (found) {
          handleSelect(found);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadPledge();
  }, [defaultPledgeId]);
  
  async function handleSelect(pledge) {
    setSelectedId(pledge.id);
    setDetailLoading(true);
    try {
      const d = await invoke("get_repledge_detail_cmd", { pledgeId: pledge.id });
      setDetail(d);
      setNewLoanAmount(String(d.pledge.loan_amount));
      setNewRate(String(d.pledge.interest_rate));
      setNewScheme(d.pledge.scheme_name);
      setNewDuration(String(d.pledge.loan_duration_months));
      setProcessingFee("0");
      setFirstInterest((d.pledge.loan_amount * d.pledge.interest_rate / 100).toFixed(2));
      setDenominations({});
      toast.success(t("pledge_selected", "Pledge configuration loaded."));
    } catch (err) {
      console.error(err);
      toast.error(t("detail_load_failed", "Failed to load structural parameters for pledge."));
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    const amt = parseFloat(newLoanAmount) || 0;
    const rate = parseFloat(newRate) || 0;
    if (amt > 0 && rate > 0) setFirstInterest((amt * rate / 100).toFixed(2));
  }, [newLoanAmount, newRate]);

  function handleBack() {
    setSelectedId(null); setDetail(null); setResult(null);
  }

  const newAmt      = parseFloat(newLoanAmount) || 0;
  const oldAmt      = detail?.pledge?.loan_amount || 0;
  const maxAmt      = detail?.pledge?.max_repledge_amount || 0;
  const pendingInt  = detail?.pledge?.pending_interest || 0;
  const feeAmt      = parseFloat(processingFee) || 0;
  const firstIntAmt = parseFloat(firstInterest) || 0;
  const cashDiff    = newAmt - oldAmt;
  
  const netToCustomer = cashDiff - pendingInt - feeAmt - firstIntAmt;
  
  const isOverMax   = newAmt > maxAmt;
  const isFormValid = newAmt > 0 && !isOverMax && newRate && newScheme && newDuration &&
    (payMethod === "CASH" || reference.trim());

  async function handleSubmit() {
    if (!isFormValid || !detail) return;
    setSubmitting(true);
    try {
      const res = await invoke("execute_repledge_cmd", {
        req: {
          old_pledge_id:            detail.pledge.id,
          new_loan_amount:          newAmt,
          new_interest_rate:        parseFloat(newRate),
          new_scheme_name:          newScheme,
          new_loan_duration_months: parseInt(newDuration),
          processing_fee_amount:    feeAmt,
          first_interest_amount:    firstIntAmt,
          payment_method:           payMethod,
          reference:                payMethod !== "CASH" ? reference.trim() : null,
          denominations:            payMethod === "CASH" ? denominations : null,
          created_by:               user?.user_id || user?.id || 1,
        },
      });
      setResult(res);
      toast.success(t("repledge_processed", "Repledge transaction posted successfully!"));
      loadList(query);
    } catch (err) { 
      console.error(err);
      toast.error(t("execution_failed", "Repledge operation failed: ") + String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rp-page">
        <div className="rp-success-container">
          <div className="rp-success-card">
            <div className="rp-success-icon"><CheckCircle2 size={52} color="#22c55e" /></div>
            <h2>{t("repledge_success")}</h2>
            <p>{t("repledge_success_desc")}</p>
            <div className="rp-success-numbers">
              <div className="rp-success-pill">
                <span>{t("old_pledge")}</span>
                <strong>{detail?.pledge?.pledge_no}</strong>
                <span className="closed-tag">CLOSED</span>
              </div>
              <ArrowRight size={22} color="#94a3b8" />
              <div className="rp-success-pill">
                <span>{t("new_pledge")}</span>
                <strong>{result.new_pledge_no}</strong>
                <span className="active-tag">ACTIVE</span>
              </div>
            </div>
            {result.pending_interest_settled > 0.01 && (
              <div className="rp-cash-diff-box in" style={{ marginBottom: 8 }}>
                <CheckCircle2 size={16} />
                <span>{t("pending_interest_settled")} <strong>₹{Number(result.pending_interest_settled).toLocaleString("en-IN")}</strong> settled</span>
              </div>
            )}
            {Math.abs(result.cash_difference) > 0.01 && (
              <div className={`rp-cash-diff-box ${result.cash_difference > 0 ? "out" : "in"}`}>
                {result.cash_difference > 0
                  ? <><TrendingUp size={18} /><span>Extra <strong>₹{Number(Math.abs(result.cash_difference)).toLocaleString("en-IN")}</strong> disbursed to customer</span></>
                  : <><TrendingDown size={18} /><span>Customer paid <strong>₹{Number(Math.abs(result.cash_difference)).toLocaleString("en-IN")}</strong></span></>}
              </div>
            )}
            <button className="rp-done-btn" onClick={handleBack}>{t("done")}</button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedId) {
    return (
      <div className="rp-page">
        <div className="rp-detail-layout">
          {/* LEFT */}
          <div className="rp-detail-left">
            <button className="rp-back-btn" onClick={handleBack}>← {t("back_to_list")}</button>

            {detailLoading ? <div className="rp-loading">{t("loading_pledge_details")}</div> : detail ? (
              <>
                {detail.pledge.is_overlimit && (
                  <div className="rp-overlimit-banner">
                    <AlertOctagon size={16} />
                    <div>
                      <strong>{t("over_limit_pledge")}</strong>
                      <span>Current LTV is {detail.pledge.loan_to_value_pct?.toFixed(1)}% (exceeds 80% limit). {t("proceed_with_caution")}</span>
                    </div>
                  </div>
                )}
                <div className="rp-info-card">
                  <div className="rp-info-header">
                    <div className="rp-info-avatar">
                      {detail.pledge.photo_path ? <img src={convertFileSrc(detail.pledge.photo_path)} alt="" /> : <span>{detail.pledge.customer_name?.charAt(0)}</span>}
                    </div>
                    <div>
                      <div className="rp-info-name">{detail.pledge.customer_name}</div>
                      <div className="rp-info-id">{detail.pledge.customer_code}</div>
                      <div className="rp-info-phone"><Phone size={13} /> {detail.pledge.phone}</div>
                    </div>
                  </div>
                  <div className="rp-info-section-title"><RefreshCw size={14} /> {t("previous_pledge")}</div>
                  <div className="rp-info-grid">
                    <div className="rp-info-item"><span>Pledge No</span><strong>{detail.pledge.pledge_no}</strong></div>
                    <div className="rp-info-item"><span>Scheme</span><strong>{detail.pledge.scheme_name}</strong></div>
                    <div className="rp-info-item"><span>Loan Type</span><strong>{detail.pledge.loan_type}</strong></div>
                    <div className="rp-info-item"><span>Principal</span><strong className="blue">₹{Number(detail.pledge.loan_amount).toLocaleString("en-IN")}</strong></div>
                    <div className="rp-info-item"><span>Interest Rate</span>.../ month</div>
                    <div className="rp-info-item"><span>Duration</span><strong>{detail.pledge.loan_duration_months} months</strong></div>
                    <div className="rp-info-item"><span>Created</span><strong>{formatDateIST(detail.pledge.created_at)}</strong></div>
                    <div className="rp-info-item"><span>Price/gram</span><strong>₹{Number(detail.pledge.price_per_gram).toLocaleString("en-IN")}</strong></div>
                  </div>
                  <div className="rp-summary-row">
                    <div className="rp-summary-chip blue"><span>Gross Weight</span>...g</div>
                    <div className="rp-summary-chip slate"><span>Net Weight</span>...g</div>
                    <div className="rp-summary-chip green"><span>Estimated Value</span><strong>₹{Number(detail.pledge.total_estimated_value).toLocaleString("en-IN")}</strong></div>
                    <div className="rp-summary-chip orange"><span>Pending Interest</span><strong>₹{Number(detail.pledge.pending_interest).toLocaleString("en-IN")}</strong></div>
                  </div>
                </div>
                {detail.items.length > 0 && (
                  <div className="rp-items-card">
                    <div className="rp-items-title"><Gem size={15} /> {t("gold_items")} ({detail.items.length})</div>
                    <table className="rp-items-table">
                      <thead><tr><th>{t("item")}</th><th>{t("gross")}</th><th>{t("net")}</th><th>{t("purity")}</th><th>{t("value")}</th></tr></thead>
                      <tbody>
                        {detail.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.jewellery_type}</td>
                            <td>{item.gross_weight}g</td>
                            <td>{item.net_weight}g</td>
                            <td>{item.purity || "—"}</td>
                            <td>₹{Number(item.item_value).toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* RIGHT: form */}
          <div className="rp-detail-right">
            <div className="rp-form-card">
              <div className="rp-form-title"><RefreshCw size={18} />{t("new_repledge_details")}</div>

              <div className="rp-max-banner">
                <Info size={14} />
                <span>{t("max_eligible")}: <strong>₹{Number(maxAmt).toLocaleString("en-IN")}</strong> (80% of estimated value)</span>
              </div>

              <div className="rp-field">
                <label>New Loan Amount <span className="req">*</span></label>
                <div className="rp-amount-input-wrapper">
                  <span className="rp-rupee">₹</span>
                  <input type="number" value={newLoanAmount} onChange={(e) => setNewLoanAmount(e.target.value)}
                    placeholder={Number(maxAmt).toLocaleString("en-IN")} className={isOverMax ? "error" : ""} disabled={submitting} />
                </div>
                {isOverMax && <div className="rp-field-error">⚠ Exceeds maximum of ₹{Number(maxAmt).toLocaleString("en-IN")} (80% LTV limit)</div>}
              </div>

              <div className="rp-field">
                <label>Interest Rate (% / month) <span className="req">*</span></label>
                <input type="number" step="0.1" value={newRate} onChange={(e) => setNewRate(e.target.value)} placeholder="3" disabled={submitting} />
              </div>

              <div className="rp-field">
                <label>Scheme Name <span className="req">*</span></label>
                <input type="text" value={newScheme} onChange={(e) => setNewScheme(e.target.value)} placeholder="Gold Scheme A" disabled={submitting} />
              </div>

              <div className="rp-field">
                <label>Loan Duration (months) <span className="req">*</span></label>
                <input type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="12" disabled={submitting} />
              </div>

              <div className="rp-field">
                <label>Processing Fee</label>
                <div className="rp-amount-input-wrapper">
                  <span className="rp-rupee">₹</span>
                  <input type="number" value={processingFee} onChange={(e) => setProcessingFee(e.target.value)} placeholder="0" disabled={submitting} />
                </div>
              </div>

              <div className="rp-field">
                <label>
                  First Month Interest
                  <span style={{ color: "#94a3b8", fontWeight: 400, marginLeft: 6, fontSize: "0.75rem" }}>
                    (auto-calc, editable)
                  </span>
                </label>
                <div className="rp-amount-input-wrapper">
                  <span className="rp-rupee">₹</span>
                  <input type="number" value={firstInterest} onChange={(e) => setFirstInterest(e.target.value)} placeholder="0" disabled={submitting} />
                </div>
              </div>

              <div className="rp-field">
                <label>Payment Method <span className="req">*</span></label>
                <select value={payMethod} onChange={(e) => { setPayMethod(e.target.value); setReference(""); setDenominations({}); }} disabled={submitting}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              {payMethod === "CASH" && netToCustomer > 0 ? (
                <div className="rp-field">
                  <label>{t("cash_denominations")} (Optional)</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    {[500, 200, 100, 50, 20, 10].map((note) => (
                      <div key={note} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b" }}>₹{note}</label>
                        <input
                          type="number"
                          min="0"
                          value={denominations[note] || ""}
                          onChange={(e) => setDenominations({ ...denominations, [note]: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                          style={{ padding: "6px", fontSize: "0.875rem" }}
                          disabled={submitting}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "0.875rem", color: "#64748b" }}>
                    {"Total"}: ₹{Object.entries(denominations).reduce((sum, [note, qty]) => sum + (parseInt(note) * (qty || 0)), 0).toLocaleString("en-IN")}
                  </div>
                </div>
              ) : null}

              {payMethod !== "CASH" && (
                <div className="rp-field">
                  <label style={{ fontSize: "0.875rem" }}>
                    {payMethod === "UPI" ? "UPI Transaction ID" : "Bank Reference No"} <span className="req">*</span>
                  </label>
                  <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Enter reference number" disabled={submitting} />
                </div>
              )}

              {/* Cash flow summary */}
              {newAmt > 0 && (
                <div className="rp-diff-summary">
                  <div className="rp-diff-row"><span>{t("old_loan_amount")}</span><strong>₹{Number(oldAmt).toLocaleString("en-IN")}</strong></div>
                  <div className="rp-diff-row"><span>{t("new_loan_amount")}</span><strong>₹{Number(newAmt).toLocaleString("en-IN")}</strong></div>
                  <div className="rp-diff-row"><span>{t("loan_difference")}</span><strong className={cashDiff >= 0 ? "green" : "red"}>{cashDiff >= 0 ? "+" : ""}₹{Number(cashDiff).toLocaleString("en-IN")}</strong></div>
                  <hr />
                  {pendingInt > 0.01 && <div className="rp-diff-row"><span>Minus: Pending Interest (settled)</span><strong className="red">− ₹{Number(pendingInt).toLocaleString("en-IN")}</strong></div>}
                  {feeAmt > 0.01 && <div className="rp-diff-row"><span>Minus: Processing Fee</span><strong className="red">− ₹{Number(feeAmt).toLocaleString("en-IN")}</strong></div>}
                  {firstIntAmt > 0.01 && <div className="rp-diff-row"><span>Minus: First Month Interest</span><strong className="red">− ₹{Number(firstIntAmt).toLocaleString("en-IN")}</strong></div>}
                  <hr />
                  <div className={`rp-diff-row big ${netToCustomer > 0.01 ? "out" : netToCustomer < -0.01 ? "in" : "equal"}`}>
                    {netToCustomer > 0.01
                      ? <><span><TrendingUp size={15} /> {t("net_disbursed")}</span><strong>+ ₹{Number(netToCustomer).toLocaleString("en-IN")}</strong></>
                      : netToCustomer < -0.01
                      ? <><span><TrendingDown size={15} /> {t("customer_must_pay")}</span><strong>₹{Number(Math.abs(netToCustomer)).toLocaleString("en-IN")}</strong></>
                      : <span>{t("no_cash_movement")}</span>}
                  </div>
                </div>
              )}

              <button className="rp-submit-btn" disabled={!isFormValid || submitting} onClick={handleSubmit}>
                {submitting ? "Processing..." : <><RefreshCw size={16} /> {t("confirm_repledge")}</>}
              </button>
              <p className="rp-submit-note">
                Closes <strong>{detail?.pledge?.pledge_no}</strong> and creates a new pledge with the same gold items.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-page">
      <div className="rp-list-layout">
        <div className="rp-list-header">
          <div className="rp-list-title-group">
            <div className="rp-list-icon"><RefreshCw size={22} /></div>
            <div><h1>{t("repledge")}</h1><p>{t("repledge_subtitle")}</p></div>
          </div>
          <div className="rp-search-bar">
            <Search size={17} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search_pledges")} />
            {query && <button className="rp-clear-search" onClick={() => setQuery("")}><X size={15} /></button>}
          </div>
        </div>

        <div className="rp-stats-strip">
          <div className="rp-stat"><span>{t("total_active")}</span><strong>{list.length}</strong></div>
          <div className="rp-stat"><span>{t("eligible")}</span><strong className="green">{list.length}</strong></div>
          <div className="rp-stat"><span>{t("over_limit")} (&gt;80% LTV)</span><strong className="red">{overlimitList.length}</strong></div>
          <div className="rp-stat"><span>{t("bank_mapped")}</span><strong className="orange">{list.filter((p) => p.is_bank_mapped).length}</strong></div>
        </div>

        <div className="rp-tabs">
          <button className={`rp-tab${activeTab === "all" ? " active" : ""}`} onClick={() => setActiveTab("all")}>
            <CheckCircle2 size={14} />{ t("all_pledges")} <span className="rp-tab-count">{list.length}</span>
          </button>
          <button className={`rp-tab overlimit-tab${activeTab === "overlimit" ? " active" : ""}`} onClick={() => setActiveTab("overlimit")}>
            <AlertOctagon size={14} /> {t("over_limit")} <span className="rp-tab-count red">{overlimitList.length}</span>
          </button>
        </div>

        {activeTab === "overlimit" && overlimitList.length > 0 && (
          <div className="rp-overlimit-info">
            <AlertOctagon size={15} />
            <span>These pledges have a Loan-to-Value ratio above 80%. The loan amount exceeds 80% of the gold's estimated value. Cannot be repledged above 80% LTV.</span>
          </div>
        )}

        {listLoading ? (
          <div className="rp-loading">{t("loading_pledges")}</div>
        ) : visibleList.length === 0 ? (
          <div className="rp-empty">
            <Scale size={40} />
            <p>{activeTab === "overlimit" ? "No over-limit pledges — all pledges are within 80% LTV." : `No active pledges found${query ? ` for "${query}"` : ""}.`}</p>
          </div>
        ) : (
          <div className="rp-pledge-list">
            {visibleList.map((pledge) => (
              <PledgeCard key={pledge.id} pledge={pledge} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}