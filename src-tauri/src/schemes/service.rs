use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct Scheme {
    pub id: i64,
    pub metal_type_id: i64,
    pub metal_name: String,
    pub scheme_name: String,
    pub loan_percentage: f64,
    pub price_program: String,
    pub interest_rate: f64,
    pub interest_type: String,
    pub processing_fee_type: String,
    pub processing_fee_value: Option<f64>,
    pub is_active: bool,
}

/* CREATE */
pub fn create_scheme(
    db: &Db,
    metal_type_id: i64,
    scheme_name: &str,
    loan_percentage: f64,
    price_program: &str,
    interest_rate: f64,
    interest_type: &str,
    processing_fee_type: &str,
    processing_fee_value: Option<f64>,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "INSERT INTO schemes
        (metal_type_id, scheme_name, loan_percentage, price_program,
         interest_rate, interest_type, processing_fee_type, processing_fee_value)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            metal_type_id,
            scheme_name,
            loan_percentage,
            price_program,
            interest_rate,
            interest_type,
            processing_fee_type,
            processing_fee_value
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/* GET */
pub fn get_schemes(db: &Db) -> Result<Vec<Scheme>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "
        SELECT s.id, s.metal_type_id, m.name,
               s.scheme_name, s.loan_percentage, s.price_program,
               s.interest_rate, s.interest_type,
               s.processing_fee_type, s.processing_fee_value,
               s.is_active
        FROM schemes s
        JOIN metal_types m ON m.id = s.metal_type_id
        ORDER BY s.id DESC
        ",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok(Scheme {
                id: r.get(0)?,
                metal_type_id: r.get(1)?,
                metal_name: r.get(2)?,
                scheme_name: r.get(3)?,
                loan_percentage: r.get(4)?,
                price_program: r.get(5)?,
                interest_rate: r.get(6)?,
                interest_type: r.get(7)?,
                processing_fee_type: r.get(8)?,
                processing_fee_value: r.get(9)?,
                is_active: r.get::<_, i64>(10)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }

    Ok(list)
}

/* ENABLE / DISABLE */
pub fn toggle_scheme(db: &Db, scheme_id: i64, is_active: bool) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "UPDATE schemes SET is_active = ?1 WHERE id = ?2",
        params![if is_active { 1 } else { 0 }, scheme_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/* Update */

pub fn update_scheme(
    db: &Db,
    id: i64,
    metal_type_id: i64,
    scheme_name: &str,
    loan_percentage: f64,
    price_program: &str,
    interest_rate: f64,
    interest_type: &str,
    processing_fee_type: &str,
    processing_fee_value: Option<f64>,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "UPDATE schemes SET 
         metal_type_id = ?1, scheme_name = ?2, loan_percentage = ?3, 
         price_program = ?4, interest_rate = ?5, interest_type = ?6, 
         processing_fee_type = ?7, processing_fee_value = ?8
         WHERE id = ?9",
        params![
            metal_type_id,
            scheme_name,
            loan_percentage,
            price_program,
            interest_rate,
            interest_type,
            processing_fee_type,
            processing_fee_value,
            id
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
