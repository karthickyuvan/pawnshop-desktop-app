// // use crate::db::connection::Db;
// // use rusqlite::{params, Result};
// // use chrono::Local;

// // pub fn map_bank_to_pledge(
// //     db: &Db,
// //     pledge_id: i64,
// //     bank_id: i64,
// //     amount: f64,
// //     bank_charges: f64,
// //     payment_method: String,
// //     created_by: i64,
// // ) -> Result<(), String> {
// //     let net_amount = amount - bank_charges;

// //     let mut conn = db.0.lock().unwrap();
// //     let tx = conn.transaction().map_err(|e| e.to_string())?;

// //     // =========================
// //     // 1️⃣ Insert Bank Mapping
// //     // =========================
// //     tx.execute(
// //         "INSERT INTO bank_mappings
// //         (pledge_id, bank_id, amount, bank_charges, net_amount)
// //         VALUES (?1, ?2, ?3, ?4, ?5)",
// //         params![pledge_id, bank_id, amount, bank_charges, net_amount],
// //     )
// //     .map_err(|e| e.to_string())?;

// //     let mapping_id = tx.last_insert_rowid();

// //     // =========================
// //     // 2️⃣ Add Bank Loan to Drawer
// //     // =========================
// //     tx.execute(
// //         "INSERT INTO fund_transactions
// //         (type, total_amount, module_type, module_id, reference, payment_method, created_by)
// //         VALUES ('ADD', ?1, 'BANK_MAPPING', ?2, ?3, ?4, ?5)",
// //         params![
// //             amount,
// //             pledge_id,
// //             format!("Bank Loan for Pledge {}", pledge_id),
// //             payment_method,
// //             created_by
// //         ],
// //     )
// //     .map_err(|e| e.to_string())?;

// //     // =========================
// //     // 3️⃣ Bank Processing Fee (Expense)
// //     // =========================
// //     if bank_charges > 0.0 {
// //         tx.execute(
// //             "INSERT INTO fund_transactions
// //             (type, total_amount, module_type, module_id, reference, payment_method, created_by)
// //             VALUES ('WITHDRAW', ?1, 'EXPENSE', ?2, ?3, ?4, ?5)",
// //             params![
// //                 bank_charges,
// //                 pledge_id,
// //                 format!("Bank Charges for Pledge {}", pledge_id),
// //                 payment_method,
// //                 created_by
// //             ],
// //         )
// //         .map_err(|e| e.to_string())?;
// //     }

// //     tx.commit().map_err(|e| e.to_string())?;
// //     Ok(())
// // }


// // pub fn unmap_bank_from_pledge(
// //     db: &Db,
// //     mapping_id: i64,
// //     pledge_id: i64,
// //     bank_repayment: f64,
// //     payment_method: String,
// //     created_by: i64,
// // ) -> Result<(), String> {

// //     let mut conn = db.0.lock().unwrap();
// //     let tx = conn.transaction().map_err(|e| e.to_string())?;

// //     // =========================
// //     // 1️⃣ Withdraw Bank Repayment
// //     // =========================
// //     tx.execute(
// //         "INSERT INTO fund_transactions
// //         (type, total_amount, module_type, module_id, reference, payment_method, created_by)
// //         VALUES ('WITHDRAW', ?1, 'CLOSURE', ?2, ?3, ?4, ?5)",
// //         params![
// //             bank_repayment,
// //             pledge_id,
// //             format!("Bank Closure for Pledge {}", pledge_id),
// //             payment_method,
// //             created_by
// //         ],
// //     )
// //     .map_err(|e| e.to_string())?;

// //     // =========================
// //     // 2️⃣ Mark Mapping Reversed
// //     // =========================
// //     tx.execute(
// //         "UPDATE bank_mappings 
// //          SET status = 'REVERSED'
// //          WHERE id = ?1",
// //         params![mapping_id],
// //     )
// //     .map_err(|e| e.to_string())?;

// //     tx.commit().map_err(|e| e.to_string())?;
// //     Ok(())
// // }


// // bank_mapping/service.rs
// use crate::db::connection::Db;
// use rusqlite::{params, Result as SqlResult};
// use serde::{Deserialize, Serialize};


// #[derive(Serialize, Deserialize, Debug, Clone)]
// pub struct DenominationEntry {
//     pub denomination: i32,
//     pub quantity: i32,
// }

// #[derive(Serialize, Deserialize, Debug)]
// pub struct PledgeDetails {
//     pub pledge_id: i64,
//     pub customer_name: String,
//     pub pledge_no: String,
//     pub loan_amount: f64,
//     pub status: String,
//     pub created_at: String,
//     pub is_bank_mapped: bool,
//     pub bank_mapping_id: Option<i64>,
// }

// #[derive(Serialize, Deserialize, Debug, Clone)]
// pub struct BankMappingRequest {
//     pub pledge_id: i64,
//     pub bank_id: i64,
//     pub bank_loan_amount: f64,   // Amount bank agreed to give
//     pub actual_received: f64,     // Amount actually received from bank
//     pub bank_charges: f64,
//     pub payment_method: String,   // Not used in mapping (bank always gives cash)
//     pub actor_user_id: i64,
//     pub denominations: Option<Vec<DenominationEntry>>,  // ← add this
//     pub reference_number: Option<String>, 
// }

// #[derive(Serialize, Deserialize, Debug, Clone)]
// pub struct BankUnmappingRequest {
//     pub mapping_id: i64,
//     pub pledge_id: i64,
//     pub customer_payment: f64,      // Total received from customer (principal + interest)
//     pub bank_repayment: f64,        // Total paid to bank (principal + interest)
//     pub bank_interest: f64,         // Interest paid to bank (for reference)
//     pub customer_interest: f64,     // Interest received from customer (for reference)
//     pub payment_method: String,     // Not really used (always cash/bank)
//     pub actor_user_id: i64,
//     pub denominations: Option<Vec<DenominationEntry>>,  // ← add this
//     pub reference_number: Option<String>, 
// }

// /// Fetch pledge details by pledge number
// pub fn get_pledge_by_number(db: &Db, pledge_no: &str) -> Result<PledgeDetails, String> {
//     let conn = db.0.lock().unwrap();

//     let mut stmt = conn
//         .prepare(
//             "SELECT 
//                 p.id,
//                 c.name as customer_name,
//                 p.pledge_no,
//                 p.loan_amount,
//                 p.status,
//                 p.created_at,
//                 CASE 
//                     WHEN EXISTS (
//                         SELECT 1 FROM bank_mappings 
//                         WHERE pledge_id = p.id AND status = 'ACTIVE'
//                     ) THEN 1 
//                     ELSE 0 
//                 END as is_mapped,
//                 (SELECT id FROM bank_mappings WHERE pledge_id = p.id AND status = 'ACTIVE' LIMIT 1) as mapping_id
//             FROM pledges p
//             JOIN customers c ON p.customer_id = c.id
//             WHERE p.pledge_no = ?1",
//         )
//         .map_err(|e| e.to_string())?;

//     let pledge = stmt
//         .query_row(params![pledge_no], |row| {
//             Ok(PledgeDetails {
//                 pledge_id: row.get(0)?,
//                 customer_name: row.get(1)?,
//                 pledge_no: row.get(2)?,
//                 loan_amount: row.get(3)?,
//                 status: row.get(4)?,
//                 created_at: row.get(5)?,
//                 is_bank_mapped: row.get::<_, i64>(6)? == 1,
//                 bank_mapping_id: row.get(7).ok(),
//             })
//         })
//         .map_err(|e| format!("Pledge not found: {}", e))?;

//     Ok(pledge)
// }

// /// Map bank to pledge
// /// IMPORTANT: Pledge disbursement to customer already happened on pledge creation day!
// /// This function ONLY records the bank transaction.
// pub fn map_bank_to_pledge(
//     db: &Db,
//     request: &BankMappingRequest,
// ) -> Result<i64, String> {
//     let mut conn = db.0.lock().unwrap();
//     let tx = conn.transaction().map_err(|e| e.to_string())?;

//     // 1. Check if pledge already mapped
//     let existing: Option<i64> = tx
//         .query_row(
//             "SELECT id FROM bank_mappings WHERE pledge_id = ?1 AND status = 'ACTIVE'",
//             params![request.pledge_id],
//             |row| row.get(0),
//         )
//         .ok();

//     if existing.is_some() {
//         return Err("Pledge is already mapped to a bank".to_string());
//     }

//     // 2. Get pledge loan amount (for reference only)
//     let pledge_loan: f64 = tx
//         .query_row(
//             "SELECT loan_amount FROM pledges WHERE id = ?1",
//             params![request.pledge_id],
//             |row| row.get(0),
//         )
//         .map_err(|e| format!("Failed to fetch pledge: {}", e))?;

//     // 3. Calculate net amount from bank after charges
//     let net_from_bank = request.actual_received - request.bank_charges;
    
//     // 4. Calculate surplus/deficit
//     // Surplus: Bank gave MORE than customer loan
//     // Deficit: Bank gave LESS than customer loan
//     let difference = net_from_bank - pledge_loan;
//     let is_surplus = difference > 0.0;

//     // 5. Insert bank mapping record
//     tx.execute(
//         "INSERT INTO bank_mappings
//         (pledge_id, bank_id, amount, bank_charges, net_amount, mapped_date, status)
//         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), 'ACTIVE')",
//         params![
//             request.pledge_id,
//             request.bank_id,
//             request.bank_loan_amount,
//             request.bank_charges,
//             net_from_bank
//         ],
//     )
//     .map_err(|e| e.to_string())?;

//     let mapping_id = tx.last_insert_rowid();

//     // 6. Record cash received from bank (INFLOW)
//     // This is the actual cash that came into the shop
//     tx.execute(
//         "INSERT INTO fund_transactions
//         (type, total_amount, module_type, module_id, reference, payment_method, created_by, created_at)
//         VALUES ('ADD', ?1, 'BANK_MAPPING', ?2, ?3, 'CASH', ?4, datetime('now'))",
//         params![
//             request.actual_received,
//             mapping_id,
//             format!("Bank loan received for Pledge #{} - {}", request.pledge_id, if is_surplus { "SURPLUS" } else { "DEFICIT" }),
//             request.actor_user_id
//         ],
//     )
//     .map_err(|e| e.to_string())?;

//     let bank_inflow_tx_id = tx.last_insert_rowid();
    
//     // Add denominations for cash received
//     insert_denominations(&tx, bank_inflow_tx_id, &request.denominations, request.actual_received)?;


//     // 7. Record bank charges as expense (OUTFLOW)
//     if request.bank_charges > 0.0 {
//         tx.execute(
//             "INSERT INTO fund_transactions
//             (type, total_amount, module_type, module_id, reference, payment_method, created_by, created_at)
//             VALUES ('WITHDRAW', ?1, 'EXPENSE', ?2, ?3, 'CASH', ?4, datetime('now'))",
//             params![
//                 request.bank_charges,
//                 mapping_id,
//                 format!("Bank charges for Pledge #{}", request.pledge_id),
//                 request.actor_user_id
//             ],
//         )
//         .map_err(|e| e.to_string())?;

//         let charges_tx_id = tx.last_insert_rowid();
//         insert_denominations(&tx, charges_tx_id, &None, request.bank_charges)?;

//     }

//     // NOTE: We do NOT record pledge disbursement here because it was already
//     // recorded when the pledge was created!

//     tx.commit().map_err(|e| e.to_string())?;
//     Ok(mapping_id)
// }

// /// Unmap bank (customer closure + bank repayment)
// pub fn unmap_bank_from_pledge(
//     db: &Db,
//     request: &BankUnmappingRequest,
// ) -> Result<(), String> {
//     let mut conn = db.0.lock().unwrap();
//     let tx = conn.transaction().map_err(|e| e.to_string())?;

//     // 1. Verify mapping exists and is active
//     let (bank_net_amount, bank_original_amount): (f64, f64) = tx
//         .query_row(
//             "SELECT net_amount, amount FROM bank_mappings WHERE id = ?1 AND status = 'ACTIVE'",
//             params![request.mapping_id],
//             |row| Ok((row.get(0)?, row.get(1)?)),
//         )
//         .map_err(|_| "Bank mapping not found or already unmapped".to_string())?;

//     // 2. Get pledge loan amount
//     let pledge_loan: f64 = tx
//         .query_row(
//             "SELECT loan_amount FROM pledges WHERE id = ?1",
//             params![request.pledge_id],
//             |row| row.get(0),
//         )
//         .map_err(|e| format!("Failed to fetch pledge: {}", e))?;

//     // 3. Mark bank mapping as reversed
//     tx.execute(
//         "UPDATE bank_mappings SET status = 'REVERSED' WHERE id = ?1",
//         params![request.mapping_id],
//     )
//     .map_err(|e| e.to_string())?;

//     // 4. Record customer payment received (INFLOW)
//     tx.execute(
//         "INSERT INTO fund_transactions
//         (type, total_amount, module_type, module_id, reference, payment_method, created_by, created_at)
//         VALUES ('ADD', ?1, 'CLOSURE', ?2, ?3, 'CASH', ?4, datetime('now'))",
//         params![
//             request.customer_payment,
//             request.pledge_id,
//             format!("Customer closure payment for Pledge #{}", request.pledge_id),
//             request.actor_user_id
//         ],
//     )
//     .map_err(|e| e.to_string())?;

//     let customer_tx_id = tx.last_insert_rowid();
//     insert_denominations(&tx, customer_tx_id, &request.denominations, request.customer_payment)?;


//     // 5. Record bank repayment made (OUTFLOW)
//     tx.execute(
//         "INSERT INTO fund_transactions
//         (type, total_amount, module_type, module_id, reference, payment_method, created_by, created_at)
//         VALUES ('WITHDRAW', ?1, 'BANK_MAPPING', ?2, ?3, 'CASH', ?4, datetime('now'))",
//         params![
//             request.bank_repayment,
//             request.mapping_id,
//             format!("Bank repayment for Pledge #{}", request.pledge_id),
//             request.actor_user_id
//         ],
//     )
//     .map_err(|e| e.to_string())?;

//     let bank_repay_tx_id = tx.last_insert_rowid();
//     insert_denominations(&tx, bank_repay_tx_id, &None, request.bank_repayment)?;


//     // 6. Calculate net profit/loss
//     // Customer gave: customer_payment
//     // Owner paid bank: bank_repayment
//     // Net difference: customer_payment - bank_repayment
//     let owner_net = request.customer_payment - request.bank_repayment;

//     // Note: This net includes:
//     // - Processing fees collected from customer at pledge time
//     // - Interest collected from customer
//     // - Minus bank interest paid
//     // - Plus any surplus from bank mapping
//     // - Minus any deficit from bank mapping

//     // No need to record this separately as it's already reflected in the
//     // fund transactions above. The daybook will show the correct balance.

//     // 7. Update pledge status to CLOSED
//     tx.execute(
//         "UPDATE pledges SET status = 'CLOSED' WHERE id = ?1",
//         params![request.pledge_id],
//     )
//     .map_err(|e| e.to_string())?;

//     tx.commit().map_err(|e| e.to_string())?;
//     Ok(())
// }

// /// Get all bank mappings with details
// pub fn get_bank_mappings(db: &Db) -> Result<Vec<serde_json::Value>, String> {
//     let conn = db.0.lock().unwrap();

//     let mut stmt = conn
//         .prepare(
//             "SELECT 
//                 bm.id,
//                 bm.pledge_id,
//                 p.pledge_no,
//                 c.name as customer_name,
//                 b.bank_name,
//                 b.account_number,
//                 bm.amount as bank_loan_amount,
//                 bm.bank_charges,
//                 bm.net_amount,
//                 p.loan_amount as pledge_amount,
//                 bm.mapped_date,
//                 bm.status
//             FROM bank_mappings bm
//             JOIN pledges p ON bm.pledge_id = p.id
//             JOIN customers c ON p.customer_id = c.id
//             JOIN banks b ON bm.bank_id = b.id
//             ORDER BY bm.mapped_date DESC",
//         )
//         .map_err(|e| e.to_string())?;

//     let mappings = stmt
//         .query_map([], |row| {
//             let net_amount: f64 = row.get(8)?;
//             let pledge_amount: f64 = row.get(9)?;
//             let difference = net_amount - pledge_amount;
            
//             Ok(serde_json::json!({
//                 "id": row.get::<_, i64>(0)?,
//                 "pledge_id": row.get::<_, i64>(1)?,
//                 "pledge_no": row.get::<_, String>(2)?,
//                 "customer_name": row.get::<_, String>(3)?,
//                 "bank_name": row.get::<_, String>(4)?,
//                 "account_number": row.get::<_, String>(5)?,
//                 "bank_loan_amount": row.get::<_, f64>(6)?,
//                 "bank_charges": row.get::<_, f64>(7)?,
//                 "net_amount": net_amount,
//                 "pledge_amount": pledge_amount,
//                 "difference": difference,
//                 "is_surplus": difference > 0.0,
//                 "mapped_date": row.get::<_, String>(10)?,
//                 "status": row.get::<_, String>(11)?
//             }))
//         })
//         .map_err(|e| e.to_string())?
//         .collect::<SqlResult<Vec<_>>>()
//         .map_err(|e| e.to_string())?;

//     Ok(mappings)
// }

// fn insert_denominations(
//     tx: &rusqlite::Transaction,
//     fund_tx_id: i64,
//     denominations: &Option<Vec<DenominationEntry>>,
//     fallback_amount: f64,
// ) -> Result<(), String> {
//     match denominations {
//         Some(denoms) if !denoms.is_empty() => {
//             // Insert only non-zero user-entered denominations
//             for entry in denoms {
//                 if entry.quantity > 0 {
//                     let amount = entry.denomination as f64 * entry.quantity as f64;
//                     tx.execute(
//                         "INSERT INTO fund_denominations
//                         (fund_transaction_id, denomination, quantity, amount)
//                         VALUES (?1, ?2, ?3, ?4)",
//                         params![fund_tx_id, entry.denomination, entry.quantity, amount],
//                     )
//                     .map_err(|e| e.to_string())?;
//                 }
//             }
//         }
//         _ => {
//             // No denominations provided — skip, don't auto-calculate
//             // Daybook will show amount without breakdown
//         }
//     }
//     Ok(())
// }



// /// Search pledges by partial pledge number (for live search)
// pub fn search_pledges_for_mapping(db: &Db, query: &str) -> Result<Vec<PledgeDetails>, String> {
//     let conn = db.0.lock().unwrap();
//     let search_pattern = format!("%{}%", query);

//     let mut stmt = conn
//         .prepare(
//             "SELECT 
//                 p.id,
//                 c.name as customer_name,
//                 p.pledge_no,
//                 p.loan_amount,
//                 p.status,
//                 p.created_at,
//                 CASE 
//                     WHEN EXISTS (
//                         SELECT 1 FROM bank_mappings 
//                         WHERE pledge_id = p.id AND status = 'ACTIVE'
//                     ) THEN 1 
//                     ELSE 0 
//                 END as is_mapped,
//                 (SELECT id FROM bank_mappings WHERE pledge_id = p.id AND status = 'ACTIVE' LIMIT 1) as mapping_id
//             FROM pledges p
//             JOIN customers c ON p.customer_id = c.id
//             WHERE p.pledge_no LIKE ?1
//             AND p.status != 'CLOSED'
//             ORDER BY p.created_at DESC
//             LIMIT 10",
//         )
//         .map_err(|e| e.to_string())?;

//     let results = stmt
//         .query_map(rusqlite::params![search_pattern], |row| {
//             Ok(PledgeDetails {
//                 pledge_id: row.get(0)?,
//                 customer_name: row.get(1)?,
//                 pledge_no: row.get(2)?,
//                 loan_amount: row.get(3)?,
//                 status: row.get(4)?,
//                 created_at: row.get(5)?,
//                 is_bank_mapped: row.get::<_, i64>(6)? == 1,
//                 bank_mapping_id: row.get(7).ok(),
//             })
//         })
//         .map_err(|e| e.to_string())?
//         .collect::<rusqlite::Result<Vec<_>>>()
//         .map_err(|e| e.to_string())?;

//     Ok(results)
// }






// bank_mapping/service.rs
use crate::db::connection::Db;
use rusqlite::{params, Result as SqlResult};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DenominationEntry {
    pub denomination: i32,
    pub quantity: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PledgeDetails {
    pub pledge_id: i64,
    pub customer_name: String,
    pub pledge_no: String,
    pub loan_amount: f64,
    pub status: String,
    pub created_at: String,
    pub is_bank_mapped: bool,
    pub bank_mapping_id: Option<i64>,
    pub bank_loan_amount: Option<f64>, // ← Amount from bank_mappings.amount (what bank gave us)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BankMappingRequest {
    pub pledge_id: i64,
    pub bank_id: i64,
    pub bank_loan_amount: f64,
    pub actual_received: f64,
    pub bank_charges: f64,
    pub payment_method: String,
    pub actor_user_id: i64,
    pub denominations: Option<Vec<DenominationEntry>>,
    pub reference_number: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BankUnmappingRequest {
    pub mapping_id: i64,
    pub pledge_id: i64,
    pub customer_payment: f64,
    pub bank_repayment: f64,
    pub bank_interest: f64,
    pub customer_interest: f64,
    pub payment_method: String,
    pub actor_user_id: i64,
    pub denominations: Option<Vec<DenominationEntry>>,
    pub reference_number: Option<String>,
}

// ─────────────────────────────────────────────────────────────────────────────
// get_pledge_by_number
// Added index 8 → bank_loan_amount (SELECT amount FROM bank_mappings WHERE ACTIVE)
// ─────────────────────────────────────────────────────────────────────────────
pub fn get_pledge_by_number(db: &Db, pledge_no: &str) -> Result<PledgeDetails, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT 
                p.id,
                c.name AS customer_name,
                p.pledge_no,
                p.loan_amount,
                p.status,
                p.created_at,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM bank_mappings 
                        WHERE pledge_id = p.id AND status = 'ACTIVE'
                    ) THEN 1 
                    ELSE 0 
                END AS is_mapped,
                (SELECT id     FROM bank_mappings WHERE pledge_id = p.id AND status = 'ACTIVE' LIMIT 1) AS mapping_id,
                (SELECT amount FROM bank_mappings WHERE pledge_id = p.id AND status = 'ACTIVE' LIMIT 1) AS bank_loan_amount
            FROM pledges p
            JOIN customers c ON p.customer_id = c.id
            WHERE p.pledge_no = ?1",
        )
        .map_err(|e| e.to_string())?;

    let pledge = stmt
        .query_row(params![pledge_no], |row| {
            Ok(PledgeDetails {
                pledge_id:       row.get(0)?,
                customer_name:   row.get(1)?,
                pledge_no:       row.get(2)?,
                loan_amount:     row.get(3)?,
                status:          row.get(4)?,
                created_at:      row.get(5)?,
                is_bank_mapped:  row.get::<_, i64>(6)? == 1,
                bank_mapping_id: row.get(7).ok(),
                bank_loan_amount: row.get(8).ok(), // ← NEW
            })
        })
        .map_err(|e| format!("Pledge not found: {}", e))?;

    Ok(pledge)
}

// ─────────────────────────────────────────────────────────────────────────────
// map_bank_to_pledge  (unchanged logic, kept as-is)
// ─────────────────────────────────────────────────────────────────────────────
pub fn map_bank_to_pledge(
    db: &Db,
    request: &BankMappingRequest,
) -> Result<i64, String> {
    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 1. Check pledge not already mapped
    let existing: Option<i64> = tx
        .query_row(
            "SELECT id FROM bank_mappings WHERE pledge_id = ?1 AND status = 'ACTIVE'",
            params![request.pledge_id],
            |row| row.get(0),
        )
        .ok();

    if existing.is_some() {
        return Err("Pledge is already mapped to a bank".to_string());
    }

    // 2. Get pledge loan amount
    let pledge_loan: f64 = tx
        .query_row(
            "SELECT loan_amount FROM pledges WHERE id = ?1",
            params![request.pledge_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to fetch pledge: {}", e))?;

    // 3. Calculate net amount after bank charges
    let net_from_bank = request.actual_received - request.bank_charges;
    let difference    = net_from_bank - pledge_loan;
    let is_surplus    = difference > 0.0;

    // 4. Insert bank_mappings row
    tx.execute(
        "INSERT INTO bank_mappings
            (pledge_id, bank_id, amount, bank_charges, net_amount, mapped_date, status)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), 'ACTIVE')",
        params![
            request.pledge_id,
            request.bank_id,
            request.bank_loan_amount,
            request.bank_charges,
            net_from_bank
        ],
    )
    .map_err(|e| e.to_string())?;

    let mapping_id = tx.last_insert_rowid();

    // 5. Record cash received from bank (INFLOW)
    tx.execute(
        "INSERT INTO fund_transactions
            (type, total_amount, module_type, module_id, reference, payment_method, created_by, created_at)
         VALUES ('ADD', ?1, 'BANK_MAPPING', ?2, ?3, 'CASH', ?4, datetime('now'))",
        params![
            request.actual_received,
            mapping_id,
            format!(
                "Bank loan received for Pledge #{} - {}",
                request.pledge_id,
                if is_surplus { "SURPLUS" } else { "DEFICIT" }
            ),
            request.actor_user_id
        ],
    )
    .map_err(|e| e.to_string())?;

    let bank_inflow_tx_id = tx.last_insert_rowid();
    insert_denominations(&tx, bank_inflow_tx_id, &request.denominations, request.actual_received)?;

    // 6. Record bank charges as expense (OUTFLOW)
    if request.bank_charges > 0.0 {
        tx.execute(
            "INSERT INTO fund_transactions
                (type, total_amount, module_type, module_id, reference, payment_method, created_by, created_at)
             VALUES ('WITHDRAW', ?1, 'EXPENSE', ?2, ?3, 'CASH', ?4, datetime('now'))",
            params![
                request.bank_charges,
                mapping_id,
                format!("Bank charges for Pledge #{}", request.pledge_id),
                request.actor_user_id
            ],
        )
        .map_err(|e| e.to_string())?;

        let charges_tx_id = tx.last_insert_rowid();
        insert_denominations(&tx, charges_tx_id, &None, request.bank_charges)?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(mapping_id)
}

// ─────────────────────────────────────────────────────────────────────────────
// unmap_bank_from_pledge  (unchanged logic, kept as-is)
// ─────────────────────────────────────────────────────────────────────────────
pub fn unmap_bank_from_pledge(
    db: &Db,
    request: &BankUnmappingRequest,
) -> Result<(), String> {
    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 1. Verify mapping exists and is active
    let (_bank_net_amount, _bank_original_amount): (f64, f64) = tx
        .query_row(
            "SELECT net_amount, amount FROM bank_mappings WHERE id = ?1 AND status = 'ACTIVE'",
            params![request.mapping_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|_| "Bank mapping not found or already unmapped".to_string())?;

    // 2. Mark bank mapping as REVERSED
    tx.execute(
        "UPDATE bank_mappings SET status = 'REVERSED' WHERE id = ?1",
        params![request.mapping_id],
    )
    .map_err(|e| e.to_string())?;

    // 3. Record bank repayment paid out (OUTFLOW from drawer)
    tx.execute(
        "INSERT INTO fund_transactions
            (type, total_amount, module_type, module_id, reference, payment_method, created_by, created_at)
         VALUES ('WITHDRAW', ?1, 'BANK_MAPPING', ?2, ?3, ?4, ?5, datetime('now'))",
        params![
            request.bank_repayment,
            request.mapping_id,
            format!("Bank repayment for Pledge #{}", request.pledge_id),
            request.payment_method,
            request.actor_user_id
        ],
    )
    .map_err(|e| e.to_string())?;

    let bank_repay_tx_id = tx.last_insert_rowid();
    insert_denominations(&tx, bank_repay_tx_id, &request.denominations, request.bank_repayment)?;

    // NOTE: Pledge is NOT closed here.
    // After unmapping, the pledge returns to normal ACTIVE state.
    // Customer must pay via the normal Payment panel to close the pledge.
    // The bank_mappings status = 'REVERSED' means the closure block in
    // add_pledge_payment will now allow closure (WHERE status = 'ACTIVE' returns 0).

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// get_bank_mappings  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
pub fn get_bank_mappings(db: &Db) -> Result<Vec<serde_json::Value>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT 
                bm.id,
                bm.pledge_id,
                p.pledge_no,
                c.name AS customer_name,
                b.bank_name,
                b.account_number,
                bm.amount AS bank_loan_amount,
                bm.bank_charges,
                bm.net_amount,
                p.loan_amount AS pledge_amount,
                bm.mapped_date,
                bm.status
            FROM bank_mappings bm
            JOIN pledges  p ON bm.pledge_id = p.id
            JOIN customers c ON p.customer_id = c.id
            JOIN banks    b ON bm.bank_id = b.id
            ORDER BY bm.mapped_date DESC",
        )
        .map_err(|e| e.to_string())?;

    let mappings = stmt
        .query_map([], |row| {
            let net_amount: f64    = row.get(8)?;
            let pledge_amount: f64 = row.get(9)?;
            let difference         = net_amount - pledge_amount;

            Ok(serde_json::json!({
                "id":               row.get::<_, i64>(0)?,
                "pledge_id":        row.get::<_, i64>(1)?,
                "pledge_no":        row.get::<_, String>(2)?,
                "customer_name":    row.get::<_, String>(3)?,
                "bank_name":        row.get::<_, String>(4)?,
                "account_number":   row.get::<_, String>(5)?,
                "bank_loan_amount": row.get::<_, f64>(6)?,
                "bank_charges":     row.get::<_, f64>(7)?,
                "net_amount":       net_amount,
                "pledge_amount":    pledge_amount,
                "difference":       difference,
                "is_surplus":       difference > 0.0,
                "mapped_date":      row.get::<_, String>(10)?,
                "status":           row.get::<_, String>(11)?
            }))
        })
        .map_err(|e| e.to_string())?
        .collect::<SqlResult<Vec<_>>>()
        .map_err(|e| e.to_string())?;

    Ok(mappings)
}

// ─────────────────────────────────────────────────────────────────────────────
// search_pledges_for_mapping
// Added index 8 → bank_loan_amount (same subquery as get_pledge_by_number)
// ─────────────────────────────────────────────────────────────────────────────
pub fn search_pledges_for_mapping(db: &Db, query: &str) -> Result<Vec<PledgeDetails>, String> {
    let conn = db.0.lock().unwrap();
    let search_pattern = format!("%{}%", query);

    let mut stmt = conn
        .prepare(
            "SELECT 
                p.id,
                c.name AS customer_name,
                p.pledge_no,
                p.loan_amount,
                p.status,
                p.created_at,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM bank_mappings 
                        WHERE pledge_id = p.id AND status = 'ACTIVE'
                    ) THEN 1 
                    ELSE 0 
                END AS is_mapped,
                (SELECT id     FROM bank_mappings WHERE pledge_id = p.id AND status = 'ACTIVE' LIMIT 1) AS mapping_id,
                (SELECT amount FROM bank_mappings WHERE pledge_id = p.id AND status = 'ACTIVE' LIMIT 1) AS bank_loan_amount
            FROM pledges p
            JOIN customers c ON p.customer_id = c.id
            WHERE p.pledge_no LIKE ?1
              AND p.status != 'CLOSED'
            ORDER BY p.created_at DESC
            LIMIT 10",
        )
        .map_err(|e| e.to_string())?;

    let results = stmt
        .query_map(rusqlite::params![search_pattern], |row| {
            Ok(PledgeDetails {
                pledge_id:        row.get(0)?,
                customer_name:    row.get(1)?,
                pledge_no:        row.get(2)?,
                loan_amount:      row.get(3)?,
                status:           row.get(4)?,
                created_at:       row.get(5)?,
                is_bank_mapped:   row.get::<_, i64>(6)? == 1,
                bank_mapping_id:  row.get(7).ok(),
                bank_loan_amount: row.get(8).ok(), // ← NEW
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())?;

    Ok(results)
}

// ─────────────────────────────────────────────────────────────────────────────
// insert_denominations  (unchanged helper)
// ─────────────────────────────────────────────────────────────────────────────
fn insert_denominations(
    tx: &rusqlite::Transaction,
    fund_tx_id: i64,
    denominations: &Option<Vec<DenominationEntry>>,
    _fallback_amount: f64,
) -> Result<(), String> {
    match denominations {
        Some(denoms) if !denoms.is_empty() => {
            for entry in denoms {
                if entry.quantity > 0 {
                    let amount = entry.denomination as f64 * entry.quantity as f64;
                    tx.execute(
                        "INSERT INTO fund_denominations
                            (fund_transaction_id, denomination, quantity, amount)
                         VALUES (?1, ?2, ?3, ?4)",
                        params![fund_tx_id, entry.denomination, entry.quantity, amount],
                    )
                    .map_err(|e| e.to_string())?;
                }
            }
        }
        _ => {
            // No denominations — skip
        }
    }
    Ok(())
}