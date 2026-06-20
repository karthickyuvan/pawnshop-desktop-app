use crate::db::connection::Db;
use tauri::State;
use rusqlite::params;
use chrono::{Datelike, Local, NaiveDate};

#[derive(serde::Serialize)]
pub struct StaffSalaryReportRow {
    pub staff_id: i64,
    pub username: String,
    pub full_name: Option<String>,
    pub monthly_salary: f64,
    pub joining_date: Option<String>,
    pub months_worked: i64,
    pub total_earned: f64,
    pub total_paid: f64,
    pub unsettled_advances: f64,
    pub unpaid_dues: f64,
    pub is_active: bool,
}

#[derive(serde::Serialize)]
pub struct GlobalSalaryAdvanceRow {
    pub id: i64,
    pub staff_name: String,
    pub advance_date: String,
    pub amount: f64,
    pub payment_mode: String,
    pub remarks: Option<String>,
    pub status: String, // "UNSETTLED" or "CLEARED"
}

#[derive(serde::Serialize)]
pub struct GlobalSalaryPaymentRow {
    pub id: i64,
    pub staff_name: String,
    pub salary_month: String,
    pub gross_salary: f64,
    pub advance_amount: f64,
    pub net_salary: f64,
    pub payment_mode: String,
    pub paid_at: String,
    pub remarks: Option<String>,
}

#[derive(serde::Serialize)]
pub struct StaffSalaryReport {
    pub total_monthly_payroll: f64,
    pub total_paid_to_date: f64,
    pub total_unsettled_advances: f64,
    pub total_unpaid_salary_dues: f64,
    pub staff_rows: Vec<StaffSalaryReportRow>,
    pub advances: Vec<GlobalSalaryAdvanceRow>,
    pub payments: Vec<GlobalSalaryPaymentRow>,
}

pub fn get_staff_salary_report(db: &Db) -> Result<StaffSalaryReport, String> {
    let conn = db.0.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 1. Fetch all staff members
    let mut stmt = conn
        .prepare(
            "SELECT id, username, full_name, monthly_salary, COALESCE(joining_date, date('now')), is_active 
             FROM users 
             WHERE role = 'STAFF'
             ORDER BY full_name ASC, username ASC"
        )
        .map_err(|e| e.to_string())?;

    let staff_raw = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, f64>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, i32>(5)? == 1,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut staff_rows = Vec::new();
    let mut total_monthly_payroll = 0.0;
    let mut total_paid_to_date = 0.0;
    let mut total_unsettled_advances = 0.0;
    let mut total_unpaid_salary_dues = 0.0;

    for s in staff_raw {
        let (id, username, full_name, monthly_salary, joining_date, is_active) = s.map_err(|e| e.to_string())?;

        // Calculate months worked
        let months_worked: i64 = conn
            .query_row(
                "SELECT 
                    (strftime('%Y', 'now') - strftime('%Y', ?1)) * 12
                    + (strftime('%m', 'now') - strftime('%m', ?1))
                    - CASE 
                        WHEN CAST(strftime('%d', 'now') AS INTEGER) 
                           < CAST(strftime('%d', ?1) AS INTEGER)
                        THEN 1 ELSE 0
                      END",
                params![joining_date],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let months_worked = std::cmp::max(0, months_worked);
        let total_earned = monthly_salary * months_worked as f64;

        // Fetch total already paid
        let total_paid: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(net_salary), 0.0) FROM staff_salary_payments WHERE user_id = ?1",
                params![id],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        // Fetch current unsettled advances
        let unsettled_advances: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(amount), 0.0) FROM staff_salary_advances WHERE user_id = ?1 AND salary_payment_id IS NULL",
                params![id],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        let unpaid_dues = (total_earned - total_paid - unsettled_advances).max(0.0);

        // Accumulate global KPIs
        if is_active {
            total_monthly_payroll += monthly_salary;
        }
        total_paid_to_date += total_paid;
        total_unsettled_advances += unsettled_advances;
        total_unpaid_salary_dues += unpaid_dues;

        staff_rows.push(StaffSalaryReportRow {
            staff_id: id,
            username,
            full_name,
            monthly_salary,
            joining_date: Some(joining_date),
            months_worked,
            total_earned,
            total_paid,
            unsettled_advances,
            unpaid_dues,
            is_active,
        });
    }

    drop(stmt);

    // 2. Fetch all chronological salary advances
    let mut adv_stmt = conn.prepare(
        "
        SELECT 
            sa.id,
            COALESCE(u.full_name, u.username) as staff_name,
            sa.advance_date,
            sa.amount,
            sa.payment_mode,
            sa.remarks,
            CASE WHEN sa.salary_payment_id IS NULL THEN 'UNSETTLED' ELSE 'CLEARED' END as status
        FROM staff_salary_advances sa
        JOIN users u ON u.id = sa.user_id
        ORDER BY sa.advance_date DESC, sa.id DESC
        "
    ).map_err(|e| e.to_string())?;

    let adv_iter = adv_stmt.query_map([], |row| {
        Ok(GlobalSalaryAdvanceRow {
            id: row.get(0)?,
            staff_name: row.get(1)?,
            advance_date: row.get(2)?,
            amount: row.get(3)?,
            payment_mode: row.get(4)?,
            remarks: row.get(5)?,
            status: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut advances = Vec::new();
    for a in adv_iter {
        advances.push(a.map_err(|e| e.to_string())?);
    }

    drop(adv_stmt);

    // 3. Fetch all chronological payroll settlements
    let mut pay_stmt = conn.prepare(
        "
        SELECT 
            sp.id,
            COALESCE(u.full_name, u.username) as staff_name,
            sp.salary_month,
            sp.gross_salary,
            sp.advance_amount,
            sp.net_salary,
            sp.payment_mode,
            datetime(sp.created_at, 'localtime'),
            sp.remarks
        FROM staff_salary_payments sp
        JOIN users u ON u.id = sp.user_id
        ORDER BY sp.salary_month DESC, sp.id DESC
        "
    ).map_err(|e| e.to_string())?;

    let pay_iter = pay_stmt.query_map([], |row| {
        Ok(GlobalSalaryPaymentRow {
            id: row.get(0)?,
            staff_name: row.get(1)?,
            salary_month: row.get(2)?,
            gross_salary: row.get(3)?,
            advance_amount: row.get(4)?,
            net_salary: row.get(5)?,
            payment_mode: row.get(6)?,
            paid_at: row.get(7)?,
            remarks: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut payments = Vec::new();
    for p in pay_iter {
        payments.push(p.map_err(|e| e.to_string())?);
    }

    Ok(StaffSalaryReport {
        total_monthly_payroll,
        total_paid_to_date,
        total_unsettled_advances,
        total_unpaid_salary_dues,
        staff_rows,
        advances,
        payments,
    })
}

#[tauri::command]
pub fn get_staff_salary_report_cmd(
    db: tauri::State<Db>,
) -> Result<StaffSalaryReport, String> {
    get_staff_salary_report(db.inner())
}