use crate::db::connection::Db;
// use rusqlite::params;

#[derive(serde::Serialize)]
pub struct StockRow {
    pub metal: String,
    pub gross_weight: f64,
    pub net_weight: f64,
    pub item_count: i64,
    pub estimated_value: f64,
}

#[derive(serde::Serialize)]
pub struct StockReport {
    pub rows: Vec<StockRow>,
    pub total_active_pockets: i64,     
    pub current_pocket_running: i64,   
}

pub fn get_stock_report(
    db: &Db,
) -> Result<StockReport, String> {

    let conn = db.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "
        SELECT 
            mt.name,
            COALESCE(SUM(pi.gross_weight),0),
            COALESCE(SUM(pi.net_weight),0),
            COALESCE(COUNT(pi.id),0),
            COALESCE(SUM(pi.item_value),0)
        FROM metal_types mt

        LEFT JOIN jewellery_types jt 
            ON jt.metal_type_id = mt.id

        LEFT JOIN pledge_items pi 
            ON pi.jewellery_type_id = jt.id

        LEFT JOIN pledges p 
            ON p.id = pi.pledge_id 
            AND p.status = 'ACTIVE'

        WHERE mt.is_active = 1

        GROUP BY mt.name
        ORDER BY mt.name
        "
    ).map_err(|e| e.to_string())?;

    let rows_iter = stmt.query_map([], |row| {

        Ok(StockRow {
            metal: row.get(0)?,
            gross_weight: row.get(1)?,
            net_weight: row.get(2)?,
            item_count: row.get(3)?,
            estimated_value: row.get(4)?,
        })

    }).map_err(|e| e.to_string())?;

    let mut rows = vec![];

    for r in rows_iter {
        rows.push(r.map_err(|e| e.to_string())?);
    }

    // NEW: active pockets count (only ACTIVE pledges)
    let total_active_pockets: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pledges WHERE status = 'ACTIVE' AND pocket_number IS NOT NULL",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
 
    // NEW: highest pocket number ever assigned (running counter)
    let current_pocket_running: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(pocket_number), 0) FROM pledges",
            [],
            |row| row.get(0),
        ).unwrap_or(0);


    Ok(StockReport { rows,
        total_active_pockets,
        current_pocket_running,
 })
}

#[tauri::command]
pub fn get_stock_report_cmd(
    db: tauri::State<Db>,
) -> Result<StockReport, String> {

    get_stock_report(db.inner())
}