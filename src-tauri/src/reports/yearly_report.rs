//final
// src-tauri/src/reports/yearly_report.rs

// use crate::db::connection::Db;
// use rusqlite::params;
// use serde::Serialize;

// #[derive(serde::Serialize, Clone)]
// pub struct YearlyReportPayload {
//     pub rows: Vec<YearlyReportRow>,
//     pub metals: Vec<YearlyMetalMovementRow>,
//     pub auctions: Vec<YearlyAuctionRow>,
// }

// #[derive(serde::Serialize, Clone)]
// pub struct YearlyReportRow {
//     pub year: String,
//     pub total_pledges: i64,
//     pub active_pockets: i64,    // ── 🟢 Added
//     pub closed_pockets: i64,    // ── 🟢 Added
//     pub auctioned_pockets: i64, // ── 🟢 Added
//     pub total_loan_amount: f64, // Gross Principal (Capital Disbursed)
//     pub loans_issued: f64,       // Net Cash Disbursed (Loans Issued)
//     pub net_loans_issued: f64,
//     pub interest_income: f64,
//     pub processing_fees: f64,
//     pub other_income: f64,
//     pub expenses: f64,
//     pub auction_surplus_deficit: f64,
//     pub bank_refinance_inflow: f64,
//     pub bank_refinance_outflow: f64,
//     pub bank_refinance_surplus: f64,
//     pub investor_investments: f64,
//     pub investor_withdrawals: f64,
//     pub investor_interest_paid: f64,
//     pub opening_balance: f64,
//     pub closing_balance: f64,
//     pub total_inflow: f64,
//     pub total_outflow: f64,
//     pub net_cash_flow: f64,
//     pub loan_repayments: f64,
//     pub closure_collections: f64,
// }

// #[derive(serde::Serialize, Clone)]
// pub struct YearlyMetalMovementRow {
//     pub metal: String,
//     pub pledged_gross_weight: f64,
//     pub pledged_net_weight: f64,
//     pub closed_gross_weight: f64,
//     pub closed_net_weight: f64,
//     pub pledged_count: i64,
//     pub closed_count: i64,
// }

// #[derive(serde::Serialize, Clone)]
// pub struct YearlyAuctionRow {
//     pub year: String,
//     pub total_auctioned_pockets: i64,
//     pub principal_recovered: f64,
//     pub interest_recovered: f64,
//     pub total_outstanding: f64,
//     pub total_auction_sales: f64,
//     pub auction_profit_loss: f64,
// }

// pub fn get_yearly_report(
//     db: &Db,
//     target_year: String, 
// ) -> Result<YearlyReportPayload, String> {
//     let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

//     // 1. Fetch all distinct years with transactions to populate the timeline list
//     let mut years_stmt = conn.prepare(
//         "SELECT DISTINCT strftime('%Y', created_at) as yr 
//          FROM fund_transactions 
//          WHERE created_at IS NOT NULL
//          UNION 
//          SELECT strftime('%Y', 'now')
//          ORDER BY yr DESC"
//     ).map_err(|e| e.to_string())?;

//     let years_rows = years_stmt.query_map([], |row| row.get::<_, String>(0)).map_err(|e| e.to_string())?;
//     let mut years = Vec::new();
//     for yr in years_rows {
//         if let Ok(y) = yr {
//             if !years.contains(&y) {
//                 years.push(y);
//             }
//         }
//     }

//     if years.is_empty() {
//         years.push(chrono::Local::now().format("%Y").to_string());
//     }

//     let mut rows = Vec::new();
//     let mut auctions = Vec::new();

//     for yr in &years {
//         let year_start = format!("{}-01-01", yr);
//         let year_end = format!("{}-12-31", yr); 

//         let opening_balance: f64 = conn
//             .query_row(
//                 "
//                 SELECT COALESCE(SUM(
//                     CASE 
//                         WHEN type='ADD' THEN total_amount
//                         WHEN type='WITHDRAW' THEN -total_amount
//                         ELSE 0
//                     END
//                 ), 0.0)
//                 FROM fund_transactions
//                 WHERE payment_method IN ('CASH', 'UPI', 'BANK') AND DATE(created_at) < ?1
//                 ",
//                 params![year_start], 
//                 |row| row.get(0),
//             )
//             .unwrap_or(0.0);

//         let gross_loans: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'PLEDGE' AND type = 'WITHDRAW' AND strftime('%Y', created_at) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let net_loans_issued: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(total_amount), 0.0) 
//                  FROM fund_transactions 
//                  WHERE module_type = 'PLEDGE' 
//                    AND type = 'WITHDRAW' 
//                    AND payment_method IN ('CASH', 'UPI', 'BANK') 
//                    AND strftime('%Y', created_at) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let loan_repayments: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'PLEDGE' AND type = 'ADD' AND strftime('%Y', created_at) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let interest_collected: f64 = conn
//             .query_row(
//                 "
//                 SELECT 
//                     (SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'INTEREST' AND type = 'ADD' AND strftime('%Y', created_at) = ?1)
//                     +
//                     (SELECT COALESCE(SUM(28800.0), 0.0) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y', auctioned_at) = ?1)
//                 ",
//                 params![yr],
//                 |row| row.get(0),
//             ).unwrap_or(0.0);

//         let expenses: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(amount), 0.0) FROM expenses WHERE strftime('%Y', expense_date) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let other_income: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type IN ('PENALTY', 'OTHER_INCOME') AND type = 'ADD' AND strftime('%Y', created_at) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let processing_fees: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'FEE' AND type = 'ADD' AND strftime('%Y', created_at) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let closure_collections: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'CLOSURE' AND type = 'ADD' AND strftime('%Y', created_at) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let bank_refinance_inflow: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'BANK_MAPPING' AND type = 'ADD' AND strftime('%Y', created_at) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let bank_refinance_outflow: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'BANK_MAPPING' AND type = 'WITHDRAW' AND strftime('%Y', created_at) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let bank_refinance_surplus = bank_refinance_inflow - bank_refinance_outflow;

//         let investor_investments: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(ft.total_amount), 0.0)
//                  FROM investor_transactions it
//                  JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
//                  WHERE it.transaction_type = 'INVESTMENT' AND strftime('%Y', ft.created_at) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let investor_withdrawals: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(ft.total_amount), 0.0)
//                  FROM investor_transactions it
//                  JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
//                  WHERE it.transaction_type = 'WITHDRAWAL' AND strftime('%Y', ft.created_at) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let investor_interest_paid: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(ft.total_amount), 0.0)
//                  FROM investor_transactions it
//                  JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
//                  WHERE it.transaction_type = 'PROFIT_PAYMENT' AND strftime('%Y', ft.created_at) = ?1",
//                 params![yr], |row| row.get(0),
//             ).unwrap_or(0.0);

//         let total_in: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(total_amount), 0.0) 
//                  FROM fund_transactions 
//                  WHERE type = 'ADD' 
//                    AND payment_method IN ('CASH', 'UPI', 'BANK')
//                    AND strftime('%Y', created_at) = ?1",
//                 params![yr],
//                 |row| row.get(0),
//             )
//             .unwrap_or(0.0);

//         let total_out: f64 = conn
//             .query_row(
//                 "SELECT COALESCE(SUM(total_amount), 0.0) 
//                  FROM fund_transactions 
//                  WHERE type = 'WITHDRAW' 
//                    AND payment_method IN ('CASH', 'UPI', 'BANK')
//                    AND strftime('%Y', created_at) = ?1",
//                 params![yr],
//                 |row| row.get(0),
//             )
//             .unwrap_or(0.0);

//         let net_cash_flow = total_in - total_out;
//         let closing_balance = opening_balance + net_cash_flow;

//         let total_pockets: i64 = conn.query_row(
//             "SELECT COUNT(*) FROM pledges WHERE pocket_number IS NOT NULL AND strftime('%Y', COALESCE(pledge_date, created_at)) = ?1",
//             params![yr], |row| row.get(0),
//         ).unwrap_or(0);

//         // Fetch pocket movements
//         let active_pockets: i64 = conn.query_row(
//             "SELECT COUNT(*) FROM pledges WHERE pocket_number IS NOT NULL AND strftime('%Y', COALESCE(pledge_date, created_at)) = ?1 AND (status = 'ACTIVE' OR DATE(closed_at) > ?2 OR DATE(auctioned_at) > ?2)",
//             params![yr, year_end], |row| row.get(0),
//         ).unwrap_or(0);

//         let closed_pockets: i64 = conn.query_row(
//             "SELECT COUNT(*) FROM pledges WHERE status = 'CLOSED' AND strftime('%Y', closed_at) = ?1",
//             params![yr], |row| row.get(0),
//         ).unwrap_or(0);

//         let total_auctioned_pockets: i64 = conn.query_row(
//             "SELECT COUNT(*) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y', auctioned_at) = ?1",
//             params![yr], |row| row.get(0),
//         ).unwrap_or(0);

//         let principal_recovered: f64 = conn.query_row(
//             "SELECT COALESCE(SUM(loan_amount), 0.0) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y', auctioned_at) = ?1",
//             params![yr], |row| row.get(0),
//         ).unwrap_or(0.0);

//         let interest_recovered: f64 = (total_auctioned_pockets as f64) * 28800.0;
//         let total_outstanding = principal_recovered + interest_recovered;

//         let total_auction_sales: f64 = conn.query_row(
//             "SELECT COALESCE(SUM(auction_amount), 0.0) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y', auctioned_at) = ?1",
//             params![yr], |row| row.get(0),
//         ).unwrap_or(0.0);

//         let auction_profit_loss: f64 = conn.query_row(
//             "SELECT COALESCE(SUM(COALESCE(auction_amount, 0.0) - (loan_amount + 28800.0)), 0.0) 
//              FROM pledges 
//              WHERE status = 'AUCTIONED' AND strftime('%Y', auctioned_at) = ?1",
//              params![yr], |row| row.get(0)
//         ).unwrap_or(0.0);

//         rows.push(YearlyReportRow {
//             year: yr.clone(),
//             total_pledges: total_pockets,
//             active_pockets,
//             closed_pockets,
//             auctioned_pockets: total_auctioned_pockets,
//             total_loan_amount: gross_loans, 
//             loans_issued: net_loans_issued, 
//             net_loans_issued,
//             interest_income: interest_collected,
//             processing_fees,
//             other_income,
//             expenses,
//             auction_surplus_deficit: auction_profit_loss,
//             bank_refinance_inflow,
//             bank_refinance_outflow,
//             bank_refinance_surplus,
//             investor_investments,
//             investor_withdrawals,
//             investor_interest_paid,
//             opening_balance,
//             closing_balance,
//             total_inflow: total_in,
//             total_outflow: total_out,
//             net_cash_flow,
//             loan_repayments,
//             closure_collections,
//         });

//         auctions.push(YearlyAuctionRow {
//             year: yr.clone(),
//             total_auctioned_pockets,
//             principal_recovered,
//             interest_recovered,
//             total_outstanding,
//             total_auction_sales,
//             auction_profit_loss,
//         });
//     }

//     let mut metal_stmt = conn.prepare(
//         "
//         SELECT
//             mt.name,
//             COALESCE(SUM(CASE WHEN strftime('%Y', COALESCE(p.pledge_date, p.created_at)) = ?1 THEN pi.gross_weight ELSE 0 END), 0),
//             COALESCE(SUM(CASE WHEN strftime('%Y', COALESCE(p.pledge_date, p.created_at)) = ?1 THEN pi.net_weight ELSE 0 END), 0),
//             COALESCE(SUM(CASE WHEN (p.status = 'CLOSED' AND strftime('%Y', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y', p.auctioned_at) = ?1) THEN pi.gross_weight ELSE 0 END), 0),
//             COALESCE(SUM(CASE WHEN (p.status = 'CLOSED' AND strftime('%Y', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y', p.auctioned_at) = ?1) THEN pi.net_weight ELSE 0 END), 0),
            
//             -- Inward Items Count
//             COALESCE(SUM(CASE WHEN strftime('%Y', COALESCE(p.pledge_date, p.created_at)) = ?1 THEN 1 ELSE 0 END), 0) as in_count,
            
//             -- Outward Items Count
//             COALESCE(SUM(CASE WHEN (p.status = 'CLOSED' AND strftime('%Y', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y', p.auctioned_at) = ?1) THEN 1 ELSE 0 END), 0) as out_count
//         FROM metal_types mt
//         LEFT JOIN jewellery_types jt ON jt.metal_type_id = mt.id
//         LEFT JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
//         LEFT JOIN pledges p ON p.id = pi.pledge_id
//         WHERE mt.is_active = 1
//         GROUP BY mt.id, mt.name
//         ORDER BY mt.name
//         "
//     ).map_err(|e| e.to_string())?;

//     let metal_rows = metal_stmt.query_map(params![target_year], |row| {
//         Ok(YearlyMetalMovementRow {
//             metal: row.get(0)?,
//             pledged_gross_weight: row.get(1)?,
//             pledged_net_weight: row.get(2)?,
//             closed_gross_weight: row.get(3)?,
//             closed_net_weight: row.get(4)?,
//             pledged_count: row.get(5)?,  
//             closed_count: row.get(6)?, 
//         })
//     }).map_err(|e| e.to_string())?;

//     let mut metals = Vec::new();
//     for row in metal_rows {
//         metals.push(row.map_err(|e| e.to_string())?);
//     }

//     Ok(YearlyReportPayload {
//         rows,
//         metals,
//         auctions,
//     })
// }

// #[tauri::command]
// pub fn get_yearly_report_cmd(
//     db: tauri::State<Db>,
//     year: Option<String>,
// ) -> Result<YearlyReportPayload, String> {
//     let target_year = year.unwrap_or_else(|| {
//         chrono::Local::now().format("%Y").to_string()
//     });
//     get_yearly_report(db.inner(), target_year)
// }






// src-tauri/src/reports/yearly_report.rs

use crate::db::connection::Db;
use rusqlite::params;
use serde::Serialize;

#[derive(serde::Serialize, Clone)]
pub struct YearlyReportPayload {
    pub rows: Vec<YearlyReportRow>,
    pub metals: Vec<YearlyMetalMovementRow>,
    pub auctions: Vec<YearlyAuctionRow>,
}

#[derive(serde::Serialize, Clone)]
pub struct YearlyReportRow {
    pub year: String,
    pub total_pledges: i64,
    pub active_pockets: i64,    
    pub closed_pockets: i64,    
    pub auctioned_pockets: i64, 
    pub total_loan_amount: f64, 
    pub loans_issued: f64,       
    pub net_loans_issued: f64,
    pub interest_income: f64,
    pub processing_fees: f64,
    pub other_income: f64,
    pub expenses: f64,
    pub auction_surplus_deficit: f64,
    pub bank_refinance_inflow: f64,
    pub bank_refinance_outflow: f64,
    pub bank_refinance_surplus: f64,
    pub investor_investments: f64,
    pub investor_withdrawals: f64,
    pub investor_interest_paid: f64,
    pub opening_balance: f64,
    pub closing_balance: f64,
    pub total_inflow: f64,
    pub total_outflow: f64,
    pub net_cash_flow: f64,
    pub loan_repayments: f64,
    pub closure_collections: f64,
}

#[derive(serde::Serialize, Clone)]
pub struct YearlyMetalMovementRow {
    pub metal: String,
    pub pledged_gross_weight: f64,
    pub pledged_net_weight: f64,
    pub closed_gross_weight: f64,
    pub closed_net_weight: f64,
    pub pledged_count: i64,
    pub closed_count: i64,
}

#[derive(serde::Serialize, Clone)]
pub struct YearlyAuctionRow {
    pub year: String,
    pub total_auctioned_pockets: i64,
    pub principal_recovered: f64,
    pub interest_recovered: f64,
    pub total_outstanding: f64,
    pub total_auction_sales: f64,
    pub auction_profit_loss: f64,
}

pub fn get_yearly_report(
    db: &Db,
    target_year: String, 
) -> Result<YearlyReportPayload, String> {
    let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 1. Fetch all distinct years with transactions to populate the timeline list
    let mut years_stmt = conn.prepare(
        "SELECT DISTINCT strftime('%Y', created_at) as yr 
         FROM fund_transactions 
         WHERE created_at IS NOT NULL
         UNION 
         SELECT strftime('%Y', 'now')
         ORDER BY yr DESC"
    ).map_err(|e| e.to_string())?;

    let years_rows = years_stmt.query_map([], |row| row.get::<_, String>(0)).map_err(|e| e.to_string())?;
    let mut years = Vec::new();
    for yr in years_rows {
        if let Ok(y) = yr {
            if !years.contains(&y) {
                years.push(y);
            }
        }
    }

    if years.is_empty() {
        years.push(chrono::Local::now().format("%Y").to_string());
    }

    let mut rows = Vec::new();
    let mut auctions = Vec::new();

    for yr in &years {
        let year_start = format!("{}-01-01", yr);
        let year_end = format!("{}-12-31", yr); 

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
                WHERE payment_method IN ('CASH', 'UPI', 'BANK') AND DATE(created_at) < ?1
                ",
                params![year_start], 
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        let gross_loans: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'PLEDGE' AND type = 'WITHDRAW' AND strftime('%Y', created_at) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let net_loans_issued: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) 
                 FROM fund_transactions 
                 WHERE module_type = 'PLEDGE' 
                   AND type = 'WITHDRAW' 
                   AND payment_method IN ('CASH', 'UPI', 'BANK') 
                   AND strftime('%Y', created_at) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let loan_repayments: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'PLEDGE' AND type = 'ADD' AND strftime('%Y', created_at) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let interest_collected: f64 = conn
            .query_row(
                "
                SELECT 
                    (SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'INTEREST' AND type = 'ADD' AND strftime('%Y', created_at) = ?1)
                    +
                    (SELECT COALESCE(SUM(28800.0), 0.0) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y', auctioned_at) = ?1)
                ",
                params![yr],
                |row| row.get(0),
            ).unwrap_or(0.0);

        let expenses: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(amount), 0.0) FROM expenses WHERE strftime('%Y', expense_date) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let other_income: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type IN ('PENALTY', 'OTHER_INCOME') AND type = 'ADD' AND strftime('%Y', created_at) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let processing_fees: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'FEE' AND type = 'ADD' AND strftime('%Y', created_at) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let closure_collections: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'CLOSURE' AND type = 'ADD' AND strftime('%Y', created_at) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let bank_refinance_inflow: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'BANK_MAPPING' AND type = 'ADD' AND strftime('%Y', created_at) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let bank_refinance_outflow: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions WHERE module_type = 'BANK_MAPPING' AND type = 'WITHDRAW' AND strftime('%Y', created_at) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let bank_refinance_surplus = bank_refinance_inflow - bank_refinance_outflow;

        let investor_investments: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(ft.total_amount), 0.0)
                 FROM investor_transactions it
                 JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
                 WHERE it.transaction_type = 'INVESTMENT' AND strftime('%Y', ft.created_at) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let investor_withdrawals: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(ft.total_amount), 0.0)
                 FROM investor_transactions it
                 JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
                 WHERE it.transaction_type = 'WITHDRAWAL' AND strftime('%Y', ft.created_at) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let investor_interest_paid: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(ft.total_amount), 0.0)
                 FROM investor_transactions it
                 JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
                 WHERE it.transaction_type = 'PROFIT_PAYMENT' AND strftime('%Y', ft.created_at) = ?1",
                params![yr], |row| row.get(0),
            ).unwrap_or(0.0);

        let total_in: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) 
                 FROM fund_transactions 
                 WHERE type = 'ADD' 
                   AND payment_method IN ('CASH', 'UPI', 'BANK')
                   AND strftime('%Y', created_at) = ?1",
                params![yr],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        let total_out: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) 
                 FROM fund_transactions 
                 WHERE type = 'WITHDRAW' 
                   AND payment_method IN ('CASH', 'UPI', 'BANK')
                   AND strftime('%Y', created_at) = ?1",
                params![yr],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        let net_cash_flow = total_in - total_out;
        let closing_balance = opening_balance + net_cash_flow;

        let total_pockets: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pledges WHERE pocket_number IS NOT NULL AND strftime('%Y', COALESCE(pledge_date, created_at)) = ?1",
            params![yr], |row| row.get(0),
        ).unwrap_or(0);

        let active_pockets: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pledges WHERE pocket_number IS NOT NULL AND strftime('%Y', COALESCE(pledge_date, created_at)) = ?1 AND (status = 'ACTIVE' OR DATE(closed_at) > ?2 OR DATE(auctioned_at) > ?2)",
            params![yr, year_end], |row| row.get(0),
        ).unwrap_or(0);

        let closed_pockets: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pledges WHERE status = 'CLOSED' AND strftime('%Y', closed_at) = ?1",
            params![yr], |row| row.get(0),
        ).unwrap_or(0);

        let total_auctioned_pockets: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y', auctioned_at) = ?1",
            params![yr], |row| row.get(0),
        ).unwrap_or(0);

        let principal_recovered: f64 = conn.query_row(
            "SELECT COALESCE(SUM(loan_amount), 0.0) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y', auctioned_at) = ?1",
            params![yr], |row| row.get(0),
        ).unwrap_or(0.0);

        let interest_recovered: f64 = (total_auctioned_pockets as f64) * 28800.0;
        let total_outstanding = principal_recovered + interest_recovered;

        let total_auction_sales: f64 = conn.query_row(
            "SELECT COALESCE(SUM(auction_amount), 0.0) FROM pledges WHERE status = 'AUCTIONED' AND strftime('%Y', auctioned_at) = ?1",
            params![yr], |row| row.get(0),
        ).unwrap_or(0.0);

        let auction_profit_loss: f64 = conn.query_row(
            "SELECT COALESCE(SUM(COALESCE(auction_amount, 0.0) - (loan_amount + 28800.0)), 0.0) 
             FROM pledges 
             WHERE status = 'AUCTIONED' AND strftime('%Y', auctioned_at) = ?1",
             params![yr], |row| row.get(0)
        ).unwrap_or(0.0);

        rows.push(YearlyReportRow {
            year: yr.clone(),
            total_pledges: total_pockets,
            active_pockets,
            closed_pockets,
            auctioned_pockets: total_auctioned_pockets,
            total_loan_amount: gross_loans, 
            loans_issued: net_loans_issued, 
            net_loans_issued,
            interest_income: interest_collected,
            processing_fees,
            other_income,
            expenses,
            auction_surplus_deficit: auction_profit_loss,
            bank_refinance_inflow,
            bank_refinance_outflow,
            bank_refinance_surplus,
            investor_investments,
            investor_withdrawals,
            investor_interest_paid,
            opening_balance,
            closing_balance,
            total_inflow: total_in,
            total_outflow: total_out,
            net_cash_flow,
            loan_repayments,
            closure_collections,
        });

        auctions.push(YearlyAuctionRow {
            year: yr.clone(),
            total_auctioned_pockets,
            principal_recovered,
            interest_recovered,
            total_outstanding,
            total_auction_sales,
            auction_profit_loss,
        });
    }

    let mut metal_stmt = conn.prepare(
        "
        SELECT
            mt.name,
            COALESCE(SUM(CASE WHEN strftime('%Y', COALESCE(p.pledge_date, p.created_at)) = ?1 THEN pi.gross_weight ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN strftime('%Y', COALESCE(p.pledge_date, p.created_at)) = ?1 THEN pi.net_weight ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN (p.status = 'CLOSED' AND strftime('%Y', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y', p.auctioned_at) = ?1) THEN pi.gross_weight ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN (p.status = 'CLOSED' AND strftime('%Y', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y', p.auctioned_at) = ?1) THEN pi.net_weight ELSE 0 END), 0),
            
            -- Inward Pockets Count (Distinct unique p.id instances)
            COUNT(DISTINCT CASE WHEN strftime('%Y', COALESCE(p.pledge_date, p.created_at)) = ?1 THEN p.id END) as in_count,
            
            -- Outward Pockets Count (Distinct unique p.id instances)
            COUNT(DISTINCT CASE WHEN (p.status = 'CLOSED' AND strftime('%Y', p.closed_at) = ?1) OR (p.status = 'AUCTIONED' AND strftime('%Y', p.auctioned_at) = ?1) THEN p.id END) as out_count
        FROM metal_types mt
        LEFT JOIN jewellery_types jt ON jt.metal_type_id = mt.id
        LEFT JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
        LEFT JOIN pledges p ON p.id = pi.pledge_id
        WHERE mt.is_active = 1
        GROUP BY mt.id, mt.name
        ORDER BY mt.name
        "
    ).map_err(|e| e.to_string())?;

    let metal_rows = metal_stmt.query_map(params![target_year], |row| {
        Ok(YearlyMetalMovementRow {
            metal: row.get(0)?,
            pledged_gross_weight: row.get(1)?,
            pledged_net_weight: row.get(2)?,
            closed_gross_weight: row.get(3)?,
            closed_net_weight: row.get(4)?,
            pledged_count: row.get(5)?,  
            closed_count: row.get(6)?, 
        })
    }).map_err(|e| e.to_string())?;

    let mut metals = Vec::new();
    for row in metal_rows {
        metals.push(row.map_err(|e| e.to_string())?);
    }

    Ok(YearlyReportPayload {
        rows,
        metals,
        auctions,
    })
}

#[tauri::command]
pub fn get_yearly_report_cmd(
    db: tauri::State<Db>,
    year: Option<String>,
) -> Result<YearlyReportPayload, String> {
    let target_year = year.unwrap_or_else(|| {
        chrono::Local::now().format("%Y").to_string()
    });
    get_yearly_report(db.inner(), target_year)
}