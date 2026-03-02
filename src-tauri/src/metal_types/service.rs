use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct MetalType {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub is_active: bool,
}

// create metal type
pub fn create_metal_type(db: &Db, name: &str, description: Option<&str>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "INSERT INTO metal_types (name, description)
         VALUES (?1, ?2)",
        rusqlite::params![name, description],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// get all metal types
pub fn get_metal_types(db: &Db) -> Result<Vec<MetalType>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT id, name, description, is_active
         FROM metal_types
         ORDER BY id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(MetalType {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                is_active: row.get::<_, i64>(3)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }

    Ok(list)
}

// enable/disable metal types
pub fn toggle_metal_type(db: &Db, metal_type_id: i64, is_active: bool) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "UPDATE metal_types SET is_active = ?1 WHERE id = ?2",
        params![if is_active { 1 } else { 0 }, metal_type_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
