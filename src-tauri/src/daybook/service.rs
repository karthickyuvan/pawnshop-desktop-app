

// // version 4 
// use crate::db::connection::Db;
// use rusqlite::{params, Result};
// use serde::Serialize;

// #[derive(Serialize)]
// pub struct PaymentModeBreakdown {
//     pub cash: f64,
//     pub bank: f64,
//     pub upi: f64,
//     pub auction: f64, // ✅ Added to track total auction collections
// }

// #[derive(Serialize)]
// pub struct DenominationItem {
//     pub denomination: i32,
//     pub quantity: i32,
//     pub total: f64,
// }

// #[derive(Serialize)]
// pub struct DenominationDetail {
//     pub fund_tx_id: i64,
//     pub denominations: Vec<DenominationItem>,
// }

// #[derive(Serialize)]
// pub struct DaybookEntry {
//     pub time: String,
//     pub type_field: String,
//     pub module_type: String,
//     pub reason: String,
//     pub description: String,
//     pub payment_method: String,
//     pub transaction_ref: Option<String>,
//     pub amount: f64,
//     pub customer_name: Option<String>,  
//     pub fund_tx_id: i64,    
// }

// #[derive(Serialize)]
// pub struct DaybookResponse {
//     pub opening_balance: f64,
//     pub total_in: f64,
//     pub total_out: f64,
//     pub closing_balance: f64,
//     pub breakdown: PaymentModeBreakdown,
//     pub denominations: Vec<DenominationItem>,
//     pub entries: Vec<DaybookEntry>,
//     pub transaction_denominations: Vec<DenominationDetail>,
// }



// pub fn get_daybook(db: &Db, date: String) -> Result<DaybookResponse, String> {
//     let conn = db.0.lock().unwrap();

//     // 🟢 1. Opening Balance Calculation (FIXED: Added 'ft' alias)
//     let opening_balance: f64 = conn
//     .query_row(
//         "SELECT COALESCE(SUM(
//             CASE WHEN ft.type='ADD' THEN ft.total_amount
//                  WHEN ft.type='WITHDRAW' THEN -ft.total_amount
//             END
//         ),0)
//         FROM fund_transactions ft
//         WHERE substr(ft.created_at, 1, 10) < DATE(?1)", 
//         params![date],
//         |row| row.get(0),
//     )
//     .unwrap_or(0.0);

//     // 🟢 2. Calculate payment method breakdown CUMULATIVELY (FIXED: Added 'ft' alias)
//     let mut breakdown_stmt = conn.prepare(
//         "
//         SELECT 
//             ft.payment_method,
//             COALESCE(SUM(
//                 CASE WHEN ft.type='ADD' THEN ft.total_amount
//                      WHEN ft.type='WITHDRAW' THEN -ft.total_amount
//                 END
//             ), 0) as balance
//         FROM fund_transactions ft
//         WHERE substr(ft.created_at, 1, 10) <= DATE(?1)
//         GROUP BY ft.payment_method
//         "
//     ).map_err(|e| e.to_string())?;

//     let breakdown_rows = breakdown_stmt.query_map(params![date], |row| {
//         Ok((
//             row.get::<_, String>(0)?,
//             row.get::<_, f64>(1)?
//         ))
//     }).map_err(|e| e.to_string())?;

//     let mut cash = 0.0;
//     let mut bank = 0.0;
//     let mut upi = 0.0;
//     let mut auction = 0.0; 

//     for row in breakdown_rows {
//         let (method, balance) = row.map_err(|e| e.to_string())?;
//         match method.as_str() {
//             "CASH" => cash = balance,
//             "BANK" => bank = balance,
//             "UPI" => upi = balance,
//             "AUCTION" => auction = balance, 
//             _ => {}
//         }
//     }

//     // 🟢 3. Fetch Day Entries 
//     let mut stmt = conn.prepare(
//         "
//         SELECT 
//             ft.id,
//             ft.created_at,
//             ft.type, 
//             CASE 
//                 WHEN ft.payment_method = 'AUCTION' THEN 'AUCTION'
//                 ELSE ft.module_type
//             END as module_type,
//             ft.reference, 
//             COALESCE(ft.description, '') as description,
//             ft.payment_method, 
//             ft.total_amount,
//             ft.module_id,
//             c.name as customer_name,
//             ft.transaction_ref 
//         FROM fund_transactions ft
//         LEFT JOIN pledges p ON 
//             (ft.module_id = p.id AND ft.module_type IN ('PLEDGE', 'PAYMENT', 'INTEREST', 'CLOSURE', 'FEE'))
//             OR (ft.payment_method = 'AUCTION' AND ft.reference LIKE 'AUCTION-%' 
//                 AND p.pledge_no = SUBSTR(ft.reference, 9))
//         LEFT JOIN customers c ON p.customer_id = c.id
//         WHERE substr(ft.created_at, 1, 10) = DATE(?1)
//         ORDER BY ft.created_at DESC
//         "
//     ).map_err(|e| e.to_string())?;

//     let rows = stmt.query_map(params![date], |row| {
//         Ok(DaybookEntry {
//             fund_tx_id:      row.get(0)?,
//             time:            row.get(1)?,
//             type_field:      row.get(2)?,
//             module_type:     row.get::<_, Option<String>>(3)?.unwrap_or("OTHER".to_string()),
//             reason:          row.get::<_, Option<String>>(4)?.unwrap_or("".to_string()),
//             description:     row.get::<_, Option<String>>(5)?.unwrap_or("".to_string()), 
//             payment_method:  row.get(6)?,
//             amount:          row.get(7)?,
//             customer_name:   row.get::<_, Option<String>>(9)?,
//             transaction_ref: row.get::<_, Option<String>>(10)?,
//         })
//     })
//     .map_err(|e| e.to_string())?;

//     let mut entries = vec![];
//     let mut total_in = 0.0;
//     let mut total_out = 0.0;

//     for row in rows {
//         let entry = row.map_err(|e| e.to_string())?;
    
//         if entry.type_field == "ADD" {
//             total_in += entry.amount;
//         } else {
//             total_out += entry.amount;
//         }
    
//         entries.push(entry);
//     }

//     let closing_balance = opening_balance + total_in - total_out;

//     // 🟢 4. Denomination Summary
//     let mut denom_stmt = conn.prepare(
//         "
//         SELECT fd.denomination,
//                SUM(
//                    CASE WHEN ft.type='ADD' THEN fd.quantity
//                         WHEN ft.type='WITHDRAW' THEN -fd.quantity
//                    END
//                ) as qty
//         FROM fund_denominations fd
//         JOIN fund_transactions ft ON fd.fund_transaction_id = ft.id
//         WHERE substr(ft.created_at, 1, 10) <= DATE(?1)
//         GROUP BY fd.denomination
//         HAVING qty > 0
//         "
//     ).map_err(|e| e.to_string())?;

//     let denom_rows = denom_stmt.query_map(params![date], |row| {
//         let denom: i32 = row.get(0)?;
//         let qty: i32 = row.get(1)?;
//         Ok(DenominationItem {
//             denomination: denom,
//             quantity: qty,
//             total: denom as f64 * qty as f64,
//         })
//     }).map_err(|e| e.to_string())?;

//     let mut denominations = vec![];
//     for row in denom_rows {
//         denominations.push(row.map_err(|e| e.to_string())?);
//     }

//     // 🟢 5. Fetch denomination details for each CASH transaction
//     let mut denom_detail_stmt = conn.prepare(
//         "
//         SELECT 
//             fd.fund_transaction_id,
//             fd.denomination,
//             fd.quantity,
//             fd.amount
//         FROM fund_denominations fd
//         JOIN fund_transactions ft ON fd.fund_transaction_id = ft.id
//         WHERE substr(ft.created_at, 1, 10) = DATE(?1)
//         ORDER BY fd.fund_transaction_id, fd.denomination DESC
//         "
//     ).map_err(|e| e.to_string())?;

//     let denom_detail_rows = denom_detail_stmt
//         .query_map(params![date], |row| {
//             Ok((
//                 row.get::<_, i64>(0)?,      
//                 row.get::<_, i32>(1)?,      
//                 row.get::<_, i32>(2)?,      
//                 row.get::<_, f64>(3)?,      
//             ))
//         })
//         .map_err(|e| e.to_string())?;

//     let mut transaction_denominations: std::collections::HashMap<i64, Vec<DenominationItem>> = 
//         std::collections::HashMap::new();

//     for row in denom_detail_rows {
//         let (tx_id, denom, qty, amt) = row.map_err(|e| e.to_string())?;
        
//         transaction_denominations
//             .entry(tx_id)
//             .or_insert_with(Vec::new)
//             .push(DenominationItem {
//                 denomination: denom,
//                 quantity: qty,
//                 total: amt,
//             });
//     }

//     let transaction_denominations_vec: Vec<DenominationDetail> = transaction_denominations
//         .into_iter()
//         .map(|(fund_tx_id, denoms)| DenominationDetail {
//             fund_tx_id,
//             denominations: denoms,
//         })
//         .collect();

//     Ok(DaybookResponse {
//         opening_balance,
//         total_in,
//         total_out,
//         closing_balance,
//         breakdown: PaymentModeBreakdown { cash, bank, upi, auction }, 
//         denominations,
//         entries,
//         transaction_denominations: transaction_denominations_vec,  
//     })
// }













// src-tauri/src/daybook/service.rs

use crate::db::connection::Db;
use rusqlite::{params, Result};
use serde::Serialize;

#[derive(Serialize)]
pub struct PaymentModeBreakdown {
    pub cash: f64,
    pub bank: f64,
    pub upi: f64,
    pub auction: f64, 
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
    pub description: String,
    pub payment_method: String,
    pub transaction_ref: Option<String>,
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

    // 🟢 1. Opening Balance Calculation (CASH பரிவர்த்தனைகள் மட்டுமே கணக்கிடப்படுகிறது)
    let opening_balance: f64 = conn
    .query_row(
        "SELECT COALESCE(SUM(
            CASE WHEN ft.type='ADD' THEN ft.total_amount
                 WHEN ft.type='WITHDRAW' THEN -ft.total_amount
            END
        ),0)
        FROM fund_transactions ft
        WHERE ft.payment_method = 'CASH' AND substr(ft.created_at, 1, 10) < DATE(?1)", 
        params![date],
        |row| row.get(0),
    )
    .unwrap_or(0.0);

    // 🟢 2. Calculate payment method breakdown CUMULATIVELY
    let mut breakdown_stmt = conn.prepare(
        "
        SELECT 
            ft.payment_method,
            COALESCE(SUM(
                CASE WHEN ft.type='ADD' THEN ft.total_amount
                     WHEN ft.type='WITHDRAW' THEN -ft.total_amount
                END
            ), 0) as balance
        FROM fund_transactions ft
        WHERE substr(ft.created_at, 1, 10) <= DATE(?1)
        GROUP BY ft.payment_method
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
    let mut auction = 0.0; 

    for row in breakdown_rows {
        let (method, balance) = row.map_err(|e| e.to_string())?;
        match method.as_str() {
            "CASH" => cash = balance,
            "BANK" => bank = balance,
            "UPI" => upi = balance,
            "AUCTION" => auction = balance, 
            _ => {}
        }
    }

    // 🟢 3. Fetch Day Entries 
    let mut stmt = conn.prepare(
        "
        SELECT 
            ft.id,
            ft.created_at,
            ft.type, 
            CASE 
                WHEN ft.payment_method = 'AUCTION' THEN 'AUCTION'
                ELSE ft.module_type
            END as module_type,
            ft.reference, 
            COALESCE(ft.description, '') as description,
            ft.payment_method, 
            ft.total_amount,
            ft.module_id,
            c.name as customer_name,
            ft.transaction_ref 
        FROM fund_transactions ft
        LEFT JOIN pledges p ON 
            (ft.module_id = p.id AND ft.module_type IN ('PLEDGE', 'PAYMENT', 'INTEREST', 'CLOSURE', 'FEE'))
            OR (ft.payment_method = 'AUCTION' AND ft.reference LIKE 'AUCTION-%' 
                AND p.pledge_no = SUBSTR(ft.reference, 9))
        LEFT JOIN customers c ON p.customer_id = c.id
        WHERE substr(ft.created_at, 1, 10) = DATE(?1)
        ORDER BY ft.created_at DESC
        "
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![date], |row| {
        Ok(DaybookEntry {
            fund_tx_id:      row.get(0)?,
            time:            row.get(1)?,
            type_field:      row.get(2)?,
            module_type:     row.get::<_, Option<String>>(3)?.unwrap_or("OTHER".to_string()),
            reason:          row.get::<_, Option<String>>(4)?.unwrap_or("".to_string()),
            description:     row.get::<_, Option<String>>(5)?.unwrap_or("".to_string()), 
            payment_method:  row.get(6)?,
            amount:          row.get(7)?,
            customer_name:   row.get::<_, Option<String>>(9)?,
            transaction_ref: row.get::<_, Option<String>>(10)?,
        })
    })
    .map_err(|e| e.to_string())?;

    let mut entries = vec![];
    let mut total_in = 0.0;
    let mut total_out = 0.0;

    for row in rows {
        let entry = row.map_err(|e| e.to_string())?;
    
        // 🟢 Reconcile expected cash strictly from CASH payment methods only
        if entry.payment_method == "CASH" {
            if entry.type_field == "ADD" {
                total_in += entry.amount;
            } else {
                total_out += entry.amount;
            }
        }
    
        entries.push(entry);
    }

    let closing_balance = opening_balance + total_in - total_out;

    // 🟢 4. Denomination Summary (Fixed: Removed HAVING qty > 0)
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
        WHERE substr(ft.created_at, 1, 10) <= DATE(?1)
        GROUP BY fd.denomination
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

    // 🟢 5. Fetch denomination details for each CASH transaction
    let mut denom_detail_stmt = conn.prepare(
        "
        SELECT 
            fd.fund_transaction_id,
            fd.denomination,
            fd.quantity,
            fd.amount
        FROM fund_denominations fd
        JOIN fund_transactions ft ON fd.fund_transaction_id = ft.id
        WHERE substr(ft.created_at, 1, 10) = DATE(?1)
        ORDER BY fd.fund_transaction_id, fd.denomination DESC
        "
    ).map_err(|e| e.to_string())?;

    let denom_detail_rows = denom_detail_stmt
        .query_map(params![date], |row| {
            Ok((
                row.get::<_, i64>(0)?,      
                row.get::<_, i32>(1)?,      
                row.get::<_, i32>(2)?,      
                row.get::<_, f64>(3)?,      
            ))
        })
        .map_err(|e| e.to_string())?;

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
        breakdown: PaymentModeBreakdown { cash, bank, upi, auction }, 
        denominations,
        entries,
        transaction_denominations: transaction_denominations_vec,  
    })
}