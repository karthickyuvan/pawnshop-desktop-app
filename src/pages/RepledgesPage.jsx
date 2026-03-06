import { useEffect, useState, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAuthStore } from "../auth/authStore";
import {
  RefreshCw, Search, Phone, Scale, Calendar, ChevronRight,
  AlertTriangle, CheckCircle2, ArrowRight, Gem, TrendingUp,
  TrendingDown, Info, X, AlertOctagon,
} from "lucide-react";
import "./repledgespage.css";

// ─── helpers ──────────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtNum(n) { return Number(n || 0).toLocaleString("en-IN"); }
function fmtAmt(n) { return `₹${fmtNum(n)}`; }
function monthsAgo(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr), now = new Date();
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
            <div className="rp-amount-val">{fmtAmt(pledge.loan_amount)}</div>
          </div>
          <div>
            <div className="rp-amount-label">Est. Value</div>
            <div className="rp-amount-val">{fmtAmt(pledge.total_estimated_value)}</div>
          </div>
          <div>
            <div className="rp-amount-label">LTV</div>
            <div className={`rp-amount-val${isOver ? " red" : " green"}`}>{ltv.toFixed(1)}%</div>
          </div>
          <div>
            <div className="rp-amount-label">Pending Interest</div>
            <div className="rp-amount-val orange">{fmtAmt(pledge.pending_interest)}</div>
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
export default function RepledgePage({ defaultTab = "all" ,defaultPledgeId }) {
  const user = useAuthStore((s) => s.user);

  // list + tab - use defaultTab prop to set initial active tab
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
  const [error, setError]           = useState("");

  // derived list split
  const overlimitList = list.filter((p) => p.is_overlimit);
  const visibleList   = activeTab === "overlimit" ? overlimitList : list;

  // load list
  const loadList = useCallback(async (q) => {
    setListLoading(true);
    try {
      const data = await invoke("get_eligible_pledges_for_repledge_cmd", { query: q || "" });
      setList(data || []);
    } catch (err) { console.error(err); }
    finally { setListLoading(false); }
  }, []);

  useEffect(() => { loadList(""); }, []);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadList(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {

    if (!defaultPledgeId) return;
  
    async function loadPledge() {
      try {
  
        const pledges = await invoke("get_eligible_pledges_for_repledge_cmd", {
          query: ""
        });
  
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
  
  // select pledge
  async function handleSelect(pledge) {
    setSelectedId(pledge.id);
    setDetailLoading(true);
    setError("");
    try {
      const d = await invoke("get_repledge_detail_cmd", { pledgeId: pledge.id });
      setDetail(d);
      setNewLoanAmount(String(d.pledge.loan_amount));
      setNewRate(String(d.pledge.interest_rate));
      setNewScheme(d.pledge.scheme_name);
      setNewDuration(String(d.pledge.loan_duration_months));
      setProcessingFee("0");
      // Calculate first interest on NEW loan amount (will be updated when user changes amount)
      setFirstInterest((d.pledge.loan_amount * d.pledge.interest_rate / 100).toFixed(2));
      setDenominations({});
    } catch (err) { setError(String(err)); }
    finally { setDetailLoading(false); }
  }

  // re-calc first interest when loan amount or rate changes
  useEffect(() => {
    const amt = parseFloat(newLoanAmount) || 0;
    const rate = parseFloat(newRate) || 0;
    if (amt > 0 && rate > 0) setFirstInterest((amt * rate / 100).toFixed(2));
  }, [newLoanAmount, newRate]);

  function handleBack() {
    setSelectedId(null); setDetail(null); setResult(null); setError("");
  }

  // form derived
  const newAmt      = parseFloat(newLoanAmount) || 0;
  const oldAmt      = detail?.pledge?.loan_amount || 0;
  const maxAmt      = detail?.pledge?.max_repledge_amount || 0;
  const pendingInt  = detail?.pledge?.pending_interest || 0;
  const feeAmt      = parseFloat(processingFee) || 0;
  const firstIntAmt = parseFloat(firstInterest) || 0;
  const cashDiff    = newAmt - oldAmt;
  
  // Net cash customer receives = loan diff - pending interest - fee - first interest
  // If negative, customer must pay the difference
  const netToCustomer = cashDiff - pendingInt - feeAmt - firstIntAmt;
  
  const isOverMax   = newAmt > maxAmt;
  const isFormValid = newAmt > 0 && !isOverMax && newRate && newScheme && newDuration &&
    (payMethod === "CASH" || reference.trim());

  // submit
  async function handleSubmit() {
    if (!isFormValid || !detail) return;
    setSubmitting(true); setError("");
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
          reference:                payMethod !== "CASH" ? reference : null,
          denominations:            payMethod === "CASH" ? denominations : null,
          created_by:               user.user_id,
        },
      });
      setResult(res);
      loadList(query);
    } catch (err) { setError(String(err)); }
    finally { setSubmitting(false); }
  }

  // ── Success screen ────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="rp-page">
        <div className="rp-success-container">
          <div className="rp-success-card">
            <div className="rp-success-icon"><CheckCircle2 size={52} color="#22c55e" /></div>
            <h2>Repledge Successful!</h2>
            <p>Old pledge closed — new pledge created with same gold items.</p>
            <div className="rp-success-numbers">
              <div className="rp-success-pill">
                <span>Old Pledge</span>
                <strong>{detail?.pledge?.pledge_no}</strong>
                <span className="closed-tag">CLOSED</span>
              </div>
              <ArrowRight size={22} color="#94a3b8" />
              <div className="rp-success-pill">
                <span>New Pledge</span>
                <strong>{result.new_pledge_no}</strong>
                <span className="active-tag">ACTIVE</span>
              </div>
            </div>
            {result.pending_interest_settled > 0.01 && (
              <div className="rp-cash-diff-box in" style={{ marginBottom: 8 }}>
                <CheckCircle2 size={16} />
                <span>Pending interest <strong>{fmtAmt(result.pending_interest_settled)}</strong> settled</span>
              </div>
            )}
            {Math.abs(result.cash_difference) > 0.01 && (
              <div className={`rp-cash-diff-box ${result.cash_difference > 0 ? "out" : "in"}`}>
                {result.cash_difference > 0
                  ? <><TrendingUp size={18} /><span>Extra <strong>{fmtAmt(Math.abs(result.cash_difference))}</strong> disbursed to customer</span></>
                  : <><TrendingDown size={18} /><span>Customer paid <strong>{fmtAmt(Math.abs(result.cash_difference))}</strong></span></>}
              </div>
            )}
            <button className="rp-done-btn" onClick={handleBack}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Detail / form view ────────────────────────────────────────────────
  if (selectedId) {
    return (
      <div className="rp-page">
        <div className="rp-detail-layout">
          {/* LEFT */}
          <div className="rp-detail-left">
            <button className="rp-back-btn" onClick={handleBack}>← Back to list</button>

            {detailLoading ? <div className="rp-loading">Loading pledge details...</div> : detail ? (
              <>
                {detail.pledge.is_overlimit && (
                  <div className="rp-overlimit-banner">
                    <AlertOctagon size={16} />
                    <div>
                      <strong>Over Limit Pledge</strong>
                      <span>Current LTV is {detail.pledge.loan_to_value_pct?.toFixed(1)}% — exceeds 90% threshold. Proceed with caution.</span>
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
                  <div className="rp-info-section-title"><RefreshCw size={14} /> Previous Pledge</div>
                  <div className="rp-info-grid">
                    <div className="rp-info-item"><span>Pledge No</span><strong>{detail.pledge.pledge_no}</strong></div>
                    <div className="rp-info-item"><span>Scheme</span><strong>{detail.pledge.scheme_name}</strong></div>
                    <div className="rp-info-item"><span>Loan Type</span><strong>{detail.pledge.loan_type}</strong></div>
                    <div className="rp-info-item"><span>Principal</span><strong className="blue">{fmtAmt(detail.pledge.loan_amount)}</strong></div>
                    <div className="rp-info-item"><span>Interest Rate</span><strong>{detail.pledge.interest_rate}% / month</strong></div>
                    <div className="rp-info-item"><span>Duration</span><strong>{detail.pledge.loan_duration_months} months</strong></div>
                    <div className="rp-info-item"><span>Created</span><strong>{fmtDate(detail.pledge.created_at)}</strong></div>
                    <div className="rp-info-item"><span>Price/gram</span><strong>{fmtAmt(detail.pledge.price_per_gram)}</strong></div>
                  </div>
                  <div className="rp-summary-row">
                    <div className="rp-summary-chip blue"><span>Gross Weight</span><strong>{detail.pledge.total_gross_weight}g</strong></div>
                    <div className="rp-summary-chip slate"><span>Net Weight</span><strong>{detail.pledge.total_net_weight}g</strong></div>
                    <div className="rp-summary-chip green"><span>Estimated Value</span><strong>{fmtAmt(detail.pledge.total_estimated_value)}</strong></div>
                    <div className="rp-summary-chip orange"><span>Pending Interest</span><strong>{fmtAmt(detail.pledge.pending_interest)}</strong></div>
                  </div>
                </div>
                {detail.items.length > 0 && (
                  <div className="rp-items-card">
                    <div className="rp-items-title"><Gem size={15} /> Gold Items ({detail.items.length})</div>
                    <table className="rp-items-table">
                      <thead><tr><th>Item</th><th>Gross</th><th>Net</th><th>Purity</th><th>Value</th></tr></thead>
                      <tbody>
                        {detail.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.jewellery_type}</td>
                            <td>{item.gross_weight}g</td>
                            <td>{item.net_weight}g</td>
                            <td>{item.purity || "—"}</td>
                            <td>{fmtAmt(item.item_value)}</td>
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
              <div className="rp-form-title"><RefreshCw size={18} /> New Repledge Details</div>

              <div className="rp-max-banner">
                <Info size={14} />
                <span>Max eligible: <strong>{fmtAmt(maxAmt)}</strong> (full estimated value)</span>
              </div>

              <div className="rp-field">
                <label>New Loan Amount <span className="req">*</span></label>
                <div className="rp-amount-input-wrapper">
                  <span className="rp-rupee">₹</span>
                  <input type="number" value={newLoanAmount} onChange={(e) => setNewLoanAmount(e.target.value)}
                    placeholder={fmtNum(maxAmt)} className={isOverMax ? "error" : ""} />
                </div>
                {isOverMax && <div className="rp-field-error">⚠ Exceeds maximum of {fmtAmt(maxAmt)}</div>}
              </div>

              <div className="rp-field">
                <label>Interest Rate (% / month) <span className="req">*</span></label>
                <input type="number" step="0.1" value={newRate} onChange={(e) => setNewRate(e.target.value)} placeholder="3" />
              </div>

              <div className="rp-field">
                <label>Scheme Name <span className="req">*</span></label>
                <input type="text" value={newScheme} onChange={(e) => setNewScheme(e.target.value)} placeholder="Gold Scheme A" />
              </div>

              <div className="rp-field">
                <label>Loan Duration (months) <span className="req">*</span></label>
                <input type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="12" />
              </div>

              <div className="rp-field">
                <label>Processing Fee</label>
                <div className="rp-amount-input-wrapper">
                  <span className="rp-rupee">₹</span>
                  <input type="number" value={processingFee} onChange={(e) => setProcessingFee(e.target.value)} placeholder="0" />
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
                  <input type="number" value={firstInterest} onChange={(e) => setFirstInterest(e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="rp-field">
                <label>Payment Method <span className="req">*</span></label>
                <select value={payMethod} onChange={(e) => { setPayMethod(e.target.value); setReference(""); setDenominations({}); }}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              {payMethod === "CASH" && netToCustomer > 0 ? (
                <div className="rp-field">
                  <label>Cash Denominations (Optional)</label>
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
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "0.875rem", color: "#64748b" }}>
                    Total: ₹{Object.entries(denominations).reduce((sum, [note, qty]) => sum + (parseInt(note) * (qty || 0)), 0).toLocaleString("en-IN")}
                  </div>
                </div>
              ) : null}

              {payMethod !== "CASH" && (
                <div className="rp-field">
                  <label>{payMethod === "UPI" ? "UPI Transaction ID" : "Bank Reference No"} <span className="req">*</span></label>
                  <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Enter reference number" />
                </div>
              )}

              {/* Cash flow summary */}
              {newAmt > 0 && (
                <div className="rp-diff-summary">
                  <div className="rp-diff-row"><span>Old Loan Amount</span><strong>{fmtAmt(oldAmt)}</strong></div>
                  <div className="rp-diff-row"><span>New Loan Amount</span><strong>{fmtAmt(newAmt)}</strong></div>
                  <div className="rp-diff-row"><span>Loan Difference</span><strong className={cashDiff >= 0 ? "green" : "red"}>{cashDiff >= 0 ? "+" : ""}{fmtAmt(cashDiff)}</strong></div>
                  <hr />
                  {pendingInt > 0.01 && <div className="rp-diff-row"><span>Minus: Pending Interest (settled)</span><strong className="red">− {fmtAmt(pendingInt)}</strong></div>}
                  {feeAmt > 0.01 && <div className="rp-diff-row"><span>Minus: Processing Fee</span><strong className="red">− {fmtAmt(feeAmt)}</strong></div>}
                  {firstIntAmt > 0.01 && <div className="rp-diff-row"><span>Minus: First Month Interest</span><strong className="red">− {fmtAmt(firstIntAmt)}</strong></div>}
                  <hr />
                  <div className={`rp-diff-row big ${netToCustomer > 0.01 ? "out" : netToCustomer < -0.01 ? "in" : "equal"}`}>
                    {netToCustomer > 0.01
                      ? <><span><TrendingUp size={15} /> Net disbursed to customer</span><strong>+ {fmtAmt(netToCustomer)}</strong></>
                      : netToCustomer < -0.01
                      ? <><span><TrendingDown size={15} /> Customer must pay</span><strong>{fmtAmt(Math.abs(netToCustomer))}</strong></>
                      : <span>No net cash movement</span>}
                  </div>
                </div>
              )}

              {error && <div className="rp-error-box"><AlertTriangle size={16} /> {error}</div>}

              <button className="rp-submit-btn" disabled={!isFormValid || submitting} onClick={handleSubmit}>
                {submitting ? "Processing..." : <><RefreshCw size={16} /> Confirm Repledge</>}
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

  // ── List view ─────────────────────────────────────────────────────────
  return (
    <div className="rp-page">
      <div className="rp-list-layout">
        <div className="rp-list-header">
          <div className="rp-list-title-group">
            <div className="rp-list-icon"><RefreshCw size={22} /></div>
            <div><h1>Repledge</h1><p>Renew existing pledges with updated loan terms</p></div>
          </div>
          <div className="rp-search-bar">
            <Search size={17} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by pledge no, customer name or phone..." />
            {query && <button className="rp-clear-search" onClick={() => setQuery("")}><X size={15} /></button>}
          </div>
        </div>

        <div className="rp-stats-strip">
          <div className="rp-stat"><span>Total Active</span><strong>{list.length}</strong></div>
          <div className="rp-stat"><span>Eligible</span><strong className="green">{list.length}</strong></div>
          <div className="rp-stat"><span>Over Limit (&gt;90% LTV)</span><strong className="red">{overlimitList.length}</strong></div>
          <div className="rp-stat"><span>Bank-Mapped</span><strong className="orange">{list.filter((p) => p.is_bank_mapped).length}</strong></div>
        </div>

        {/* Tabs */}
        <div className="rp-tabs">
          <button className={`rp-tab${activeTab === "all" ? " active" : ""}`} onClick={() => setActiveTab("all")}>
            <CheckCircle2 size={14} /> All Pledges <span className="rp-tab-count">{list.length}</span>
          </button>
          <button className={`rp-tab overlimit-tab${activeTab === "overlimit" ? " active" : ""}`} onClick={() => setActiveTab("overlimit")}>
            <AlertOctagon size={14} /> Over Limit <span className="rp-tab-count red">{overlimitList.length}</span>
          </button>
        </div>

        {activeTab === "overlimit" && overlimitList.length > 0 && (
          <div className="rp-overlimit-info">
            <AlertOctagon size={15} />
            <span>These pledges have a Loan-to-Value ratio above 90%. The loan amount exceeds 90% of the gold's estimated value.</span>
          </div>
        )}

        {listLoading ? (
          <div className="rp-loading">Loading pledges...</div>
        ) : visibleList.length === 0 ? (
          <div className="rp-empty">
            <Scale size={40} />
            <p>{activeTab === "overlimit" ? "No over-limit pledges — all pledges are within 90% LTV." : `No active pledges found${query ? ` for "${query}"` : ""}.`}</p>
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