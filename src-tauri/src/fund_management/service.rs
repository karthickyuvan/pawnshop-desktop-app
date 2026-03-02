use crate::db::connection::Db;
use rusqlite::{params, Error, Result, Row};
use std::collections::HashMap;

/// ===============================
/// Drawer total
/// ===============================
pub fn get_available_cash(db: &Db) -> Result<f64> {
    let conn = db.0.lock().unwrap();
    conn.query_row(
        "
        SELECT
            COALESCE(SUM(CASE WHEN type='ADD' THEN total_amount ELSE 0 END), 0)
          - COALESCE(SUM(CASE WHEN type='WITHDRAW' THEN total_amount ELSE 0 END), 0)
        FROM fund_transactions
        ",
        [],
        |row: &Row| row.get(0),
    )
}

/// ===============================
/// Internal save
/// ===============================
fn save_fund_transaction(
    db: &Db,
    tx_type: &str, // "ADD" or "WITHDRAW"
    reason: String,
    created_by: i64,
    payment_method: String,
    transaction_ref: Option<String>,
    amount: f64,
    denominations: Vec<(i32, i32)>,
) -> Result<()> {
    // 1️⃣ Basic Validation
    if amount <= 0.0 {
        return Err(Error::InvalidQuery);
    }

    // 2️⃣ Cash Validation
    if payment_method == "CASH" {
        if denominations.is_empty() {
            return Err(Error::InvalidQuery);
        }

        let calc_total: f64 = denominations
            .iter()
            .map(|(d, q)| (*d as f64) * (*q as f64))
            .sum();

        if (calc_total - amount).abs() > 0.01 {
            return Err(Error::InvalidQuery);
        }
    }

    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction()?;

    // 3️⃣ Withdraw balance check
    if tx_type == "WITHDRAW" {
        let balance: f64 = tx.query_row(
            "
            SELECT
                COALESCE(SUM(CASE WHEN type='ADD' THEN total_amount ELSE 0 END), 0)
              - COALESCE(SUM(CASE WHEN type='WITHDRAW' THEN total_amount ELSE 0 END), 0)
            FROM fund_transactions
            ",
            [],
            |row: &Row| row.get(0),
        )?;

        if amount > balance {
            return Err(Error::InvalidQuery);
        }
    }

    // 4️⃣ Insert Transaction (CORRECTED)
    tx.execute(
        "
        INSERT INTO fund_transactions
        (
            type,
            total_amount,
            module_type,
            module_id,
            reference,
            payment_method,
            transaction_ref,
            created_by
        )
        VALUES (?1, ?2, 'CAPITAL', NULL, ?3, ?4, ?5, ?6)
        ",
        params![
            tx_type,
            amount,
            reason,            // now stored in reference
            payment_method,
            transaction_ref,
            created_by
        ],
    )?;

    let fund_tx_id = tx.last_insert_rowid();

    // 5️⃣ Insert Denominations
    for (denom, qty) in denominations {
        let line_amount = denom as f64 * qty as f64;

        tx.execute(
            "
            INSERT INTO fund_denominations
            (fund_transaction_id, denomination, quantity, amount)
            VALUES (?1, ?2, ?3, ?4)
            ",
            params![fund_tx_id, denom, qty, line_amount],
        )?;
    }

    tx.commit()?;
    Ok(())
}

/// ===============================
/// OWNER APIs
/// ===============================
pub fn add_fund(
    db: &Db,
    created_by: i64,
    reason: String,
    payment_method: String,
    transaction_ref: Option<String>,
    amount: f64,
    denominations: Vec<(i32, i32)>,
) -> Result<()> {
    save_fund_transaction(
        db,
        "ADD",
        reason,
        created_by,
        payment_method,
        transaction_ref,
        amount,
        denominations,
    )
}

pub fn withdraw_fund(
    db: &Db,
    created_by: i64,
    reason: String,
    payment_method: String,
    transaction_ref: Option<String>,
    amount: f64,
    denominations: Vec<(i32, i32)>,
) -> Result<()> {
    save_fund_transaction(
        db,
        "WITHDRAW",
        reason,
        created_by,
        payment_method,
        transaction_ref,
        amount,
        denominations,
    )
}

pub fn get_fund_ledger(db: &Db) -> Result<Vec<(i64, String, f64, String, String, String)>> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "
        SELECT
            id,
            type,
            total_amount,
            COALESCE(reference, ''),
            created_at,
            COALESCE(payment_method, 'CASH') -- 6th Column
        FROM fund_transactions
        ORDER BY created_at DESC
        ",
    )?;

    let rows = stmt.query_map([], |row: &Row| {
        Ok((
            row.get(0)?,
            row.get(1)?,
            row.get(2)?,
            row.get(3)?,
            row.get(4)?,
            row.get(5)?,
        ))
    })?;

    let mut result = Vec::new();
    for r in rows {
        result.push(r?);
    }

    Ok(result)
}

pub fn get_current_denominations(db: &Db) -> Result<Vec<(i32, i32)>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "
        SELECT
            fd.denomination,
            COALESCE(SUM(
                CASE
                    WHEN ft.type = 'ADD' THEN fd.quantity
                    WHEN ft.type = 'WITHDRAW' THEN -fd.quantity
                END
            ), 0) as balance_qty
        FROM fund_denominations fd
        JOIN fund_transactions ft
            ON fd.fund_transaction_id = ft.id
        GROUP BY fd.denomination
        ",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| Ok((row.get::<_, i32>(0)?, row.get::<_, i32>(1)?)))
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for r in rows {
        result.push(r.map_err(|e| e.to_string())?);
    }

    Ok(result)
}
