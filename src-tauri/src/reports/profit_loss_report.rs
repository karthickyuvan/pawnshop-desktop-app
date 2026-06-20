
// use crate::db::connection::Db;
// use rusqlite::{params, Row};
// use serde::Serialize;

// #[derive(Serialize)]
// pub struct MetalSummary {
//     pub metal: String,
//     pub pledged_net_weight: f64,
//     pub pledged_gross_weight: f64,
//     pub closed_net_weight: f64,
//     pub closed_gross_weight: f64,
// }

// #[derive(Serialize)]
// pub struct ProfitLossReport {
//     pub interest_income: f64,
//     pub processing_fee_income: f64,
//     pub other_income: f64,

//     pub business_expenses: f64,

//     pub pledge_loans_issued: f64,
//     pub pledge_principal_received: f64,

//     pub loan_portfolio: f64,
//     pub interest_yield_percent: f64,

//     pub metals: Vec<MetalSummary>,

//     pub net_profit: f64,
// }

// pub fn get_profit_loss_report(
//     db: &Db,
//     start_date: String,
//     end_date: String,
// ) -> Result<ProfitLossReport, String> {

//     let conn = db.0.lock().unwrap();

//     /* INTEREST INCOME */
//     let interest_income: f64 = conn.query_row(
//         "
//         SELECT COALESCE(SUM(total_amount),0)
//         FROM fund_transactions
//         WHERE type='ADD'
//         AND module_type='INTEREST'
//         AND date(created_at) BETWEEN ?1 AND ?2
//         ",
//         params![start_date, end_date],
//         |r: &Row| r.get(0)
//     ).map_err(|e| format!("Interest Income Error: {}", e))?;


//     /* PROCESSING FEE */
//     let processing_fee: f64 = conn.query_row(
//         "
//         SELECT COALESCE(SUM(total_amount),0)
//         FROM fund_transactions
//         WHERE type='ADD'
//         AND module_type='FEE'
//         AND date(created_at) BETWEEN ?1 AND ?2
//         ",
//         params![start_date, end_date],
//         |r: &Row| r.get(0)
//     ).map_err(|e| format!("Processing Fee Error: {}", e))?;


//     /* OTHER INCOME */
//     let other_income: f64 = conn.query_row(
//         "
//         SELECT COALESCE(SUM(total_amount),0)
//         FROM fund_transactions
//         WHERE type='ADD'
//         AND module_type NOT IN ('INTEREST','FEE')
//         AND date(created_at) BETWEEN ?1 AND ?2
//         ",
//         params![start_date, end_date],
//         |r: &Row| r.get(0)
//     ).map_err(|e| format!("Other Income Error: {}", e))?;


//     /* BUSINESS EXPENSES */
//     let business_expenses: f64 = conn.query_row(
//         "
//         SELECT COALESCE(SUM(amount),0)
//         FROM expenses
//         WHERE date(expense_date) BETWEEN ?1 AND ?2
//         ",
//         params![start_date, end_date],
//         |r: &Row| r.get(0)
//     ).map_err(|e| format!("Business Expenses Error: {}", e))?;


//     /* PLEDGE LOANS ISSUED */
//     // FIX: Changed to `loan_amount` and mapped date to `pledge_date` for backdated pledges
//     let pledge_loans_issued: f64 = conn.query_row(
//         "
//         SELECT COALESCE(SUM(loan_amount),0)
//         FROM pledges
//         WHERE date(COALESCE(pledge_date, created_at)) BETWEEN ?1 AND ?2
//         ",
//         params![start_date, end_date],
//         |r: &Row| r.get(0)
//     ).map_err(|e| format!("Pledge Loans Issued Error: {}", e))?;


//     /* PRINCIPAL RECEIVED */
//     let pledge_principal_received: f64 = conn.query_row(
//         "
//         SELECT COALESCE(SUM(amount),0)
//         FROM pledge_payments
//         WHERE payment_type='PRINCIPAL'
//         AND date(paid_at) BETWEEN ?1 AND ?2
//         ",
//         params![start_date, end_date],
//         |r: &Row| r.get(0)
//     ).map_err(|e| format!("Principal Received Error: {}", e))?;


//     /* PROFIT */
//     let total_income = interest_income + processing_fee + other_income;
//     let net_profit = total_income - business_expenses;


//     /* LOAN PORTFOLIO */
//     // FIX: Changed to `loan_amount`
//     let loan_portfolio: f64 = conn.query_row(
//         "
//         SELECT COALESCE(SUM(loan_amount),0)
//         FROM pledges
//         WHERE status='ACTIVE'
//         ",
//         [],
//         |r: &Row| r.get(0)
//     ).map_err(|e| format!("Loan Portfolio Error: {}", e))?;


//     /* INTEREST YIELD */
//     let interest_yield_percent = if loan_portfolio > 0.0 {
//         (interest_income / loan_portfolio) * 100.0
//     } else {
//         0.0
//     };


//     /* METAL PORTFOLIO */
//     let mut stmt = conn.prepare(
//         "
//         SELECT
//             mt.name,
//             SUM(CASE WHEN p.status='ACTIVE' THEN pi.net_weight ELSE 0 END),
//             SUM(CASE WHEN p.status='ACTIVE' THEN pi.gross_weight ELSE 0 END),
//             SUM(CASE WHEN p.status='CLOSED' THEN pi.net_weight ELSE 0 END),
//             SUM(CASE WHEN p.status='CLOSED' THEN pi.gross_weight ELSE 0 END)
//         FROM pledge_items pi
//         JOIN pledges p ON p.id = pi.pledge_id
//         JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
//         JOIN metal_types mt ON mt.id = jt.metal_type_id
//         GROUP BY mt.name
//         "
//     ).map_err(|e| format!("Metal Portfolio Prepare Error: {}", e))?;

//     let metal_iter = stmt.query_map([], |row: &Row| {
//         Ok(MetalSummary {
//             metal: row.get(0)?,
//             pledged_net_weight: row.get::<_, Option<f64>>(1)?.unwrap_or(0.0),
//             pledged_gross_weight: row.get::<_, Option<f64>>(2)?.unwrap_or(0.0),
//             closed_net_weight: row.get::<_, Option<f64>>(3)?.unwrap_or(0.0),
//             closed_gross_weight: row.get::<_, Option<f64>>(4)?.unwrap_or(0.0),
//         })
//     }).map_err(|e| format!("Metal Portfolio Query Error: {}", e))?;

//     let mut metals = Vec::new();
//     for m in metal_iter {
//         metals.push(m.map_err(|e| e.to_string())?);
//     }

//     Ok(ProfitLossReport {
//         interest_income,
//         processing_fee_income: processing_fee,
//         other_income,
//         business_expenses,
//         pledge_loans_issued,
//         pledge_principal_received,
//         loan_portfolio,
//         interest_yield_percent,
//         metals,
//         net_profit,
//     })
// }


// #[tauri::command]
// pub fn get_profit_loss_report_cmd(
//     db: tauri::State<Db>,
//     start_date: String,
//     end_date: String,
// ) -> Result<ProfitLossReport, String> {
//     get_profit_loss_report(db.inner(), start_date, end_date)
// }







use crate::db::connection::Db;
use rusqlite::{params, Row};
use serde::Serialize;

#[derive(Serialize)]
pub struct MetalSummary {
    pub metal: String,
    pub pledged_net_weight: f64,
    pub pledged_gross_weight: f64,
    pub closed_net_weight: f64,
    pub closed_gross_weight: f64,
}

#[derive(Serialize)]
pub struct ProfitLossReport {
    pub interest_income: f64,
    pub processing_fee_income: f64,
    pub other_income: f64,
    pub business_expenses: f64,
    pub investor_interest_paid: f64, // ✅ NEW: Financing cost expense
    pub pledge_loans_issued: f64,
    pub pledge_principal_received: f64,
    pub loan_portfolio: f64,
    pub interest_yield_percent: f64,
    pub metals: Vec<MetalSummary>,
    pub net_profit: f64,
}

pub fn get_profit_loss_report(
    db: &Db,
    start_date: String,
    end_date: String,
) -> Result<ProfitLossReport, String> {

    let conn = db.0.lock().unwrap();

    /* INTEREST INCOME */
    let interest_income: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(total_amount),0)
        FROM fund_transactions
        WHERE type='ADD'
        AND module_type='INTEREST'
        AND date(created_at) BETWEEN ?1 AND ?2
        ",
        params![start_date, end_date],
        |r: &Row| r.get(0)
    ).map_err(|e| format!("Interest Income Error: {}", e))?;


    /* PROCESSING FEE */
    let processing_fee: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(total_amount),0)
        FROM fund_transactions
        WHERE type='ADD'
        AND module_type='FEE'
        AND date(created_at) BETWEEN ?1 AND ?2
        ",
        params![start_date, end_date],
        |r: &Row| r.get(0)
    ).map_err(|e| format!("Processing Fee Error: {}", e))?;


    /* OTHER INCOME */
    let other_income: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(total_amount),0)
        FROM fund_transactions
        WHERE type='ADD'
        AND module_type NOT IN ('INTEREST','FEE')
        AND date(created_at) BETWEEN ?1 AND ?2
        ",
        params![start_date, end_date],
        |r: &Row| r.get(0)
    ).map_err(|e| format!("Other Income Error: {}", e))?;


    /* BUSINESS EXPENSES */
    let business_expenses: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(amount),0)
        FROM expenses
        WHERE date(expense_date) BETWEEN ?1 AND ?2
        ",
        params![start_date, end_date],
        |r: &Row| r.get(0)
    ).map_err(|e| format!("Business Expenses Error: {}", e))?;


    /* ✅ NEW: INVESTOR INTEREST PAYMENTS */
    let investor_interest_paid: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(ft.total_amount), 0)
        FROM investor_transactions it
        JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
        WHERE it.transaction_type = 'PROFIT_PAYMENT'
          AND date(ft.created_at) BETWEEN ?1 AND ?2
        ",
        params![start_date, end_date],
        |r: &Row| r.get(0)
    ).unwrap_or(0.0);


    /* PLEDGE LOANS ISSUED */
    let pledge_loans_issued: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(loan_amount),0)
        FROM pledges
        WHERE date(COALESCE(pledge_date, created_at)) BETWEEN ?1 AND ?2
        ",
        params![start_date, end_date],
        |r: &Row| r.get(0)
    ).map_err(|e| format!("Pledge Loans Issued Error: {}", e))?;


    /* PRINCIPAL RECEIVED */
    let pledge_principal_received: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(amount),0)
        FROM pledge_payments
        WHERE payment_type='PRINCIPAL'
        AND date(paid_at) BETWEEN ?1 AND ?2
        ",
        params![start_date, end_date],
        |r: &Row| r.get(0)
    ).map_err(|e| format!("Principal Received Error: {}", e))?;


    /* PROFIT CALCULATIONS */
    let total_income = interest_income + processing_fee + other_income;
    // ✅ Net Profit now correctly subtracts investor payouts as financing costs
    let net_profit = total_income - business_expenses - investor_interest_paid;


    /* LOAN PORTFOLIO */
    let loan_portfolio: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(loan_amount),0)
        FROM pledges
        WHERE status='ACTIVE'
        ",
        [],
        |r: &Row| r.get(0)
    ).map_err(|e| format!("Loan Portfolio Error: {}", e))?;


    /* INTEREST YIELD */
    let interest_yield_percent = if loan_portfolio > 0.0 {
        (interest_income / loan_portfolio) * 100.0
    } else {
        0.0
    };


    /* METAL PORTFOLIO */
    let mut stmt = conn.prepare(
        "
        SELECT
            mt.name,
            SUM(CASE WHEN p.status='ACTIVE' THEN pi.net_weight ELSE 0 END),
            SUM(CASE WHEN p.status='ACTIVE' THEN pi.gross_weight ELSE 0 END),
            SUM(CASE WHEN p.status='CLOSED' THEN pi.net_weight ELSE 0 END),
            SUM(CASE WHEN p.status='CLOSED' THEN pi.gross_weight ELSE 0 END)
        FROM pledge_items pi
        JOIN pledges p ON p.id = pi.pledge_id
        JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
        JOIN metal_types mt ON mt.id = jt.metal_type_id
        GROUP BY mt.name
        "
    ).map_err(|e| format!("Metal Portfolio Prepare Error: {}", e))?;

    let metal_iter = stmt.query_map([], |row: &Row| {
        Ok(MetalSummary {
            metal: row.get(0)?,
            pledged_net_weight: row.get::<_, Option<f64>>(1)?.unwrap_or(0.0),
            pledged_gross_weight: row.get::<_, Option<f64>>(2)?.unwrap_or(0.0),
            closed_net_weight: row.get::<_, Option<f64>>(3)?.unwrap_or(0.0),
            closed_gross_weight: row.get::<_, Option<f64>>(4)?.unwrap_or(0.0),
        })
    }).map_err(|e| format!("Metal Portfolio Query Error: {}", e))?;

    let mut metals = Vec::new();
    for m in metal_iter {
        metals.push(m.map_err(|e| e.to_string())?);
    }

    Ok(ProfitLossReport {
        interest_income,
        processing_fee_income: processing_fee,
        other_income,
        business_expenses,
        investor_interest_paid, // ✅ Passed to Struct
        pledge_loans_issued,
        pledge_principal_received,
        loan_portfolio,
        interest_yield_percent,
        metals,
        net_profit,
    })
}

#[tauri::command]
pub fn get_profit_loss_report_cmd(
    db: tauri::State<Db>,
    start_date: String,
    end_date: String,
) -> Result<ProfitLossReport, String> {
    get_profit_loss_report(db.inner(), start_date, end_date)
}