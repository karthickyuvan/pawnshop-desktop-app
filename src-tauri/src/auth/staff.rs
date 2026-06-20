use crate::auth::password::hash_password;
use crate::db::connection::Db;
use rusqlite::{params, Transaction, OptionalExtension};
use serde::Serialize;
use chrono::Local;

#[derive(serde::Serialize)]
pub struct StaffUser {
    pub id: i64,
    pub username: String,
    pub full_name: Option<String>,
    pub monthly_salary: f64,
    pub joining_date: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Serialize)]
pub struct StaffSalaryAdvance {
    pub id: i64,
    pub user_id: i64,
    pub advance_date: String,
    pub amount: f64,
    pub payment_mode: String,
    pub transaction_ref: Option<String>,
    pub remarks: Option<String>,
    pub salary_payment_id: Option<i64>,
    
}

#[derive(Debug, Serialize)]
pub struct SalarySettlementSummary {
    pub gross_salary: f64,          // monthly salary
    pub months_worked: i64,         // completed months since joining
    pub total_salary_due: f64,      // months_worked × gross_salary
    pub total_paid: f64,            // sum of all past net_salary payments
    pub advance_amount: f64,        // current unsettled advances
    pub net_payable: f64,           // total_salary_due - total_paid - advance_amount
}


#[derive(Debug, Serialize)]
pub struct PastSalaryPaymentRow {
    pub id: i64,
    pub salary_month: String,
    pub gross_salary: f64,
    pub advance_amount: f64,
    pub net_salary: f64,
    pub payment_mode: String,
    pub transaction_ref: Option<String>,
    pub remarks: Option<String>,
    pub created_at: String,
}



/* ============================================================
   INTERNAL UTILITY HOOKS
============================================================ */

fn get_or_create_expense_category(tx: &Transaction, category_name: &str) -> rusqlite::Result<i64> {
    let id_opt: Option<i64> = tx
        .query_row(
            "SELECT id FROM expense_categories WHERE name = ?1",
            [category_name],
            |row| row.get(0),
        )
        .optional()?;

    if let Some(existing_id) = id_opt {
        Ok(existing_id)
    } else {
        tx.execute(
            "INSERT INTO expense_categories (name, is_active) VALUES (?1, 1)",
            [category_name],
        )?;
        Ok(tx.last_insert_rowid())
    }
}

fn generate_automated_expense_code(tx: &Transaction) -> rusqlite::Result<String> {
    let current_year = Local::now().format("%Y").to_string();
    let pattern = format!("EXP-{}-%", current_year);

    let last_code: Option<String> = tx
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
   CORE SERVICE LOGIC FUNCTIONS
============================================================ */

pub fn create_salary_advance(
    db: &Db,
    user_id: i64,
    advance_date: &str,
    amount: f64,
    payment_mode: &str,
    transaction_ref: Option<String>,
    remarks: &str,
    denominations: Vec<(i32, i32)>,
    created_by: i64,
) -> Result<(), String> {
    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let uppercase_mode = payment_mode.to_uppercase();
    let sanitized_mode = match uppercase_mode.as_str() {
        "BANK_TRANSFER" => "BANK",
        other => other,
    };

    // Cash balance guard — prevent fund ledger going negative
    if sanitized_mode == "CASH" {
        let available_cash: f64 = tx
            .query_row(
                "SELECT COALESCE(SUM(
                    CASE WHEN type='ADD' THEN total_amount ELSE -total_amount END
                 ), 0.0)
                 FROM fund_transactions
                 WHERE payment_method = 'CASH'",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        if available_cash < amount {
            return Err(format!(
                "Insufficient cash balance. Available: ₹{:.2}, Required: ₹{:.2}",
                available_cash, amount
            ));
        }
    }

    // 1. Record the salary advance entry
    tx.execute(
        "INSERT INTO staff_salary_advances
        (user_id, advance_date, amount, payment_mode, transaction_ref, remarks, created_by)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            user_id,
            advance_date,
            amount,
            sanitized_mode,
            transaction_ref,
            remarks,
            created_by
        ],
    )
    .map_err(|e| format!("Advance entry error: {}", e))?;

    let advance_record_id = tx.last_insert_rowid();

    // 2. Fetch staff name for expense description
    let staff_name: String = tx
        .query_row(
            "SELECT COALESCE(full_name, username) FROM users WHERE id = ?1",
            params![user_id],
            |row| row.get(0),
        )
        .map_err(|_| "Staff member not found".to_string())?;

    // 3. Resolve expense category and generate code
    let category_id = get_or_create_expense_category(&tx, "Salary Advance")
        .map_err(|e| format!("Category hook failed: {}", e))?;

    let expense_code = generate_automated_expense_code(&tx)
        .map_err(|e| format!("Expense code generation failed: {}", e))?;

    let dynamic_desc = format!(
        "Salary Advance issued to {} [Advance ID: #{}]. Notes: {}",
        staff_name, advance_record_id, remarks
    );

    // Expenses table uses BANK_TRANSFER; fund_transactions uses BANK
    let expense_payment_mode = if sanitized_mode == "BANK" {
        "BANK_TRANSFER"
    } else {
        sanitized_mode
    };

    // 4. Auto-insert into expenses
    tx.execute(
        "INSERT INTO expenses (
            expense_code, category_id, description,
            payment_mode, amount, expense_date,
            created_by, transaction_ref
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            expense_code,
            category_id,
            dynamic_desc,
            expense_payment_mode,
            amount,
            advance_date,
            created_by,
            transaction_ref.clone()
        ],
    )
    .map_err(|e| format!("Expense auto-insert failed: {}", e))?;

    let generated_expense_id = tx.last_insert_rowid();

    // 5. Post WITHDRAW to fund_transactions → visible in fund ledger + daybook
let fund_reference = format!("ADVANCE#{} - {} - Salary Advance - {}", advance_record_id, expense_code, staff_name);
    let fund_description = format!(
    "Salary Advance paid to {} on {}. Amount: ₹{:.2}",
    staff_name, advance_date, amount
);

tx.execute(
    "INSERT INTO fund_transactions (
        type, total_amount, module_type, module_id,
        reference, description, payment_method, transaction_ref, created_by, created_at
    ) VALUES ('WITHDRAW', ?1, 'EXPENSE', ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)",
    params![
        amount,
        generated_expense_id,
        fund_reference,
        fund_description,    // ← add this
        sanitized_mode,
        transaction_ref,
        created_by
    ],
)
.map_err(|e| format!("Fund ledger post failed: {}", e))?;

    let fund_tx_id = tx.last_insert_rowid();

    if sanitized_mode == "CASH" {
        for (denom, qty) in &denominations {
            if *qty <= 0 { continue; }
            let line_amount = (*denom as f64) * (*qty as f64);
            tx.execute(
                "INSERT INTO fund_denominations
                 (fund_transaction_id, denomination, quantity, amount)
                 VALUES (?1, ?2, ?3, ?4)",
                params![fund_tx_id, denom, qty, line_amount],
            )
            .map_err(|e| format!("Denomination insert failed: {}", e))?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

pub fn create_salary_payment(
    db: &Db,
    user_id: i64,
    salary_month: &str,
    payment_mode: &str,
    transaction_ref: Option<String>,
    remarks: &str,
    denominations: Vec<(i32, i32)>,
    created_by: i64,
) -> Result<(), String> {
    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Compute summary INSIDE the transaction to avoid stale reads
    // Compute total due based on months worked
    let (gross_salary, joining_date): (f64, String) = tx
        .query_row(
            "SELECT monthly_salary, COALESCE(joining_date, date('now'))
             FROM users WHERE id = ?1",
            params![user_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|_| "Staff profile not found".to_string())?;

    let months_worked: i64 = tx
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

    let months_worked = months_worked.max(0);
    let total_salary_due = gross_salary * months_worked as f64;

    let total_paid: f64 = tx
        .query_row(
            "SELECT COALESCE(SUM(net_salary), 0.0)
             FROM staff_salary_payments WHERE user_id = ?1",
            params![user_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let advance_amount: f64 = tx
        .query_row(
            "SELECT COALESCE(SUM(amount), 0.0)
             FROM staff_salary_advances
             WHERE user_id = ?1 AND salary_payment_id IS NULL",
            params![user_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let net_payable = (total_salary_due - total_paid - advance_amount).max(0.0);

    if net_payable <= 0.0 {
        return Err("No outstanding salary due. Payout aborted.".to_string());
    }
    // let gross_salary: f64 = tx
    //     .query_row(
    //         "SELECT monthly_salary FROM users WHERE id = ?1",
    //         params![user_id],
    //         |row| row.get(0),
    //     )
    //     .map_err(|_| "Staff profile not found".to_string())?;

    // let advance_amount: f64 = tx
    //     .query_row(
    //         "SELECT COALESCE(SUM(amount), 0.0)
    //          FROM staff_salary_advances
    //          WHERE user_id = ?1 AND salary_payment_id IS NULL",
    //         params![user_id],
    //         |row| row.get(0),
    //     )
    //     .unwrap_or(0.0);

    // let net_payable = gross_salary - advance_amount;

    // if net_payable <= 0.0 {
    //     return Err("Net payable amount is zero or negative. Payout aborted.".to_string());
    // }

    let uppercase_mode = payment_mode.to_uppercase();
    let sanitized_mode = match uppercase_mode.as_str() {
        "BANK_TRANSFER" => "BANK",
        other => other,
    };

    // Cash balance guard — prevent fund ledger going negative
    if sanitized_mode == "CASH" {
        let available_cash: f64 = tx
            .query_row(
                "SELECT COALESCE(SUM(
                    CASE WHEN type='ADD' THEN total_amount ELSE -total_amount END
                 ), 0.0)
                 FROM fund_transactions
                 WHERE payment_method = 'CASH'",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        if available_cash < net_payable {
            return Err(format!(
                "Insufficient cash balance. Available: ₹{:.2}, Required: ₹{:.2}",
                available_cash, net_payable
            ));
        }
    }

    // 1. Insert salary payment record
    tx.execute(
        "INSERT INTO staff_salary_payments
        (user_id, salary_month, gross_salary, advance_amount, net_salary,
         payment_mode, transaction_ref, remarks, created_by)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            user_id,
            salary_month,
            gross_salary,
            advance_amount,
            net_payable,
            sanitized_mode,
            transaction_ref,
            remarks,
            created_by
        ],
    )
    .map_err(|e| format!("Payroll record insert failed: {}", e))?;

    let payment_record_id = tx.last_insert_rowid();

    // 2. Link and clear outstanding advances
    tx.execute(
        "UPDATE staff_salary_advances
         SET salary_payment_id = ?1
         WHERE user_id = ?2 AND salary_payment_id IS NULL",
        params![payment_record_id, user_id],
    )
    .map_err(|e| format!("Advance settlement link failed: {}", e))?;

    // 3. Fetch staff name for expense description
    let staff_name: String = tx
        .query_row(
            "SELECT COALESCE(full_name, username) FROM users WHERE id = ?1",
            params![user_id],
            |row| row.get(0),
        )
        .map_err(|_| "Staff member not found".to_string())?;

    // 4. Auto-log as expense → visible on expenses page
    let category_id = get_or_create_expense_category(&tx, "Staff Salary Payroll")
        .map_err(|e| format!("Category hook failed: {}", e))?;

    let expense_code = generate_automated_expense_code(&tx)
        .map_err(|e| format!("Expense code generation failed: {}", e))?;

    let dynamic_desc = format!(
        "Monthly salary paid to {} (Gross: ₹{:.2}, Advances deducted: ₹{:.2}). Notes: {}",
        staff_name, gross_salary, advance_amount, remarks
    );

    let expense_payment_mode = if sanitized_mode == "BANK" {
        "BANK_TRANSFER"
    } else {
        sanitized_mode
    };

    tx.execute(
        "INSERT INTO expenses (
            expense_code, category_id, description,
            payment_mode, amount, expense_date,
            created_by, transaction_ref
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            expense_code,
            category_id,
            dynamic_desc,
            expense_payment_mode,
            net_payable,
            salary_month,
            created_by,
            transaction_ref.clone()
        ],
    )
    .map_err(|e| format!("Payroll expense auto-insert failed: {}", e))?;

    let generated_expense_id = tx.last_insert_rowid();

    // 5. Post WITHDRAW to fund_transactions → visible in fund ledger + daybook
    let fund_reference = format!("{} - Monthly Payroll - {}", expense_code, staff_name);

let fund_description = format!(
    "Monthly salary paid to {} on {}. Gross: ₹{:.2}, Advances deducted: ₹{:.2}, Net: ₹{:.2}",
    staff_name, salary_month, gross_salary, advance_amount, net_payable
);

tx.execute(
    "INSERT INTO fund_transactions (
        type, total_amount, module_type, module_id,
        reference, description, payment_method, transaction_ref, created_by, created_at
    ) VALUES ('WITHDRAW', ?1, 'EXPENSE', ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)",
    params![
        net_payable,
        generated_expense_id,
        fund_reference,
        fund_description,   
        sanitized_mode,
        transaction_ref,
        created_by
    ],
)
.map_err(|e| format!("Fund ledger post failed: {}", e))?;

let fund_tx_id = tx.last_insert_rowid();

    if sanitized_mode == "CASH" {
        for (denom, qty) in &denominations {
            if *qty <= 0 { continue; }
            let line_amount = (*denom as f64) * (*qty as f64);
            tx.execute(
                "INSERT INTO fund_denominations
                 (fund_transaction_id, denomination, quantity, amount)
                 VALUES (?1, ?2, ?3, ?4)",
                params![fund_tx_id, denom, qty, line_amount],
            )
            .map_err(|e| format!("Denomination insert failed: {}", e))?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

// Used only for the salary modal preview — NOT called inside create_salary_payment
// pub fn get_salary_summary(db: &Db, user_id: i64) -> Result<SalarySettlementSummary, String> {
//     let conn = db.0.lock().unwrap();

//     let gross_salary: f64 = conn
//         .query_row(
//             "SELECT monthly_salary FROM users WHERE id = ?1",
//             params![user_id],
//             |row| row.get(0),
//         )
//         .map_err(|_| "Staff profile not found".to_string())?;

//     let advance_amount: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(amount), 0.0)
//              FROM staff_salary_advances
//              WHERE user_id = ?1 AND salary_payment_id IS NULL",
//             params![user_id],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     Ok(SalarySettlementSummary {
//         gross_salary,
//         advance_amount,
//         net_payable: gross_salary - advance_amount,
//     })
// }

pub fn get_salary_summary(db: &Db, user_id: i64) -> Result<SalarySettlementSummary, String> {
    let conn = db.0.lock().unwrap();

    // 1. Fetch monthly salary and joining date
    let (gross_salary, joining_date): (f64, String) = conn
        .query_row(
            "SELECT monthly_salary, COALESCE(joining_date, date('now')) 
             FROM users WHERE id = ?1",
            params![user_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|_| "Staff profile not found".to_string())?;

    // 2. Calculate completed months from joining_date to today
    let months_worked: i64 = conn
        .query_row(
            "SELECT 
                (strftime('%Y', 'now') - strftime('%Y', ?1)) * 12
                + (strftime('%m', 'now') - strftime('%m', ?1))
                -- subtract 1 if current day < joining day (month not completed)
                - CASE 
                    WHEN CAST(strftime('%d', 'now') AS INTEGER) 
                       < CAST(strftime('%d', ?1) AS INTEGER)
                    THEN 1 ELSE 0
                  END",
            params![joining_date],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let months_worked = months_worked.max(0);
    let total_salary_due = gross_salary * months_worked as f64;

    // 3. Total already paid in past salary payments
    let total_paid: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(net_salary), 0.0)
             FROM staff_salary_payments
             WHERE user_id = ?1",
            params![user_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // 4. Current unsettled advances
    let advance_amount: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0.0)
             FROM staff_salary_advances
             WHERE user_id = ?1 AND salary_payment_id IS NULL",
            params![user_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let net_payable = (total_salary_due - total_paid - advance_amount).max(0.0);

    Ok(SalarySettlementSummary {
        gross_salary,
        months_worked,
        total_salary_due,
        total_paid,
        advance_amount,
        net_payable,
    })
}

pub fn create_staff(
    db: &Db,
    username: &str,
    password: &str,
    full_name: &str,
    monthly_salary: f64,
    joining_date: &str,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    let hash = hash_password(password);

    conn.execute(
        "INSERT INTO users
        (username, password_hash, role, is_active, full_name, monthly_salary, joining_date)
        VALUES (?1, ?2, 'STAFF', 1, ?3, ?4, ?5)",
        params![username, hash, full_name, monthly_salary, joining_date],
    )
    .map_err(|e| format!("Create staff error: {}", e))?;

    Ok(())
}

pub fn get_all_staff(db: &Db) -> Result<Vec<StaffUser>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, username, full_name, monthly_salary, joining_date, is_active
             FROM users
             WHERE role = 'STAFF'
             ORDER BY created_at DESC",
        )
        .map_err(|_| "Failed to prepare staff query")?;

    let staff_iter = stmt
        .query_map([], |row| {
            Ok(StaffUser {
                id: row.get(0)?,
                username: row.get(1)?,
                full_name: row.get(2)?,
                monthly_salary: row.get(3)?,
                joining_date: row.get(4)?,
                is_active: row.get::<_, i64>(5)? == 1,
            })
        })
        .map_err(|e| format!("Staff mapping failed: {}", e))?;

    let mut staff = Vec::new();
    for user in staff_iter {
        if let Ok(u) = user {
            staff.push(u);
        }
    }
    Ok(staff)
}

pub fn get_salary_advances(db: &Db, user_id: i64) -> Result<Vec<StaffSalaryAdvance>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, user_id, advance_date, amount, payment_mode,
                    transaction_ref, remarks, salary_payment_id
             FROM staff_salary_advances
             WHERE user_id = ?1
             ORDER BY advance_date DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![user_id], |row| {
            Ok(StaffSalaryAdvance {
                id: row.get(0)?,
                user_id: row.get(1)?,
                advance_date: row.get(2)?,
                amount: row.get(3)?,
                payment_mode: row.get(4)?,
                transaction_ref: row.get(5)?,
                remarks: row.get(6)?,
                salary_payment_id: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut advances = Vec::new();
    for row in rows {
        advances.push(row.map_err(|e| e.to_string())?);
    }
    Ok(advances)
}

pub fn update_staff_status(db: &Db, staff_id: i64, is_active: bool) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE users SET is_active = ?1 WHERE id = ?2 AND role = 'STAFF'",
        params![is_active as i32, staff_id],
    )
    .map_err(|_| "Failed to update staff status")?;
    Ok(())
}


pub fn get_advance_denominations(
    db: &Db,
    advance_id: i64,
) -> Result<Vec<(i32, i32)>, String> {
    let conn = db.0.lock().unwrap();

    // Pattern 1: new format — ADVANCE#4 - EXP-...
    let new_pattern = format!("ADVANCE#{}-%", advance_id);

    // Pattern 2: old format — look up expense id via advance description,
    // then find fund_transaction by module_id
    // We know the expense description contains the advance_record_id
    // e.g. "Salary Advance issued to karthick [Advance ID: #3]."
    let old_desc_pattern = format!("%Advance ID: #{}]%", advance_id);
    // Fallback: even older format used "Ref Log ID: #N"
    let older_desc_pattern = format!("%Ref Log ID: #{}]%", advance_id);

    let mut stmt = conn.prepare(
        "SELECT fd.denomination, fd.quantity
         FROM fund_denominations fd
         JOIN fund_transactions ft ON fd.fund_transaction_id = ft.id
         WHERE ft.reference LIKE ?1
            OR ft.id IN (
                SELECT ft2.id
                FROM fund_transactions ft2
                JOIN expenses e ON ft2.module_id = e.id
                WHERE ft2.type = 'WITHDRAW'
                  AND ft2.module_type = 'EXPENSE'
                  AND (
                      e.description LIKE ?2
                   OR e.description LIKE ?3
                  )
            )
         ORDER BY fd.denomination DESC",
    )
    .map_err(|e| e.to_string())?;

    let rows: Vec<(i32, i32)> = stmt
        .query_map(
            params![new_pattern, old_desc_pattern, older_desc_pattern],
            |row| Ok((row.get::<_, i32>(0)?, row.get::<_, i32>(1)?)),
        )
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(rows)
}


// Ensure NO #[tauri::command] is placed on this raw function block
pub fn get_past_salary_payments(
    db: &Db, 
    user_id: i64
) -> Result<Vec<PastSalaryPaymentRow>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, salary_month, gross_salary, advance_amount, net_salary, 
                    payment_mode, transaction_ref, remarks, datetime(created_at, 'localtime')
             FROM staff_salary_payments
             WHERE user_id = ?1
             ORDER BY salary_month DESC, id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![user_id], |row| {
            Ok(PastSalaryPaymentRow {
                id: row.get(0)?,
                salary_month: row.get(1)?,
                gross_salary: row.get(2)?,
                advance_amount: row.get(3)?,
                net_salary: row.get(4)?,
                payment_mode: row.get(5)?,
                transaction_ref: row.get(6)?,
                remarks: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for row in rows {
        list.push(row.map_err(|e| e.to_string())?);
    }
    Ok(list)
}