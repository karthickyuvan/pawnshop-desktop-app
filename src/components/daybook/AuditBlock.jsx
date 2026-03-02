// import React from 'react';
// import { formatTimeIST } from '../../utils/timeFormatter';

// /**
//  * Renders a categorized table of transactions.
//  */
// export default function AuditBlock({ type, entries }) {
//   // ✅ FIX: Calculate total by respecting transaction type
//   const total = entries.reduce((sum, entry) => {
//     if (entry.type_field === "ADD") {
//       return sum + entry.amount;
//     } else {
//       return sum - entry.amount;
//     }
//   }, 0);
  
//   return (
//     <div className={`audit-block ${ total < 0 ? "block-out" : "block-in"}`}>
//       <div className="block-header">
//         <span className="category-title">{type.replace(/_/g, " ")}</span>
//         <span className={`category-total ${ total < 0 ? "red" : "green" }`} >
//         ₹ {Math.abs(total).toLocaleString()}
//         </span>    
//       </div>

//       <div className="table-wrapper">
//         <table>
//           <thead>
//             <tr>
//               <th>Time</th>
//               <th>Reference</th>
//               <th>Method</th>
//               <th className="text-right">Amount</th>
//             </tr>
//           </thead>
//           <tbody>
//             {entries.map((entry, index) => {
//               // Determine if this is outflow or inflow
//               const isOut = entry.type_field === "WITHDRAW";
              
//               return (
//                 <tr key={entry.id || index}>
//                   {/* ✅ FIX: Format time to IST */}
//                   <td className="time-cell">{formatTimeIST(entry.time)}</td>
//                   <td className="reason-cell">{entry.reason}</td>
//                   <td>
//                     <span className="method-tag">{entry.payment_method}</span>
//                   </td>
//                   <td className={`amount-cell text-right ${isOut ? "red" : "green"}`}>
//                     ₹ {Math.abs(entry.amount).toLocaleString()}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }





import React, { useState } from 'react';
import { formatTimeIST } from '../../utils/timeFormatter';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function AuditBlock({ type, entries, transactionDenominations }) {
  const [expandedTx, setExpandedTx] = useState({});

  const total = entries.reduce((sum, entry) => {
    if (entry.type_field === "ADD") {
      return sum + entry.amount;
    } else {
      return sum - entry.amount;
    }
  }, 0);

  const toggleExpand = (fundTxId) => {
    setExpandedTx(prev => ({
      ...prev,
      [fundTxId]: !prev[fundTxId]
    }));
  };

  const getDenominationsForTx = (fundTxId) => {
    const detail = transactionDenominations?.find(d => d.fund_tx_id === fundTxId);
    return detail?.denominations || [];
  };

  return (
    <div className={`audit-block ${total < 0 ? "block-out" : "block-in"}`}>
      <div className="block-header">
        <span className="category-title">{type.replace(/_/g, " ")}</span>
        <span className={`category-total ${total < 0 ? "red" : "green"}`}>
          ₹ {Math.abs(total).toLocaleString()}
        </span>    
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Customer</th>
              <th>Reference</th>
              <th>Method</th>
              <th className="text-right">Amount</th>
              <th width="40"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const isOut = entry.type_field === "WITHDRAW";
              const denoms = getDenominationsForTx(entry.fund_tx_id);
              const hasDenoms = entry.payment_method === "CASH" && denoms.length > 0;
              const isExpanded = expandedTx[entry.fund_tx_id];
              
              return (
                <React.Fragment key={entry.fund_tx_id || index}>
                  <tr className={hasDenoms ? 'has-details' : ''}>
                    <td className="time-cell">{formatTimeIST(entry.time)}</td>
                    
                    <td className="customer-cell">
                      {entry.customer_name ? (
                        <span className="customer-name">{entry.customer_name}</span>
                      ) : (
                        <span className="no-customer">—</span>
                      )}
                    </td>
                    
                    <td className="reason-cell">{entry.reason}</td>
                    
                    <td>
                      <span className="method-tag">{entry.payment_method}</span>
                    </td>
                    
                    <td className={`amount-cell text-right ${isOut ? "red" : "green"}`}>
                      ₹ {Math.abs(entry.amount).toLocaleString()}
                    </td>
                    
                    <td className="expand-cell">
                      {hasDenoms && (
                        <button 
                          className="expand-btn"
                          onClick={() => toggleExpand(entry.fund_tx_id)}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </td>
                  </tr>
                  
                  {/* Expandable Denomination Details */}
                  {hasDenoms && isExpanded && (
                    <tr className="denomination-detail-row">
                      <td colSpan="6">
                        <div className="denomination-detail">
                          <h5>Cash Breakdown:</h5>
                          <div className="denom-grid">
                            {denoms.map((d, i) => (
                              <div key={i} className="denom-item">
                                <span className="denom-note">₹{d.denomination}</span>
                                <span className="denom-multiply">×</span>
                                <span className="denom-qty">{d.quantity}</span>
                                <span className="denom-equals">=</span>
                                <span className="denom-total">₹{d.total.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}