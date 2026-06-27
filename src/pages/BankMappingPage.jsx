// src/pages/BankMappingPage.jsx

import { useEffect, useState } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useAuthStore } from "../auth/authStore";
import { getBanks } from "../services/bankApi";
import {
  getPledgeByNumber,
  mapBankToPledge,
  unmapBankFromPledge,
  searchPledgesForMapping,
} from "../services/bankMappingApi";
import {
  Link2,
  Fingerprint,
  Landmark,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Hash,
} from "lucide-react";
import "./bankMapping.css";
import { useLanguage } from "../context/LanguageContext";
import { formatTransactionTimestamp } from "../utils/timeFormatter";

// ─── Helper: convert {500: 2, 100: 3} → [{denomination:500,quantity:2}, ...] ──
const denomObjectToArray = (denomObj) =>
  Object.entries(denomObj)
    .map(([d, qty]) => ({ denomination: Number(d), quantity: Number(qty) }))
    .filter((e) => e.quantity > 0);

// ─── Cash Denominations Component ────────────────────────────────────────────
function CashDenominations({
  denominations,
  onChange,
  label = "Note Breakup",
}) {
  const denoms = [500, 200, 100, 50, 20, 10];
  const total = denoms.reduce((sum, d) => sum + d * (denominations[d] || 0), 0);

  return (
    <div className="denom-section">
      <div className="denom-section-header">
        <span>{label}</span>
        {total > 0 && (
          <span className="denom-count-label">
            Count: ₹{total.toLocaleString()}
          </span>
        )}
      </div>
      <div className="denom-grid">
        {denoms.map((d) => (
          <div key={d} className="denom-item">
            <span className="denom-label">₹{d}</span>
            <input
              type="number"
              min="0"
              className="denom-input"
              value={denominations[d] || 0}
              onChange={(e) =>
                onChange({
                  ...denominations,
                  [d]: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reference Number Input Component ────────────────────────────────────────
function ReferenceInput({ method, value, onChange }) {
  return (
    <div className="input-group input-group-margined">
      <label>
        <Hash size={14} /> {method === "UPI" ? "UPI" : "Bank Transfer"}{" "}
        Reference Number <span className="req">*</span>
      </label>
      <input
        type="text"
        placeholder={
          method === "UPI"
            ? "Enter UPI Transaction ID / UTR number"
            : "Enter Bank Transfer reference / UTR number"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="reference-input"
      />
      <small>
        {method === "UPI"
          ? "12-digit UPI transaction reference"
          : "NEFT / IMPS / RTGS UTR number"}
      </small>
    </div>
  );
}

// ─── Default denomination state ───────────────────────────────────────────────
const emptyDenominations = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 };

// ─── Helper: calculate denom total ───────────────────────────────────────────
const calcDenomTotal = (denoms) =>
  Object.entries(denoms).reduce((sum, [d, qty]) => sum + Number(d) * qty, 0);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BankMappingPage() {
  const user = useAuthStore((s) => s.user);
  const { t } = useLanguage();
  const [banks, setBanks] = useState([]);
  const [pledgeNumber, setPledgeNumber] = useState("");
  const [pledgeDetails, setPledgeDetails] = useState(null);
  const [pledgeConfirmed, setPledgeConfirmed] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // ── Mapping fields ──
  const [bankId, setBankId] = useState("");
  const [bankLoanAmount, setBankLoanAmount] = useState("");
  const [actualReceived, setActualReceived] = useState("");
  const [bankCharges, setBankCharges] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [mapDenominations, setMapDenominations] = useState({
    ...emptyDenominations,
  });
  const [mapReference, setMapReference] = useState("");

  // ── Unmapping fields ──
  const [bankInterest, setBankInterest] = useState("");
  const [bankSettleMethod, setBankSettleMethod] = useState("CASH");
  const [bankSettleDenominations, setBankSettleDenominations] = useState({
    ...emptyDenominations,
  });
  const [bankSettleReference, setBankSettleReference] = useState("");

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  // ── Added: Define isCash state helper ──
  const isCash = paymentMethod === "CASH";

  useEffect(() => {
    getBanks().then(setBanks).catch((err) => {
      console.error(err);
      toast.error(t("failed_load_banks", "Failed to load bank accounts registries."));
    });
  }, [t]);

  // ── Debounced live search ─────────────────────────────────────────────────
  useEffect(() => {
    if (pledgeNumber.trim().length < 3 || pledgeConfirmed || pledgeDetails) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await searchPledgesForMapping(pledgeNumber.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [pledgeNumber, pledgeConfirmed, pledgeDetails]);

  const searchPledge = async () => {
    const targetPledge = pledgeNumber.trim().toUpperCase(); 
    
    if (!targetPledge) {
      toast.error(t("enter_pledge_number_error", "Please enter a pledge number to query.")); 
      return;
    }
    try {
      setSearching(true);
      const details = await getPledgeByNumber(targetPledge);
      setPledgeDetails(details);
      setSearchResults([]);
      setPledgeConfirmed(false);
      setMode(details.is_bank_mapped ? "unmap" : "map");
      toast.success(t("pledge_found", "Pledge record matched."));
    } catch {
      toast.error(`${t("pledge_not_found_err", "Pledge not found. Please verify query input.")} (${targetPledge})`); 
      setPledgeDetails(null);
      setPledgeConfirmed(false);
      setMode(null);
    } finally {
      setSearching(false);
    }
  };

  const confirmPledge = () => {
    setPledgeConfirmed(true);
    toast.success(t("pledge_confirmed_hint", "Pledge profile verified. Complete payment variables below."));
  };

  const cancelPledge = () => {
    setPledgeDetails(null);
    setPledgeConfirmed(false);
    setPledgeNumber("");
    setSearchResults([]);
    setBankId("");
    setBankLoanAmount("");
    setActualReceived("");
    setBankCharges("");
    setPaymentMethod("CASH");
    setMapDenominations({ ...emptyDenominations });
    setMapReference("");
    setBankInterest("");
    setBankSettleMethod("CASH");
    setBankSettleDenominations({ ...emptyDenominations });
    setBankSettleReference("");
    setMode(null);
  };

  const calculateNetReceived = () => {
    return parseFloat(actualReceived) || 0;
  };

  const calculateDifference = () => {
    if (!pledgeDetails) return 0;
    return (parseFloat(actualReceived) || 0) - pledgeDetails.loan_amount;
  };

  const isSurplus = () => calculateDifference() > 0;

  const submitMapping = async () => {
    if (!pledgeConfirmed || !bankId || !bankLoanAmount || !actualReceived) {
      toast.error(t("fill_required_fields", "Please complete all mandatory parameters and lock down pledge details first.")); 
      return;
    }
    if (paymentMethod !== "CASH" && !mapReference.trim()) {
      toast.error(`${t("reference_required_for_method", "Please enter a transaction reference")} (${paymentMethod})`); 
      return;
    }
    if (paymentMethod === "CASH") {
      const denomTotal = calcDenomTotal(mapDenominations);
      if (denomTotal === 0) {
        toast.error(t("enter_denominations_error", "Please record currency notes values before confirming settlement submission.")); 
        return;
      }
      if (Math.abs(denomTotal - parseFloat(actualReceived)) > 0.01) {
        toast.error(t("denom_mismatch_received", "Denomination total must match the received amount.")); 
        return;
      }
    }

    const difference = calculateDifference();
    const netReceived = calculateNetReceived();
    const confirmMsg = isSurplus()
      ? `Bank gave MORE than needed.\n\nSURPLUS of ₹${difference.toFixed(2)} via ${paymentMethod}.\n\nContinue?`
      : difference < 0
        ? `Bank gave LESS than needed.\n\nDEFICIT of ₹${Math.abs(difference).toFixed(2)} via ${paymentMethod}.\n\nContinue?`
        : `Exact match. No surplus or deficit.\n\nContinue?`;

    setConfirmModal({
      message: confirmMsg,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          setLoading(true);

          const payload = {
            pledgeId: pledgeDetails.pledge_id,
            bankId: Number(bankId),
            bankLoanAmount: Number(bankLoanAmount),
            actualReceived: Number(actualReceived),
            bankCharges: Number(bankCharges || 0),
            paymentMethod,
            referenceNumber: paymentMethod !== "CASH" ? mapReference : null,
            denominations:
              paymentMethod === "CASH"
                ? denomObjectToArray(mapDenominations)
                : null,
            actorUserId: user.user_id,
          };

          await mapBankToPledge(payload);

          toast.success(
            `${t("mapping_success", "Bank Mapping Successful!")}\nNet Received: ₹${netReceived.toFixed(2)} (${
              isSurplus()
                ? `Surplus: +₹${difference.toFixed(2)}`
                : difference < 0
                  ? `Deficit: -₹${Math.abs(difference).toFixed(2)}`
                  : "Exact Match"
            })`,
            { duration: 5000 }
          );
          cancelPledge();
        } catch (err) {
          toast.error(t("mapping_failed_alert", "Mapping failed. Please recheck balance properties and parameters.")); 
          console.error("❌ Mapping error:", err);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const submitUnmapping = async () => {
    if (!pledgeConfirmed) {
      toast.error(t("confirm_pledge_first", "Please lock down system pledge authentication details first.")); 
      return;
    }

    const totalToPay =
      (pledgeDetails?.bank_loan_amount || pledgeDetails?.loan_amount || 0) +
      (parseFloat(bankInterest) || 0);

    if (bankSettleMethod !== "CASH" && !bankSettleReference.trim()) {
      toast.error(`${t("reference_required_for_method", "Please enter a transaction reference")} (${bankSettleMethod})`); 
      return;
    }
    if (bankSettleMethod === "CASH") {
      const denomTotal = calcDenomTotal(bankSettleDenominations);
      if (denomTotal === 0) {
        toast.error(t("enter_denominations_error", "Please provide a denomination breakdown.")); 
        return;
      }
      if (Math.abs(denomTotal - totalToPay) > 0.01) {
        toast.error(t("denom_mismatch_payout", "Denomination total must match the payout amount.")); 
        return;
      }
    }

    setConfirmModal({
      message: `Pay ₹${totalToPay.toLocaleString()} to bank and close pledge?\n\nThis action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          setLoading(true);
          await unmapBankFromPledge({
            mappingId: pledgeDetails.bank_mapping_id,
            pledgeId: pledgeDetails.pledge_id,
            customerPayment: totalToPay,
            bankRepayment: totalToPay,
            bankInterest: Number(bankInterest || 0),
            customerInterest: 0,
            paymentMethod: bankSettleMethod,
            referenceNumber:
              bankSettleMethod !== "CASH" ? bankSettleReference : null,
            denominations:
              bankSettleMethod === "CASH"
                ? denomObjectToArray(bankSettleDenominations)
                : null,
            actorUserId: user.user_id,
          });

          toast.success(`${t("unmapping_success", "Bank Unmapping & Closure Successful!")}\nTotal Paid: ₹${totalToPay.toLocaleString()}`, { duration: 5000 });
          cancelPledge();
        } catch (err) {
          toast.error(t("unmapping_failed_alert", "Unmapping operation failed.") + " " + (err?.message || err)); 
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const mapDenomTotal = calcDenomTotal(mapDenominations);
  const mapDenomMatched =
    mapDenomTotal > 0 &&
    Math.abs(mapDenomTotal - parseFloat(actualReceived || 0)) < 0.01;

  const totalToPayBank =
    (pledgeDetails?.bank_loan_amount || pledgeDetails?.loan_amount || 0) +
    (parseFloat(bankInterest) || 0);

  const bankSettleDenomTotal = calcDenomTotal(bankSettleDenominations); 
  const bankSettleMatched =
    bankSettleDenomTotal > 0 &&
    Math.abs(bankSettleDenomTotal - totalToPayBank) < 0.01;

  return (
    <div className="mapping-container">
      <header className="mapping-header">
        <div className="title-group">
          <div className="icon-wrapper">
            <Link2 className="icon-main" />
          </div>
          <div>
            <h1>{t("bank_mapping_title")}</h1>
            <p>{t("bank_mapping_desc")}</p>
          </div>
        </div>
      </header>

      {/* ── SEARCH SECTION ── */}
      <div className="mapping-card">
        <div className="card-section-title">
          <Search size={18} /> {t("search_pledge")}
        </div>
        <div className="search-section">
          <div className="input-group">
            <label>
              <Fingerprint size={14} /> {t("pledge_number")}{" "}
              <span className="req">*</span>
            </label>
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Type pledge number to search..."
                value={pledgeNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  setPledgeNumber(val);
                  setPledgeDetails(null);
                  setMode(null);
                  setPledgeConfirmed(false);
                  if (val.trim().length < 3) {
                    setSearchResults([]);
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && searchPledge()}
                disabled={pledgeConfirmed}
              />
              <button
                className="search-btn"
                onClick={searchPledge}
                disabled={searching || pledgeConfirmed}
              >
                {searching ? t("searching") : t("search")}
              </button>

              {/* ── Fixed: Dropdown pledge select rows restored ── */}
              {searchResults.length > 0 && !pledgeConfirmed && (
                <div className="search-results-dropdown">
                  {searchResults.map((r) => (
                    <div
                      key={r.pledge_id}
                      onClick={() => {
                        setPledgeNumber(r.pledge_no);
                        setPledgeDetails(r);
                        setSearchResults([]);
                        setPledgeConfirmed(false);
                        setMode(r.is_bank_mapped ? "unmap" : "map");
                      }}
                      className="search-result-row"
                    >
                      <div>
                        <div className="result-primary-text">
                          {r.pledge_no}
                        </div>
                        <div className="result-sub-text">
                          {r.customer_name} · ₹{r.loan_amount.toLocaleString()}
                        </div>
                      </div>
                      {r.is_bank_mapped && (
                        <span className="badge-inline-status">
                          Bank Mapped
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pledge Details Card ── */}
      {pledgeDetails && (
        <div className={`pledge-details-card ${pledgeConfirmed ? "confirmed" : ""}`}>
          <div className="details-header">
            <h3>{t("pledge_details")}</h3>
            <div className="footer-actions">
              {pledgeDetails.is_bank_mapped && (
                <span className="status-badge warning">
                  <AlertTriangle size={16} /> Bank Mapped
                </span>
              )}
              {pledgeConfirmed ? (
                <span className="status-badge confirmed">
                  <CheckCircle2 size={16} /> {t("confirmed")}
                </span>
              ) : (
                <span className="status-badge pending">
                  <AlertCircle size={16} /> {t("pending")}
                </span>
              )}
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <User size={16} />
              <div>
                <span className="label">{t("customer_name")}</span>
                <span className="value">{pledgeDetails.customer_name}</span>
              </div>
            </div>
            <div className="detail-item">
              <Fingerprint size={16} />
              <div>
                <span className="label">Pledge Number</span>
                <span className="value">{pledgeDetails.pledge_no}</span>
              </div>
            </div>
            <div className="detail-item">
              <IndianRupee size={16} />
              <div>
                <span className="label">{t("loan_amount")}</span>
                <span className="value loan-amt">
                  ₹{pledgeDetails.loan_amount.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <Calendar size={16} />
              <div>
                <span className="label">{t("created")}</span>
                <span className="value">
                  {formatTransactionTimestamp(pledgeDetails.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Bank Mapped Amount Banner ── */}
          {pledgeDetails.is_bank_mapped && pledgeDetails.bank_loan_amount && (
            <div className="bank-amt-banner">
              <div className="bank-banner-title-group">
                <Landmark size={16} className="negative" />
                <span className="bank-banner-title">
                  Bank Mapped Amount
                </span>
              </div>
              <span className="bank-banner-value">
                ₹{pledgeDetails.bank_loan_amount.toLocaleString()}
              </span>
            </div>
          )}

          {!pledgeConfirmed && (
            <div className="details-actions">
              <button className="btn-cancel" onClick={cancelPledge}>
                <XCircle size={16} /> {t("cancel")}
              </button>
              <button className="btn-confirm" onClick={confirmPledge}>
                <CheckCircle2 size={16} /> {t("confirm_continue")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── BANK MAPPING FORM ── */}
      {pledgeConfirmed && mode === "map" && (
        <div className="mapping-card">
          <div className="card-section-title">
            <ShieldCheck size={18} /> {t("bank_mapping_details")}
          </div>

          <div className="mapping-grid">
            <div className="input-group">
              <label>
                <Landmark size={14} /> Bank <span className="req">*</span>
              </label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
              >
                <option value="">Select Bank</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bank_name} - {b.account_number.slice(-4)}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>
                <IndianRupee size={14} /> {t("bank_loan_amount")}{" "}
                <span className="req">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Amount bank agreed"
                value={bankLoanAmount}
                onChange={(e) => setBankLoanAmount(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>
                <IndianRupee size={14} /> {t("actual_received")}{" "}
                <span className="req">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Amount actually received"
                value={actualReceived}
                onChange={(e) => setActualReceived(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>
                <ReceiptText size={14} /> {t("bank_charges")}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={bankCharges}
                onChange={(e) => setBankCharges(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>
                <Wallet size={14} /> {t("payment_method")}{" "}
                <span className="req">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setMapReference("");
                  setMapDenominations({ ...emptyDenominations });
                }}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* TRANSACTION REF */}
          {!isCash && (
            <div className="input-group" style={{ marginTop: "12px", width: "100%" }}>
              <ReferenceInput
                method={paymentMethod}
                value={mapReference}
                onChange={setMapReference}
              />
            </div>
          )}

          {paymentMethod === "CASH" && (
            <CashDenominations
              denominations={mapDenominations}
              onChange={setMapDenominations}
              label="Note Breakup (Received)"
            />
          )}

          {actualReceived && pledgeDetails && (
            <div className="calculation-summary">
              <div className="calc-row">
                <span>{t("actual_received")}:</span>
                <span>₹{parseFloat(actualReceived).toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>{t("bank_charges")}:</span>
                <span className="negative">
                  - ₹{parseFloat(bankCharges || 0).toFixed(2)}
                </span>
              </div>
              <div className="calc-row divider">
                <span>
                  <strong>Net Received:</strong>
                </span>
                <span className="net-amount">
                  <strong>₹{calculateNetReceived().toFixed(2)}</strong>
                </span>
              </div>
              <div className="calc-row">
                <span>Customer Loan Amount:</span>
                <span>₹{pledgeDetails.loan_amount.toFixed(2)}</span>
              </div>
              {paymentMethod === "CASH" && (
                <div className="calc-row">
                  <span>Denomination Total:</span>
                  <span className={mapDenomMatched ? "positive" : "negative"}>
                    ₹{mapDenomTotal.toFixed(2)}{" "}
                    {mapDenomMatched
                      ? "✅ Matched"
                      : "❌ Must match Actual Received"}
                  </span>
                </div>
              )}
              {Math.abs(calculateDifference()) > 0.01 && (
                <div className={`calc-row ${isSurplus() ? "surplus" : "deficit"}`}>
                  <span>
                    <strong>
                      {isSurplus() ? (
                        <>
                          <TrendingUp size={16} /> Surplus (You Get)
                        </>
                      ) : (
                        <>
                          <TrendingDown size={16} /> Deficit (You Add)
                        </>
                      )}
                      :
                    </strong>
                  </span>
                  <span className={isSurplus() ? "surplus-amt" : "deficit-amt"}>
                    <strong>
                      ₹{Math.abs(calculateDifference()).toFixed(2)}
                    </strong>
                    <span className="method-badge">{paymentMethod}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mapping-footer">
            <div className="footer-actions">
              <button className="btn-secondary" onClick={cancelPledge}>
                Cancel
              </button>
              <button
                className="submit-btn"
                onClick={submitMapping}
                disabled={
                  loading || (paymentMethod === "CASH" && !mapDenomMatched)
                }
              >
                {loading ? t("processing") : t("confirm_bank_mapping")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BANK UNMAPPING FORM ── */}
      {pledgeConfirmed && mode === "unmap" && (
        <div className="mapping-card">
          <div className="card-section-title">
            <ShieldCheck size={18} /> {t("unmap_retrieve_gold")}
          </div>

          {/* ── Total to Pay Bank Banner ── */}
          <div className="unmap-total-box">
            <div className="unmap-total-label">
              🔒 {t("total_to_pay_bank")}:
            </div>
            <div className="unmap-total-amount">
              ₹{totalToPayBank.toLocaleString()}
            </div>
            <div className="unmap-total-sub">
              Principal: ₹
              {(
                pledgeDetails?.bank_loan_amount ||
                pledgeDetails?.loan_amount ||
                0
              ).toLocaleString()}
              {parseFloat(bankInterest) > 0 &&
                ` + Interest: ₹${parseFloat(bankInterest).toLocaleString()}`}
            </div>
          </div>

          <div className="input-group input-group-top-padded">
            <label>
              <ReceiptText size={14} /> Interest/Charges Paid to Bank
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0"
              value={bankInterest}
              onChange={(e) => setBankInterest(e.target.value)}
            />
            <small>
              {/* ── Fixed: Removed undefined variables pledge_loan and pledge ── */}
              Principal: ₹
              {(
                pledgeDetails?.bank_loan_amount ||
                pledgeDetails?.loan_amount ||
                0
              ).toLocaleString()}
              {parseFloat(bankInterest) > 0
                ? ` + Interest: ₹${parseFloat(bankInterest).toLocaleString()}`
                : " + Interest: (enter above)"}
            </small>
          </div>

          <div className="input-group input-group-margined">
            <label>
              <Wallet size={14} /> {t("settlement_method")}
            </label>
            <select
              value={bankSettleMethod}
              onChange={(e) => {
                setBankSettleMethod(e.target.value);
                setBankSettleReference("");
                setBankSettleDenominations({ ...emptyDenominations });
              }}
            >
              <option value="CASH">Cash from Drawer</option>
              <option value="UPI">UPI</option>
              <option value="BANK">Bank Transfer</option>
            </select>
          </div>

          {bankSettleMethod === "CASH" && (
            <>
              <CashDenominations
                denominations={bankSettleDenominations}
                onChange={setBankSettleDenominations}
                label="Note Breakup (Paying Bank)"
              />
              <div className={`denom-match-status ${bankSettleMatched ? "matched" : "unmatched"}`}>
                {bankSettleMatched
                  ? `✅ Count: ₹${bankSettleDenomTotal.toLocaleString()} — Matched`
                  : `❌ Count: ₹${bankSettleDenomTotal.toLocaleString()} — Must match ₹${totalToPayBank.toLocaleString()}`}
              </div>
            </>
          )}

          {bankSettleMethod !== "CASH" && (
            <ReferenceInput
              method={bankSettleMethod}
              value={bankSettleReference}
              onChange={setBankSettleReference}
            />
          )}

          <div className="mapping-footer">
            <div className="footer-actions">
              <button className="btn-secondary" onClick={cancelPledge}>
                Cancel
              </button>
              <button
                className="submit-btn danger"
                onClick={submitUnmapping}
                disabled={
                  loading ||
                  (bankSettleMethod === "CASH" && !bankSettleMatched) ||
                  (bankSettleMethod !== "CASH" && !bankSettleReference.trim())
                }
              >
                {loading
                  ? "Processing..."
                  : `Pay ₹${totalToPayBank.toLocaleString()} & Close Pledge`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ── Inline Confirm/Alert Modal ── */}
      {confirmModal && (
        <div className="overlay-fixed-confirm">
          <div className="modal-content-confirm">
            <p className="modal-text-confirm">
              {confirmModal.message}
            </p>
            <div className="modal-actions-confirm">
              {confirmModal.onConfirm && (
                <button
                  onClick={() => setConfirmModal(null)}
                  className="btn-confirm-cancel"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) {
                    confirmModal.onConfirm();
                  } else {
                    setConfirmModal(null);
                  }
                }}
                className="btn-confirm-submit"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}