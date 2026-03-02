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
pub fn set_price_per_gram(db: &Db, metal_type_id: i64, price: f64) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
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
