import { invoke } from "@tauri-apps/api/core";

// Drawer total
export const getAvailableCash = () => {
  return invoke("get_available_cash_cmd");
};

// Updated: Added support for reference and description with a fallback to reason
export const addFund = ({ 
  createdBy, 
  reason, 
  reference,       // ── ADDED ──
  description,     // ── ADDED ──
  paymentMethod, 
  transactionRef, 
  amount, 
  transactionDate,
  denominations 
}) => {
  return invoke("add_fund_cmd", {
    createdBy,
    reference: reference || null,
    description: description || reason || null, // Resolves either new description or old reason
    paymentMethod,          
    transactionRef,        
    amount: Number(amount), 
    transactionDate,
    denominations,
  });
};

// Updated: Added support for reference and description with a fallback to reason
export const withdrawFund = ({ 
  createdBy, 
  reason, 
  reference,       // ── ADDED ──
  description,     // ── ADDED ──
  paymentMethod, 
  transactionRef, 
  amount, 
  transactionDate,
  denominations 
}) => {
  return invoke("withdraw_fund_cmd", {
    createdBy,
    reference: reference || null,
    description: description || reason || null, // Resolves either new description or old reason
    paymentMethod,
    transactionRef,
    amount: Number(amount),
    transactionDate,
    denominations,
  });
};

// Ledger
export const getFundLedger = () => {
  return invoke("get_fund_ledger_cmd");
};

// Cash drawer 
export const processDrawerExchange = (payload) =>
  invoke("process_drawer_exchange_cmd", payload);