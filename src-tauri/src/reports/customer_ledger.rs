use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct LedgerRow {
    pub pledge_id: i64,
    pub pledge_no: String,
    pub date: String,
    pub description: String,
    pub debit: f64,
    pub credit: f64,
    pub balance: f64,
}

#[derive(serde::Serialize)]
pub struct CustomerLedgerReport {
    pub customer_name: String,
    pub customer_code: String,
    pub rows: Vec<LedgerRow>,
}

pub fn get_customer_ledger_report(
    db: &Db,
    customer_code: String,
) -> Result<CustomerLedgerReport, String> {

    let conn = db.0.lock().unwrap();

    // Get customer details
    let (customer_id, customer_name, customer_code):(i64,String,String) =
        conn.query_row(
            "SELECT id,name,customer_code FROM customers WHERE customer_code=?1",
            params![customer_code],
            |row| Ok((row.get(0)?,row.get(1)?,row.get(2)?))
        )
        .map_err(|e| e.to_string())?;

    let mut rows: Vec<LedgerRow> = Vec::new();

    // =========================
    // LOAN ISSUED
    // =========================

    let mut stmt = conn.prepare(
        "
        SELECT 
            p.id,
            p.created_at,
            p.pledge_no,
            p.loan_amount,
            mt.name
        FROM pledges p
        JOIN pledge_items pi ON pi.pledge_id = p.id
        JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
        JOIN metal_types mt ON mt.id = jt.metal_type_id
        WHERE p.customer_id=?1
        GROUP BY p.id
        ORDER BY p.created_at ASC
        "
    ).map_err(|e| e.to_string())?;

    let pledge_iter = stmt.query_map(params![customer_id], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, f64>(3)?,
            row.get::<_, String>(4)?,
        ))
    }).map_err(|e| e.to_string())?;

    for p in pledge_iter {

        let (pledge_id, date, pledge_no, amount, metal) =
            p.map_err(|e| e.to_string())?;

        rows.push(LedgerRow {
            pledge_id,
            pledge_no,
            date,
            description: format!("Loan Issued ({})", metal),
            debit: amount,
            credit: 0.0,
            balance: 0.0,
        });

    }

    // =========================
    // PAYMENTS
    // =========================

    let mut stmt = conn.prepare(
        "
        SELECT 
            pp.paid_at,
            pp.payment_type,
            pp.amount,
            p.pledge_no,
            p.id
        FROM pledge_payments pp
        JOIN pledges p ON p.id = pp.pledge_id
        WHERE p.customer_id=?1
        ORDER BY pp.paid_at ASC
        "
    ).map_err(|e| e.to_string())?;

    let pay_iter = stmt.query_map(params![customer_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, f64>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, i64>(4)?,
        ))
    }).map_err(|e| e.to_string())?;

    for p in pay_iter {

        let (date, ptype, amount, pledge_no, pledge_id) =
            p.map_err(|e| e.to_string())?;

        rows.push(LedgerRow {
            pledge_id,
            pledge_no,
            date,
            description: format!("Payment {}", ptype),
            debit: 0.0,
            credit: amount,
            balance: 0.0,
        });

    }

    // =========================
    // SORT BY DATE
    // =========================

    rows.sort_by(|a, b| a.date.cmp(&b.date));

    // =========================
    // RUNNING BALANCE
    // =========================

    let mut balance = 0.0;

    for r in rows.iter_mut() {
        balance += r.debit;
        balance -= r.credit;
        r.balance = balance;
    }

    Ok(CustomerLedgerReport {
        customer_name,
        customer_code,
        rows,
    })
}

#[tauri::command]
pub fn get_customer_ledger_report_cmd(
    db: tauri::State<Db>,
    customer_code: String,
) -> Result<CustomerLedgerReport, String> {

    get_customer_ledger_report(db.inner(), customer_code)

}