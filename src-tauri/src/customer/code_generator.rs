use crate::db::connection::Db;
use rusqlite::Result;

pub fn generate_next_customer_code(db: &Db) -> Result<String> {
    let conn = db.0.lock().unwrap();

    let last_code: Option<String> = conn
        .query_row(
            "SELECT customer_code FROM customers ORDER BY id DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    let next_number = match last_code {
        Some(code) => code.parse::<i64>().unwrap_or(0) + 1,
        None => 1,
    };

    Ok(next_number.to_string())
}