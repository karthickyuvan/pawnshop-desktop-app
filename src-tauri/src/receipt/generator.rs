// src-tauri/src/receipt/generator.rs

use chrono::Local;
use rusqlite::{params, Connection, Transaction};

/// Generate next unified receipt number
/// Format: RCP-YYYY-NNNNN
/// Example: RCP-2026-00001, RCP-2026-00002, etc.
pub fn generate_next_receipt_no(tx: &Transaction) -> Result<String, String> {
    let current_year: i32 = Local::now().format("%Y").to_string()
        .parse()
        .map_err(|e| format!("Failed to parse year: {}", e))?;

    // Get stored year and last receipt number
    let (stored_year, last_number): (i32, i64) = tx
        .query_row(
            "SELECT current_year, last_receipt_number FROM receipt_sequence WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| format!("Failed to fetch receipt sequence: {}", e))?;

    // Reset counter if year changed
    let next_number = if current_year != stored_year {
        // New year - reset counter
        tx.execute(
            "UPDATE receipt_sequence SET current_year = ?1, last_receipt_number = 1 WHERE id = 1",
            params![current_year],
        )
        .map_err(|e| format!("Failed to reset receipt sequence: {}", e))?;
        1
    } else {
        // Same year - increment
        let new_number = last_number + 1;
        tx.execute(
            "UPDATE receipt_sequence SET last_receipt_number = ?1 WHERE id = 1",
            params![new_number],
        )
        .map_err(|e| format!("Failed to update receipt sequence: {}", e))?;
        new_number
    };

    Ok(format!("RCP-{}-{:05}", current_year, next_number))
}

/// Get current receipt number without incrementing (for display purposes)
pub fn get_current_receipt_no(conn: &Connection) -> Result<String, String> {
    let (year, number): (i32, i64) = conn
        .query_row(
            "SELECT current_year, last_receipt_number FROM receipt_sequence WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| format!("Failed to fetch current receipt: {}", e))?;

    Ok(format!("RCP-{}-{:05}", year, number))
}

/// Validate receipt number format
pub fn validate_receipt_format(receipt_no: &str) -> bool {
    // Format: RCP-YYYY-NNNNN
    let parts: Vec<&str> = receipt_no.split('-').collect();
    
    if parts.len() != 3 || parts[0] != "RCP" {
        return false;
    }
    
    // Check year is 4 digits
    if parts[1].len() != 4 || parts[1].parse::<i32>().is_err() {
        return false;
    }
    
    // Check number is 5 digits
    if parts[2].len() != 5 || parts[2].parse::<i64>().is_err() {
        return false;
    }
    
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_receipt_format() {
        assert!(validate_receipt_format("RCP-2026-00001"));
        assert!(validate_receipt_format("RCP-2026-99999"));
        assert!(!validate_receipt_format("PLG-2026-00001"));
        assert!(!validate_receipt_format("RCP-26-00001"));
        assert!(!validate_receipt_format("RCP-2026-001"));
    }
}