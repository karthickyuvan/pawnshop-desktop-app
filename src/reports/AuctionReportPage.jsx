



import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import { getAuctionReport } from "../services/auctionApi";
import "./AuctionReportPage.css"; // Using the new professional stylesheet

export default function AuctionReportPage() {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [data, setData] = useState({
    summary: {},
    items: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const res = await getAuctionReport();
      setData(
        res || {
          summary: {},
          items: [],
        }
      );
    } catch (err) {
      console.error("Failed to load auction report:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalAuctioned     = data.summary?.total_auctioned || 0;
  const totalLoanAmount    = data.summary?.total_loan_amount || 0;
  const totalAuctionAmount = data.summary?.total_auction_amount || 0;
  const totalProfit        = data.summary?.total_profit || 0;

  if (loading) {
    return <div className="report-loading-state">{t("loading_report_data", "Loading Report Data...")}</div>;
  }

  return (
    <div className="auction-report-page">
      <div className="report-header">
        <h2>{t("branch_daily_report_desc", "Auction Report")}</h2>
        <p>{t("auction_report_subtitle", "View all auctioned pledges and auction history with detailed financial breakups")}</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <h3>{totalAuctioned}</h3>
          <p>{t("total_auctioned_lbl", "Total Auctioned")}</p>
        </div>

        <div className="summary-card">
          <h3>₹{Number(totalLoanAmount).toLocaleString("en-IN")}</h3>
          <p>{t("total_loan_amount")}</p>
        </div>

        <div className="summary-card">
          <h3>₹{Number(totalAuctionAmount).toLocaleString("en-IN")}</h3>
          <p>{t("total_auction_amount_lbl", "Total Auction Amount")}</p>
        </div>

        <div className="summary-card">
          <h3 style={{ color: totalProfit >= 0 ? "#16a34a" : "#dc2626" }}>
            {totalProfit >= 0 ? "+" : "−"} ₹{Math.abs(totalProfit).toLocaleString("en-IN")}
          </h3>
          <p>{t("profit_loss_hdr", "PROFIT / LOSS")}</p>
        </div>
      </div>

      {/* Modern Financial Table */}
      <div className="report-table-container">
        <table className="corporate-report-table">
          <thead>
            <tr>
              <th>{t("pledge_no")}</th>
              <th>{t("customer")}</th>
              <th>{t("pledge_date")}</th>
              <th className="text-right">{t("loan_principal_hdr", "Loan Principal")}</th>
              <th className="text-right">{t("interest_pending_lbl", "Interest Pending")}</th>
              <th className="text-right">{t("total_outstanding_hdr", "Total Outstanding")}</th>
              <th className="text-right">{t("auction_amount_label", "Auction Amount")}</th>
              <th className="text-center">{t("profit_loss_hdr", "PROFIT / LOSS")}</th>
              <th>{t("auction_date_hdr", "Auction Date")}</th>
              <th>{t("notes_hdr", "Notes")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan="10" className="table-empty-state">
                  {t("no_auctioned_pledges_fallback", "No Auctioned Pledges Found")}
                </td>
              </tr>
            ) : (
              data.items.map((row) => {
                // Fallback tracking parameters setup
                const pendingInterestFallback = 28800; 
                const outstandingTotalValue = Number(row.loan_amount || 0) + pendingInterestFallback;
                const rowRealizedProfit = Number(row.auction_amount || 0) - outstandingTotalValue;

                return (
                  <tr key={row.pledge_id}>
                    <td className="pledge-mono">{row.pledge_no}</td>
                    <td className="customer-name-cell">{row.customer_name}</td>
                    <td className="date-cell">{row.pledge_date}</td>
                    <td className="text-right amount-cell">
                      ₹{Number(row.loan_amount).toLocaleString("en-IN")}
                    </td>
                    <td className="text-right amount-cell text-muted-red">
                      ₹{pendingInterestFallback.toLocaleString("en-IN")}
                    </td>
                    <td className="text-right amount-cell text-bold-slate">
                      ₹{outstandingTotalValue.toLocaleString("en-IN")}
                    </td>
                    <td className="text-right amount-cell text-bold-blue">
                      ₹{Number(row.auction_amount).toLocaleString("en-IN")}
                    </td>
                    <td className="text-center">
                      <span className={`status-pill-badge ${rowRealizedProfit >= 0 ? "badge-profit" : "badge-loss"}`}>
                        {rowRealizedProfit >= 0 ? t("profit", "Profit") : t("loss", "Loss")}{" "}
                        ₹{Math.abs(rowRealizedProfit).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="date-cell">
                      {row.auctioned_at ? row.auctioned_at.slice(0, 10) : "-"}
                    </td>
                    <td className="notes-cell">
                      <div className="notes-truncate" title={row.auction_notes}>
                        {row.auction_notes || "-"}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}