// src-tauri/src/receipt/migration.rs

use rusqlite::{params, Connection};
use chrono::Local;

/// Migrate existing pledges to have receipt numbers
pub fn migrate_existing_pledges(conn: &mut Connection) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    // Get current year
    let current_year: i32 = Local::now().format("%Y")
        .to_string()
        .parse()
        .map_err(|e| format!("Failed to parse year: {}", e))?;
    
    // Get all pledges without receipt numbers, ordered by creation date
    let mut stmt = tx
        .prepare(
            "SELECT id, pledge_no, created_at 
             FROM pledges 
             WHERE receipt_number IS NULL 
             ORDER BY created_at ASC, id ASC"
        )
        .map_err(|e| e.to_string())?;
    
    let pledges: Vec<(i64, String, String)> = stmt
        .query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    drop(stmt);
    
    // Assign sequential receipt numbers
    for (counter, (pledge_id, _pledge_no, _created_at)) in pledges.iter().enumerate() {
        let receipt_no = format!("RCP-{}-{:05}", current_year, counter + 1);
        
        tx.execute(
            "UPDATE pledges SET receipt_number = ?1 WHERE id = ?2",
            params![receipt_no, pledge_id],
        )
        .map_err(|e| e.to_string())?;
    }
    
    // Update the sequence counter
    let last_count = pledges.len() as i64;
    tx.execute(
        "UPDATE receipt_sequence SET last_receipt_number = ?1, current_year = ?2 WHERE id = 1",
        params![last_count, current_year],
    )
    .map_err(|e| e.to_string())?;
    
    tx.commit().map_err(|e| e.to_string())?;
    
    println!("✅ Migrated {} pledges with receipt numbers", pledges.len());
    Ok(())
}

/// Migrate existing payments to have receipt numbers
pub fn migrate_existing_payments(conn: &mut Connection) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    // Get current receipt counter
    let current_counter: i64 = tx
        .query_row(
            "SELECT last_receipt_number FROM receipt_sequence WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    let current_year: i32 = tx
        .query_row(
            "SELECT current_year FROM receipt_sequence WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .unwrap_or(2026);
    
    // Get all payments without proper receipt numbers
    let mut stmt = tx
        .prepare(
            "SELECT id, pledge_id, paid_at 
             FROM pledge_payments 
             WHERE receipt_no IS NULL OR receipt_no LIKE 'RCP-%-%-%'
             ORDER BY paid_at ASC, id ASC"
        )
        .map_err(|e| e.to_string())?;
    
    let payments: Vec<(i64, i64, String)> = stmt
        .query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    drop(stmt);
    
    let mut counter = current_counter;
    
    for (_payment_id, _pledge_id, _paid_at) in payments.iter() {
        counter += 1;
        let receipt_no = format!("RCP-{}-{:05}", current_year, counter);
        
        tx.execute(
            "UPDATE pledge_payments SET receipt_no = ?1 WHERE id = ?2",
            params![receipt_no, _payment_id],
        )
        .map_err(|e| e.to_string())?;
    }
    
    // Update the sequence counter
    tx.execute(
        "UPDATE receipt_sequence SET last_receipt_number = ?1 WHERE id = 1",
        params![counter],
    )
    .map_err(|e| e.to_string())?;
    
    tx.commit().map_err(|e| e.to_string())?;
    
    println!("✅ Migrated {} payments with receipt numbers", payments.len());
    Ok(())
}