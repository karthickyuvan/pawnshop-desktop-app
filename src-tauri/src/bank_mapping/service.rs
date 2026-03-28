
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

    eprintln!("🏦 Bank mapping request received:");
    eprintln!("   pledge_id: {}", request.pledge_id);
    eprintln!("   bank_loan_amount: {}", request.bank_loan_amount);
    eprintln!("   actual_received: {}", request.actual_received);
    eprintln!("   payment_method: {}", request.payment_method);
    eprintln!("   denominations: {:?}", request.denominations);
    
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
    let _difference = net_from_bank - pledge_loan;

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
    // This should be the ACTUAL amount received, not the bank loan amount
    tx.execute(
        "INSERT INTO fund_transactions
            (type, total_amount, module_type, module_id, reference, description, payment_method, created_by, created_at)
         VALUES ('ADD', ?1, 'BANK_MAPPING', ?2, ?3, ?4, ?5, ?6, datetime('now'))",
         params![
            request.actual_received,  // ✅ The actual cash received (₹84,000)
            mapping_id,
            format!("Bank loan received for Pledge #{}", request.pledge_id),
            format!("Bank loan received for Pledge #{}", request.pledge_id),
            request.payment_method,
            request.actor_user_id
        ],
    )
    .map_err(|e| e.to_string())?;

    let bank_inflow_tx_id = tx.last_insert_rowid();
    eprintln!("✅ Created fund_transaction ID: {}", bank_inflow_tx_id);
    
    insert_denominations(&tx, bank_inflow_tx_id, &request.denominations, request.actual_received)?;



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
// insert_denominations — FIXED VERSION
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// insert_denominations  (FIXED - comprehensive pattern matching)
// ─────────────────────────────────────────────────────────────────────────────
fn insert_denominations(
    tx: &rusqlite::Transaction,
    fund_tx_id: i64,
    denominations: &Option<Vec<DenominationEntry>>,
    _fallback_amount: f64,
) -> Result<(), String> {
    
    // ✅ Add debug logging
    eprintln!("📝 insert_denominations called:");
    eprintln!("   fund_tx_id: {}", fund_tx_id);
    eprintln!("   denominations: {:?}", denominations);
    
    match denominations {
        Some(denoms) if !denoms.is_empty() => {
            eprintln!("   ✅ Found {} denomination entries", denoms.len());
            
            for entry in denoms {
                if entry.quantity > 0 {
                    let amount = entry.denomination as f64 * entry.quantity as f64;
                    
                    eprintln!("      Inserting: ₹{} × {} = ₹{}", 
                        entry.denomination, entry.quantity, amount);
                    
                    tx.execute(
                        "INSERT INTO fund_denominations
                            (fund_transaction_id, denomination, quantity, amount)
                         VALUES (?1, ?2, ?3, ?4)",
                        params![fund_tx_id, entry.denomination, entry.quantity, amount],
                    )
                    .map_err(|e| {
                        eprintln!("❌ Failed to insert denomination: {}", e);
                        format!("Failed to insert denomination: {}", e)
                    })?;
                }
            }
            eprintln!("   ✅ All denominations inserted successfully");
        }
        Some(denoms) if denoms.is_empty() => {
            eprintln!("   ⚠️  Empty denominations vector provided");
        }
        None => {
            eprintln!("   ⚠️  No denominations provided (None)");
        }
        // ✅ This covers the &Some(_) case that was missing
        Some(_) => {
            eprintln!("   ⚠️  Unexpected denomination state");
        }
    }
    
    Ok(())
}