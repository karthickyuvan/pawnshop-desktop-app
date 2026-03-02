// 3rd version 
use crate::db::connection::Db;
use rusqlite::{params, Result};
use serde::Serialize;

#[derive(Serialize)]
pub struct PaymentModeBreakdown {
    pub cash: f64,
    pub bank: f64,
    pub upi: f64,
}

#[derive(Serialize)]
pub struct DenominationItem {
    pub denomination: i32,
    pub quantity: i32,
    pub total: f64,
}

#[derive(Serialize)]
pub struct DenominationDetail {
    pub fund_tx_id: i64,
    pub denominations: Vec<DenominationItem>,
}

#[derive(Serialize)]
pub struct DaybookEntry {
    pub time: String,
    pub type_field: String,
    pub module_type: String,
    pub reason: String,
    pub payment_method: String,
    pub amount: f64,
    pub customer_name: Option<String>,  
    pub fund_tx_id: i64,    
}

#[derive(Serialize)]
pub struct DaybookResponse {
    pub opening_balance: f64,
    pub total_in: f64,
    pub total_out: f64,
    pub closing_balance: f64,
    pub breakdown: PaymentModeBreakdown,
    pub denominations: Vec<DenominationItem>,
    pub entries: Vec<DaybookEntry>,
    pub transaction_denominations: Vec<DenominationDetail>,
}

pub fn get_daybook(db: &Db, date: String) -> Result<DaybookResponse, String> {
    let conn = db.0.lock().unwrap();

    // 🟢 Opening Balance Calculation
    // Include: All transactions BEFORE today + Any "Opening Balance" transactions up to today
    let opening_balance: f64 = conn
        .query_row(
            "
            SELECT COALESCE(SUM(
                CASE WHEN type='ADD' THEN total_amount
                     WHEN type='WITHDRAW' THEN -total_amount
                END
            ),0)
            FROM fund_transactions
            WHERE DATE(created_at) < DATE(?1)
               OR (DATE(created_at) = DATE(?1) 
                   AND LOWER(COALESCE(reference, '')) = 'opening balance')
            ",
            params![date],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // 🟢 Calculate payment method breakdown CUMULATIVELY (up to and including selected date)
    // This shows the current balance in each payment method AS OF the selected date
    let mut breakdown_stmt = conn.prepare(
        "
        SELECT 
            payment_method,
            COALESCE(SUM(
                CASE WHEN type='ADD' THEN total_amount
                     WHEN type='WITHDRAW' THEN -total_amount
                END
            ), 0) as balance
        FROM fund_transactions
        WHERE DATE(created_at) <= DATE(?1)
        GROUP BY payment_method
        "
    ).map_err(|e| e.to_string())?;

    let breakdown_rows = breakdown_stmt.query_map(params![date], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, f64>(1)?
        ))
    }).map_err(|e| e.to_string())?;

    let mut cash = 0.0;
    let mut bank = 0.0;
    let mut upi = 0.0;

    for row in breakdown_rows {
        let (method, balance) = row.map_err(|e| e.to_string())?;
        match method.as_str() {
            "CASH" => cash = balance,
            "BANK" => bank = balance,
            "UPI" => upi = balance,
            _ => {}
        }
    }

    // 🟢 Fetch Day Entries (transactions that happened ON this specific date)
    let mut stmt = conn.prepare(
        "
        SELECT 
            ft.id,
            ft.created_at,
            ft.type, 
            ft.module_type,
            ft.reference, 
            ft.payment_method, 
            ft.total_amount,
            ft.module_id,
            c.name as customer_name
        FROM fund_transactions ft
        LEFT JOIN pledges p ON ft.module_id = p.id 
            AND ft.module_type IN ('PLEDGE', 'PAYMENT', 'INTEREST', 'CLOSURE', 'FEE')
        LEFT JOIN customers c ON p.customer_id = c.id
        WHERE DATE(ft.created_at) = DATE(?1)
        ORDER BY ft.created_at DESC
        "
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![date], |row| {
        Ok(DaybookEntry {
            fund_tx_id: row.get(0)?,
            time: row.get(1)?,
            type_field: row.get(2)?,
            module_type: row.get::<_, Option<String>>(3)?.unwrap_or("OTHER".to_string()),
            reason: row.get::<_, Option<String>>(4)?.unwrap_or("".to_string()),
            payment_method: row.get(5)?,
            amount: row.get(6)?,
            customer_name: row.get::<_, Option<String>>(8)?,
        })
    })
    .map_err(|e| e.to_string())?;

    let mut entries = vec![];
    let mut total_in = 0.0;
    let mut total_out = 0.0;

    for row in rows {
        let entry = row.map_err(|e| e.to_string())?;

        // Check if this is an opening balance entry
        let is_opening = entry.reason.to_lowercase() == "opening balance";

        if entry.type_field == "ADD" {
            // Only add to total_in if NOT opening balance
            if !is_opening {
                total_in += entry.amount;
            }
        } else {
            total_out += entry.amount;
        }

        entries.push(entry);
    }

    let closing_balance = opening_balance + total_in - total_out;

    // 🟢 Denomination Summary
    let mut denom_stmt = conn.prepare(
        "
        SELECT fd.denomination,
               SUM(
                   CASE WHEN ft.type='ADD' THEN fd.quantity
                        WHEN ft.type='WITHDRAW' THEN -fd.quantity
                   END
               ) as qty
        FROM fund_denominations fd
        JOIN fund_transactions ft ON fd.fund_transaction_id = ft.id
        WHERE DATE(ft.created_at) <= DATE(?1)
        GROUP BY fd.denomination
        HAVING qty > 0
        "
    ).map_err(|e| e.to_string())?;

    let denom_rows = denom_stmt.query_map(params![date], |row| {
        let denom: i32 = row.get(0)?;
        let qty: i32 = row.get(1)?;
        Ok(DenominationItem {
            denomination: denom,
            quantity: qty,
            total: denom as f64 * qty as f64,
        })
    }).map_err(|e| e.to_string())?;

    let mut denominations = vec![];
    for row in denom_rows {
        denominations.push(row.map_err(|e| e.to_string())?);
    }


    // 🟢 Fetch denomination details for each CASH transaction
let mut denom_detail_stmt = conn.prepare(
    "
    SELECT 
        fd.fund_transaction_id,
        fd.denomination,
        fd.quantity,
        fd.amount
    FROM fund_denominations fd
    JOIN fund_transactions ft ON fd.fund_transaction_id = ft.id
    WHERE DATE(ft.created_at) = DATE(?1)
    ORDER BY fd.fund_transaction_id, fd.denomination DESC
    "
).map_err(|e| e.to_string())?;

let denom_detail_rows = denom_detail_stmt
    .query_map(params![date], |row| {
        Ok((
            row.get::<_, i64>(0)?,      // fund_transaction_id
            row.get::<_, i32>(1)?,      // denomination
            row.get::<_, i32>(2)?,      // quantity
            row.get::<_, f64>(3)?,      // amount
        ))
    })
    .map_err(|e| e.to_string())?;

    // Group by fund_transaction_id
    let mut transaction_denominations: std::collections::HashMap<i64, Vec<DenominationItem>> = 
        std::collections::HashMap::new();

    for row in denom_detail_rows {
        let (tx_id, denom, qty, amt) = row.map_err(|e| e.to_string())?;
        
        transaction_denominations
            .entry(tx_id)
            .or_insert_with(Vec::new)
            .push(DenominationItem {
                denomination: denom,
                quantity: qty,
                total: amt,
            });
    }

    // Convert to Vec<DenominationDetail>
    let transaction_denominations_vec: Vec<DenominationDetail> = transaction_denominations
        .into_iter()
        .map(|(fund_tx_id, denoms)| DenominationDetail {
            fund_tx_id,
            denominations: denoms,
        })
        .collect();

        Ok(DaybookResponse {
            opening_balance,
            total_in,
            total_out,
            closing_balance,
            breakdown: PaymentModeBreakdown { cash, bank, upi },
            denominations,
            entries,
            transaction_denominations: transaction_denominations_vec,  // ✅ ADD THIS
        })
}