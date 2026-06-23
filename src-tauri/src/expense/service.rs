

// src-tauri/src/expense/service.rs

use crate::db::connection::Db;
use chrono::Local;
use rusqlite::{params, OptionalExtension, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

/* ============================================================
   STRUCTS
============================================================ */

#[derive(Serialize)]
pub struct Expense {
    pub id: i64,
    pub expense_code: String,
    pub category_name: String,
    pub description: Option<String>,
    pub payment_mode: String,
    pub amount: f64,
    pub expense_date: String,
    pub created_by_role: String,
    pub created_at: String,
    pub transaction_ref: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateExpenseRequest {
    pub category_id: i64,
    pub description: Option<String>,
    pub payment_mode: String,
    pub amount: f64,
    pub expense_date: String,
    pub created_by: i64,
    pub denominations: Option<HashMap<String, i64>>,
    pub transaction_ref: Option<String>,
}

#[derive(Serialize)]
pub struct ExpenseCategory {
    pub id: i64,
    pub name: String,
}

#[derive(Serialize)]
pub struct ExpenseStats {
    pub total_expense: f64,
    pub this_month_expense: f64,
    pub total_categories: i64,
    pub total_transactions: i64,
}

#[derive(Serialize)]
pub struct ExpenseCategoryFull {
    pub id: i64,
    pub name: String,
    pub is_active: i64,
}

/* ============================================================
   GENERATE EXPENSE CODE
============================================================ */

fn generate_expense_code(conn: &rusqlite::Connection) -> Result<String> {
    let current_year = Local::now().format("%Y").to_string();
    let pattern = format!("EXP-{}-%", current_year);

    let last_code: Option<String> = conn
        .query_row(
            "SELECT expense_code FROM expenses
             WHERE UPPER(expense_code) LIKE ?1
             ORDER BY id DESC LIMIT 1",
            [pattern],
            |row| row.get(0),
        )
        .optional()?;

    let next_number = if let Some(code) = last_code {
        let parts: Vec<&str> = code.split('-').collect();
        if parts.len() == 3 {
            parts[2].parse::<i64>().unwrap_or(0) + 1
        } else {
            1
        }
    } else {
        1
    };

    Ok(format!("EXP-{}-{:04}", current_year, next_number))
}

/* ============================================================
   CREATE EXPENSE
============================================================ */

#[tauri::command]
pub fn create_expense(db: State<Db>, req: CreateExpenseRequest) -> Result<String, String> {
    if req.amount <= 0.0 {
        return Err("Amount must be greater than zero".to_string());
    }

    let mut conn = db.0.lock().unwrap();

    // 🛡️ SECURITY: Fetch user's role to validate date constraints
    let user_role: String = conn
        .query_row(
            "SELECT role FROM users WHERE id = ?1",
            params![req.created_by],
            |row| row.get::<usize, String>(0), // ✅ Explicit type annotation
        )
        .map_err(|e| e.to_string())?;

    let today = Local::now().format("%Y-%m-%d").to_string();
    
    // Force staff to today's date; owners can still change the date if needed
    let expense_date = if user_role != "OWNER" {
        today
    } else {
        req.expense_date.clone()
    };

    let expense_code =
        generate_expense_code(&conn).map_err(|e| format!("Code generation failed: {}", e))?;

    let payment_mode = req.payment_mode.to_uppercase();

    // Normalise: frontend sends BANK_TRANSFER but DB allows BANK_TRANSFER
    let valid_modes = ["CASH", "UPI", "BANK_TRANSFER"];
    if !valid_modes.contains(&payment_mode.as_str()) {
        return Err(format!("Invalid payment mode: {}", payment_mode));
    }

    /* ---------- CASH VALIDATION ---------- */
    if payment_mode == "CASH" {
        let available_cash: f64 = conn
            .query_row(
                "SELECT IFNULL(SUM(
                    CASE WHEN type='ADD' THEN total_amount ELSE -total_amount END
                ),0) FROM fund_transactions WHERE payment_method='CASH'",
                [],
                |row| row.get::<usize, f64>(0), // ✅ Explicit type annotation
            )
            .map_err(|e| e.to_string())?;

        if available_cash < req.amount {
            return Err(format!(
                "Insufficient cash balance. Available: ₹{:.2}, Required: ₹{:.2}",
                available_cash, req.amount
            ));
        }

        if let Some(denoms) = &req.denominations {
            for (key, qty) in denoms {
                if *qty <= 0 { continue; }
                let denomination: i64 = if key == "coins" { 0 } else { key.parse::<i64>().unwrap_or(0) };
                let available_qty: i64 = conn
                    .query_row(
                        "SELECT IFNULL(SUM(
                            CASE WHEN ft.type='ADD' THEN fd.quantity ELSE -fd.quantity END
                        ),0)
                        FROM fund_denominations fd
                        JOIN fund_transactions ft ON fd.fund_transaction_id = ft.id
                        WHERE fd.denomination = ?1",
                        [denomination],
                        |row| row.get::<usize, i64>(0), // ✅ Explicit type annotation
                    )
                    .map_err(|e| e.to_string())?;

                if available_qty < *qty {
                    return Err(format!(
                        "Insufficient stock for ₹{}. Available: {}, Requested: {}",
                        if denomination == 0 { "Coins".to_string() } else { denomination.to_string() },
                        available_qty, qty
                    ));
                }
            }
        }
    }

    /* ---------- TRANSACTION ---------- */
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // ── INSERT EXPENSE ─────────────────────────────────────────────────────
    tx.execute(
        "INSERT INTO expenses (
            expense_code, category_id, description,
            payment_mode, amount, expense_date,
            created_by, transaction_ref
        ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![
            expense_code,
            req.category_id,
            req.description,
            payment_mode,
            req.amount,
            expense_date,
            req.created_by,
            req.transaction_ref,
        ],
    )
    .map_err(|e| e.to_string())?;

    let expense_id = tx.last_insert_rowid();

    // ── FUND TRANSACTION for CASH ──────────────────────────────────────────
    if payment_mode == "CASH" {
        let category_name: String = tx
            .query_row(
                "SELECT name FROM expense_categories WHERE id=?1",
                [req.category_id],
                |row| row.get::<usize, String>(0), // ✅ Explicit type annotation
            )
            .map_err(|e| e.to_string())?;

        let reference = format!(
            "{} - {} - {}",
            expense_code, category_name,
            req.description.as_deref().unwrap_or("No Description")
        );

        let trimmed_date = expense_date.trim();
        let created_at = if trimmed_date.contains('T') {
            trimmed_date.to_string()
        } else {
            format!(
                "{}T{}Z",
                trimmed_date,
                chrono::Utc::now().format("%H:%M:%S")
            )
        };

        tx.execute(
            "INSERT INTO fund_transactions (
                type,
                total_amount,
                module_type,
                module_id,
                reference,
                description,
                payment_method,
                transaction_ref,
                created_by,
                created_at
            )
            VALUES (
                'WITHDRAW',
                ?1,
                'EXPENSE',
                ?2,
                ?3,
                ?4,
                ?5,
                ?6,
                ?7,
                ?8
            )",
            params![
                req.amount,
                expense_id,
                reference,
                req.description.clone().unwrap_or_default(),
                "CASH",
                req.transaction_ref,
                req.created_by,
                created_at
            ],
        )
        .map_err(|e| e.to_string())?;

        let fund_tx_id = tx.last_insert_rowid();

        if let Some(denoms) = &req.denominations {
            for (key, qty) in denoms {
                if *qty <= 0 { continue; }
                let (denomination, amount) = if key == "coins" {
                    (0_i64, *qty as f64)
                } else {
                    let d = key.parse::<i64>().unwrap_or(0);
                    if d == 0 { continue; }
                    (d, (d * qty) as f64)
                };
                tx.execute(
                    "INSERT INTO fund_denominations
                     (fund_transaction_id,denomination,quantity,amount)
                     VALUES (?1,?2,?3,?4)",
                    params![fund_tx_id, denomination, qty, amount],
                )
                .map_err(|e| e.to_string())?;
            }
        }

    // ── FUND TRANSACTION for UPI / BANK_TRANSFER ──────────────────────────
    } else {
        let category_name: String = tx
            .query_row(
                "SELECT name FROM expense_categories WHERE id=?1",
                [req.category_id],
                |row| row.get::<usize, String>(0), // ✅ Explicit type annotation
            )
            .map_err(|e| e.to_string())?;

        let reference = format!(
            "{} - {} - {}",
            expense_code, category_name,
            req.description.as_deref().unwrap_or("No Description")
        );

        let trimmed_date = expense_date.trim();
        let created_at = if trimmed_date.contains('T') {
            trimmed_date.to_string()
        } else {
            format!(
                "{}T{}Z",
                trimmed_date,
                chrono::Utc::now().format("%H:%M:%S")
            )
        };

        tx.execute(
            "INSERT INTO fund_transactions (
                type, total_amount, module_type, module_id,
                reference, payment_method, transaction_ref, created_by,
                created_at
            ) VALUES ('WITHDRAW',?1,'EXPENSE',?2,?3,?4,?5,?6,?7)",
            params![
                req.amount,
                expense_id,
                reference,
                payment_mode,
                req.transaction_ref,
                req.created_by,
                created_at
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(expense_code)
}

/* ============================================================
   GET EXPENSES
============================================================ */

#[tauri::command]
pub fn get_expenses(db: State<Db>) -> Result<Vec<Expense>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT
                e.id,
                e.expense_code,
                ec.name,
                e.description,
                e.payment_mode,
                e.amount,
                e.expense_date,
                u.role,
                e.created_at,
                e.transaction_ref
             FROM expenses e
             JOIN expense_categories ec ON e.category_id = ec.id
             JOIN users u ON e.created_by = u.id
             ORDER BY e.expense_date DESC",
        )
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Expense {
                id:               row.get::<usize, i64>(0)?,
                expense_code:     row.get::<usize, String>(1)?,
                category_name:    row.get::<usize, String>(2)?,
                description:      row.get::<usize, Option<String>>(3)?,
                payment_mode:     row.get::<usize, String>(4)?,
                amount:           row.get::<usize, f64>(5)?,
                expense_date:     row.get::<usize, String>(6)?,
                created_by_role:  row.get::<usize, String>(7)?,
                created_at:       row.get::<usize, String>(8)?,
                transaction_ref:  row.get::<usize, Option<String>>(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut expenses = Vec::new();
    for exp in iter {
        expenses.push(exp.map_err(|e| e.to_string())?);
    }

    Ok(expenses)
}

/* ============================================================
   DELETE EXPENSE
============================================================ */

#[tauri::command]
pub fn delete_expense(db: State<Db>, expense_id: i64, actor_user_id: i64) -> Result<(), String> {
    let mut conn = db.0.lock().unwrap();

    let role: String = conn
        .query_row("SELECT role FROM users WHERE id=?1", [actor_user_id], |row| row.get::<usize, String>(0))
        .map_err(|e| e.to_string())?;

    if role != "OWNER" {
        return Err("Only OWNER can delete expenses".to_string());
    }

    // Verify the expense exists before proceeding
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM expenses WHERE id=?1)",
            [expense_id],
            |row| row.get::<usize, bool>(0)
        )
        .unwrap_or(false);

    if !exists {
        return Err("Expense not found".to_string());
    }

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Delete associated cash denominations tied to this expense's fund transaction
    tx.execute(
        "DELETE FROM fund_denominations 
         WHERE fund_transaction_id IN (
             SELECT id FROM fund_transactions WHERE module_type='EXPENSE' AND module_id=?1
         )",
        params![expense_id],
    ).map_err(|e| e.to_string())?;

    // Physically delete the fund transactions so it doesn't leave orphans messing up the ledger
    tx.execute(
        "DELETE FROM fund_transactions 
         WHERE module_type='EXPENSE' AND module_id=?1",
        params![expense_id],
    ).map_err(|e| e.to_string())?;

    // Finally, delete the expense record itself
    tx.execute("DELETE FROM expenses WHERE id=?1", params![expense_id])
        .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

/* ============================================================
   GET EXPENSE CATEGORIES
============================================================ */

#[tauri::command]
pub fn get_expense_categories(db: State<Db>) -> Result<Vec<ExpenseCategoryFull>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare("SELECT id, name, is_active FROM expense_categories ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(ExpenseCategoryFull { 
                id: row.get::<usize, i64>(0)?, 
                name: row.get::<usize, String>(1)?, 
                is_active: row.get::<usize, i64>(2)? 
            })
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for cat in iter { out.push(cat.map_err(|e| e.to_string())?); }
    Ok(out)
}


#[tauri::command]
pub fn update_expense_category(db: State<Db>, id: i64, name: String) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    
    // Check for unique name constraints during update
    match conn.execute("UPDATE expense_categories SET name=?1 WHERE id=?2", params![name.trim(), id]) {
        Ok(_) => Ok(()),
        Err(e) => {
            if e.to_string().contains("UNIQUE") {
                Err("Category name already exists".into())
            } else {
                Err(e.to_string())
            }
        }
    }
}

#[tauri::command]
pub fn toggle_expense_category_status(
    db: State<Db>, id: i64, is_active: i32,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute("UPDATE expense_categories SET is_active=?1 WHERE id=?2", params![is_active, id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/* ============================================================
   CREATE EXPENSE CATEGORY
============================================================ */

#[tauri::command]
pub fn create_expense_category(db: State<Db>, name: String) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    match conn.execute("INSERT INTO expense_categories (name,is_active) VALUES (?1,1)", [&name]) {
        Ok(_) => Ok(()),
        Err(e) => {
            if e.to_string().contains("UNIQUE") {
                Err("Category already exists".into())
            } else {
                Err(e.to_string())
            }
        }
    }
}

/* ============================================================
   EXPENSE STATS
============================================================ */

#[tauri::command]
pub fn get_expense_stats(db: State<Db>) -> Result<ExpenseStats, String> {
    let conn = db.0.lock().unwrap();

    let total_expense: f64 = conn
        .query_row("SELECT IFNULL(SUM(amount),0) FROM expenses", [], |row| row.get::<usize, f64>(0))
        .map_err(|e| e.to_string())?;

    let this_month_expense: f64 = conn
        .query_row(
            "SELECT IFNULL(SUM(amount),0) FROM expenses
             WHERE strftime('%Y-%m',expense_date)=strftime('%Y-%m','now')",
            [], |row| row.get::<usize, f64>(0),
        )
        .map_err(|e| e.to_string())?;

    let total_categories: i64 = conn
        .query_row("SELECT COUNT(*) FROM expense_categories WHERE is_active=1", [], |row| row.get::<usize, i64>(0))
        .map_err(|e| e.to_string())?;

    let total_transactions: i64 = conn
        .query_row("SELECT COUNT(*) FROM expenses", [], |row| row.get::<usize, i64>(0))
        .map_err(|e| e.to_string())?;

    Ok(ExpenseStats { total_expense, this_month_expense, total_categories, total_transactions })
}