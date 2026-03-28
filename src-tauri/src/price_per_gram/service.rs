use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct PricePerGram {
    pub id: i64,
    pub metal_name: String,
    pub price_per_gram: f64,
    pub updated_at: String,
}

/* ---------------- UPSERT PRICE (UPDATE OR INSERT) ---------------- */
pub fn set_price_per_gram(
    db: &Db,
    metal_type_id: i64,
    price: f64,
    actor_user_id: i64
) -> Result<(), String> {

    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Update current price
    tx.execute(
        "
        INSERT INTO price_per_gram (metal_type_id, price_per_gram)
        VALUES (?1, ?2)
        ON CONFLICT(metal_type_id)
        DO UPDATE SET
            price_per_gram = excluded.price_per_gram,
            updated_at = CURRENT_TIMESTAMP
        ",
        params![metal_type_id, price],
    )
    .map_err(|e| e.to_string())?;

    // Insert history record
    tx.execute(
        "
        INSERT INTO price_per_gram_history
        (metal_type_id, price_per_gram, changed_by)
        VALUES (?1, ?2, ?3)
        ",
        params![metal_type_id, price, actor_user_id],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

/* ---------------- GET CURRENT PRICES ---------------- */
pub fn get_prices(db: &Db) -> Result<Vec<PricePerGram>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "
        SELECT p.id, m.name, p.price_per_gram, p.updated_at
        FROM price_per_gram p
        JOIN metal_types m ON m.id = p.metal_type_id
        ORDER BY m.name
        ",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(PricePerGram {
                id: row.get(0)?,
                metal_name: row.get(1)?,
                price_per_gram: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = vec![];
    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }

    Ok(list)
}

/* ---------------- GET  PRICES HISTORY  ---------------- */
pub fn get_price_history(db: &Db) -> Result<Vec<serde_json::Value>, String> {

    let conn = db.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "
        SELECT m.name, h.price_per_gram, h.changed_at
        FROM price_per_gram_history h
        JOIN metal_types m ON m.id = h.metal_type_id
        ORDER BY h.changed_at DESC
        "
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "metal": row.get::<_, String>(0)?,
            "price": row.get::<_, f64>(1)?,
            "changed_at": row.get::<_, String>(2)?
        }))
    }).map_err(|e| e.to_string())?;

    let mut list = vec![];

    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }

    Ok(list)
}