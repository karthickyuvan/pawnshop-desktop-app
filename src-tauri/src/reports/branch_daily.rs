// use crate::db::connection::Db;
// use chrono::Local;
// use rusqlite::params;

// #[derive(serde::Serialize, Clone)]
// pub struct BranchDailyReport {
//     pub date: String,
//     pub opening_balance: f64,
//     pub loans_issued: f64,
//     pub interest_collected: f64,
//     pub processing_fees: f64,
//     pub expenses: f64,
//     pub other_income: f64,
//     pub closing_balance: f64,
//     // Additional auditor-required fields
//     pub net_cash_flow: f64,
//     pub loan_repayments: f64, 
//     pub total_inflow: f64,
//     pub total_outflow: f64,

//     // NEW
//     pub metal_in_gross: f64,
//     pub metal_in_net: f64,
//     pub metal_out_gross: f64,
//     pub metal_out_net: f64,

//     pub total_pockets: i64,
//     pub active_pockets: i64,
//     pub closed_pockets: i64,

//     pub metal_movements: Vec<MetalMovement>,
// }



// #[derive(serde::Serialize)]
// pub struct DetailedTransaction {
//     pub id: i64,
//     pub transaction_date: String,
//     pub module_type: String,
//     pub transaction_type: String,
//     pub amount: f64,
//     pub reference: Option<String>,
//     pub description: Option<String>,
// }


// #[derive(serde::Serialize, Clone)]
// pub struct MetalMovement {
//     pub metal: String,
//     pub in_gross: f64,
//     pub in_net: f64,
//     pub out_gross: f64,
//     pub out_net: f64,
// }


// pub fn get_branch_daily_report(
//     db: &Db,
//     report_date: String,
// ) -> Result<BranchDailyReport, String> {
//     let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

//     // 1. Opening Balance - Sum of all transactions BEFORE report date
//     let opening_balance: f64 = conn
//         .query_row(
//             "
//             SELECT COALESCE(SUM(
//                 CASE 
//                     WHEN type='ADD' THEN total_amount
//                     WHEN type='WITHDRAW' THEN -total_amount
//                     ELSE 0
//                 END
//             ), 0.0)
//             FROM fund_transactions
//             WHERE DATE(created_at) < ?1
//             ",
//             params![report_date],
//             |row| row.get(0),
//         )
//         .map_err(|e| format!("Error fetching opening balance: {}", e))?;

//     // 2. Loans Issued (Cash Out)
//     let loans_issued: f64 = conn
//         .query_row(
//             "
//             SELECT COALESCE(SUM(total_amount), 0.0)
//             FROM fund_transactions
//             WHERE module_type = 'PLEDGE'
//             AND type = 'WITHDRAW'
//             AND DATE(created_at) = ?1
//             ",
//             params![report_date],
//             |row| row.get(0),
//         )
//         .map_err(|e| format!("Error fetching loans issued: {}", e))?;

//     // 3. CRITICAL FIX: Loan Repayments (Principal returned - Cash In)
//     // This was MISSING in your original code - a major audit issue!
//     let loan_repayments: f64 = conn
//         .query_row(
//             "
//             SELECT COALESCE(SUM(total_amount), 0.0)
//             FROM fund_transactions
//             WHERE module_type = 'PLEDGE'
//             AND type = 'ADD'
//             AND DATE(created_at) = ?1
//             ",
//             params![report_date],
//             |row| row.get(0),
//         )
//         .map_err(|e| format!("Error fetching loan repayments: {}", e))?;

//     // 4. Interest Collected (Cash In)
//     let interest_collected: f64 = conn
//         .query_row(
//             "
//             SELECT COALESCE(SUM(total_amount), 0.0)
//             FROM fund_transactions
//             WHERE module_type = 'INTEREST'
//             AND type = 'ADD'
//             AND DATE(created_at) = ?1
//             ",
//             params![report_date],
//             |row| row.get(0),
//         )
//         .map_err(|e| format!("Error fetching interest: {}", e))?;

//     // 5. Expenses (Cash Out)
//     let expenses: f64 = conn
//         .query_row(
//             "
//             SELECT COALESCE(SUM(total_amount), 0.0)
//             FROM fund_transactions
//             WHERE module_type = 'EXPENSE'
//             AND type = 'WITHDRAW'
//             AND DATE(created_at) = ?1
//             ",
//             params![report_date],
//             |row| row.get(0),
//         )
//         .map_err(|e| format!("Error fetching expenses: {}", e))?;

//     // 6. Other Income -  Penalties, etc. (Cash In)
//     let other_income: f64 = conn
//         .query_row(
//             "
//             SELECT COALESCE(SUM(total_amount), 0.0)
//             FROM fund_transactions
//             WHERE module_type IN ('PENALTY', 'OTHER_INCOME')
//             AND type = 'ADD'
//             AND DATE(created_at) = ?1
//             ",
//             params![report_date],
//             |row| row.get(0),
//         )
//         .map_err(|e| format!("Error fetching other income: {}", e))?;

//     // 7. processing fees
//     let processing_fees: f64 = conn
//     .query_row(
//         "
//         SELECT COALESCE(SUM(total_amount),0)
//         FROM fund_transactions
//         WHERE module_type='FEE'
//         AND type='ADD'
//         AND DATE(created_at)=?1
//         ",
//         params![report_date],
//         |row| row.get(0),
//     )
//     .map_err(|e| format!("Error fetching processing fees: {}", e))?;

//     let total_pockets: i64 = conn
//     .query_row(
//                "
//         SELECT COUNT(*)
//         FROM pledges
//         WHERE pocket_number IS NOT NULL
//         AND DATE(pledge_date) = ?1
//         ",
//         params![report_date],
//         |row| row.get(0),
//     )
//     .unwrap_or(0);

//     let closed_pockets: i64 = conn
//     .query_row(
//         "
//         SELECT COUNT(*)
//         FROM pledges
//         WHERE status = 'CLOSED'
//         AND closed_at IS NOT NULL
//         AND DATE(closed_at) = ?1
//         ",
//         params![report_date],
//         |row| row.get(0),
//     )
//     .unwrap_or(0);


// let closure_collections: f64 = conn
//     .query_row(
//         "
//         SELECT COALESCE(SUM(total_amount),0)
//         FROM fund_transactions
//         WHERE module_type = 'CLOSURE'
//         AND type = 'ADD'
//         AND DATE(created_at) = ?1
//         ",
//         params![report_date],
//         |row| row.get(0),
//     )
//     .unwrap_or(0.0);
//     // Calculate totals
// let total_inflow =
//     loan_repayments +
//     closure_collections +
//     interest_collected +
//     processing_fees +
//     other_income;
    
//     let total_outflow = loans_issued + expenses;
//     let net_cash_flow = total_inflow - total_outflow;


// let active_pockets: i64 = conn
//     .query_row(
//         "
//         SELECT COUNT(*)
//         FROM pledges
//         WHERE status = 'ACTIVE'
//         AND DATE(pledge_date) = ?1
//         ",
//         params![report_date],
//         |row| row.get(0),
//     )
//     .unwrap_or(0);
//     // CORRECTED Closing Balance Formula
//     let closing_balance = opening_balance + net_cash_flow;

//     let metal_in_gross: f64 = conn
//     .query_row(
//         "
//         SELECT COALESCE(SUM(pi.gross_weight),0)
//         FROM pledges p
//         JOIN pledge_items pi ON pi.pledge_id = p.id
//         WHERE DATE(COALESCE(p.pledge_date, p.created_at)) = ?1
//         ",
//         params![report_date],
//         |row| row.get(0),
//     )
//     .unwrap_or(0.0);

// let metal_in_net: f64 = conn
//     .query_row(
//         "
//         SELECT COALESCE(SUM(pi.net_weight),0)
//         FROM pledges p
//         JOIN pledge_items pi ON pi.pledge_id = p.id
//         WHERE DATE(COALESCE(p.pledge_date, p.created_at)) = ?1
//         ",
//         params![report_date],
//         |row| row.get(0),
//     )
//     .unwrap_or(0.0);

//     let metal_out_gross: f64 = conn
//     .query_row(
//         "
//         SELECT COALESCE(SUM(pi.gross_weight),0)
//         FROM pledges p
//         JOIN pledge_items pi ON pi.pledge_id = p.id
//         WHERE p.status = 'CLOSED'
//         AND DATE(p.closed_at) = ?1
//         ",
//         params![report_date],
//         |row| row.get(0),
//     )
//     .unwrap_or(0.0);

// let metal_out_net: f64 = conn
//     .query_row(
//         "
//         SELECT COALESCE(SUM(pi.net_weight),0)
//         FROM pledges p
//         JOIN pledge_items pi ON pi.pledge_id = p.id
//         WHERE p.status = 'CLOSED'
//         AND DATE(p.closed_at) = ?1
//         ",
//         params![report_date],
//         |row| row.get(0),
//     )
//     .unwrap_or(0.0);

//     let mut metal_stmt = conn.prepare(
//         "
//         SELECT
//             mt.name,
    
//             COALESCE(SUM(
//                 CASE
//                     WHEN DATE(COALESCE(p.pledge_date,p.created_at)) = ?1
//                     THEN pi.gross_weight
//                     ELSE 0
//                 END
//             ),0),
    
//             COALESCE(SUM(
//                 CASE
//                     WHEN DATE(COALESCE(p.pledge_date,p.created_at)) = ?1
//                     THEN pi.net_weight
//                     ELSE 0
//                 END
//             ),0),
    
//             COALESCE(SUM(
//                 CASE
//                     WHEN p.status = 'CLOSED'
//                     AND DATE(p.closed_at) = ?1
//                     THEN pi.gross_weight
//                     ELSE 0
//                 END
//             ),0),
    
//             COALESCE(SUM(
//                 CASE
//                     WHEN p.status = 'CLOSED'
//                     AND DATE(p.closed_at) = ?1
//                     THEN pi.net_weight
//                     ELSE 0
//                 END
//             ),0)
    
//         FROM metal_types mt
    
//         LEFT JOIN jewellery_types jt
//             ON jt.metal_type_id = mt.id
    
//         LEFT JOIN pledge_items pi
//             ON pi.jewellery_type_id = jt.id
    
//         LEFT JOIN pledges p
//             ON p.id = pi.pledge_id
    
//         WHERE mt.is_active = 1
    
//         GROUP BY mt.id, mt.name
    
//         ORDER BY mt.name
//         "
//     ).map_err(|e| e.to_string())?;


//     let metal_rows = metal_stmt
//     .query_map(params![report_date], |row| {
//         Ok(MetalMovement {
//             metal: row.get(0)?,
//             in_gross: row.get(1)?,
//             in_net: row.get(2)?,
//             out_gross: row.get(3)?,
//             out_net: row.get(4)?,
//         })
//     })
//     .map_err(|e| e.to_string())?;

// let mut metal_movements = Vec::new();

// for row in metal_rows {
//     metal_movements.push(
//         row.map_err(|e| e.to_string())?
//     );
// }
    

//     Ok(BranchDailyReport {
//         date: report_date,
//         opening_balance,
//         loans_issued,
//         interest_collected,
//         processing_fees,
//         expenses,
//         other_income,
//         closing_balance,
//         net_cash_flow,
//         loan_repayments,
//         total_inflow,
//         total_outflow,

//         metal_in_gross,
//         metal_in_net,
//         metal_out_gross,
//         metal_out_net,

//         total_pockets,
//     active_pockets,
//     closed_pockets,

//     metal_movements,
    
//     })
// }

// #[tauri::command]
// pub fn get_branch_daily_report_cmd(
//     db: tauri::State<Db>,
//     report_date: Option<String>,
// ) -> Result<BranchDailyReport, String> {
//     let date = report_date.unwrap_or_else(|| {
//         Local::now().format("%Y-%m-%d").to_string()
//     });

//     get_branch_daily_report(db.inner(), date)
// }


// // Get detailed transactions for audit trail
// #[tauri::command]
// pub fn get_transaction_details_cmd(
//     db: tauri::State<Db>,
//     report_date: String,
// ) -> Result<Vec<DetailedTransaction>, String> {
//     let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

//     let mut stmt = conn
//         .prepare(
//             "
//             SELECT id, created_at, module_type, type, total_amount, reference,description
//             FROM fund_transactions
//             WHERE DATE(created_at) = ?1
//             ORDER BY created_at ASC
//             "
//         )
//         .map_err(|e| format!("Error preparing statement: {}", e))?;

//     let transactions = stmt
//         .query_map(params![report_date], |row| {
//             Ok(DetailedTransaction {
//                 id: row.get(0)?,
//                 transaction_date: row.get(1)?,
//                 module_type: row.get(2)?,
//                 transaction_type: row.get(3)?,
//                 amount: row.get(4)?,
//                 reference: row.get(5)?,
//                 description: row.get(6)?,
//             })
//         })
//         .map_err(|e| format!("Error querying transactions: {}", e))?
//         .collect::<Result<Vec<_>, _>>()
//         .map_err(|e| format!("Error collecting transactions: {}", e))?;

//     Ok(transactions)
// }







// src-tauri/src/reports/branch_daily.rs

use crate::db::connection::Db;
use chrono::Local;
use rusqlite::params;

#[derive(serde::Serialize, Clone)]
pub struct BranchDailyReport {
    pub date: String,
    pub opening_balance: f64,
    pub loans_issued: f64,
    pub interest_collected: f64,
    pub processing_fees: f64,
    pub expenses: f64,
    pub other_income: f64,
    pub closing_balance: f64,
    pub net_cash_flow: f64,
    pub loan_repayments: f64, 
    pub total_inflow: f64,
    pub total_outflow: f64,

    pub total_pockets: i64,
    pub active_pockets: i64,
    pub closed_pockets: i64,

    pub metal_movements: Vec<MetalMovement>,

    // Investor & Bank Refinancing Metrics
    pub investor_investments: f64,
    pub investor_withdrawals: f64,
    pub investor_interest_paid: f64,
    pub bank_refinance_inflow: f64,
    pub bank_refinance_outflow: f64,
}

#[derive(serde::Serialize)]
pub struct DetailedTransaction {
    pub id: i64,
    pub transaction_date: String,
    pub module_type: String,
    pub transaction_type: String,
    pub amount: f64,
    pub reference: Option<String>,
    pub description: Option<String>,
}

#[derive(serde::Serialize, Clone)]
pub struct MetalMovement {
    pub metal: String,
    pub in_gross: f64,
    pub in_net: f64,
    pub out_gross: f64,
    pub out_net: f64,
    pub to_bank_gross: f64,     // ✅ Itemized Store -> Bank Locker Gross
    pub to_bank_net: f64,       // ✅ Itemized Store -> Bank Locker Net
    pub from_bank_gross: f64,   // ✅ Itemized Bank -> Store Locker Gross
    pub from_bank_net: f64,     // ✅ Itemized Bank -> Store Locker Net
}

pub fn get_branch_daily_report(
    db: &Db,
    report_date: String,
) -> Result<BranchDailyReport, String> {
    let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 1. Opening Balance - Sum of all transactions BEFORE report date
    let opening_balance: f64 = conn
        .query_row(
            "
            SELECT COALESCE(SUM(
                CASE 
                    WHEN type='ADD' THEN total_amount
                    WHEN type='WITHDRAW' THEN -total_amount
                    ELSE 0
                END
            ), 0.0)
            FROM fund_transactions
            WHERE DATE(created_at) < ?1
            ",
            params![report_date],
            |row| row.get(0),
        )
        .map_err(|e| format!("Error fetching opening balance: {}", e))?;

    // 2. Loans Issued (Cash Out)
    let loans_issued: f64 = conn
        .query_row(
            "
            SELECT COALESCE(SUM(total_amount), 0.0)
            FROM fund_transactions
            WHERE module_type = 'PLEDGE'
            AND type = 'WITHDRAW'
            AND DATE(created_at) = ?1
            ",
            params![report_date],
            |row| row.get(0),
        )
        .map_err(|e| format!("Error fetching loans issued: {}", e))?;

    // 3. Loan Repayments (Principal returned - Cash In)
    let loan_repayments: f64 = conn
        .query_row(
            "
            SELECT COALESCE(SUM(total_amount), 0.0)
            FROM fund_transactions
            WHERE module_type = 'PLEDGE'
            AND type = 'ADD'
            AND DATE(created_at) = ?1
            ",
            params![report_date],
            |row| row.get(0),
        )
        .map_err(|e| format!("Error fetching loan repayments: {}", e))?;

    // 4. Interest Collected (Cash In)
    let interest_collected: f64 = conn
        .query_row(
            "
            SELECT COALESCE(SUM(total_amount), 0.0)
            FROM fund_transactions
            WHERE module_type = 'INTEREST'
            AND type = 'ADD'
            AND DATE(created_at) = ?1
            ",
            params![report_date],
            |row| row.get(0),
        )
        .map_err(|e| format!("Error fetching interest: {}", e))?;

    // 5. Operating Expenses
    let target_date = report_date.clone();

    let expenses: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0.0) FROM expenses WHERE date(expense_date) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0.0);

    // 6. Other Income (Penalties, etc.)
    let other_income: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type IN ('PENALTY', 'OTHER_INCOME') AND type = 'ADD' AND date(created_at) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0.0);

    // 7. Processing Fees
    let processing_fees: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'FEE' AND type = 'ADD' AND date(created_at) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0.0);

    // 8. Closure Collections
    let closure_collections: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'CLOSURE' AND type = 'ADD' AND date(created_at) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0.0);

    /* -------------------------------------------------------------------------
       BANK REFINANCING FLOWS
    --------------------------------------------------------------------------*/
    let bank_refinance_inflow: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'BANK_MAPPING' AND type = 'ADD' AND date(created_at) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0.0);

    let bank_refinance_outflow: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'BANK_MAPPING' AND type = 'WITHDRAW' AND date(created_at) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0.0);

    let bank_refinance_surplus = bank_refinance_inflow - bank_refinance_outflow;

    /* -------------------------------------------------------------------------
       INVESTOR CAPITAL FLOWS
    --------------------------------------------------------------------------*/
    let investor_investments: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(ft.total_amount), 0.0)
             FROM investor_transactions it
             JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
             WHERE it.transaction_type = 'INVESTMENT' AND DATE(ft.created_at) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0.0);

    let investor_withdrawals: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(ft.total_amount), 0.0)
             FROM investor_transactions it
             JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
             WHERE it.transaction_type = 'WITHDRAWAL' AND DATE(ft.created_at) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0.0);

    let investor_interest_paid: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(ft.total_amount), 0.0)
             FROM investor_transactions it
             JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
             WHERE it.transaction_type = 'PROFIT_PAYMENT' AND DATE(ft.created_at) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0.0);

    /* -------------------------------------------------------------------------
       POCKET STATS
    --------------------------------------------------------------------------*/
    let total_pockets: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pledges WHERE pocket_number IS NOT NULL AND DATE(COALESCE(pledge_date, created_at)) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0);

    let closed_pockets: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pledges WHERE status = 'CLOSED' AND DATE(closed_at) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0);

    let active_pockets: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pledges WHERE status = 'ACTIVE' AND DATE(COALESCE(pledge_date, created_at)) = ?1",
            params![target_date], |row| row.get(0),
        ).unwrap_or(0);

    /* -------------------------------------------------------------------------
       RECONCILIATION MATH
    --------------------------------------------------------------------------*/
    let total_inflow = loan_repayments 
        + closure_collections 
        + interest_collected 
        + processing_fees 
        + other_income
        + bank_refinance_inflow
        + investor_investments; 

    let total_outflow = loans_issued 
        + expenses
        + bank_refinance_outflow
        + investor_withdrawals; 

    let net_cash_flow = total_inflow - total_outflow;
    let closing_balance = opening_balance + net_cash_flow;

    /* -------------------------------------------------------------------------
       VAULT METALS REPORT (Categorized dynamically per metal)
    --------------------------------------------------------------------------*/
    let mut metal_stmt = conn.prepare(
        "
        SELECT
            mt.name,
            
            -- 1. Inward Customer Pledges Gross & Net Wt
            COALESCE((
                SELECT SUM(pi.gross_weight)
                FROM pledge_items pi
                JOIN pledges p ON p.id = pi.pledge_id
                JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
                WHERE jt.metal_type_id = mt.id
                  AND DATE(COALESCE(p.pledge_date, p.created_at)) = ?1
            ), 0.0),
            COALESCE((
                SELECT SUM(pi.net_weight)
                FROM pledge_items pi
                JOIN pledges p ON p.id = pi.pledge_id
                JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
                WHERE jt.metal_type_id = mt.id
                  AND DATE(COALESCE(p.pledge_date, p.created_at)) = ?1
            ), 0.0),

            -- 2. Outward Customer Releases (Closures) Gross & Net Wt
            COALESCE((
                SELECT SUM(pi.gross_weight)
                FROM pledge_items pi
                JOIN pledges p ON p.id = pi.pledge_id
                JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
                WHERE jt.metal_type_id = mt.id
                  AND p.status = 'CLOSED'
                  AND DATE(p.closed_at) = ?1
            ), 0.0),
            COALESCE((
                SELECT SUM(pi.net_weight)
                FROM pledge_items pi
                JOIN pledges p ON p.id = pi.pledge_id
                JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
                WHERE jt.metal_type_id = mt.id
                  AND p.status = 'CLOSED'
                  AND DATE(p.closed_at) = ?1
            ), 0.0),

            -- 3. Store to Bank Locker Transfers Gross & Net Wt
            COALESCE((
                SELECT SUM(pi.gross_weight)
                FROM bank_mappings bm
                JOIN pledge_items pi ON pi.pledge_id = bm.pledge_id
                JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
                WHERE jt.metal_type_id = mt.id
                  AND DATE(bm.mapped_date) = ?1
            ), 0.0),
            COALESCE((
                SELECT SUM(pi.net_weight)
                FROM bank_mappings bm
                JOIN pledge_items pi ON pi.pledge_id = bm.pledge_id
                JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
                WHERE jt.metal_type_id = mt.id
                  AND DATE(bm.mapped_date) = ?1
            ), 0.0),

            -- 4. Bank Locker back to Store Transfers Gross & Net Wt
            COALESCE((
                SELECT SUM(pi.gross_weight)
                FROM fund_transactions ft
                JOIN bank_mappings bm ON bm.id = ft.module_id AND ft.module_type = 'BANK_MAPPING' AND ft.type = 'WITHDRAW'
                JOIN pledge_items pi ON pi.pledge_id = bm.pledge_id
                JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
                WHERE jt.metal_type_id = mt.id
                  AND DATE(ft.created_at) = ?1
            ), 0.0),
            COALESCE((
                SELECT SUM(pi.net_weight)
                FROM fund_transactions ft
                JOIN bank_mappings bm ON bm.id = ft.module_id AND ft.module_type = 'BANK_MAPPING' AND ft.type = 'WITHDRAW'
                JOIN pledge_items pi ON pi.pledge_id = bm.pledge_id
                JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
                WHERE jt.metal_type_id = mt.id
                  AND DATE(ft.created_at) = ?1
            ), 0.0)

        FROM metal_types mt
        WHERE mt.is_active = 1
        ORDER BY mt.name
        "
    ).map_err(|e| e.to_string())?;

    let metal_rows = metal_stmt
        .query_map(params![target_date], |row| {
            Ok(MetalMovement {
                metal: row.get(0)?,
                in_gross: row.get(1)?,
                in_net: row.get(2)?,
                out_gross: row.get(3)?,
                out_net: row.get(4)?,
                to_bank_gross: row.get(5)?,
                to_bank_net: row.get(6)?,
                from_bank_gross: row.get(7)?,
                from_bank_net: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut metal_movements = Vec::new();
    for row in metal_rows {
        metal_movements.push(row.map_err(|e| e.to_string())?);
    }

    Ok(BranchDailyReport {
        date: target_date,
        opening_balance,
        loans_issued,
        interest_collected,
        processing_fees,
        expenses,
        other_income,
        closing_balance,
        net_cash_flow,
        loan_repayments,
        total_inflow,
        total_outflow,

        total_pockets,
        active_pockets,
        closed_pockets,

        metal_movements,

        investor_investments,
        investor_withdrawals,
        investor_interest_paid,
        bank_refinance_inflow,
        bank_refinance_outflow,
    })
}

#[tauri::command]
pub fn get_branch_daily_report_cmd(
    db: tauri::State<Db>,
    report_date: Option<String>,
) -> Result<BranchDailyReport, String> {
    let date = report_date.unwrap_or_else(|| {
        Local::now().format("%Y-%m-%d").to_string()
    });
    get_branch_daily_report(db.inner(), date)
}

// Get detailed transactions for audit trail
#[tauri::command]
pub fn get_transaction_details_cmd(
    db: tauri::State<Db>,
    report_date: String,
) -> Result<Vec<DetailedTransaction>, String> {
    let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

    let mut stmt = conn
        .prepare(
            "
            SELECT id, created_at, module_type, type, total_amount, reference, description
            FROM fund_transactions
            WHERE DATE(created_at) = ?1
            ORDER BY created_at ASC
            "
        )
        .map_err(|e| format!("Error preparing statement: {}", e))?;

    let transactions = stmt
        .query_map(params![report_date], |row| {
            Ok(DetailedTransaction {
                id: row.get(0)?,
                transaction_date: row.get(1)?,
                module_type: row.get(2)?,
                transaction_type: row.get(3)?,
                amount: row.get(4)?,
                reference: row.get(5)?,
                description: row.get(6)?,
            })
        })
        .map_err(|e| format!("Error querying transactions: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Error collecting transactions: {}", e))?;

    Ok(transactions)
}