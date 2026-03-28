use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) {
    conn.execute_batch(
        "

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('OWNER','STAFF')) NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- METAL TYPES
CREATE TABLE IF NOT EXISTS metal_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- JEWELLERY TYPES
CREATE TABLE IF NOT EXISTS jewellery_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metal_type_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metal_type_id, name),
    FOREIGN KEY (metal_type_id) REFERENCES metal_types(id)
);

-- SCHEMES
CREATE TABLE IF NOT EXISTS schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metal_type_id INTEGER NOT NULL,
    scheme_name TEXT NOT NULL,
    loan_percentage REAL NOT NULL,
    price_program TEXT NOT NULL,
    interest_rate REAL NOT NULL,
    interest_type TEXT CHECK(interest_type IN ('MONTHLY','YEARLY')) NOT NULL,
    processing_fee_type TEXT CHECK(processing_fee_type IN ('MANUAL','FIXED','PERCENTAGE')) NOT NULL,
    processing_fee_value REAL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (metal_type_id) REFERENCES metal_types(id)
);

-- PRICE PER GRAM
CREATE TABLE IF NOT EXISTS price_per_gram (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metal_type_id INTEGER NOT NULL UNIQUE,
    price_per_gram REAL NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (metal_type_id) REFERENCES metal_types(id)
);

-- PRICE HISTORY
CREATE TABLE IF NOT EXISTS price_per_gram_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metal_type_id INTEGER NOT NULL,
    price_per_gram REAL NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    changed_by INTEGER,
    FOREIGN KEY (metal_type_id) REFERENCES metal_types(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_price_history_metal
ON price_per_gram_history(metal_type_id);

-- BANKS
CREATE TABLE IF NOT EXISTS banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    relation_type TEXT,
    relation_name TEXT,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    address TEXT,
    id_proof_type TEXT CHECK(
        id_proof_type IN (
            'Aadhaar Card',
            'PAN Card',
            'Passport',
            'Voter ID',
            'Driving License'
        )
    ),
    id_proof_number TEXT,
    photo_path TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FUND TRANSACTIONS
CREATE TABLE IF NOT EXISTS fund_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('ADD','WITHDRAW')) NOT NULL,
    total_amount REAL NOT NULL,
    module_type TEXT CHECK(module_type IN (
        'PLEDGE','PAYMENT','EXPENSE','CAPITAL','BANK_MAPPING','FEE','INTEREST','CLOSURE'
    )),
    module_id INTEGER,
    reference TEXT,
    description TEXT,
    payment_method TEXT,
    transaction_ref TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fund_created_at
ON fund_transactions(created_at);

-- FUND DENOMINATIONS
CREATE TABLE IF NOT EXISTS fund_denominations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fund_transaction_id INTEGER NOT NULL,
    denomination INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (fund_transaction_id) REFERENCES fund_transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_fund_denominations_tx
ON fund_denominations(fund_transaction_id);

-- PLEDGES
CREATE TABLE IF NOT EXISTS pledges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pledge_no TEXT UNIQUE NOT NULL,
    pocket_number INTEGER UNIQUE,
    customer_id INTEGER NOT NULL,
    scheme_name TEXT NOT NULL,
    loan_type TEXT NOT NULL,
    interest_rate REAL NOT NULL,
    loan_duration_months INTEGER NOT NULL,
    price_per_gram REAL NOT NULL,
    total_gross_weight REAL NOT NULL,
    total_net_weight REAL NOT NULL,
    total_estimated_value REAL NOT NULL,
    loan_amount REAL NOT NULL,
    is_overlimit INTEGER DEFAULT 0,
    actual_loan_percentage REAL DEFAULT 0.0,
    receipt_number TEXT,
    status TEXT CHECK(status IN ('ACTIVE','CLOSED','AUCTIONED')) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX IF NOT EXISTS idx_pledges_customer
ON pledges(customer_id);

CREATE INDEX IF NOT EXISTS idx_pledges_overlimit
ON pledges(is_overlimit) WHERE is_overlimit = 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pledges_receipt
ON pledges(receipt_number) WHERE receipt_number IS NOT NULL;

-- PLEDGE ITEMS
CREATE TABLE IF NOT EXISTS pledge_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pledge_id INTEGER NOT NULL,
    jewellery_type_id INTEGER NOT NULL,
    description TEXT,
    purity TEXT,
    gross_weight REAL NOT NULL,
    net_weight REAL NOT NULL,
    item_value REAL NOT NULL,
    remarks TEXT,
    image_path TEXT,
    FOREIGN KEY (pledge_id) REFERENCES pledges(id),
    FOREIGN KEY (jewellery_type_id) REFERENCES jewellery_types(id)
);

-- PLEDGE PAYMENTS
CREATE TABLE IF NOT EXISTS pledge_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pledge_id INTEGER NOT NULL,
    payment_type TEXT CHECK(payment_type IN ('INTEREST','PRINCIPAL','CLOSURE')) NOT NULL,
    payment_mode TEXT CHECK(payment_mode IN ('CASH','BANK','UPI')) NOT NULL,
    receipt_no TEXT,
    receipt_number TEXT,
    amount REAL NOT NULL,
    status TEXT CHECK(status IN ('COMPLETED','REVERSED')) DEFAULT 'COMPLETED',
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (pledge_id) REFERENCES pledges(id)
);

CREATE INDEX IF NOT EXISTS idx_pledge_payments_pledge
ON pledge_payments(pledge_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_receipt
ON pledge_payments(receipt_number) WHERE receipt_number IS NOT NULL;

-- BANK MAPPING
CREATE TABLE IF NOT EXISTS bank_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pledge_id INTEGER NOT NULL,
    bank_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    bank_charges REAL DEFAULT 0,
    net_amount REAL NOT NULL,
    mapped_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('ACTIVE','REVERSED')) DEFAULT 'ACTIVE',
    FOREIGN KEY (pledge_id) REFERENCES pledges(id),
    FOREIGN KEY (bank_id) REFERENCES banks(id)
);

CREATE INDEX IF NOT EXISTS idx_bank_mappings_pledge
ON bank_mappings(pledge_id);

-- SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    interest_calculation_type TEXT CHECK(
        interest_calculation_type IN (
            'DAILY',
            'MONTHLY',
            'SLAB_WITH_HALF',
            'SLAB_WITH_CUSTOM'
        )
    ) NOT NULL DEFAULT 'SLAB_WITH_HALF',
    grace_days INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO system_settings (id) VALUES (1);

-- SHOP SETTINGS
CREATE TABLE IF NOT EXISTS shop_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    shop_name TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT DEFAULT '',
    website TEXT DEFAULT '',
    license_number TEXT DEFAULT '',
    logo_path TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO shop_settings (id) VALUES (1);

-- EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_code TEXT UNIQUE NOT NULL,
    category_id INTEGER NOT NULL,
    description TEXT,
    payment_mode TEXT CHECK(payment_mode IN ('CASH','BANK_TRANSFER','UPI')) NOT NULL,
    amount REAL NOT NULL,
    transaction_ref TEXT,
    expense_date DATETIME NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_category
ON expenses(category_id);

CREATE INDEX IF NOT EXISTS idx_expenses_date
ON expenses(expense_date);

-- UNIFIED RECEIPT SEQUENCE
CREATE TABLE IF NOT EXISTS receipt_sequence (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_receipt_number INTEGER DEFAULT 0,
    current_year INTEGER DEFAULT 2026
);

INSERT OR IGNORE INTO receipt_sequence (id, current_year)
VALUES (1, strftime('%Y', 'now'));

"
    ).expect("Failed to run migrations");
}