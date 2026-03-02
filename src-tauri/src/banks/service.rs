use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct Bank {
    pub id: i64,
    pub bank_name: String,
    pub branch_name: String,
    pub account_number: String,
    pub ifsc_code: String,
    pub is_active: bool,
}

pub fn create_bank(
    db: &Db,
    bank_name: &str,
    branch_name: &str,
    account_number: &str,
    ifsc_code: &str,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "INSERT INTO banks (bank_name, branch_name, account_number, ifsc_code)
         VALUES (?1, ?2, ?3, ?4)",
        params![bank_name, branch_name, account_number, ifsc_code],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_banks(db: &Db) -> Result<Vec<Bank>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT id, bank_name, branch_name, account_number, ifsc_code, is_active
         FROM banks",
        )
        .unwrap();

    let rows = stmt
        .query_map([], |r| {
            Ok(Bank {
                id: r.get(0)?,
                bank_name: r.get(1)?,
                branch_name: r.get(2)?,
                account_number: r.get(3)?,
                ifsc_code: r.get(4)?,
                is_active: r.get::<_, i64>(5)? == 1,
            })
        })
        .unwrap();

    Ok(rows.map(|r| r.unwrap()).collect())
}
