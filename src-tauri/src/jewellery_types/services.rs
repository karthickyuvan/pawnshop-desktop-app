use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct JewelleryType {
    pub id: i64,
    pub metal_type_id: i64,
    pub metal_name: String,
    pub name: String,
    pub description: Option<String>,
    pub is_active: bool,
}

// ---------------- CREATE ----------------
pub fn create_jewellery_type(
    db: &Db,
    metal_type_id: i64,
    name: &str,
    description: Option<&str>,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "INSERT INTO jewellery_types (metal_type_id, name, description)
         VALUES (?1, ?2, ?3)",
        params![metal_type_id, name, description],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// ---------------- GET ----------------
pub fn get_jewellery_types(db: &Db) -> Result<Vec<JewelleryType>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "
            SELECT jt.id, jt.metal_type_id, mt.name, jt.name,
                   jt.description, jt.is_active
            FROM jewellery_types jt
            JOIN metal_types mt ON mt.id = jt.metal_type_id
            ORDER BY jt.id DESC
            ",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok(JewelleryType {
                id: r.get(0)?,
                metal_type_id: r.get(1)?,
                metal_name: r.get(2)?,
                name: r.get(3)?,
                description: r.get(4)?,
                is_active: r.get::<_, i64>(5)? == 1,
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
pub fn toggle_jewellery_type(
    db: &Db,
    jewellery_type_id: i64,
    is_active: bool,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "UPDATE jewellery_types SET is_active = ?1 WHERE id = ?2",
        params![if is_active { 1 } else { 0 }, jewellery_type_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
