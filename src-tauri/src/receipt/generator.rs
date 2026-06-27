
use chrono::Local;
use rusqlite::{params, Connection, Transaction};

/// Generate next unified receipt number
/// Format: RCP-YYYY-NNNNN
/// Example: RCP-2026-00001, RCP-2026-00002, etc.
pub fn generate_next_receipt_no(tx: &Transaction, custom_year: Option<i32>) -> Result<String, String> {
    // Determine target year
    let target_year: i32 = match custom_year {
        Some(year) => year,
        None => Local::now().format("%Y").to_string()
            .parse()
            .map_err(|e| format!("Failed to parse year: {}", e))?,
    };

    let like_pattern = format!("RCP-{}-%", target_year);

    // 1️⃣ Scan pledges for highest receipt number in the target year
    let max_pledge_num: i64 = tx
        .query_row(
            "SELECT COALESCE(MAX(CAST(SUBSTR(receipt_number, 10) AS INTEGER)), 0)
             FROM pledges
             WHERE receipt_number LIKE ?1",
            [&like_pattern],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to scan max pledge receipt: {}", e))?;

    // 2️⃣ Scan pledge_payments for highest receipt number in the target year
    let max_payment_num: i64 = tx
        .query_row(
            "SELECT COALESCE(MAX(CAST(SUBSTR(receipt_no, 10) AS INTEGER)), 0)
             FROM pledge_payments
             WHERE receipt_no LIKE ?1",
            [&like_pattern],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to scan max payment receipt: {}", e))?;

    // Take the absolute maximum sequence number used so far for that year
    let last_number = std::cmp::max(max_pledge_num, max_payment_num);
    let next_number = last_number + 1;

    // Optional: Synchronize with the receipt_sequence table for current year displays
    let current_system_year: i32 = Local::now().format("%Y").to_string()
        .parse()
        .unwrap_or(2026);

    if target_year == current_system_year {
        let _ = tx.execute(
            "INSERT INTO receipt_sequence (id, last_receipt_number, current_year)
             VALUES (1, ?1, ?2)
             ON CONFLICT(id)
             DO UPDATE SET last_receipt_number = excluded.last_receipt_number, current_year = excluded.current_year",
            params![next_number, target_year],
        );
    }

    Ok(format!("RCP-{}-{:05}", target_year, next_number))
}

/// Get current receipt number without incrementing (for display purposes)
pub fn get_current_receipt_no(conn: &Connection) -> Result<String, String> {
    let current_year: i32 = Local::now().format("%Y").to_string()
        .parse()
        .unwrap_or(2026);

    let like_pattern = format!("RCP-{}-%", current_year);

    let max_pledge_num: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(CAST(SUBSTR(receipt_number, 10) AS INTEGER)), 0)
             FROM pledges
             WHERE receipt_number LIKE ?1",
            [&like_pattern],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let max_payment_num: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(CAST(SUBSTR(receipt_no, 10) AS INTEGER)), 0)
             FROM pledge_payments
             WHERE receipt_no LIKE ?1",
            [&like_pattern],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let last_number = std::cmp::max(max_pledge_num, max_payment_num);

    Ok(format!("RCP-{}-{:05}", current_year, last_number))
}

/// Validate receipt number format
pub fn validate_receipt_format(receipt_no: &str) -> bool {
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