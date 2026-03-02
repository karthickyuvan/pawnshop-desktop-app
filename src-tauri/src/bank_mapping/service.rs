use crate::db::connection::Db;
use rusqlite::params;

pub fn map_bank_to_pledge(
    db: &Db,
    pledge_id: i64,
    bank_id: i64,
    amount: f64,
    bank_charges: f64,
) -> Result<(), String> {
    let net_amount = amount - bank_charges;

    let conn = db.0.lock().unwrap();

    conn.execute(
        "INSERT INTO bank_mappings
        (pledge_id, bank_id, amount, bank_charges, net_amount)
        VALUES (?1, ?2, ?3, ?4, ?5)",
        params![pledge_id, bank_id, amount, bank_charges, net_amount],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
