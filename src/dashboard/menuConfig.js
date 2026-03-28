export const ownerMenu = [
  {
    titleKey: "home",
    key: "home",
  },

  {
    titleKey: "masters",
    children: [
      { titleKey: "loan_types", key: "loan-types" },
      { titleKey: "jewellery_types", key: "jewellery-types" },
      { titleKey: "schemes", key: "schemes" },
      { titleKey: "price_per_gram", key: "price-per-gram" },
      { titleKey: "banks", key: "banks" },
      { titleKey: "bank_mapping", key: "bank-mapping" },
      { titleKey: "fund_management", key: "fund-management" },
      { titleKey: "interest_settings", key: "interest-settings" },
      { titleKey: "expense_categories", key: "expense-categories" }
    ],
  },

  {
    titleKey: "people",
    children: [
      { titleKey: "staff", key: "staff" },
      { titleKey: "customers", key: "customers" },
    ],
  },

  {
    titleKey: "pledges_menu",
    children: [
      { titleKey: "pledges", key: "pledges" },
      { titleKey: "view_pledges", key: "viewpledges" },
      { titleKey: "repledges", key: "repledges" },
      { titleKey: "overlimit_pledges", key: "overlimit-pledges" },
      { titleKey: "auction_list", key: "auction-list" },
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

  {
    titleKey: "reports",
    key: "reports",
  },

  {
    titleKey: "settings",
    key: "settings",
  },
];