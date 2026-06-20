

// import React from "react";
// import { useLanguage } from "../../context/LanguageContext";

// export default function InvestorSummaryCards({ investors = [] }) {
//   const { t } = useLanguage();

//   const totalInvestors = investors.length;
//   const activeInvestors = investors.filter((i) => i.is_active).length;

//   // Safe aggregate accumulation
//   const totalInvestment = investors.reduce(
//     (sum, i) => sum + (i.total_investment || 0),
//     0
//   );
//   const totalWithdrawn = investors.reduce(
//     (sum, i) => sum + (i.total_withdrawn || 0),
//     0
//   );
//   const currentBalance = investors.reduce(
//     (sum, i) => sum + (i.current_balance || 0),
//     0
//   );
//   const totalInterestPaid = investors.reduce(
//     (sum, i) => sum + (i.total_profit_paid || 0),
//     0
//   );

//   // Helper function to resolve missing translation keys gracefully
//   const getLabel = (key, fallback) => {
//     const val = t(key);
//     return val === key ? fallback : val;
//   };

//   return (
//     <div className="summary-grid">
//       {/* 1. Total Investors */}
//       <div className="summary-card">
//         <div className="summary-title">{getLabel("total_investors", "Total Investors")}</div>
//         <div className="summary-value">{totalInvestors}</div>
//       </div>

//       {/* 2. Active Investors */}
//       <div className="summary-card">
//         <div className="summary-title">{getLabel("active_investors", "Active Investors")}</div>
//         <div className="summary-value">{activeInvestors}</div>
//       </div>

//       {/* 3. Total Investment */}
//       <div className="summary-card">
//         <div className="summary-title">{getLabel("total_investment", "Total Investment")}</div>
//         <div className="summary-value">
//           ₹{totalInvestment.toLocaleString("en-IN")}
//         </div>
//       </div>

//       {/* 4. Total Withdrawn */}
//       <div className="summary-card">
//         <div className="summary-title">{getLabel("total_withdrawn", "Total Withdrawn")}</div>
//         <div className="summary-value">
//           ₹{totalWithdrawn.toLocaleString("en-IN")}
//         </div>
//       </div>

//       {/* 5. Current Balance */}
//       <div className="summary-card">
//         <div className="summary-title">{getLabel("current_balance_lbl", "Current Balance")}</div>
//         <div className="summary-value">
//           ₹{currentBalance.toLocaleString("en-IN")}
//         </div>
//       </div>

//       {/* 6. Total Interest Paid */}
//       <div className="summary-card">
//         <div className="summary-title">{getLabel("total_interest_paid", "Total Interest Paid")}</div>
//         <div className="summary-value">
//           ₹{totalInterestPaid.toLocaleString("en-IN")}
//         </div>
//       </div>
//     </div>
//   );
// }




import React from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function InvestorSummaryCards({ investors = [] }) {
  const { t } = useLanguage();

  const totalInvestors = investors.length;
  const activeInvestors = investors.filter((i) => i.is_active).length;

  // Safe aggregate accumulation
  const totalInvestment = investors.reduce(
    (sum, i) => sum + (i.total_investment || 0),
    0
  );
  const totalWithdrawn = investors.reduce(
    (sum, i) => sum + (i.total_withdrawn || 0),
    0
  );
  const currentBalance = investors.reduce(
    (sum, i) => sum + (i.current_balance || 0),
    0
  );
  const totalInterestPaid = investors.reduce(
    (sum, i) => sum + (i.total_profit_paid || 0),
    0
  );

  return (
    <div className="summary-grid">
      {/* 1. Total Investors */}
      <div className="summary-card">
        <div className="summary-title">{t("total_investors_lbl", "Total Investors")}</div>
        <div className="summary-value">{totalInvestors}</div>
      </div>

      {/* 2. Active Investors */}
      <div className="summary-card">
        <div className="summary-title">{t("active_investors_lbl", "Active Investors")}</div>
        <div className="summary-value">{activeInvestors}</div>
      </div>

      {/* 3. Total Investment */}
      <div className="summary-card">
        <div className="summary-title">{t("total_investment_lbl", "Total Investment")}</div>
        <div className="summary-value">
          ₹{totalInvestment.toLocaleString("en-IN")}
        </div>
      </div>

      {/* 4. Total Withdrawn */}
      <div className="summary-card">
        <div className="summary-title">{t("total_withdrawn_lbl", "Total Withdrawn")}</div>
        <div className="summary-value">
          ₹{totalWithdrawn.toLocaleString("en-IN")}
        </div>
      </div>

      {/* 5. Current Balance */}
      <div className="summary-card">
        <div className="summary-title">{t("remaining_principal", "Current Balance")}</div>
        <div className="summary-value">
          ₹{currentBalance.toLocaleString("en-IN")}
        </div>
      </div>

      {/* 6. Total Interest Paid */}
      <div className="summary-card">
        <div className="summary-title">{t("interest_paid", "Total Interest Paid")}</div>
        <div className="summary-value">
          ₹{totalInterestPaid.toLocaleString("en-IN")}
        </div>
      </div>
    </div>
  );
}