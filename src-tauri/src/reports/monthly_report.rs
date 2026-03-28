use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct MonthlyReport {

    pub month: String,

    pub total_loans_issued: f64,
    pub total_loan_repayments: f64,

    pub total_interest_collected: f64,
    pub total_expenses: f64,

    pub net_profit: f64,
}


pub fn get_monthly_report(
    db: &Db,
    month: String,
) -> Result<MonthlyReport,String>{

    let conn = db.0.lock().unwrap();

    let start = format!("{}-01",month);
    let end   = format!("{}-31",month);



    /* ------------------------
       LOANS ISSUED
    -------------------------*/

    let total_loans_issued:f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(loan_amount),0)
        FROM pledges
        WHERE date(created_at) BETWEEN ?1 AND ?2
        ",
        params![start,end],
        |r| r.get(0)
    ).unwrap_or(0.0);



    /* ------------------------
       LOAN REPAYMENTS
    -------------------------*/

    let total_loan_repayments:f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(amount),0)
        FROM pledge_payments
        WHERE payment_type='PRINCIPAL'
        AND date(paid_at) BETWEEN ?1 AND ?2
        ",
        params![start,end],
        |r| r.get(0)
    ).unwrap_or(0.0);



    /* ------------------------
       INTEREST COLLECTED
    -------------------------*/

    let total_interest_collected:f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(total_amount),0)
        FROM fund_transactions
        WHERE module_type='INTEREST'
        AND type='ADD'
        AND date(created_at) BETWEEN ?1 AND ?2
        ",
        params![start,end],
        |r| r.get(0)
    ).unwrap_or(0.0);



    /* ------------------------
       EXPENSES
    -------------------------*/

    let total_expenses:f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(amount),0)
        FROM expenses
        WHERE date(expense_date) BETWEEN ?1 AND ?2
        ",
        params![start,end],
        |r| r.get(0)
    ).unwrap_or(0.0);



    /* ------------------------
       NET PROFIT
    -------------------------*/

    let net_profit = total_interest_collected - total_expenses;



    Ok(MonthlyReport{

        month,

        total_loans_issued,
        total_loan_repayments,

        total_interest_collected,
        total_expenses,

        net_profit

    })

}



#[tauri::command]
pub fn get_monthly_report_cmd(
    db: tauri::State<Db>,
    month:String
)->Result<MonthlyReport,String>{

    get_monthly_report(db.inner(),month)

}