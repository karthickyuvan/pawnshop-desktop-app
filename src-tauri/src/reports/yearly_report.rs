// // version 3 

// use crate::db::connection::Db;
// use rusqlite::params;

// #[derive(serde::Serialize)]
// pub struct MetalSummary {
//     pub metal: String,
//     pub pledged_net_weight: f64,
//     pub pledged_gross_weight: f64,
//     pub closed_net_weight: f64,
//     pub closed_gross_weight: f64,
// }

// #[derive(serde::Serialize)]
// pub struct YearlyAuctionSummaryRow {
//     pub year: String,
//     pub total_auctioned_pockets: i64,
//     pub principal_recovered: f64,
//     pub interest_recovered: f64,   
//     pub total_outstanding: f64,    
//     pub total_auction_sales: f64,
//     pub auction_profit_loss: f64,
// }

// #[derive(serde::Serialize)]
// pub struct YearlyReportRow {
//     pub year: String,
//     pub total_pledges: i64,
//     pub total_loan_amount: f64,
//     pub interest_income: f64,
//     pub processing_fees: f64,      
//     pub other_income: f64,         
//     pub expenses: f64,
//     pub auction_surplus_deficit: f64,
//     pub net_profit: f64,
    
//     // --- Bank Refinancing Metrics ---
//     pub bank_refinance_inflow: f64,
//     pub bank_refinance_outflow: f64,
//     pub bank_refinance_surplus: f64,
// }

// #[derive(serde::Serialize)]
// pub struct CorporateYearlyReport {
//     pub rows: Vec<YearlyReportRow>,
//     pub metals: Vec<MetalSummary>,
//     pub auctions: Vec<YearlyAuctionSummaryRow>,
// }

// pub fn get_corporate_yearly_report(db: &Db) -> Result<CorporateYearlyReport, String> {
//     let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

//     /* -------------------------------------------------------------------------
//        AUDITING FINANCIAL LINES - SUMMARY OVER FISCAL YEARS
//     --------------------------------------------------------------------------*/
//     let mut stmt = conn.prepare(
//         "
//         WITH AllYears AS (
//             SELECT strftime('%Y', COALESCE(pledge_date, created_at)) as year FROM pledges WHERE created_at IS NOT NULL
//             UNION
//             SELECT strftime('%Y', created_at) as year FROM fund_transactions WHERE created_at IS NOT NULL
//             UNION
//             SELECT strftime('%Y', expense_date) as year FROM expenses WHERE expense_date IS NOT NULL
//         )
//         SELECT
//             y.year,
//             (SELECT COUNT(id) FROM pledges WHERE strftime('%Y', COALESCE(pledge_date, created_at)) = y.year),
//             (SELECT COALESCE(SUM(loan_amount), 0.0) FROM pledges WHERE strftime('%Y', COALESCE(pledge_date, created_at)) = y.year),
            
//             -- 1. Standard Interest Collected + Recovered Auction Interest Component
//             (
//                 (SELECT COALESCE(SUM(total_amount), 0.0)
//                  FROM fund_transactions
//                  WHERE type='ADD' AND module_type='INTEREST'
//                  AND strftime('%Y', created_at) = y.year)
//                 +
//                 (SELECT COALESCE(SUM(28800.0), 0.0)
//                  FROM pledges
//                  WHERE status='AUCTIONED'
//                  AND strftime('%Y', auctioned_at) = y.year)
//             ),
            
//             (
//                 SELECT COALESCE(SUM(total_amount), 0.0)
//                 FROM fund_transactions
//                 WHERE type='ADD' AND module_type='FEE'
//                 AND strftime('%Y', created_at) = y.year
//             ),
//             (
//                 SELECT COALESCE(SUM(total_amount), 0.0)
//                 FROM fund_transactions
//                 WHERE type='ADD' AND module_type IN ('PENALTY', 'OTHER_INCOME')
//                 AND strftime('%Y', created_at) = y.year
//             ),
//             (
//                 SELECT COALESCE(SUM(amount), 0.0)
//                 FROM expenses
//                 WHERE strftime('%Y', expense_date) = y.year
//             ),
            
//             -- 2. Pure Auction Surplus Spread
//             (
//                 SELECT COALESCE(SUM(
//                     COALESCE(auction_amount, 0.0) - (loan_amount + 28800.0)
//                 ), 0.0)
//                 FROM pledges
//                 WHERE status='AUCTIONED'
//                 AND strftime('%Y', auctioned_at) = y.year
//             ),

//             -- 3. Yearly Bank Mapping Inflow
//             (
//                 SELECT COALESCE(SUM(total_amount), 0.0)
//                 FROM fund_transactions
//                 WHERE type='ADD' AND module_type='BANK_MAPPING'
//                 AND strftime('%Y', created_at) = y.year
//             ),

//             -- 4. Yearly Bank Mapping Outflow (Repayments)
//             (
//                 SELECT COALESCE(SUM(total_amount), 0.0)
//                 FROM fund_transactions
//                 WHERE type='WITHDRAW' AND module_type='BANK_MAPPING'
//                 AND strftime('%Y', created_at) = y.year
//             )
//         FROM AllYears y
//         WHERE y.year IS NOT NULL
//         ORDER BY y.year DESC
//         "
//     ).map_err(|e| e.to_string())?;

//     let rows_iter = stmt.query_map([], |row| {
//         let interest: f64 = row.get(3)?;
//         let fees: f64 = row.get(4)?;
//         let other: f64 = row.get(5)?;
//         let expenses: f64 = row.get(6)?;
//         let auction_margin: f64 = row.get(7)?;
//         let bank_inflow: f64 = row.get(8)?;
//         let bank_outflow: f64 = row.get(9)?;

//         let total_revenue = interest + fees + other + auction_margin;

//         Ok(YearlyReportRow {
//             year: row.get(0)?,
//             total_pledges: row.get(1)?,
//             total_loan_amount: row.get(2)?,
//             interest_income: interest,
//             processing_fees: fees,
//             other_income: other,
//             expenses,
//             auction_surplus_deficit: auction_margin,
//             net_profit: total_revenue - expenses,
//             bank_refinance_inflow: bank_inflow,
//             bank_refinance_outflow: bank_outflow,
//             bank_refinance_surplus: bank_inflow - bank_outflow,
//         })
//     }).map_err(|e| e.to_string())?;

//     let mut rows = Vec::new();
//     for r in rows_iter {
//         rows.push(r.map_err(|e| e.to_string())?);
//     }

//     /* -------------------------------------------------------------------------
//        YEAR-OVER-YEAR AUCTION PERFORMANCE BALANCES
//     --------------------------------------------------------------------------*/
//     let mut auction_stmt = conn.prepare(
//         "
//         SELECT 
//             strftime('%Y', auctioned_at) as year,
//             COUNT(id),
//             COALESCE(SUM(loan_amount), 0.0),
//             COALESCE(SUM(28800.0), 0.0), 
//             COALESCE(SUM(auction_amount), 0.0),
//             COALESCE(SUM(COALESCE(auction_amount, 0.0) - (loan_amount + 28800.0)), 0.0)
//         FROM pledges
//         WHERE status = 'AUCTIONED'
//         GROUP BY year
//         ORDER BY year DESC
//         "
//     ).map_err(|e| e.to_string())?;

//     let auction_iter = auction_stmt.query_map([], |row| {
//         let principal: f64 = row.get(2)?;
//         let interest: f64 = row.get(3)?;

//         Ok(YearlyAuctionSummaryRow {
//             year: row.get(0)?,
//             total_auctioned_pockets: row.get(1)?,
//             principal_recovered: principal,
//             interest_recovered: interest,
//             total_outstanding: principal + interest,
//             total_auction_sales: row.get(4)?,
//             auction_profit_loss: row.get(5)?,
//         })
//     }).map_err(|e| e.to_string())?;

//     let mut auctions = Vec::new();
//     for a in auction_iter {
//         auctions.push(a.map_err(|e| e.to_string())?);
//     }

//     /* -------------------------------------------------------------------------
//        COMMODITY WEIGHT BALANCES
//     --------------------------------------------------------------------------*/
//     let mut stmt = conn.prepare(
//         "
//         SELECT
//             mt.name,
//             SUM(CASE WHEN LOWER(p.status)='active' THEN pi.net_weight ELSE 0 END),
//             SUM(CASE WHEN LOWER(p.status)='active' THEN pi.gross_weight ELSE 0 END),
//             SUM(CASE WHEN LOWER(p.status) IN ('closed', 'auctioned') THEN pi.net_weight ELSE 0 END),
//             SUM(CASE WHEN LOWER(p.status) IN ('closed', 'auctioned') THEN pi.gross_weight ELSE 0 END)
//         FROM pledge_items pi
//         JOIN pledges p ON p.id = pi.pledge_id
//         JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
//         JOIN metal_types mt ON mt.id = jt.metal_type_id
//         GROUP BY mt.name
//         ORDER BY mt.name ASC
//         "
//     ).map_err(|e| e.to_string())?;

//     let metal_iter = stmt.query_map([], |row| {
//         Ok(MetalSummary {
//             metal: row.get(0)?,
//             pledged_net_weight: row.get::<_, Option<f64>>(1)?.unwrap_or(0.0),
//             pledged_gross_weight: row.get::<_, Option<f64>>(2)?.unwrap_or(0.0),
//             closed_net_weight: row.get::<_, Option<f64>>(3)?.unwrap_or(0.0),
//             closed_gross_weight: row.get::<_, Option<f64>>(4)?.unwrap_or(0.0),
//         })
//     }).map_err(|e| e.to_string())?;

//     let mut metals = Vec::new();
//     for m in metal_iter {
//         metals.push(m.map_err(|e| e.to_string())?);
//     }

//     Ok(CorporateYearlyReport {
//         rows,
//         metals,
//         auctions,
//     })
// }

// #[tauri::command]
// pub fn get_yearly_report_cmd(
//     db: tauri::State<Db>,
// ) -> Result<CorporateYearlyReport, String> {
//     get_corporate_yearly_report(db.inner())
// }








// src-tauri/src/reports/yearly_report.rs

use crate::db::connection::Db;
use rusqlite::params;
use rusqlite::Result;
use serde::Serialize;

#[derive(serde::Serialize)]
pub struct MetalSummary {
    pub metal: String,
    pub pledged_net_weight: f64,
    pub pledged_gross_weight: f64,
    pub closed_net_weight: f64,
    pub closed_gross_weight: f64,
}

#[derive(serde::Serialize)]
pub struct YearlyAuctionSummaryRow {
    pub year: String,
    pub total_auctioned_pockets: i64,
    pub principal_recovered: f64,
    pub interest_recovered: f64,   
    pub total_outstanding: f64,    
    pub total_auction_sales: f64,
    pub auction_profit_loss: f64,
}

#[derive(serde::Serialize)]
pub struct YearlyReportRow {
    pub year: String,
    pub total_pledges: i64,
    pub total_loan_amount: f64,
    pub interest_income: f64,
    pub processing_fees: f64,      
    pub other_income: f64,         
    pub expenses: f64,
    pub auction_surplus_deficit: f64,
    pub net_profit: f64,
    
    // --- Bank Refinancing Metrics ---
    pub bank_refinance_inflow: f64,
    pub bank_refinance_outflow: f64,
    pub bank_refinance_surplus: f64,

    // --- Investor Metrics (NEW) ---
    pub investor_investments: f64,
    pub investor_withdrawals: f64,
    pub investor_interest_paid: f64,
}

#[derive(serde::Serialize)]
pub struct CorporateYearlyReport {
    pub rows: Vec<YearlyReportRow>,
    pub metals: Vec<MetalSummary>,
    pub auctions: Vec<YearlyAuctionSummaryRow>,
}

pub fn get_corporate_yearly_report(db: &Db) -> Result<CorporateYearlyReport, String> {
    let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

    let mut stmt = conn.prepare(
        "
        WITH AllYears AS (
            SELECT strftime('%Y', COALESCE(pledge_date, created_at)) as year FROM pledges WHERE created_at IS NOT NULL
            UNION
            SELECT strftime('%Y', created_at) as year FROM fund_transactions WHERE created_at IS NOT NULL
            UNION
            SELECT strftime('%Y', expense_date) as year FROM expenses WHERE expense_date IS NOT NULL
        )
        SELECT
            y.year,
            (SELECT COUNT(id) FROM pledges WHERE strftime('%Y', COALESCE(pledge_date, created_at)) = y.year),
            (SELECT COALESCE(SUM(loan_amount), 0.0) FROM pledges WHERE strftime('%Y', COALESCE(pledge_date, created_at)) = y.year),
            
            -- Interest Income
            (
                (SELECT COALESCE(SUM(total_amount), 0.0)
                 FROM fund_transactions
                 WHERE type='ADD' AND module_type='INTEREST'
                 AND strftime('%Y', created_at) = y.year)
                +
                (SELECT COALESCE(SUM(28800.0), 0.0)
                 FROM pledges
                 WHERE status='AUCTIONED'
                 AND strftime('%Y', auctioned_at) = y.year)
            ),
            
            (
                SELECT COALESCE(SUM(total_amount), 0.0)
                FROM fund_transactions
                WHERE type='ADD' AND module_type='FEE'
                AND strftime('%Y', created_at) = y.year
            ),
            (
                SELECT COALESCE(SUM(total_amount), 0.0)
                FROM fund_transactions
                WHERE type='ADD' AND module_type IN ('PENALTY', 'OTHER_INCOME')
                AND strftime('%Y', created_at) = y.year
            ),
            (
                SELECT COALESCE(SUM(amount), 0.0)
                FROM expenses
                WHERE strftime('%Y', expense_date) = y.year
            ),
            
            -- Auction Surplus Spread
            (
                SELECT COALESCE(SUM(
                    COALESCE(auction_amount, 0.0) - (loan_amount + 28800.0)
                ), 0.0)
                FROM pledges
                WHERE status='AUCTIONED'
                AND strftime('%Y', auctioned_at) = y.year
            ),

            -- Bank Mapping Inflow
            (
                SELECT COALESCE(SUM(total_amount), 0.0)
                FROM fund_transactions
                WHERE type='ADD' AND module_type='BANK_MAPPING'
                AND strftime('%Y', created_at) = y.year
            ),

            -- Bank Mapping Outflow
            (
                SELECT COALESCE(SUM(total_amount), 0.0)
                FROM fund_transactions
                WHERE type='WITHDRAW' AND module_type='BANK_MAPPING'
                AND strftime('%Y', created_at) = y.year
            ),

            -- 1. Yearly Investor Investment Inflow
            (
                SELECT COALESCE(SUM(ft.total_amount), 0.0)
                FROM investor_transactions it
                JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
                WHERE it.transaction_type = 'INVESTMENT'
                AND strftime('%Y', ft.created_at) = y.year
            ),

            -- 2. Yearly Investor Capital Withdrawal Outflow
            (
                SELECT COALESCE(SUM(ft.total_amount), 0.0)
                FROM investor_transactions it
                JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
                WHERE it.transaction_type = 'WITHDRAWAL'
                AND strftime('%Y', ft.created_at) = y.year
            ),

            -- 3. Yearly Investor Interest Paid Outflow
            (
                SELECT COALESCE(SUM(ft.total_amount), 0.0)
                FROM investor_transactions it
                JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
                WHERE it.transaction_type = 'PROFIT_PAYMENT'
                AND strftime('%Y', ft.created_at) = y.year
            )
        FROM AllYears y
        WHERE y.year IS NOT NULL
        ORDER BY y.year DESC
        "
    ).map_err(|e| e.to_string())?;

    let rows_iter = stmt.query_map([], |row| {
        let interest: f64 = row.get(3)?;
        let fees: f64 = row.get(4)?;
        let other: f64 = row.get(5)?;
        let expenses: f64 = row.get(6)?;
        let auction_margin: f64 = row.get(7)?;
        let bank_inflow: f64 = row.get(8)?;
        let bank_outflow: f64 = row.get(9)?;
        
        let investor_inflow: f64 = row.get(10)?;
        let investor_outflow: f64 = row.get(11)?;
        let investor_interest: f64 = row.get(12)?;

        let total_revenue = interest + fees + other + auction_margin;

        Ok(YearlyReportRow {
            year: row.get(0)?,
            total_pledges: row.get(1)?,
            total_loan_amount: row.get(2)?,
            interest_income: interest,
            processing_fees: fees,
            other_income: other,
            expenses,
            auction_surplus_deficit: auction_margin,
            net_profit: total_revenue - expenses,
            bank_refinance_inflow: bank_inflow,
            bank_refinance_outflow: bank_outflow,
            bank_refinance_surplus: bank_inflow - bank_outflow,
            investor_investments: investor_inflow,
            investor_withdrawals: investor_outflow,
            investor_interest_paid: investor_interest,
        })
    }).map_err(|e| e.to_string())?;

    let mut rows = Vec::new();
    for r in rows_iter {
        rows.push(r.map_err(|e| e.to_string())?);
    }

    /* -------------------------------------------------------------------------
       YEAR-OVER-YEAR AUCTION PERFORMANCE BALANCES
    --------------------------------------------------------------------------*/
    let mut auction_stmt = conn.prepare(
        "
        SELECT 
            strftime('%Y', auctioned_at) as year,
            COUNT(id),
            COALESCE(SUM(loan_amount), 0.0),
            COALESCE(SUM(28800.0), 0.0), 
            COALESCE(SUM(auction_amount), 0.0),
            COALESCE(SUM(COALESCE(auction_amount, 0.0) - (loan_amount + 28800.0)), 0.0)
        FROM pledges
        WHERE status = 'AUCTIONED'
        GROUP BY year
        ORDER BY year DESC
        "
    ).map_err(|e| e.to_string())?;

    let auction_iter = auction_stmt.query_map([], |row| {
        let principal: f64 = row.get(2)?;
        let interest: f64 = row.get(3)?;

        Ok(YearlyAuctionSummaryRow {
            year: row.get(0)?,
            total_auctioned_pockets: row.get(1)?,
            principal_recovered: principal,
            interest_recovered: interest,
            total_outstanding: principal + interest,
            total_auction_sales: row.get(4)?,
            auction_profit_loss: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut auctions = Vec::new();
    for a in auction_iter {
        auctions.push(a.map_err(|e| e.to_string())?);
    }

    /* -------------------------------------------------------------------------
       COMMODITY WEIGHT BALANCES
    --------------------------------------------------------------------------*/
    let mut stmt = conn.prepare(
        "
        SELECT
            mt.name,
            SUM(CASE WHEN LOWER(p.status)='active' THEN pi.net_weight ELSE 0 END),
            SUM(CASE WHEN LOWER(p.status)='active' THEN pi.gross_weight ELSE 0 END),
            SUM(CASE WHEN LOWER(p.status) IN ('closed', 'auctioned') THEN pi.net_weight ELSE 0 END),
            SUM(CASE WHEN LOWER(p.status) IN ('closed', 'auctioned') THEN pi.gross_weight ELSE 0 END)
        FROM pledge_items pi
        JOIN pledges p ON p.id = pi.pledge_id
        JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
        JOIN metal_types mt ON mt.id = jt.metal_type_id
        GROUP BY mt.name
        ORDER BY mt.name ASC
        "
    ).map_err(|e| e.to_string())?;

    let metal_iter = stmt.query_map([], |row| {
        Ok(MetalSummary {
            metal: row.get(0)?,
            pledged_net_weight: row.get::<_, Option<f64>>(1)?.unwrap_or(0.0),
            pledged_gross_weight: row.get::<_, Option<f64>>(2)?.unwrap_or(0.0),
            closed_net_weight: row.get::<_, Option<f64>>(3)?.unwrap_or(0.0),
            closed_gross_weight: row.get::<_, Option<f64>>(4)?.unwrap_or(0.0),
        })
    }).map_err(|e| e.to_string())?;

    let mut metals = Vec::new();
    for m in metal_iter {
        metals.push(m.map_err(|e| e.to_string())?);
    }

    Ok(CorporateYearlyReport {
        rows,
        metals,
        auctions,
    })
}

#[tauri::command]
pub fn get_yearly_report_cmd(
    db: tauri::State<Db>,
) -> Result<CorporateYearlyReport, String> {
    get_corporate_yearly_report(db.inner())
}