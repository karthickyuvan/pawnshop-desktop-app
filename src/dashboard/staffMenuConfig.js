export const staffMenu = [
  {
    title: "Home",
    key: "home",
  },
  {
    title: "Customers",
    key: "customers",
  },
  {
    title: "Pledges",
    children: [
      { title: "Create Pledge", key: "pledges" },
      { title: "View All Pledges", key: "viewpledges" },
      { title: "Re-Pledges", key: "repledges" },
    ],
  },
  {
    title: "Payments",
    key: "payments",
  },
  {
    title: "Accounts",
    children: [
      { title: "Transactions", key: "transactions" },
      { title: "Expenses", key: "expenses" },
      { title: "Day Book", key: "daybook" },
    ],
  },
];