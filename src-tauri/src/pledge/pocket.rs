use crate::db::connection::Db;
use rusqlite::Result;
 
/// Returns the next pocket number to use.
/// It finds the MAX pocket_number across ALL pledges (active + closed)
/// so retired numbers are never reused.
pub fn generate_next_pocket_number(db: &Db) -> Result<i64, String> {
    let conn = db.0.lock().unwrap();
    let next: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(pocket_number), 0) + 1 FROM pledges",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    Ok(next)
}