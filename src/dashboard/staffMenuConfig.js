export const staffMenu = [
  {
    titleKey: "home",
    key: "home",
  },
  {
    titleKey: "customers",
    key: "customers",
  },
  {
    titleKey: "pledges_menu",
    children: [
      { titleKey: "pledges", key: "pledges" },
      { titleKey: "view_pledges", key: "viewpledges" },
      { titleKey: "repledges", key: "repledges" },
      { titleKey: "overlimit_pledges", key: "overlimit-pledges" },
    ],
  },
  {
    titleKey: "payments",
    key: "payments",
  },
  {
    titleKey: "accounts",
    children: [
      { titleKey: "transactions", key: "transactions" },
      { titleKey: "expenses", key: "expenses" },
      { titleKey: "daybook", key: "daybook" },
    ],
  },
];