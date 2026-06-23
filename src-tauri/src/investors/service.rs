// src-tauri/src/investors/service.rs

use crate::db::connection::Db;
use rusqlite::{params, OptionalExtension, Result};
use serde::{Deserialize, Serialize};
use chrono::{Datelike, Local, NaiveDate};

#[derive(Debug, Serialize, Deserialize)]
pub struct Investor {
    pub id: i64,
    pub investor_code: String,
    pub investor_name: String,
    pub mobile: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub investor_type: String, 
    pub is_active: bool,
    pub created_at: String,
    pub fixed_interest_percentage: f64,
    pub interest_paid_upto: Option<String>,
    pub total_investment: f64,
    pub total_withdrawn: f64,
    pub total_profit_paid: f64,
    pub current_balance: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateInvestorRequest {
    pub investor_name: String,
    pub mobile: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub investor_type: Option<String>, 
    pub fixed_interest_percentage: Option<f64>,
    pub created_by: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateInvestorRequest {
    pub id: i64,
    pub investor_name: String,
    pub mobile: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub investor_type: String, 
    pub fixed_interest_percentage: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateInvestmentRequest {
    pub investor_id: i64,
    pub amount: f64,
    pub payment_method: String,
    pub transaction_ref: Option<String>,
    pub remarks: Option<String>,
    pub transaction_date: Option<String>,
    pub denominations: Vec<(i32, i32)>,
    pub created_by: i64,
}

#[derive(Debug, Serialize)]
pub struct InvestorLedgerRow {
    pub id: i64,
    pub transaction_date: String,
    pub transaction_type: String,
    pub amount: f64,
    pub payment_method: String,
    pub remarks: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct InvestorLedgerSummary {
    pub investor_name: String,
    pub investor_code: String,
    pub investor_type: String,
    pub total_investment: f64,
    pub total_profit_paid: f64,
    pub total_withdrawn: f64,
    pub current_balance: f64,
    pub transaction_count: i64,
    pub accrued_interest: f64,       
    pub total_account_value: f64,    
}

#[derive(Debug, Serialize)]
pub struct InvestorLedgerResponse {
    pub summary: InvestorLedgerSummary,
    pub transactions: Vec<InvestorLedgerRow>,
}

#[derive(Debug, Deserialize)]
pub struct WithdrawInvestmentRequest {
    pub investor_id: i64,
    pub amount: f64,
    pub payment_method: String,
    pub remarks: Option<String>,
    pub transaction_ref: Option<String>, // ── ADDED: To support transaction references in withdrawals ──
    pub transaction_date: Option<String>,
    pub denominations: Vec<(i32, i32)>,
    pub created_by: i64,
}

#[derive(Debug, Deserialize)]
pub struct ToggleInvestorStatusRequest {
    pub id: i64,
    pub is_active: bool,
}

#[derive(Debug, Deserialize)]
pub struct PayProfitRequest {
    pub investor_id: i64,
    pub profit_amount: f64,
    pub payment_method: String,
    pub remarks: Option<String>,
    pub transaction_date: Option<String>,
    pub denominations: Vec<(i32, i32)>,
    pub created_by: i64,
    pub months_paid: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct InvestorInterestPreview {
    pub investor_id: i64,
    pub investor_name: String,
    pub principal_amount: f64,
    pub interest_percentage: f64,
    pub total_months: i32,
    pub accrued_interest: f64,
    pub total_payable: f64,
}

/* ============================================================
   INTERNAL AUTOMATED EXPENSE HOOKS & HELPER UTILITIES
============================================================ */

fn get_or_create_expense_category(tx: &rusqlite::Transaction, category_name: &str) -> rusqlite::Result<i64> {
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

fn generate_automated_expense_code(tx: &rusqlite::Transaction) -> rusqlite::Result<String> {
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

fn generate_investor_code(conn: &rusqlite::Connection) -> Result<String> {
    let last_id: Option<i64> = conn
        .query_row(
            "SELECT id FROM investors ORDER BY id DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    let next_id = last_id.unwrap_or(0) + 1;
    Ok(format!("INV{:04}", next_id))
}

fn safely_extract_date(date_str: &str) -> NaiveDate {
    let cleaned = if date_str.len() >= 10 { &date_str[..10] } else { date_str };
    NaiveDate::parse_from_str(cleaned, "%Y-%m-%d")
        .unwrap_or_else(|_| Local::now().date_naive())
}

/* ============================================================
   PUBLIC SERVICE METHODS
============================================================ */

pub fn create_investor(db: &Db, request: CreateInvestorRequest) -> Result<()> {
    let conn = db.0.lock().unwrap();

    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM investors WHERE LOWER(investor_name) = LOWER(?1)",
        params![request.investor_name],
        |row| row.get(0),
    )?;

    if count > 0 {
        return Err(rusqlite::Error::InvalidQuery);
    }

    let investor_code = generate_investor_code(&conn)?;
    let type_assignment = request.investor_type.unwrap_or_else(|| "FIXED_INTEREST".to_string());

    conn.execute(
        "
        INSERT INTO investors (
            investor_code, investor_name, investor_type, mobile, 
            address, notes, fixed_interest_percentage, created_by
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        ",
        params![
            investor_code,
            request.investor_name,
            type_assignment, 
            request.mobile,
            request.address,
            request.notes,
            request.fixed_interest_percentage.unwrap_or(0.0),
            request.created_by
        ],
    )?;

    Ok(())
}

pub fn get_images() {} 

pub fn get_investors(db: &Db) -> Result<Vec<Investor>> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "
        SELECT
            i.id,
            i.investor_code,
            i.investor_name,
            i.mobile,
            i.address,
            i.notes,
            i.investor_type, 
            i.fixed_interest_percentage,
            i.is_active,
            i.created_at,
            i.interest_paid_upto,
            COALESCE(inv.total_invest, 0.0) AS total_investment,
            COALESCE(wdr.total_withdrawn, 0.0) AS total_withdrawn,
            COALESCE(prf.total_profit, 0.0) AS total_profit_paid
        FROM investors i
        LEFT JOIN (
            SELECT investor_id, SUM(ft.total_amount) AS total_invest
            FROM investor_transactions it
            JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
            WHERE it.transaction_type = 'INVESTMENT'
            GROUP BY investor_id
        ) inv ON inv.investor_id = i.id
        LEFT JOIN (
            SELECT investor_id, SUM(ft.total_amount) AS total_withdrawn
            FROM investor_transactions it
            JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
            WHERE it.transaction_type = 'WITHDRAWAL'
            GROUP BY investor_id
        ) wdr ON wdr.investor_id = i.id
        LEFT JOIN (
            SELECT investor_id, SUM(ft.total_amount) AS total_profit
            FROM investor_transactions it
            JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
            WHERE it.transaction_type = 'PROFIT_PAYMENT'
            GROUP BY investor_id
        ) prf ON prf.investor_id = i.id
        WHERE i.is_active = 1
        ORDER BY i.investor_name
        "
    )?;

    let rows = stmt.query_map([], |row| {
        let id: i64 = row.get(0)?;
        let investor_code: String = row.get(1)?;
        let investor_name: String = row.get(2)?;
        let mobile: Option<String> = row.get(3)?;
        let address: Option<String> = row.get(4)?;
        let notes: Option<String> = row.get(5)?;
        let investor_type: String = row.get(6)?; 
        let fixed_interest_percentage: f64 = row.get(7)?;
        let is_active: bool = row.get::<_, i32>(8)? == 1;
        let created_at: String = row.get(9)?;
        let interest_paid_upto: Option<String> = row.get(10)?;
        let total_investment: f64 = row.get(11)?;
        let total_withdrawn: f64 = row.get(12)?;
        let total_profit_paid: f64 = row.get(13)?;
        let current_balance = total_investment - total_withdrawn; 

        Ok(Investor {
            id,
            investor_code,
            investor_name,
            mobile,
            address,
            notes,
            investor_type,
            is_active,
            created_at,
            fixed_interest_percentage,
            interest_paid_upto,
            total_investment,
            total_withdrawn,
            total_profit_paid,
            current_balance,
        })
    })?;

    let mut investors = Vec::new();
    for row in rows {
        investors.push(row?);
    }

    Ok(investors)
}

pub fn update_investor(db: &Db, request: UpdateInvestorRequest) -> Result<()> {
    let conn = db.0.lock().unwrap();

    let duplicate_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM investors WHERE LOWER(investor_name) = LOWER(?1) AND id != ?2",
        params![request.investor_name, request.id],
        |row| row.get(0),
    )?;

    if duplicate_count > 0 {
        return Err(rusqlite::Error::InvalidQuery);
    }

    conn.execute(
        "
        UPDATE investors
        SET
            investor_name = ?1,
            mobile = ?2,
            address = ?3,
            notes = ?4,
            fixed_interest_percentage = ?5,
            investor_type = ?6, 
            updated_at = datetime('now','localtime')
        WHERE id = ?7
        ",
        params![
            request.investor_name,
            request.mobile,
            request.address,
            request.notes,
            request.fixed_interest_percentage,
            request.investor_type,
            request.id
        ],
    )?;

    Ok(())
}

pub fn get_investor_by_id(db: &Db, investor_id: i64) -> Result<Investor> {
    let conn = db.0.lock().unwrap();

    conn.query_row(
        "
        SELECT
            i.id,
            i.investor_code,
            i.investor_name,
            i.mobile,
            i.address,
            i.notes,
            i.investor_type, 
            i.fixed_interest_percentage,
            i.is_active,
            i.created_at,
            i.interest_paid_upto,
            COALESCE(inv.total_invest, 0.0) AS total_investment,
            COALESCE(wdr.total_withdrawn, 0.0) AS total_withdrawn,
            COALESCE(prf.total_profit, 0.0) AS total_profit_paid
        FROM investors i
        LEFT JOIN (
            SELECT investor_id, SUM(ft.total_amount) AS total_invest
            FROM investor_transactions it
            JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
            WHERE it.transaction_type = 'INVESTMENT'
            GROUP BY investor_id
        ) inv ON inv.investor_id = i.id
        LEFT JOIN (
            SELECT investor_id, SUM(ft.total_amount) AS total_withdrawn
            FROM investor_transactions it
            JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
            WHERE it.transaction_type = 'WITHDRAWAL'
            GROUP BY investor_id
        ) wdr ON wdr.investor_id = i.id
        LEFT JOIN (
            SELECT investor_id, SUM(ft.total_amount) AS total_profit
            FROM investor_transactions it
            JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
            WHERE it.transaction_type = 'PROFIT_PAYMENT'
            GROUP BY investor_id
        ) prf ON prf.investor_id = i.id
        WHERE i.id = ?1
        ",
        params![investor_id],
        |row| {
            let id: i64 = row.get(0)?;
            let investor_code: String = row.get(1)?;
            let investor_name: String = row.get(2)?;
            let mobile: Option<String> = row.get(3)?;
            let address: Option<String> = row.get(4)?;
            let notes: Option<String> = row.get(5)?;
            let investor_type: String = row.get(6)?; 
            let fixed_interest_percentage: f64 = row.get(7)?;
            let is_active: bool = row.get::<_, i32>(8)? == 1;
            let created_at: String = row.get(9)?;
            let interest_paid_upto: Option<String> = row.get(10)?;
            let total_investment: f64 = row.get(11)?;
            let total_withdrawn: f64 = row.get(12)?;
            let total_profit_paid: f64 = row.get(13)?;
            let current_balance = total_investment - total_withdrawn; 

            Ok(Investor {
                id,
                investor_code,
                investor_name,
                mobile,
                address,
                notes,
                investor_type,
                is_active,
                created_at,
                fixed_interest_percentage,
                interest_paid_upto,
                total_investment,
                total_withdrawn,
                total_profit_paid,
                current_balance,
            })
        },
    )
}

pub fn create_investment(db: &Db, request: CreateInvestmentRequest) -> Result<()> {
    let conn = db.0.lock().unwrap();

    let is_active: bool = conn.query_row(
        "SELECT is_active FROM investors WHERE id = ?1",
        params![request.investor_id],
        |row| row.get(0),
    )?;

    if !is_active {
        return Err(rusqlite::Error::InvalidParameterName("Investor is inactive".to_string()));
    }

    let (investor_code, investor_name): (String, String) = conn.query_row(
        "SELECT investor_code, investor_name FROM investors WHERE id = ?1",
        params![request.investor_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;

    drop(conn);

    // 🟢 FIXED: மல்டி-டிஸ்கிரிப்ஷன் ஏபிஐ-ஐப் பயன்படுத்தி அசல் UPI/BANK Reference ஐச் சேமிக்கிறோம்
    let fund_tx_id = crate::fund_management::service::add_fund_with_desc(
        db,
        request.created_by,
        Some(investor_code.clone()),                                 // reference Column (INV0001)
        Some(format!("Investor Investment - {}", investor_name)),    // description Column
        request.payment_method.clone(),
        request.transaction_ref.clone(),                             // transaction_ref Column (அசல் UTR/UPI Ref!)
        request.amount,
        request.transaction_date.clone(),
        request.denominations.clone(),
    )?;

    let conn = db.0.lock().unwrap();
    conn.execute(
        "
        INSERT INTO investor_transactions (investor_id, fund_transaction_id, transaction_type, remarks, created_by)
        VALUES (?1, ?2, 'INVESTMENT', ?3, ?4)
        ",
        params![request.investor_id, fund_tx_id, request.remarks, request.created_by],
    )?;

    Ok(())
}

pub fn get_investor_ledger(db: &Db, investor_id: i64) -> Result<InvestorLedgerResponse> {
    let conn = db.0.lock().unwrap();

    let (investor_name, investor_code, investor_type): (String, String, String) = conn.query_row(
        "SELECT investor_name, investor_code, investor_type FROM investors WHERE id = ?1", 
        params![investor_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    )?;

    let mut stmt = conn.prepare(
        "
        SELECT it.id, ft.created_at, it.transaction_type, ft.total_amount, ft.payment_method, it.remarks
        FROM investor_transactions it
        INNER JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
        WHERE it.investor_id = ?1
        ORDER BY ft.created_at DESC
        "
    )?;

    let rows = stmt.query_map(params![investor_id], |row| {
        Ok(InvestorLedgerRow {
            id: row.get(0)?,
            transaction_date: row.get(1)?,
            transaction_type: row.get(2)?,
            amount: row.get(3)?,
            payment_method: row.get(4)?,
            remarks: row.get(5)?,
        })
    })?;

    let mut transactions = Vec::new();
    for row in rows {
        transactions.push(row?);
    }

    let total_investment: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(ft.total_amount), 0)
        FROM investor_transactions it
        INNER JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
        WHERE it.investor_id = ?1 AND it.transaction_type = 'INVESTMENT'
        ",
        params![investor_id],
        |row| row.get(0),
    )?;

    let total_profit_paid: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(ft.total_amount), 0)
        FROM investor_transactions it
        INNER JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
        WHERE it.investor_id = ?1 AND it.transaction_type = 'PROFIT_PAYMENT'
        ",
        params![investor_id],
        |row| row.get(0),
    )?;

    let total_withdrawn: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(ft.total_amount), 0)
        FROM investor_transactions it
        INNER JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
        WHERE it.investor_id = ?1 AND it.transaction_type ='WITHDRAWAL'
        ",
        params![investor_id],
        |row| row.get(0),
    )?;

    let current_balance = total_investment - total_withdrawn; 

    drop(stmt);
    drop(conn);

    let preview = get_investor_interest_preview(db, investor_id)?;
    let accrued_interest = preview.accrued_interest;
    let total_account_value = current_balance + accrued_interest;
    let transaction_count = transactions.len() as i64; 

    Ok(InvestorLedgerResponse {
        summary: InvestorLedgerSummary {
            investor_name,
            investor_code,
            investor_type,
            total_investment,
            total_profit_paid,
            total_withdrawn,
            current_balance,
            transaction_count,
            accrued_interest,       
            total_account_value,    
        },
        transactions,
    })
}

pub fn withdraw_investment(db: &Db, request: WithdrawInvestmentRequest) -> Result<()> {
    if request.amount <= 0.0 {
        return Err(rusqlite::Error::InvalidQuery);
    }

    let conn = db.0.lock().unwrap();
    let is_active: bool = conn.query_row(
        "SELECT is_active FROM investors WHERE id = ?1",
        params![request.investor_id],
        |row| row.get(0),
    )?;

    if !is_active {
        return Err(rusqlite::Error::InvalidParameterName("Investor is inactive".to_string()));
    }

    drop(conn);

    if request.payment_method == "CASH" {
        if request.denominations.is_empty() {
            return Err(rusqlite::Error::InvalidQuery);
        }
        let calc_total: f64 = request.denominations
            .iter()
            .map(|(d, q)| (*d as f64) * (*q as f64))
            .sum();
        if (calc_total - request.amount).abs() > 0.01 {
            return Err(rusqlite::Error::InvalidQuery);
        }
    }

    let (investor_code, investor_name, current_balance) = {
        let conn = db.0.lock().unwrap();

        let (investor_code, investor_name): (String, String) = conn.query_row(
            "SELECT investor_code, investor_name FROM investors WHERE id = ?1",
            params![request.investor_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        let total_invested: f64 = conn.query_row(
            "
            SELECT COALESCE(SUM(ft.total_amount), 0)
            FROM investor_transactions it
            INNER JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
            WHERE it.investor_id = ?1 AND it.transaction_type = 'INVESTMENT'
            ",
            params![request.investor_id],
            |row| row.get(0),
        )?;

        let total_withdrawn: f64 = conn.query_row(
            "
            SELECT COALESCE(SUM(ft.total_amount), 0)
            FROM investor_transactions it
            INNER JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
            WHERE it.investor_id = ?1 AND it.transaction_type ='WITHDRAWAL'
            ",
            params![request.investor_id],
            |row| row.get(0),
        )?;

        let current_balance = total_invested - total_withdrawn;
        (investor_code, investor_name, current_balance)
    };

    if request.amount > current_balance {
        return Err(rusqlite::Error::InvalidQuery);
    }

    // 🟢 FIXED: மல்டி-டிஸ்கிரிப்ஷன் ஏபிஐ-ஐப் பயன்படுத்தி அசல் UPI/BANK Withdrawal Reference ஐச் சேமிக்கிறோம்
    let fund_tx_id = crate::fund_management::service::withdraw_fund_with_desc(
        db,
        request.created_by,
        Some(investor_code.clone()),                               // reference Column (INV0001)
        Some(format!("Investor Withdrawal - {}", investor_name)),  // description Column
        request.payment_method.clone(),
        request.transaction_ref.clone(),                           // transaction_ref Column (அசல் UTR/UPI Ref!)
        request.amount,
        request.transaction_date.clone(),
        request.denominations.clone(),
    )?;

    let conn = db.0.lock().unwrap();
    conn.execute(
        "
        INSERT INTO investor_transactions (investor_id, fund_transaction_id, transaction_type, remarks, created_by)
        VALUES (?1, ?2, 'WITHDRAWAL', ?3, ?4)
        ",
        params![request.investor_id, fund_tx_id, request.remarks, request.created_by],
    )?;

    Ok(())
}

pub fn toggle_investor_status(db: &Db, request: ToggleInvestorStatusRequest) -> Result<()> {
    let conn = db.0.lock().unwrap();
    conn.execute("UPDATE investors SET is_active = ?1 WHERE id = ?2", params![request.is_active, request.id])?;
    Ok(())
}

pub fn pay_profit(db: &Db, request: PayProfitRequest) -> Result<()> {
    if request.profit_amount <= 0.0 {
        return Err(rusqlite::Error::InvalidQuery);
    }

    if request.payment_method == "CASH" {
        if request.denominations.is_empty() {
            return Err(rusqlite::Error::InvalidQuery);
        }

        let calc_total: f64 = request.denominations.iter().map(|(d, q)| (*d as f64) * (*q as f64)).sum();
        if (calc_total - request.profit_amount).abs() > 0.01 {
            return Err(rusqlite::Error::InvalidQuery);
        }
    }

    let conn = db.0.lock().unwrap();
    let is_active: bool = conn.query_row(
        "SELECT is_active FROM investors WHERE id = ?1",
        params![request.investor_id],
        |row| row.get(0),
    )?;

    if !is_active {
        return Err(rusqlite::Error::InvalidParameterName("Investor is inactive".to_string()));
    }
    drop(conn);

    let (investor_code, investor_name, interest_paid_upto, created_at) = {
        let conn = db.0.lock().unwrap();
        conn.query_row(
            "SELECT investor_code, investor_name, interest_paid_upto, created_at FROM investors WHERE id = ?1",
            params![request.investor_id],
            |row| Ok((row.get::<usize, String>(0)?, row.get::<usize, String>(1)?, row.get::<usize, Option<String>>(2)?, row.get::<usize, String>(3)?)),
        )?
    };

    let (final_remarks, paid_upto) = {
        let conn = db.0.lock().unwrap();
        let start_date_str: String = match interest_paid_upto.clone() {
            Some(date) if !date.trim().is_empty() => date,
            _ => {
                let first_invest: Option<String> = match conn.query_row(
                    "
                    SELECT MIN(ft.created_at) FROM investor_transactions it
                    INNER JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
                    WHERE it.investor_id = ?1 AND it.transaction_type = 'INVESTMENT'
                    ",
                    params![request.investor_id],
                    |row| row.get::<usize, Option<String>>(0),
                ) {
                    Ok(val) => val,
                    Err(_) => None,
                };

                first_invest.filter(|date| !date.trim().is_empty()).unwrap_or(created_at)
            }
        };

        let start_naive = safely_extract_date(&start_date_str);

        let paid_upto = if let Some(m) = request.months_paid {
            if m > 0 {
                start_naive.checked_add_months(chrono::Months::new(m as u32))
                    .unwrap_or(start_naive)
                    .format("%Y-%m-%d")
                    .to_string()
            } else {
                request.transaction_date.clone().unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string())
            }
        } else {
            request.transaction_date.clone().unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string())
        };

        let start_formatted = safely_extract_date(&start_date_str).format("%b %Y").to_string();
        
        let end_formatted = {
            let d = safely_extract_date(&paid_upto);
            d.pred_opt().unwrap_or(d).format("%b %Y").to_string()
        };

        let period_text = format!("🗓️ Period: {} ➔ {}", start_formatted, end_formatted);
        let final_remarks = match &request.remarks {
            Some(rem) if !rem.trim().is_empty() => format!("{} | {}", period_text, rem),
            _ => period_text,
        };

        (final_remarks, paid_upto)
    };

    // 🟢 FIXED: மல்டி-டிஸ்கிரிப்ஷன் ஏபிஐ-ஐப் பயன்படுத்தி ஏல மீட்பு அல்லாத வட்டி பட்டுவாடாவைச் சேமிக்கிறோம்
    let fund_tx_id = crate::fund_management::service::withdraw_fund_with_desc(
        db,
        request.created_by,
        Some(investor_code.clone()), // reference Column (INV0001)
        Some(format!("Investor Profit Payment - {}", investor_name)), // description Column
        request.payment_method.clone(),
        None, // Profit payment-க்கு UTR தேவையில்லை எனில் None ஆக அனுப்பலாம்
        request.profit_amount,
        request.transaction_date.clone(),
        request.denominations.clone(),
    )?;

    {
        let mut conn = db.0.lock().unwrap();
        let tx = conn.transaction()?;

        let category_id = get_or_create_expense_category(&tx, "Investor Interest Payout")?;
        let expense_code = generate_automated_expense_code(&tx)?;
        let expense_desc = format!(
            "Interest payout of ₹{:.2} made to investor {} ({}). Remarks: {}",
            request.profit_amount, investor_name, investor_code, final_remarks
        );

        let expense_payment_mode = if request.payment_method == "BANK" { "BANK_TRANSFER" } else { &request.payment_method };

        tx.execute(
            "INSERT INTO expenses (expense_code, category_id, description, payment_mode, amount, expense_date, created_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![expense_code, category_id, expense_desc, expense_payment_mode, request.profit_amount, request.transaction_date, request.created_by],
        )?;

        let expense_id = tx.last_insert_rowid();

        tx.execute(
            "UPDATE fund_transactions SET module_type = 'EXPENSE', module_id = ?1, reference = ?2 WHERE id = ?3",
            params![expense_id, format!("{} - {} - Interest Payout", expense_code, investor_name), fund_tx_id],
        )?;

        tx.execute(
            "INSERT INTO investor_profit_payments (investor_id, fund_transaction_id, profit_amount, payment_date, remarks, created_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![request.investor_id, fund_tx_id, request.profit_amount, request.transaction_date, final_remarks, request.created_by],
        )?;

        tx.execute(
            "INSERT INTO investor_transactions (investor_id, fund_transaction_id, transaction_type, remarks, created_by)
             VALUES (?1, ?2, 'PROFIT_PAYMENT', ?3, ?4)",
            params![request.investor_id, fund_tx_id, final_remarks, request.created_by],
        )?;

        tx.execute("UPDATE investors SET interest_paid_upto = ?1 WHERE id = ?2", params![paid_upto, request.investor_id])?;
        tx.commit()?;
    }

    Ok(())
}

pub fn get_investor_interest_preview(db: &Db, investor_id: i64) -> Result<InvestorInterestPreview> {
    let conn = db.0.lock().unwrap();

    let (investor_name, fixed_interest_percentage, interest_paid_upto, created_at): (String, f64, Option<String>, String) = conn.query_row(
        "SELECT investor_name, fixed_interest_percentage, interest_paid_upto, created_at FROM investors WHERE id = ?1",
        params![investor_id],
        |row| Ok((row.get::<usize, String>(0)?, row.get::<usize, f64>(1)?, row.get::<usize, Option<String>>(2)?, row.get::<usize, String>(3)?)),
    )?;

    let total_investment: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(ft.total_amount), 0) FROM investor_transactions it
        INNER JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
        WHERE it.investor_id = ?1 AND it.transaction_type = 'INVESTMENT'
        ",
        params![investor_id],
        |row| row.get(0),
    )?;

    let total_withdrawn: f64 = conn.query_row(
        "
        SELECT COALESCE(SUM(ft.total_amount), 0) FROM investor_transactions it
        INNER JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
        WHERE it.investor_id = ?1 AND it.transaction_type = 'WITHDRAWAL'
        ",
        params![investor_id],
        |row| row.get(0),
    )?;

    let principal_amount = total_investment - total_withdrawn;

    let start_date_str: String = match interest_paid_upto.clone() {
        Some(date) if !date.trim().is_empty() => date,
        _ => {
            let first_invest: Option<String> = match conn.query_row(
                "
                SELECT MIN(ft.created_at) FROM investor_transactions it
                INNER JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
                WHERE it.investor_id = ?1 AND it.transaction_type = 'INVESTMENT'
                ",
                params![investor_id],
                |row| row.get::<usize, Option<String>>(0),
            ) {
                Ok(val) => val,
                Err(_) => None,
            };

            first_invest.filter(|date| !date.trim().is_empty()).unwrap_or(created_at)
        }
    };

    let invest_date = safely_extract_date(&start_date_str);
    let today = Local::now().date_naive();

    let months_elapsed = ((today.year() - invest_date.year()) * 12) + (today.month() as i32 - invest_date.month() as i32);
    let months_elapsed = std::cmp::max(0, months_elapsed);

    let accrued_interest = principal_amount * (fixed_interest_percentage / 100.0) * months_elapsed as f64;

    Ok(InvestorInterestPreview {
        investor_id,
        investor_name,
        principal_amount,
        interest_percentage: fixed_interest_percentage,
        total_months: months_elapsed,
        accrued_interest,
        total_payable: accrued_interest,
    })
}