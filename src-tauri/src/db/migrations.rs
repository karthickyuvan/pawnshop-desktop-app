use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('OWNER','STAFF')) NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS metal_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS jewellery_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metal_type_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(metal_type_id, name),
            FOREIGN KEY (metal_type_id) REFERENCES metal_types(id)
        );

        CREATE TABLE IF NOT EXISTS schemes (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
            metal_type_id INTEGER NOT NULL,
            scheme_name TEXT NOT NULL,
            loan_percentage REAL NOT NULL,
            price_program TEXT NOT NULL,
            interest_rate REAL NOT NULL,
            interest_type TEXT
            CHECK(interest_type IN ('MONTHLY','YEARLY'))
            NOT NULL,
            processing_fee_type TEXT
            CHECK(processing_fee_type IN ('MANUAL','FIXED','PERCENTAGE'))
            NOT NULL,   processing_fee_value REAL,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (metal_type_id) REFERENCES metal_types(id)
        );

        CREATE TABLE IF NOT EXISTS price_per_gram (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metal_type_id INTEGER NOT NULL UNIQUE,
            price_per_gram REAL NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (metal_type_id) REFERENCES metal_types(id)
        );

        CREATE TABLE IF NOT EXISTS banks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_name TEXT NOT NULL,
            branch_name TEXT NOT NULL,
            account_number TEXT NOT NULL,
            ifsc_code TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

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

        CREATE TABLE IF NOT EXISTS fund_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            type TEXT CHECK(type IN ('ADD','WITHDRAW')) NOT NULL,
            total_amount REAL NOT NULL,

            module_type TEXT CHECK(module_type IN (
                'PLEDGE',
                'PAYMENT',
                'EXPENSE',
                'CAPITAL',
                'BANK_MAPPING',
                'FEE',
                'INTEREST',
                'CLOSURE'

            )),

            module_id INTEGER,

            reference TEXT,

            payment_method TEXT,
            transaction_ref TEXT,

            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS fund_denominations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fund_transaction_id INTEGER NOT NULL,
            denomination INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            amount REAL NOT NULL,
            FOREIGN KEY (fund_transaction_id) REFERENCES fund_transactions(id)
        );

        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_code TEXT UNIQUE NOT NULL,   
            name TEXT NOT NULL,
            relation TEXT,
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

        CREATE TABLE IF NOT EXISTS pledges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pledge_no TEXT UNIQUE NOT NULL, -- Format: PL-YYYYMMDD-001
        customer_id INTEGER NOT NULL,
        
        -- SNAPSHOT DATA (Fixed at time of creation)
        scheme_name TEXT NOT NULL,
        loan_type TEXT NOT NULL,
        interest_rate REAL NOT NULL,
        loan_duration_months INTEGER NOT NULL,
        price_per_gram REAL NOT NULL, -- The rate used for calculation
        
        -- CALCULATED TOTALS
        total_gross_weight REAL NOT NULL,
        total_net_weight REAL NOT NULL,
        total_estimated_value REAL NOT NULL,
        loan_amount REAL NOT NULL,
        
        status TEXT CHECK(status IN ('ACTIVE', 'CLOSED', 'AUCTIONED')) DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER NOT NULL,
        
        FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS pledge_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pledge_id INTEGER NOT NULL,
    jewellery_type_id INTEGER NOT NULL,
    purity TEXT,
    gross_weight REAL NOT NULL,
    net_weight REAL NOT NULL,
    item_value REAL NOT NULL,
    remarks TEXT,
    image_path TEXT,
    FOREIGN KEY (pledge_id) REFERENCES pledges(id),
    FOREIGN KEY (jewellery_type_id) REFERENCES jewellery_types(id)
);

    CREATE TABLE IF NOT EXISTS pledge_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pledge_id INTEGER NOT NULL,

        payment_type TEXT CHECK(payment_type IN 
            ('INTEREST','PRINCIPAL','CLOSURE')
        ) NOT NULL,

        payment_mode TEXT CHECK(payment_mode IN 
            ('CASH','BANK','UPI')
        ) NOT NULL,

        receipt_no TEXT,
        amount REAL NOT NULL,

        status TEXT CHECK(status IN 
            ('COMPLETED','REVERSED')
        ) DEFAULT 'COMPLETED',

        paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER NOT NULL,

        FOREIGN KEY (pledge_id) REFERENCES pledges(id)
        );
        CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),

        -- Interest Calculation Method
        interest_calculation_type TEXT CHECK(
            interest_calculation_type IN (
                'MONTHLY',
                'SLAB_WITH_15',
                'SLAB_WITH_CUSTOM',
                'DAILY'
            )
        ) NOT NULL DEFAULT 'SLAB_WITH_15',

        -- Used only if SLAB_WITH_CUSTOM
        grace_days INTEGER DEFAULT 15,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Ensure single row
    INSERT OR IGNORE INTO system_settings (id) VALUES (1);

    CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_code TEXT UNIQUE NOT NULL,  -- Format: EXP-YYYYMMDD-001
        category_id INTEGER NOT NULL,
        description TEXT,
        payment_mode TEXT CHECK(payment_mode IN 
            ('CASH','BANK_TRANSFER','UPI')
        ) NOT NULL,
        amount REAL NOT NULL,
        expense_date DATETIME NOT NULL,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES expense_categories(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
        );
    ",
    )
    .expect("Failed to run migrations");
}
