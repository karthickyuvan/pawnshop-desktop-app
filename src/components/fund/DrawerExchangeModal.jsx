

// version 3 
import React, { useState } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useLanguage } from "../../context/LanguageContext"; // ✅ Imported custom language hook
import { processDrawerExchange } from "../../services/fundServiceApi";
import { X, RefreshCw, Check, AlertCircle } from "lucide-react";
import { calcDenomTotal, emptyDenominations } from "../../constants/CashDenominationInput";
import "./DrawerExchangeModal.css"; 

const notes = [500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function DrawerExchangeModal({ user, onClose, onSuccess }) {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [received, setReceived] = useState(emptyDenominations());
  const [given, setGiven]       = useState(emptyDenominations());
  const [loading, setLoading]   = useState(false);

  const totalIn = calcDenomTotal(received);
  const totalOut = calcDenomTotal(given);
  const isMatched = totalIn > 0 && totalIn === totalOut;

  const handleSubmit = async () => {
    if (!isMatched) {
      toast.error(t("amount_mismatch_error", "Amounts must match before processing."));
      return;
    }

    const userId = user?.user_id || user?.id;
    if (!userId) {
      toast.error(t("session_expired", "Session expired. Please log in again."));
      return;
    }

    setLoading(true);
    try {
      await processDrawerExchange({
        createdBy: userId,
        amount: totalIn,
        receivedDenominations: Object.entries(received)
          .filter(([, q]) => q > 0)
          .map(([n, q]) => [parseInt(n), q]),
        givenDenominations: Object.entries(given)
          .filter(([, q]) => q > 0)
          .map(([n, q]) => [parseInt(n), q]),
      });
      
      // 🚀 Upgraded Success Toast
      toast.success(t("investment_saved", "Denomination Exchange Processed Successfully!"));
      onSuccess();
      onClose();
    } catch (err) {
      // 🚀 Upgraded Error Toast
      toast.error(`${t("operation_failed", "Exchange failed:")} ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const renderRow = (note, data, setData) => {
    const qty = data[note] || 0;
    const value = qty * note;

    return (
      <div className="exchange-denom-row" key={note}>
        <span className="exchange-denom-label">₹{note}</span>
        <span className="exchange-denom-multiply">×</span>
        <input
          type="number"
          min="0"
          className="exchange-denom-input"
          placeholder="0"
          value={data[note] === 0 ? "" : (data[note] ?? "")}
          onChange={(e) => setData({ ...data, [note]: Math.max(0, parseInt(e.target.value) || 0) })}
        />
        <span className="exchange-denom-equals">=</span>
        <span className="exchange-denom-value">₹{value.toLocaleString("en-IN")}</span>
      </div>
    );
  };

  return (
    <div className="exchange-modal-overlay">
      <div className="exchange-modal-card">
        {/* Header */}
        <div className="exchange-modal-header">
          <h2>{t("cash_exchange_title", "Cash Exchange (Change Maker)")}</h2>
          <button onClick={onClose} className="close-btn"><X size={18} /></button>
        </div>

        {/* Body Column Cards */}
        <div className="exchange-modal-body">
          {/* Left Card: Received */}
          <div className="exchange-column-card inward">
            <h4 className="exchange-column-title">📥 {t("inward_cash_received_lbl", "Inward Cash Received")}</h4>
            <div className="exchange-denom-list">
              {notes.map((n) => renderRow(n, received, setReceived))}
            </div>
            <div className="exchange-column-total inward">
              <span>{t("total_inflow", "Total Received")}</span>
              <span>₹{totalIn.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Right Card: Given */}
          <div className="exchange-column-card outward">
            <h4 className="exchange-column-title">📤 {t("outward_cash_given_lbl", "Outward Cash Given")}</h4>
            <div className="exchange-denom-list">
              {notes.map((n) => renderRow(n, given, setGiven))}
            </div>
            <div className="exchange-column-total outward">
              <span>{t("total_outflow", "Total Given")}</span>
              <span>₹{totalOut.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="exchange-modal-footer">
          <div className={`exchange-status-badge ${isMatched ? "matched" : "mismatched"}`}>
            {isMatched ? (
              <><Check size={16} /> {t("cash_matches_entered_amount", "Totals Match perfectly")}</>
            ) : (
              <><AlertCircle size={16} /> {t("difference", "Mismatch")}: ₹{(totalIn - totalOut).toLocaleString("en-IN")}</>
            )}
          </div>
          
          <div className="exchange-footer-actions">
            <button onClick={onClose} className="exchange-btn-secondary" disabled={loading}>{t("cancel")}</button>
            <button onClick={handleSubmit} className="exchange-btn-primary" disabled={!isMatched || loading}>
              <RefreshCw size={14} /> {t("process_exchange_btn", "Process Exchange")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}