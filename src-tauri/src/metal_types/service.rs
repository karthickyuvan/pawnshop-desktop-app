use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct MetalType {
    pub id: i64,
    pub name: String,
    pub is_active: bool,
}

// ---------------- CREATE ----------------
pub fn create_metal_type(db: &Db, name: &str) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "INSERT INTO metal_types (name)
         VALUES (?1)",
        params![name],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// ---------------- GET ----------------
pub fn get_metal_types(db: &Db) -> Result<Vec<MetalType>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT id, name, is_active
             FROM metal_types
             ORDER BY id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(MetalType {
                id: row.get(0)?,
                name: row.get(1)?,
                is_active: row.get::<_, i64>(2)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }

    Ok(list)
}

// ---------------- TOGGLE ----------------
pub fn toggle_metal_type(
    db: &Db,
    metal_type_id: i64,
    is_active: bool,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "UPDATE metal_types SET is_active = ?1 WHERE id = ?2",
        params![if is_active { 1 } else { 0 }, metal_type_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}


// ---------------- GET ACTIVE ----------------
pub fn get_active_metal_types(db: &Db) -> Result<Vec<MetalType>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT id, name, is_active
             FROM metal_types
             WHERE is_active = 1
             ORDER BY id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(MetalType {
                id: row.get(0)?,
                name: row.get(1)?,
                is_active: row.get::<_, i64>(2)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }

    Ok(list)
}


