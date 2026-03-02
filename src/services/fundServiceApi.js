import { invoke } from "@tauri-apps/api/core";

// Drawer total
export const getAvailableCash = () => {
  return invoke("get_available_cash_cmd");
};


export const addFund = ({ 
  createdBy, 
  reason, 
  paymentMethod, 
  transactionRef, 
  amount, 
  denominations 
}) => {
  return invoke("add_fund_cmd", {
    createdBy,
    reason,
    paymentMethod,          
    transactionRef,        
    amount: Number(amount), 
    denominations,
  });
};

// ✅ FIX: Update Withdraw as well
export const withdrawFund = ({ 
  createdBy, 
  reason, 
  paymentMethod, 
  transactionRef, 
  amount, 
  denominations 
}) => {
  return invoke("withdraw_fund_cmd", {
    createdBy,
    reason,
    paymentMethod,
    transactionRef,
    amount: Number(amount),
    denominations,
  });
};

// Ledger
export const getFundLedger = () => {
  return invoke("get_fund_ledger_cmd");
};