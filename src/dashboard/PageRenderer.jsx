// import HomePage from "../pages/HomePage";
// import LoanTypesPage from "../pages/LoanTypesPage";
// import JewelleryTypesPage from "../pages/JewelleryTypesPage";
// import SchemesPage from "../pages/SchemesPage";
// import PricePerGramPage from "../pages/PricePerGramPage";
// import BanksPage from "../pages/BanksPage";
// import StaffPage from "../pages/StaffPage";
// import CustomersPage from "../pages/CustomersPage";
// import PledgesPage from "../pages/PledgesPage";
// import RepledgesPage from "../pages/RepledgesPage";
// import TransactionsPage from "../pages/TransactionsPage";
// import ExpensesPage from "../pages/ExpensesPage";
// import DayBookPage from "../pages/DayBookPage";
// import ReportsPage from "../pages/ReportsPage";
// import SettingsPage from "../pages/SettingsPage";
// import BankMappingPage from "../pages/BankMappingPage";
// import FundManagement from "../pages/FundManagement";
// import ViewPledgesPage from "../pages/ViewPledgesPage";
// import SinglePledgePage from "../pages/SinglePledgePage";
// import SystemSettingsPage from "../pages/SystemSettingsPage";
// import PaymentsPage from "../pages/PaymentsPage";

// export default function PageRenderer({ activeKey, user, setActiveMenu }) {

//   // 🚫 Staff restriction
//   const restrictedForStaff = [
//     "loan-types",
//     "jewellery-types",
//     "schemes",
//     "price-per-gram",
//     "banks",
//     "bank-mapping",
//     "fund-management",
//     "interest-settings",
//     "staff",
//     "reports",
//     "settings"
//   ];

//   if (user?.role === "STAFF" && restrictedForStaff.includes(activeKey)) {
//     return <h3>Unauthorized Access</h3>;
//   }

//   // ✅ Handle dynamic single pledge route
//   if (activeKey?.startsWith("single-pledge-")) {
//     const pledgeId = activeKey.split("-")[2];

//     return (
//       <SinglePledgePage
//         pledgeId={pledgeId}
//         user={user}
//         setActiveMenu={setActiveMenu}
//       />
//     );
//   }

//   switch (activeKey) {

//     case "home":
//       return <HomePage />;

//     case "loan-types":
//       return <LoanTypesPage />;

//     case "jewellery-types":
//       return <JewelleryTypesPage />;

//     case "schemes":
//       return <SchemesPage />;

//     case "price-per-gram":
//       return <PricePerGramPage />;

//     case "banks":
//       return <BanksPage />;

//     case "bank-mapping":
//       return <BankMappingPage />;

//     case  "interest-settings":
//       return <SystemSettingsPage/>;

//     case "staff":
//       return <StaffPage />;

//     case "customers":
//       return <CustomersPage setActiveMenu={setActiveMenu} />;

//     case "pledges":
//       return <PledgesPage user={user} setActiveMenu={setActiveMenu} />;

//     case "repledges":
//       return <RepledgesPage />;

//     case "viewpledges":
//       return (
//         <ViewPledgesPage
//           user={user}
//           setActiveMenu={setActiveMenu}
//         />
//       );

//     case "payments":
//       return <PaymentsPage />;

//     case "transactions":
//       return <TransactionsPage />;

//     case "expenses":
//       return <ExpensesPage user={user} />;
      

//     case "daybook":
//       return <DayBookPage />;

//     case "reports":
//       return <ReportsPage />;

//     case "settings":
//       return <SettingsPage />;

//     case "fund-management":
//       return <FundManagement user={user} />;

//     default:
//       return <h3>Select a menu</h3>;
//   }
// }




import HomePage from "../pages/HomePage";
import LoanTypesPage from "../pages/LoanTypesPage";
import JewelleryTypesPage from "../pages/JewelleryTypesPage";
import SchemesPage from "../pages/SchemesPage";
import PricePerGramPage from "../pages/PricePerGramPage";
import BanksPage from "../pages/BanksPage";
import StaffPage from "../pages/StaffPage";
import CustomersPage from "../pages/CustomersPage";
import PledgesPage from "../pages/PledgesPage";
import RepledgesPage from "../pages/RepledgesPage";
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

export default function PageRenderer({ activeKey, user, setActiveMenu }) {

  // ✅ Handle dynamic single pledge route FIRST
  if (activeKey?.startsWith("single-pledge-")) {

    const pledgeId = activeKey.split("-")[2];

    // 🚫 Example: If you later restrict staff from editing pledges
    // you can check here also

    return (
      <SinglePledgePage
        pledgeId={pledgeId}
        user={user}
        setActiveMenu={setActiveMenu}
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
    "settings"
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

    case "viewpledges":
      return (
        <ViewPledgesPage
          user={user}
          setActiveMenu={setActiveMenu}
        />
      );

    case "payments":
      return <PaymentsPage user={user} />;

    case "transactions":
      return <TransactionsPage user={user} />;

    case "expenses":
      return <ExpensesPage user={user} />;

    case "daybook":
      return <DayBookPage user={user} />;

    case "reports":
      return <ReportsPage />;

    case "settings":
      return <SettingsPage />;

    case "fund-management":
      return <FundManagement user={user} />;

    default:
      return <h3>Select a menu</h3>;
  }
}