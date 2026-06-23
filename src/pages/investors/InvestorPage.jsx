

import { useEffect, useState } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useLanguage } from "../../context/LanguageContext";
import { getInvestors } from "../../services/investorApi";
import InvestorSummaryCards from "../../components/investors/InvestorSummaryCard";
import InvestorTable from "../../components/investors/InvestorTable";
import InvestorFormModal from "../../components/investors/InvestorFormModal";
import {
  createInvestor,
  updateInvestor,
  toggleInvestorStatus,
  payProfit,
} from "../../services/investorApi";
import {
  createInvestment,
  getInvestorLedger,
  withdrawInvestment,
  getInvestorsInterestDueReport,
} from "../../services/investorInvestmentApi";
import "./InvestorPage.css";
import InvestorInvestmentModal from "../../components/investors/InvestorInvestmentModal";
import InvestorLedgerModal from "../../components/investors/InvestorLedgerModal";
import InvestorWithdrawModal from "../../components/investors/InvestorWithdrawModal";
import InvestorProfitModal from "../../components/investors/InvestorProfitModal";

export default function InvestorPage({ user }) {
  const { t } = useLanguage();
  const [investors, setInvestors] = useState([]);
  const [dueReport, setDueReport] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  const [ledgerData, setLedgerData] = useState(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadInvestors();
  }, []);

  const loadInvestors = async () => {
    setLoadingReport(true);
    try {
      const data = await getInvestors();
      setInvestors(data || []);

      const report = await getInvestorsInterestDueReport();
      setDueReport(report || []);
    } catch (err) {
      console.error(err);
      toast.error(t("failed_to_load_investors", "Failed to sync investor summaries."));
    } finally {
      setLoadingReport(false);
    }
  };

  const filteredInvestors = investors.filter((i) =>
    (i.investor_name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleEdit = (investor) => {
    setSelectedInvestor(investor);
    setShowModal(true);
  };

  const handleToggleStatus = async (id, status) => {
    try {
      await toggleInvestorStatus({
        id,
        is_active: status,
      });

      await loadInvestors();
      toast.success(t("status_updated", "Status updated successfully!"));
    } catch (err) {
      toast.error(err?.toString() || t("operation_failed"));
    }
  };

  const handleCreateInvestment = async (payload) => {
    try {
      await createInvestment({
        ...payload,
        created_by: user?.user_id || user?.id || 1,
      });
      toast.success(t("investment_saved", "Investment saved successfully!"));
      setShowInvestmentModal(false);
      await loadInvestors();
    } catch (err) {
      console.error("INVESTMENT ERROR:", err);
      toast.error(err?.toString() || t("operation_failed"));
    }
  };

  const handleViewLedger = async (investorId) => {
    try {
      const data = await getInvestorLedger(investorId);
      setLedgerData(data);
      setShowLedgerModal(true);
    } catch (err) {
      console.error("Failed to load ledger", err);
      toast.error(err?.toString() || t("operation_failed"));
    }
  };

  const handleWithdraw = async (payload) => {
    try {
      await withdrawInvestment({ ...payload, created_by: user?.user_id || user?.id || 1 });
      setShowWithdrawModal(false);
      toast.success(t("withdrawal_saved", "Capital withdrawal completed."));
      await loadInvestors();
    } catch (err) {
      console.error(err);
      toast.error(err?.toString() || t("operation_failed"));
    }
  };

  const handlePayProfit = async (payload) => {
    try {
      await payProfit({
        ...payload,
        created_by: user?.user_id || user?.id || 1,
      });

      setShowProfitModal(false);
      setSelectedInvestor(null);
      toast.success(t("profit_paid", "Profit payout registered."));
      await loadInvestors();
    } catch (err) {
      console.error(err);
      toast.error(err?.toString() || t("operation_failed"));
    }
  };

  const handleSaveInvestor = async (formData) => {
    try {
      if (selectedInvestor) {
        await updateInvestor({
          id: selectedInvestor.id,
          ...formData,
        });
        toast.success(t("investor_updated", "Investor profile updated!"));
      } else {
        await createInvestor({
          ...formData,
          created_by: user?.user_id || user?.id || 1,
        });
        toast.success(t("investor_created", "New investor registered!"));
      }

      setShowModal(false);
      setSelectedInvestor(null);
      await loadInvestors();
    } catch (err) {
      console.error(err);
      toast.error(err?.toString() || t("operation_failed"));
    }
  };

  return (
    <div className="investor-page">
      <h2 className="investor-title">{t("investor_management")}</h2>

      <InvestorSummaryCards investors={investors} />

      {/* Search + Add Buttons Layout */}
      <div className="investor-toolbar">
        <input
          className="investor-search"
          type="text"
          placeholder={t("search_investor")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="add-investor-btn" onClick={() => setShowModal(true)}>
          + {t("add_investor")}
        </button>
        <button
          className="add-investor-btn"
          onClick={() => setShowInvestmentModal(true)}
        >
          + {t("add_investment")}
        </button>
        <button
          className="add-investor-btn"
          onClick={() => setShowWithdrawModal(true)}
        >
          {t("withdraw_capital")}
        </button>
        <button
          className="add-investor-btn"
          onClick={() => setShowProfitModal(true)}
        >
          {t("pay_profit")}
        </button>
      </div>

      {/* Pending Interest Due Report Card Table */}
      <div className="table-container due-report-container">
        <h3 className="due-report-title">
          ⏳{" "}
          {t(
            "pending_interest_due_report_title",
            "Pending Interest Due Report",
          )}
        </h3>
        {loadingReport ? (
          <div className="report-empty-state">{t("loading", "Loading report summary...")}</div>
        ) : dueReport.length === 0 ? (
          <div className="report-empty-state">
            ✅{" "}
            {t(
              "investors_all_paid_msg",
              "All active investors are currently fully paid up. There are no pending interest payouts due.",
            )}
          </div>
        ) : (
          <table className="data-table due-report-table">
            <thead>
              <tr>
                <th>{t("investor_lbl", "Investor")}</th>
                <th>{t("principal_amount")}</th>
                <th>{t("months_pending_hdr", "Months Pending")}</th>
                <th>{t("interest_due_lbl", "Interest Due")}</th>
                <th width="140">{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {dueReport.map((rep) => (
                <tr key={rep.investor_id}>
                  <td className="investor-name-cell">{rep.investor_name}</td>
                  <td>₹{rep.principal_amount.toLocaleString("en-IN")}</td>
                  <td>
                    <span className="months-pending">
                      {rep.total_months}{" "}
                      {rep.total_months === 1 ? t("month") : t("months")}
                    </span>
                  </td>
                  <td className="interest-due">
                    ₹{rep.accrued_interest.toLocaleString("en-IN")}
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedInvestor(
                          investors.find((i) => i.id === rep.investor_id),
                        );
                        setShowProfitModal(true);
                      }}
                      className="pay-interest-btn"
                    >
                      {t("pay_interest_btn", "Pay Interest")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <InvestorTable
        investors={filteredInvestors}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
        onViewLedger={handleViewLedger}
      />

      {showModal && (
        <InvestorFormModal
          investor={selectedInvestor}
          onClose={() => {
            setShowModal(false);
            setSelectedInvestor(null);
          }}
          onSave={handleSaveInvestor}
        />
      )}

      {showInvestmentModal && (
        <InvestorInvestmentModal
          investors={investors}
          onClose={() => setShowInvestmentModal(false)}
          onSave={handleCreateInvestment}
        />
      )}

      {showLedgerModal && (
        <InvestorLedgerModal
          summary={ledgerData?.summary}
          ledgerRows={ledgerData?.transactions || []}
          onClose={() => setShowLedgerModal(false)}
        />
      )}

      {showWithdrawModal && (
        <InvestorWithdrawModal
          investors={investors}
          onClose={() => setShowWithdrawModal(false)}
          onSave={handleWithdraw}
        />
      )}

      {showProfitModal && (
        <InvestorProfitModal
          investors={investors}
          onClose={() => {
            setShowProfitModal(false);
            setSelectedInvestor(null);
          }}
          onSave={handlePayProfit}
        />
      )}
    </div>
  );
}