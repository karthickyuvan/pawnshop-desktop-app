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
  transactionDate,
  denominations 
}) => {
  return invoke("add_fund_cmd", {
    createdBy,
    reason,
    paymentMethod,          
    transactionRef,        
    amount: Number(amount), 
    transactionDate,
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
  transactionDate,
  denominations 
}) => {
  return invoke("withdraw_fund_cmd", {
    createdBy,
    reason,
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



// cash drawer 
export const processDrawerExchange = (payload) =>
  invoke("process_drawer_exchange_cmd", payload);