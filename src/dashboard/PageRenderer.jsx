


import HomePage from "../pages/HomePage";
import LoanTypesPage from "../pages/LoanTypesPage";
import JewelleryTypesPage from "../pages/JewelleryTypesPage";
import SchemesPage from "../pages/SchemesPage";
import PricePerGramPage from "../pages/PricePerGramPage";
import BanksPage from "../pages/BanksPage";
import StaffPage from "../pages/StaffPage";
import CustomersPage from "../pages/CustomersPage";
import PledgesPage from "../pages/PledgesPage";
import RepledgesPage from "../pages/RepledgesPage.jsx";
import OverlimitPledgesPage from "../pages/OverlimitPledgesPage"; // ✅ NEW IMPORT
import TransactionsPage from "../pages/TransactionsPage";
import ExpensesPage from "../pages/ExpensesPage";
import DayBookPage from "../pages/DayBookPage";
import ReportsPage from "../pages/ReportsPage";
import SettingsPage from "../pages/SettingsPage";
import BankMappingPage from "../pages/BankMappingPage";
import FundManagement from "../pages/FundManagement";
import ViewPledgesPage from "../pages/ViewPledgesPage";
import SinglePledgePage from "../pages/SinglePledgePage";
import SystemSettingsPage from "../pages/SystemSettingsPage";
import PaymentsPage from "../pages/PaymentsPage";
import CustomerListPage from "../pages/CustomerListPage";
import AuctionListPage from "../pages/AuctionListPage";
import BranchDailyReportPage from "../reports/BranchDailyReportPage.jsx";
import CashFlowReportPage from "../reports/CashFlowReportPage.jsx";
import ExpenseAuditReportPage from "../reports/ExpenseAuditReportPage.jsx";
import PledgeRegisterReportPage from "../reports/PledgeRegisterReportPage.jsx";
import StockReportPage from "../reports/StockReportPage.jsx";
import CustomerLedgerReportPage from "../reports/CustomerLedgerReportPage.jsx";
import InterestAnalyticsReportPage from "../reports/InterestAnalyticsReportPage.jsx";
import YearlyReportPage from "../reports/YearlyReportPage.jsx";
import ProfitLossReport from "../reports/ProfitLossReport.jsx";
import BankMappingReport from "../reports/BankMappingReport.jsx";
import MonthlyReportPage from "../reports/Monthlyreport.jsx";
import FundLedgerReportPage from "../reports/FundLedgerReportPage.jsx";
import ExpenseCategoriesPage from "../pages/ExpenseCategoriesPage";

export default function PageRenderer({ activeKey, user, setActiveMenu }) {
  if (activeKey?.startsWith("single-pledge-")) {
    const key = activeKey.replace("single-pledge-", "");
    const [pledgeId, ...sourceParts] = key.split("-");
    const source = sourceParts.join("-") || "viewpledges";

    return (
      <SinglePledgePage
        pledgeId={pledgeId}
        source={source}
        user={user}
        setActiveMenu={setActiveMenu}
      />
    );
  }

  // ✅ Handle dynamic payment route
  if (activeKey?.startsWith("payments-")) {
    const pledgeId = activeKey.split("-")[1];

    return (
      <PaymentsPage
        user={user}
        pledgeId={pledgeId}
        setActiveMenu={setActiveMenu}
      />
    );
  }

  // Handle dynamic repledge route
  if (activeKey?.startsWith("repledge-")) {
    const pledgeId = activeKey.split("-")[1];

    return (
      <RepledgesPage
        defaultPledgeId={pledgeId}
        setActiveMenu={setActiveMenu}
        user={user}
      />
    );
  }

  // 🚫 Staff restriction list
  const restrictedForStaff = [
    "loan-types",
    "jewellery-types",
    "schemes",
    "price-per-gram",
    "banks",
    "bank-mapping",
    "fund-management",
    "interest-settings",
    "staff",
    "reports",
    "settings",
  ];

  if (user?.role === "STAFF" && restrictedForStaff.includes(activeKey)) {
    return (
      <div style={{ padding: "20px" }}>
        <h3 style={{ color: "red" }}>Unauthorized Access</h3>
        <p>You do not have permission to access this module.</p>
      </div>
    );
  }

  switch (activeKey) {
    case "home":
      return <HomePage />;

    case "loan-types":
      return <LoanTypesPage />;

    case "jewellery-types":
      return <JewelleryTypesPage />;

    case "schemes":
      return <SchemesPage />;

    case "price-per-gram":
      return <PricePerGramPage />;

    case "banks":
      return <BanksPage />;

    case "bank-mapping":
      return <BankMappingPage />;

    case "interest-settings":
      return <SystemSettingsPage />;

    case "expense-categories":
      return <ExpenseCategoriesPage user={user} />;

    case "staff":
      return <StaffPage />;

    case "customers":
      return <CustomersPage setActiveMenu={setActiveMenu} />;

    case "customer-list":
      return <CustomerListPage setActiveMenu={setActiveMenu} />;

    case "pledges":
      return <PledgesPage user={user} setActiveMenu={setActiveMenu} />;

    case "repledges":
      return <RepledgesPage />;

    // ✅ NEW: Dedicated Overlimit Pledges Page
    case "overlimit-pledges":
      return <OverlimitPledgesPage />;

    case "viewpledges":
      return <ViewPledgesPage user={user} setActiveMenu={setActiveMenu} />;

    case "payments":
      return <PaymentsPage user={user} />;

    case "transactions":
      return <TransactionsPage user={user} />;

    case "expenses":
      return <ExpensesPage user={user} />;

    case "daybook":
      return <DayBookPage user={user} />;

    case "reports":
      return <ReportsPage setActiveMenu={setActiveMenu} />;

    case "settings":
      return <SettingsPage />;

    case "fund-management":
      return <FundManagement user={user} />;

    case "auction-list":
      return <AuctionListPage user={user} />;

    case "branch-daily":
      return <BranchDailyReportPage />;

    case "cash-flow":
      return <CashFlowReportPage />;

    case "expense-audit":
      return <ExpenseAuditReportPage />;

    case "pledge-register":
      return <PledgeRegisterReportPage setActiveMenu={setActiveMenu} />;

    case "stock-report":
      return <StockReportPage />;
      
    case "customer-ledger":
      return <CustomerLedgerReportPage setActiveMenu={setActiveMenu} />;

    case "interest-analytics":
      return <InterestAnalyticsReportPage />;

    case "yearly-report":
      return <YearlyReportPage />;
    
    case "profit-loss":
      return <ProfitLossReport />;
      
    case "bankmapping-report":
      return <BankMappingReport/>

    case "monthly-report":
      return <MonthlyReportPage />;

    case "fund-ledger":
      return <FundLedgerReportPage />

    default:
      return <h3>Select a menu</h3>;
  }
}