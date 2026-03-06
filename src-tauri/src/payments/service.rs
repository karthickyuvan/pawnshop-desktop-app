

use crate::db::connection::Db;
use chrono::Local;
use rusqlite::params;
use serde::Serialize;
use tauri::State;
use rusqlite::params_from_iter;

#[derive(Serialize)]
pub struct PaymentHistoryItem {
    pub receipt_no: String,
    pub time: String,
    pub pledge_no: String,
    pub customer_name: String,
    pub payment_type: String,
    pub payment_mode: String,
    pub amount: f64,
    pub collected_by: String,
}

#[derive(Serialize)]
pub struct PledgeSearchItem {
    pub id: i64,
    pub pledge_no: String,
    pub customer_name: String,
    pub phone: String,
    pub is_overdue: bool,
}

#[derive(Serialize)]
pub struct PaymentHistoryResponse {
    pub total_collected: f64,
    pub payments: Vec<PaymentHistoryItem>,
}

#[derive(Serialize)]
pub struct PledgePaymentDetails {
    pub pledge_id: i64,
    pub pledge_no: String,
    pub customer_name: String,
    pub phone: String,
    pub loan_amount: f64,
    pub interest_rate: f64,
    pub created_at: String,
    pub total_interest_paid: f64,
    pub pending_interest: f64,
    pub photo_path: Option<String>,
    pub address: Option<String>,
    pub relation: Option<String>,
    pub customer_code: String,
}

#[tauri::command]
pub fn get_today_payment_history(db: State<Db>) -> Result<PaymentHistoryResponse, String> {
    let db = db.inner();
    let today = Local::now().format("%Y-%m-%d").to_string();
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "
        SELECT 
            COALESCE(p.receipt_no, CAST(p.id AS TEXT)) as receipt_no,
            strftime('%H:%M', p.paid_at),
            pl.pledge_no,
            c.name,
            p.payment_type,
            p.payment_mode,
            p.amount,
            u.username
        FROM pledge_payments p
        JOIN pledges pl ON p.pledge_id = pl.id
        JOIN customers c ON pl.customer_id = c.id
        JOIN users u ON p.created_by = u.id
        WHERE date(p.paid_at) = ?
        ORDER BY p.paid_at DESC
        ",
        )
        .map_err(|e| e.to_string())?;

    let payment_iter = stmt
        .query_map(params![today], |row| {
            Ok(PaymentHistoryItem {
                receipt_no: row.get::<_, String>(0)?,
                time: row.get::<_, String>(1)?,
                pledge_no: row.get::<_, String>(2)?,
                customer_name: row.get::<_, String>(3)?,
                payment_type: row.get::<_, String>(4)?,
                payment_mode: row.get::<_, String>(5)?,
                amount: row.get::<_, f64>(6)?,
                collected_by: row.get::<_, String>(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut payments = Vec::new();
    let mut total = 0.0;

    for payment in payment_iter {
        let p = payment.map_err(|e| e.to_string())?;
        total += p.amount;
        payments.push(p);
    }

    Ok(PaymentHistoryResponse {
        total_collected: total,
        payments,
    })
}

#[tauri::command]
pub fn search_pledges(db: State<Db>, query: String) -> Result<Vec<PledgeSearchItem>, String> {
    let db = db.inner();
    let conn = db.0.lock().unwrap();

    let search_term = format!("%{}%", query);

    let mut stmt = conn
        .prepare(
            "
        SELECT 
            p.id,
            p.pledge_no,
            c.name,
            c.phone,
            0 as is_overdue
        FROM pledges p
        JOIN customers c ON p.customer_id = c.id
        WHERE 
            p.pledge_no LIKE ?
            OR c.name LIKE ?
            OR c.phone LIKE ?
        ORDER BY p.created_at DESC
        LIMIT 10
        ",
        )
        .map_err(|e| e.to_string())?;

    let results = stmt
        .query_map(params![search_term, search_term, search_term], |row| {
            Ok(PledgeSearchItem {
                id: row.get::<_, i64>(0)?,
                pledge_no: row.get::<_, String>(1)?,
                customer_name: row.get::<_, String>(2)?,
                phone: row.get::<_, String>(3)?,
                is_overdue: row.get::<_, i64>(4)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for r in results {
        items.push(r.map_err(|e| e.to_string())?);
    }

    Ok(items)
}

#[tauri::command]
pub fn get_quick_access_pledges(db: State<Db>) -> Result<Vec<PledgeSearchItem>, String> {
    let db = db.inner();
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "
        SELECT 
            p.id,
            p.pledge_no,
            c.name,
            c.phone,
            0 as is_overdue
        FROM pledges p
        JOIN customers c ON p.customer_id = c.id
        ORDER BY p.created_at DESC
        LIMIT 5
        ",
        )
        .map_err(|e| e.to_string())?;

    let results = stmt
        .query_map([], |row| {
            Ok(PledgeSearchItem {
                id: row.get::<_, i64>(0)?,
                pledge_no: row.get::<_, String>(1)?,
                customer_name: row.get::<_, String>(2)?,
                phone: row.get::<_, String>(3)?,
                is_overdue: row.get::<_, i64>(4)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for r in results {
        items.push(r.map_err(|e| e.to_string())?);
    }

    Ok(items)
}

#[tauri::command]
pub fn get_payment_history(
    db: State<Db>,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<PaymentHistoryResponse, String> {
    let db = db.inner();
    let conn = db.0.lock().unwrap();

    let mut query = "
        SELECT 
            COALESCE(pp.receipt_no, CAST(pp.id AS TEXT)) as receipt_no,
            strftime('%H:%M', pp.paid_at) as time,
            pl.pledge_no,
            c.name,
            pp.payment_type,
            pp.payment_mode,
            pp.amount,
            u.username
        FROM pledge_payments pp
        JOIN pledges pl ON pp.pledge_id = pl.id
        JOIN customers c ON pl.customer_id = c.id
        JOIN users u ON pp.created_by = u.id
        WHERE 1=1
    "
    .to_string();

    let mut params: Vec<String> = vec![];

    if let Some(start) = start_date {
        query.push_str(" AND date(pp.paid_at) >= ?");
        params.push(start);
    }

    if let Some(end) = end_date {
        query.push_str(" AND date(pp.paid_at) <= ?");
        params.push(end);
    }

    query.push_str(" ORDER BY pp.paid_at DESC");

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let payment_iter = stmt
        .query_map(params_from_iter(params.iter()), |row| {
            Ok(PaymentHistoryItem {
                receipt_no: row.get::<_, String>(0)?,
                time: row.get::<_, String>(1)?,
                pledge_no: row.get::<_, String>(2)?,
                customer_name: row.get::<_, String>(3)?,
                payment_type: row.get::<_, String>(4)?,
                payment_mode: row.get::<_, String>(5)?,
                amount: row.get::<_, f64>(6)?,
                collected_by: row.get::<_, String>(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut payments = Vec::new();
    let mut total = 0.0;

    for payment in payment_iter {
        let p = payment.map_err(|e| e.to_string())?;
        total += p.amount;
        payments.push(p);
    }

    Ok(PaymentHistoryResponse {
        total_collected: total,
        payments,
    })
}