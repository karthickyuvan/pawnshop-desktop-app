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
    // Additional auditor-required fields
    pub net_cash_flow: f64,
    pub loan_repayments: f64, 
    pub total_inflow: f64,
    pub total_outflow: f64,
}

// #[derive(serde::Serialize)]
// pub struct MonthlyReport {
//     pub month: String,
//     pub total_loans_issued: f64,
//     pub total_interest_collected: f64,
//     pub total_expenses: f64,
//     pub total_loan_repayments: f64,
//     pub net_profit: f64,
//     pub average_daily_balance: f64,
// }

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

    // 3. CRITICAL FIX: Loan Repayments (Principal returned - Cash In)
    // This was MISSING in your original code - a major audit issue!
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

    // 5. Expenses (Cash Out)
    let expenses: f64 = conn
        .query_row(
            "
            SELECT COALESCE(SUM(total_amount), 0.0)
            FROM fund_transactions
            WHERE module_type = 'EXPENSE'
            AND type = 'WITHDRAW'
            AND DATE(created_at) = ?1
            ",
            params![report_date],
            |row| row.get(0),
        )
        .map_err(|e| format!("Error fetching expenses: {}", e))?;

    // 6. Other Income -  Penalties, etc. (Cash In)
    let other_income: f64 = conn
        .query_row(
            "
            SELECT COALESCE(SUM(total_amount), 0.0)
            FROM fund_transactions
            WHERE module_type IN ('PENALTY', 'OTHER_INCOME')
            AND type = 'ADD'
            AND DATE(created_at) = ?1
            ",
            params![report_date],
            |row| row.get(0),
        )
        .map_err(|e| format!("Error fetching other income: {}", e))?;

    // 7. processing fees
    let processing_fees: f64 = conn
    .query_row(
        "
        SELECT COALESCE(SUM(total_amount),0)
        FROM fund_transactions
        WHERE module_type='FEE'
        AND type='ADD'
        AND DATE(created_at)=?1
        ",
        params![report_date],
        |row| row.get(0),
    )
    .map_err(|e| format!("Error fetching processing fees: {}", e))?;

    // Calculate totals
    let total_inflow = loan_repayments + interest_collected + processing_fees + other_income;
    let total_outflow = loans_issued + expenses;
    let net_cash_flow = total_inflow - total_outflow;

    // CORRECTED Closing Balance Formula
    let closing_balance = opening_balance + net_cash_flow;

    Ok(BranchDailyReport {
        date: report_date,
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

// Additional command for monthly reports
// #[tauri::command]
// pub fn get_monthly_report_cmd(
//     db: tauri::State<Db>,
//     month: String, // Format: "2024-01"
// ) -> Result<MonthlyReport, String> {
//     let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

//     let start_date = format!("{}-01", month);
//     let end_date = format!("{}-31", month); // Simplified, should handle month-end properly

//     let total_loans_issued: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions 
//              WHERE module_type='PLEDGE' AND type='WITHDRAW' 
//              AND DATE(created_at) BETWEEN ?1 AND ?2",
//             params![start_date, end_date],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     let total_interest_collected: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions 
//              WHERE module_type='INTEREST' AND type='ADD' 
//              AND DATE(created_at) BETWEEN ?1 AND ?2",
//             params![start_date, end_date],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     let total_expenses: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions 
//              WHERE module_type='EXPENSE' AND type='WITHDRAW' 
//              AND DATE(created_at) BETWEEN ?1 AND ?2",
//             params![start_date, end_date],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     let total_loan_repayments: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(total_amount), 0.0) FROM fund_transactions 
//              WHERE module_type='PLEDGE' AND type='ADD' 
//              AND DATE(created_at) BETWEEN ?1 AND ?2",
//             params![start_date, end_date],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     let net_profit = total_interest_collected - total_expenses;

//     // Calculate average daily balance for the month
//     let average_daily_balance: f64 = conn
//         .query_row(
//             "SELECT AVG(daily_balance) FROM (
//                 SELECT DATE(created_at) as day, 
//                 SUM(CASE WHEN type='ADD' THEN total_amount ELSE -total_amount END) as daily_balance
//                 FROM fund_transactions
//                 WHERE DATE(created_at) BETWEEN ?1 AND ?2
//                 GROUP BY DATE(created_at)
//             )",
//             params![start_date, end_date],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     Ok(MonthlyReport {
//         month,
//         total_loans_issued,
//         total_interest_collected,
//         total_expenses,
//         total_loan_repayments,
//         net_profit,
//         average_daily_balance,
//     })
// }

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
            SELECT id, created_at, module_type, type, total_amount, reference,description
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