use crate::db::connection::Db;
use rusqlite::{params, Result};

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SystemSettings {
    pub interest_calculation_type: String,
    pub grace_days: i32,
}

pub fn get_system_settings(db: &Db) -> Result<SystemSettings, String> {
    let conn = db.0.lock().unwrap();

    conn.query_row(
        "SELECT interest_calculation_type, grace_days 
         FROM system_settings WHERE id = 1",
        [],
        |row| {
            Ok(SystemSettings {
                interest_calculation_type: row.get(0)?,
                grace_days: row.get(1)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

pub fn update_system_settings(db: &Db, settings: SystemSettings) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "UPDATE system_settings 
         SET interest_calculation_type = ?1,
             grace_days = ?2
         WHERE id = 1",
        params![settings.interest_calculation_type, settings.grace_days],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
