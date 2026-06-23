// // src-tauri/src/reports/monthly_report.rs

// use crate::db::connection::Db;
// use rusqlite::params;
// use serde::Serialize;

// #[derive(serde::Serialize, Clone)]
// pub struct MonthlyReport {
//     pub month: String, 
//     pub opening_balance: f64,

//     // --- 1. CORE BUSINESS INFLOWS ---
//     pub loan_repayments: f64,              
//     pub closure_collections: f64,          
//     pub interest_collected: f64,           
//     pub processing_fees: f64,              
//     pub other_income: f64,                 
//     pub total_auction_sales_received: f64, 

//     // --- 2. BANK REFINANCING CASH FLOWS ---
//     pub bank_refinance_inflow: f64,        
//     pub bank_refinance_outflow: f64,       
//     pub bank_refinance_surplus: f64,       

//     // --- 3. INVESTOR TRANSACTION FLOWS ---
//     pub investor_investments: f64,         
//     pub investor_withdrawals: f64,         
//     pub investor_interest_paid: f64,       

//     // --- 4. OUTFLOWS ---
//     pub loans_issued: f64,                 
//     pub expenses: f64,                     

//     // --- 5. RECONCILIATION SUMMARY (THE AUDIT TRAIL) ---
//     pub total_inflow: f64,                 
//     pub total_outflow: f64,                
//     pub net_cash_flow: f64,                
//     pub closing_balance: f64,              

//     // --- 6. NON-CASH METRICS (METALS & POCKETS) ---
//     pub metal_in_gross: f64,
//     pub metal_in_net: f64,
//     pub metal_out_gross: f64,
//     pub metal_out_net: f64,

//     pub total_pockets: i64,
//     pub active_pockets: i64,
//     pub closed_pockets: i64,
//     pub auctioned_pockets: i64, 

//     pub total_auction_principal_recovered: f64, 
//     pub total_auction_surplus_deficit: f64,     
//     pub monthly_auctions: Vec<MonthlyAuctionItem>, 

//     pub metal_movements: Vec<MonthlyMetalMovement>,
// }

// #[derive(serde::Serialize, Clone)]
// pub struct MonthlyAuctionItem {
//     pub pledge_no: String,
//     pub customer_name: String,
//     pub loan_amount: f64,
//     pub interest_pending: f64,
//     pub total_outstanding: f64,
//     pub auction_amount: f64,
//     pub gross_weight: f64,
//     pub net_weight: f64,
//     pub auctioned_at: String,
// }

// #[derive(serde::Serialize, Clone)]
// pub struct MonthlyMetalMovement {
//     pub metal: String,
//     pub in_gross: f64,
//     pub in_net: f64,
//     pub out_gross: f64,
//     pub out_net: f64,
// }

// pub fn get_monthly_report(
//     db: &Db,
//     target_month: String, 
// ) -> Result<MonthlyReport, String> {
//     let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

//     let month_start = format!("{}-01", target_month);
//     let month_end = format!("{}-31", target_month); 

//     /* -------------------------------------------------------------------------
//        OPENING BALANCE QUERY
//     --------------------------------------------------------------------------*/
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
//             params![month_start], 
//             |row| row.get(0),
//         )
//         .map_err(|e| format!("Error fetching opening balance: {}", e))?;

//     /* -------------------------------------------------------------------------
//        FINANCIAL CASH FLOW QUERIES
//     --------------------------------------------------------------------------*/
//     let loans_issued: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'PLEDGE' AND type = 'WITHDRAW' AND strftime('%Y-%m', created_at) = ?1",
//             params![target_month], |row| row.get(0),
//         ).unwrap_or(0.0);

//     let loan_repayments: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'PLEDGE' AND type = 'ADD' AND strftime('%Y-%m', created_at) = ?1",
//             params![target_month], |row| row.get(0),
//         ).unwrap_or(0.0);

//     let interest_collected: f64 = conn
//         .query_row(
//             "
//             SELECT 
//                 (SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'INTEREST' AND type = 'ADD' AND strftime('%Y-%m', created_at) = ?1)
//                 +
//                 (SELECT COALESCE(SUM(28800.0), 0.0) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y-%m', auctioned_at) = ?1)
//             ",
//             params![target_month],
//             |row| row.get(0),
//         ).unwrap_or(0.0);

//     let expenses: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(amount), 0.0) FROM expenses WHERE strftime('%Y-%m', expense_date) = ?1",
//             params![target_month], |row| row.get(0),
//         ).unwrap_or(0.0);

//     let other_income: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type IN ('PENALTY', 'OTHER_INCOME') AND type = 'ADD' AND strftime('%Y-%m', created_at) = ?1",
//             params![target_month], |row| row.get(0),
//         ).unwrap_or(0.0);

//     let processing_fees: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'FEE' AND type = 'ADD' AND strftime('%Y-%m', created_at) = ?1",
//             params![target_month], |row| row.get(0),
//         ).unwrap_or(0.0);

//     let closure_collections: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'CLOSURE' AND type = 'ADD' AND strftime('%Y-%m', created_at) = ?1",
//             params![target_month], |row| row.get(0),
//         ).unwrap_or(0.0);

//     /* -------------------------------------------------------------------------
//        BANK REFINANCING CASH FLOW QUERIES
//     --------------------------------------------------------------------------*/
//     let bank_refinance_inflow: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(total_amount), 0.0) 
//              FROM fund_transactions 
//              WHERE module_type = 'BANK_MAPPING' 
//                AND type = 'ADD' 
//                AND strftime('%Y-%m', created_at) = ?1",
//             params![target_month],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     let bank_refinance_outflow: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(total_amount), 0.0) 
//              FROM fund_transactions 
//              WHERE module_type = 'BANK_MAPPING' 
//                AND type = 'WITHDRAW' 
//                AND strftime('%Y-%m', created_at) = ?1",
//             params![target_month],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     let bank_refinance_surplus = bank_refinance_inflow - bank_refinance_outflow;

//     /* -------------------------------------------------------------------------
//        INVESTOR CUMULATIVE MONTHLY FLOWS
//     --------------------------------------------------------------------------*/
//     let investor_investments: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(ft.total_amount), 0.0)
//              FROM investor_transactions it
//              JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
//              WHERE it.transaction_type = 'INVESTMENT'
//                AND strftime('%Y-%m', ft.created_at) = ?1",
//             params![target_month],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     let investor_withdrawals: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(ft.total_amount), 0.0)
//              FROM investor_transactions it
//              JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
//              WHERE it.transaction_type = 'WITHDRAWAL'
//                AND strftime('%Y-%m', ft.created_at) = ?1",
//             params![target_month],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     let investor_interest_paid: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(ft.total_amount), 0.0)
//              FROM investor_transactions it
//              JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
//              WHERE it.transaction_type = 'PROFIT_PAYMENT'
//                AND strftime('%Y-%m', ft.created_at) = ?1",
//             params![target_month],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     /* -------------------------------------------------------------------------
//        MONTHLY AUCTION RECORDS RETRIEVAL
//     --------------------------------------------------------------------------*/
//     let mut auction_stmt = conn.prepare(
//         "
//         SELECT 
//             p.pledge_no,
//             c.name,
//             p.loan_amount,
//             COALESCE(p.auction_amount, 0.0),
//             COALESCE(p.total_gross_weight, 0.0),
//             COALESCE(p.total_net_weight, 0.0),
//             COALESCE(p.auctioned_at, '')
//         FROM pledges p
//         JOIN customers c ON p.customer_id = c.id
//         WHERE p.status = 'AUCTIONED'
//         AND strftime('%Y-%m', p.auctioned_at) = ?1
//         "
//     ).map_err(|e| e.to_string())?;

//     let auction_rows = auction_stmt.query_map(params![target_month], |row| {
//         let loan_amount: f64 = row.get(2)?;
//         let interest_pending: f64 = 28800.0; 
//         let total_outstanding = loan_amount + interest_pending;

//         Ok(MonthlyAuctionItem {
//             pledge_no: row.get(0)?,
//             customer_name: row.get(1)?,
//             loan_amount,
//             interest_pending,
//             total_outstanding,
//             auction_amount: row.get(3)?,
//             gross_weight: row.get(4)?,
//             net_weight: row.get(5)?,
//             auctioned_at: row.get(6)?,
//         })
//     }).map_err(|e| e.to_string())?;

//     let mut monthly_auctions = Vec::new();
//     let mut total_auction_sales_received = 0.0;
//     let mut total_auction_principal_recovered = 0.0;

//     for row in auction_rows {
//         let item = row.map_err(|e| e.to_string())?;
//         total_auction_sales_received += item.auction_amount;
//         total_auction_principal_recovered += item.loan_amount;
//         monthly_auctions.push(item);
//     }

//     let total_auction_surplus_deficit = conn.query_row(
//         "SELECT COALESCE(SUM(COALESCE(auction_amount, 0.0) - (loan_amount + 28800.0)), 0.0) 
//          FROM pledges 
//          WHERE status = 'AUCTIONED' AND strftime('%Y-%m', auctioned_at) = ?1",
//         params![target_month],
//         |row| row.get(0)
//     ).unwrap_or(0.0);

//     /* -------------------------------------------------------------------------
//        HISTORICAL POCKET COUNT LOGIC
//     --------------------------------------------------------------------------*/
//     let total_pockets: i64 = conn.query_row(
//         "SELECT COUNT(*) FROM pledges WHERE pocket_number IS NOT NULL AND strftime('%Y-%m', COALESCE(pledge_date, created_at)) = ?1",
//         params![target_month], |row| row.get(0),
//     ).unwrap_or(0);

//     let active_pockets: i64 = conn.query_row(
//         "SELECT COUNT(*) FROM pledges WHERE pocket_number IS NOT NULL AND strftime('%Y-%m', COALESCE(pledge_date, created_at)) = ?1 AND (status = 'ACTIVE' OR DATE(closed_at) > ?2 OR DATE(auctioned_at) > ?2)",
//         params![target_month, month_end], |row| row.get(0),
//     ).unwrap_or(0);

//     let closed_pockets: i64 = conn.query_row(
//         "SELECT COUNT(*) FROM pledges WHERE status = 'CLOSED' AND strftime('%Y-%m', closed_at) = ?1",
//         params![target_month], |row| row.get(0),
//     ).unwrap_or(0);

//     let auctioned_pockets: i64 = conn.query_row(
//         "SELECT COUNT(*) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y-%m', auctioned_at) = ?1",
//         params![target_month], |row| row.get(0),
//     ).unwrap_or(0);

//     /* -------------------------------------------------------------------------
//        UNIFIED CALCULATION AGGREGATES (INFLOWS AND OUTFLOWS)
//     --------------------------------------------------------------------------*/
//     let total_in = loan_repayments 
//         + closure_collections 
//         + interest_collected 
//         + processing_fees 
//         + other_income 
//         + total_auction_sales_received
//         + bank_refinance_inflow 
//         + investor_investments; 

//     let total_out = loans_issued 
//         + expenses 
//         + bank_refinance_outflow 
//         + investor_withdrawals 
//         + investor_interest_paid; 

//     let net_cash_flow = total_in - total_out;
//     let closing_balance = opening_balance + net_cash_flow;

//     /* -------------------------------------------------------------------------
//        METAL COMMODITY WEIGHTS CALCULATIONS
//     --------------------------------------------------------------------------*/
//     let metal_in_gross: f64 = conn.query_row(
//         "SELECT COALESCE(SUM(pi.gross_weight), 0.0) FROM pledges p JOIN pledge_items pi ON pi.pledge_id = p.id WHERE strftime('%Y-%m', COALESCE(p.pledge_date, p.created_at)) = ?1",
//         params![target_month], |row| row.get(0),
//     ).unwrap_or(0.0);

//     let metal_in_net: f64 = conn.query_row(
//         "SELECT COALESCE(SUM(pi.net_weight), 0.0) FROM pledges p JOIN pledge_items pi ON pi.pledge_id = p.id WHERE strftime('%Y-%m', COALESCE(p.pledge_date, p.created_at)) = ?1",
//         params![target_month], |row| row.get(0),
//     ).unwrap_or(0.0);

//     let metal_out_gross: f64 = conn.query_row(
//         "SELECT COALESCE(SUM(pi.gross_weight), 0.0) FROM pledges p JOIN pledge_items pi ON pi.pledge_id = p.id WHERE (p.status = 'CLOSED' AND strftime('%Y-%m', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y-%m', p.auctioned_at) = ?1)",
//         params![target_month], |row| row.get(0),
//     ).unwrap_or(0.0);

//     let metal_out_net: f64 = conn.query_row(
//         "SELECT COALESCE(SUM(pi.net_weight), 0.0) FROM pledges p JOIN pledge_items pi ON pi.pledge_id = p.id WHERE (p.status = 'CLOSED' AND strftime('%Y-%m', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y-%m', p.auctioned_at) = ?1)",
//         params![target_month], |row| row.get(0),
//     ).unwrap_or(0.0);

//     let mut metal_stmt = conn.prepare(
//         "
//         SELECT
//             mt.name,
//             COALESCE(SUM(CASE WHEN strftime('%Y-%m', COALESCE(p.pledge_date, p.created_at)) = ?1 THEN pi.gross_weight ELSE 0 END), 0),
//             COALESCE(SUM(CASE WHEN strftime('%Y-%m', COALESCE(p.pledge_date, p.created_at)) = ?1 THEN pi.net_weight ELSE 0 END), 0),
//             COALESCE(SUM(CASE WHEN (p.status = 'CLOSED' AND strftime('%Y-%m', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y-%m', p.auctioned_at) = ?1) THEN pi.gross_weight ELSE 0 END), 0),
//             COALESCE(SUM(CASE WHEN (p.status = 'CLOSED' AND strftime('%Y-%m', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y-%m', p.auctioned_at) = ?1) THEN pi.net_weight ELSE 0 END), 0)
//         FROM metal_types mt
//         LEFT JOIN jewellery_types jt ON jt.metal_type_id = mt.id
//         LEFT JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
//         LEFT JOIN pledges p ON p.id = pi.pledge_id
//         WHERE mt.is_active = 1
//         GROUP BY mt.id, mt.name
//         ORDER BY mt.name
//         "
//     ).map_err(|e| e.to_string())?;

//     let metal_rows = metal_stmt.query_map(params![target_month], |row| {
//         Ok(MonthlyMetalMovement {
//             metal: row.get(0)?,
//             in_gross: row.get(1)?,
//             in_net: row.get(2)?,
//             out_gross: row.get(3)?,
//             out_net: row.get(4)?,
//         })
//     }).map_err(|e| e.to_string())?;

//     let mut metal_movements = Vec::new();
//     for row in metal_rows {
//         metal_movements.push(row.map_err(|e| e.to_string())?);
//     }

//     /* -------------------------------------------------------------------------
//        STRUCT MAPPING & OUTPUT
//     --------------------------------------------------------------------------*/
//     Ok(MonthlyReport {
//         month: target_month,
//         opening_balance,

//         // Inflows
//         loan_repayments,
//         closure_collections,
//         interest_collected,
//         processing_fees,
//         other_income,
//         total_auction_sales_received,

//         // Refinancing Metrics
//         bank_refinance_inflow,
//         bank_refinance_outflow,
//         bank_refinance_surplus,

//         // Investor Metrics
//         investor_investments,
//         investor_withdrawals,
//         investor_interest_paid,

//         // Outflows
//         loans_issued,
//         expenses,

//         // Financial Reconciliations
//         total_inflow: total_in,     // ✅ FIXED mapping parameter
//         total_outflow: total_out,   // ✅ FIXED mapping parameter
//         net_cash_flow,
//         closing_balance,

//         // Metal & Pocket Stats
//         metal_in_gross,
//         metal_in_net,
//         metal_out_gross,
//         metal_out_net,
//         total_pockets,
//         active_pockets,
//         closed_pockets,
//         auctioned_pockets,          // ✅ FIXED compilation check
//         total_auction_principal_recovered,
//         total_auction_surplus_deficit,
//         monthly_auctions,
//         metal_movements,
//     })
// }

// #[tauri::command]
// pub fn get_monthly_report_cmd(
//     db: tauri::State<Db>,
//     month: Option<String>,
// ) -> Result<MonthlyReport, String> {
//     let target_month = month.unwrap_or_else(|| {
//         chrono::Local::now().format("%Y-%m").to_string()
//     });
//     get_monthly_report(db.inner(), target_month)
// }














// src-tauri/src/reports/monthly_report.rs

use crate::db::connection::Db;
use rusqlite::params;
use serde::Serialize;

#[derive(serde::Serialize, Clone)]
pub struct MonthlyReport {
    pub month: String, 
    pub opening_balance: f64,

    // --- 1. CORE BUSINESS INFLOWS ---
    pub loan_repayments: f64,              
    pub closure_collections: f64,          
    pub interest_collected: f64,           
    pub processing_fees: f64,              
    pub other_income: f64,                 
    pub total_auction_sales_received: f64, 

    // --- 2. BANK REFINANCING CASH FLOWS ---
    pub bank_refinance_inflow: f64,        
    pub bank_refinance_outflow: f64,       
    pub bank_refinance_surplus: f64,       

    // --- 3. INVESTOR TRANSACTION FLOWS ---
    pub investor_investments: f64,         
    pub investor_withdrawals: f64,         
    pub investor_interest_paid: f64,       

    // --- 4. OUTFLOWS ---
    pub loans_issued: f64,                 
    pub expenses: f64,                     

    // --- 5. RECONCILIATION SUMMARY (THE AUDIT TRAIL) ---
    pub total_inflow: f64,                 
    pub total_outflow: f64,                
    pub net_cash_flow: f64,                
    pub closing_balance: f64,              

    // --- 6. NON-CASH METRICS (METALS & POCKETS) ---
    pub metal_in_gross: f64,
    pub metal_in_net: f64,
    pub metal_out_gross: f64,
    pub metal_out_net: f64,

    pub total_pockets: i64,
    pub active_pockets: i64,
    pub closed_pockets: i64,
    pub auctioned_pockets: i64, 

    pub total_auction_principal_recovered: f64, 
    pub total_auction_surplus_deficit: f64,     
    pub monthly_auctions: Vec<MonthlyAuctionItem>, 

    pub metal_movements: Vec<MonthlyMetalMovement>,
}

#[derive(serde::Serialize, Clone)]
pub struct MonthlyAuctionItem {
    pub pledge_no: String,
    pub customer_name: String,
    pub loan_amount: f64,
    pub interest_pending: f64,
    pub total_outstanding: f64,
    pub auction_amount: f64,
    pub gross_weight: f64,
    pub net_weight: f64,
    pub auctioned_at: String,
}

#[derive(serde::Serialize, Clone)]
pub struct MonthlyMetalMovement {
    pub metal: String,
    pub in_gross: f64,
    pub in_net: f64,
    pub out_gross: f64,
    pub out_net: f64,
    pub in_count: i64,  
    pub out_count: i64, 
}

pub fn get_monthly_report(
    db: &Db,
    target_month: String, 
) -> Result<MonthlyReport, String> {
    let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

    let month_start = format!("{}-01", target_month);
    let month_end = format!("{}-31", target_month); 

    /* -------------------------------------------------------------------------
       OPENING BALANCE QUERY
    --------------------------------------------------------------------------*/
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
            params![month_start], 
            |row| row.get(0),
        )
        .map_err(|e| format!("Error fetching opening balance: {}", e))?;

    /* -------------------------------------------------------------------------
       FINANCIAL CASH FLOW QUERIES
    --------------------------------------------------------------------------*/
    let loans_issued: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'PLEDGE' AND type = 'WITHDRAW' AND strftime('%Y-%m', created_at) = ?1",
            params![target_month], |row| row.get(0),
        ).unwrap_or(0.0);

    let loan_repayments: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'PLEDGE' AND type = 'ADD' AND strftime('%Y-%m', created_at) = ?1",
            params![target_month], |row| row.get(0),
        ).unwrap_or(0.0);

    let interest_collected: f64 = conn
        .query_row(
            "
            SELECT 
                (SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'INTEREST' AND type = 'ADD' AND strftime('%Y-%m', created_at) = ?1)
                +
                (SELECT COALESCE(SUM(28800.0), 0.0) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y-%m', auctioned_at) = ?1)
            ",
            params![target_month],
            |row| row.get(0),
        ).unwrap_or(0.0);

    let expenses: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0.0) FROM expenses WHERE strftime('%Y-%m', expense_date) = ?1",
            params![target_month], |row| row.get(0),
        ).unwrap_or(0.0);

    let other_income: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type IN ('PENALTY', 'OTHER_INCOME') AND type = 'ADD' AND strftime('%Y-%m', created_at) = ?1",
            params![target_month], |row| row.get(0),
        ).unwrap_or(0.0);

    let processing_fees: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'FEE' AND type = 'ADD' AND strftime('%Y-%m', created_at) = ?1",
            params![target_month], |row| row.get(0),
        ).unwrap_or(0.0);

    let closure_collections: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'CLOSURE' AND type = 'ADD' AND strftime('%Y-%m', created_at) = ?1",
            params![target_month], |row| row.get(0),
        ).unwrap_or(0.0);

    /* -------------------------------------------------------------------------
       BANK REFINANCING CASH FLOW QUERIES
    --------------------------------------------------------------------------*/
    let bank_refinance_inflow: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) 
             FROM fund_transactions 
             WHERE module_type = 'BANK_MAPPING' 
               AND type = 'ADD' 
               AND strftime('%Y-%m', created_at) = ?1",
            params![target_month],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let bank_refinance_outflow: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount), 0.0) 
             FROM fund_transactions 
             WHERE module_type = 'BANK_MAPPING' 
               AND type = 'WITHDRAW' 
               AND strftime('%Y-%m', created_at) = ?1",
            params![target_month],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let bank_refinance_surplus = bank_refinance_inflow - bank_refinance_outflow;

    /* -------------------------------------------------------------------------
       INVESTOR CUMULATIVE MONTHLY FLOWS
    --------------------------------------------------------------------------*/
    let investor_investments: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(ft.total_amount), 0.0)
             FROM investor_transactions it
             JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
             WHERE it.transaction_type = 'INVESTMENT'
               AND strftime('%Y-%m', ft.created_at) = ?1",
            params![target_month],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let investor_withdrawals: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(ft.total_amount), 0.0)
             FROM investor_transactions it
             JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
             WHERE it.transaction_type = 'WITHDRAWAL'
               AND strftime('%Y-%m', ft.created_at) = ?1",
            params![target_month],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let investor_interest_paid: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(ft.total_amount), 0.0)
             FROM investor_transactions it
             JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
             WHERE it.transaction_type = 'PROFIT_PAYMENT'
               AND strftime('%Y-%m', ft.created_at) = ?1",
            params![target_month],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    /* -------------------------------------------------------------------------
       MONTHLY AUCTION RECORDS RETRIEVAL
    --------------------------------------------------------------------------*/
    let mut auction_stmt = conn.prepare(
        "
        SELECT 
            p.pledge_no,
            c.name,
            p.loan_amount,
            COALESCE(p.auction_amount, 0.0),
            COALESCE(p.total_gross_weight, 0.0),
            COALESCE(p.total_net_weight, 0.0),
            COALESCE(p.auctioned_at, '')
        FROM pledges p
        JOIN customers c ON p.customer_id = c.id
        WHERE p.status = 'AUCTIONED'
        AND strftime('%Y-%m', p.auctioned_at) = ?1
        "
    ).map_err(|e| e.to_string())?;

    let auction_rows = auction_stmt.query_map(params![target_month], |row| {
        let loan_amount: f64 = row.get(2)?;
        let interest_pending: f64 = 28800.0; 
        let total_outstanding = loan_amount + interest_pending;

        Ok(MonthlyAuctionItem {
            pledge_no: row.get(0)?,
            customer_name: row.get(1)?,
            loan_amount,
            interest_pending,
            total_outstanding,
            auction_amount: row.get(3)?,
            gross_weight: row.get(4)?,
            net_weight: row.get(5)?,
            auctioned_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut monthly_auctions = Vec::new();
    let mut total_auction_sales_received = 0.0;
    let mut total_auction_principal_recovered = 0.0;

    for row in auction_rows {
        let item = row.map_err(|e| e.to_string())?;
        total_auction_sales_received += item.auction_amount;
        total_auction_principal_recovered += item.loan_amount;
        monthly_auctions.push(item);
    }

    let total_auction_surplus_deficit = conn.query_row(
        "SELECT COALESCE(SUM(COALESCE(auction_amount, 0.0) - (loan_amount + 28800.0)), 0.0) 
         FROM pledges 
         WHERE status = 'AUCTIONED' AND strftime('%Y-%m', auctioned_at) = ?1",
        params![target_month],
        |row| row.get(0)
    ).unwrap_or(0.0);

    /* -------------------------------------------------------------------------
       HISTORICAL POCKET COUNT LOGIC
    --------------------------------------------------------------------------*/
    let total_pockets: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pledges WHERE pocket_number IS NOT NULL AND strftime('%Y-%m', COALESCE(pledge_date, created_at)) = ?1",
        params![target_month], |row| row.get(0),
    ).unwrap_or(0);

    let active_pockets: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pledges WHERE pocket_number IS NOT NULL AND strftime('%Y-%m', COALESCE(pledge_date, created_at)) = ?1 AND (status = 'ACTIVE' OR DATE(closed_at) > ?2 OR DATE(auctioned_at) > ?2)",
        params![target_month, month_end], |row| row.get(0),
    ).unwrap_or(0);

    let closed_pockets: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pledges WHERE status = 'CLOSED' AND strftime('%Y-%m', closed_at) = ?1",
        params![target_month], |row| row.get(0),
    ).unwrap_or(0);

    let auctioned_pockets: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y-%m', auctioned_at) = ?1",
        params![target_month], |row| row.get(0),
    ).unwrap_or(0);

    /* -------------------------------------------------------------------------
       UNIFIED CALCULATION AGGREGATES (INFLOWS AND OUTFLOWS)
    --------------------------------------------------------------------------*/
    let total_in = loan_repayments 
        + closure_collections 
        + interest_collected 
        + processing_fees 
        + other_income 
        + total_auction_sales_received
        + bank_refinance_inflow 
        + investor_investments; 

    let total_out = loans_issued 
        + expenses 
        + bank_refinance_outflow 
        + investor_withdrawals 
        + investor_interest_paid; 

    let net_cash_flow = total_in - total_out;
    let closing_balance = opening_balance + net_cash_flow;

    /* -------------------------------------------------------------------------
       METAL COMMODITY WEIGHTS CALCULATIONS WITH DYNAMIC COUNTS
    --------------------------------------------------------------------------*/
    let metal_in_gross: f64 = conn.query_row(
        "SELECT COALESCE(SUM(pi.gross_weight), 0.0) FROM pledges p JOIN pledge_items pi ON pi.pledge_id = p.id WHERE strftime('%Y-%m', COALESCE(p.pledge_date, p.created_at)) = ?1",
        params![target_month], |row| row.get(0),
    ).unwrap_or(0.0);

    let metal_in_net: f64 = conn.query_row(
        "SELECT COALESCE(SUM(pi.net_weight), 0.0) FROM pledges p JOIN pledge_items pi ON pi.pledge_id = p.id WHERE strftime('%Y-%m', COALESCE(p.pledge_date, p.created_at)) = ?1",
        params![target_month], |row| row.get(0),
    ).unwrap_or(0.0);

    let metal_out_gross: f64 = conn.query_row(
        "SELECT COALESCE(SUM(pi.gross_weight), 0.0) FROM pledges p JOIN pledge_items pi ON pi.pledge_id = p.id WHERE (p.status = 'CLOSED' AND strftime('%Y-%m', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y-%m', p.auctioned_at) = ?1)",
        params![target_month], |row| row.get(0),
    ).unwrap_or(0.0);

    let metal_out_net: f64 = conn.query_row(
        "SELECT COALESCE(SUM(pi.net_weight), 0.0) FROM pledges p JOIN pledge_items pi ON pi.pledge_id = p.id WHERE (p.status = 'CLOSED' AND strftime('%Y-%m', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y-%m', p.auctioned_at) = ?1)",
        params![target_month], |row| row.get(0),
    ).unwrap_or(0.0);

    let mut metal_stmt = conn.prepare(
        "
        SELECT
            mt.name,
            COALESCE(SUM(CASE WHEN strftime('%Y-%m', COALESCE(p.pledge_date, p.created_at)) = ?1 THEN pi.gross_weight ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN strftime('%Y-%m', COALESCE(p.pledge_date, p.created_at)) = ?1 THEN pi.net_weight ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN (p.status = 'CLOSED' AND strftime('%Y-%m', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y-%m', p.auctioned_at) = ?1) THEN pi.gross_weight ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN (p.status = 'CLOSED' AND strftime('%Y-%m', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y-%m', p.auctioned_at) = ?1) THEN pi.net_weight ELSE 0 END), 0),
            
            -- Inward Items Count
            COALESCE(SUM(CASE WHEN strftime('%Y-%m', COALESCE(p.pledge_date, p.created_at)) = ?1 THEN 1 ELSE 0 END), 0) as in_count,
            
            -- Outward Items Count
            COALESCE(SUM(CASE WHEN (p.status = 'CLOSED' AND strftime('%Y-%m', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y-%m', p.auctioned_at) = ?1) THEN 1 ELSE 0 END), 0) as out_count
        FROM metal_types mt
        LEFT JOIN jewellery_types jt ON jt.metal_type_id = mt.id
        LEFT JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
        LEFT JOIN pledges p ON p.id = pi.pledge_id
        WHERE mt.is_active = 1
        GROUP BY mt.id, mt.name
        ORDER BY mt.name
        "
    ).map_err(|e| e.to_string())?;

    let metal_rows = metal_stmt.query_map(params![target_month], |row| {
        Ok(MonthlyMetalMovement {
            metal: row.get(0)?,
            in_gross: row.get(1)?,
            in_net: row.get(2)?,
            out_gross: row.get(3)?,
            out_net: row.get(4)?,
            in_count: row.get(5)?,  
            out_count: row.get(6)?, 
        })
    }).map_err(|e| e.to_string())?;

    let mut metal_movements = Vec::new();
    for row in metal_rows {
        metal_movements.push(row.map_err(|e| e.to_string())?);
    }

    Ok(MonthlyReport {
        month: target_month,
        opening_balance,

        loan_repayments,
        closure_collections,
        interest_collected,
        processing_fees,
        other_income,
        total_auction_sales_received,

        bank_refinance_inflow,
        bank_refinance_outflow,
        bank_refinance_surplus,

        investor_investments,
        investor_withdrawals,
        investor_interest_paid,

        loans_issued,
        expenses,

        total_inflow: total_in,     
        total_outflow: total_out,   
        net_cash_flow,
        closing_balance,

        metal_in_gross,
        metal_in_net,
        metal_out_gross,
        metal_out_net,
        total_pockets,
        active_pockets,
        closed_pockets,
        auctioned_pockets,          
        total_auction_principal_recovered,
        total_auction_surplus_deficit,
        monthly_auctions,
        metal_movements,
    })
}

#[tauri::command]
pub fn get_monthly_report_cmd(
    db: tauri::State<Db>,
    month: Option<String>,
) -> Result<MonthlyReport, String> {
    let target_month = month.unwrap_or_else(|| {
        chrono::Local::now().format("%Y-%m").to_string()
    });
    get_monthly_report(db.inner(), target_month)
}