use crate::db::connection::Db;
// use rusqlite::params;

#[derive(serde::Serialize)]
pub struct BankMappingRow {
    pub pledge_no: String,
    pub customer_name: String,
    pub bank_name: String,
    pub loan_amount: f64,
    pub mapped_amount: f64,
    pub status: String,
}

#[derive(serde::Serialize)]
pub struct BankMappingReport {
    pub rows: Vec<BankMappingRow>,
}

pub fn get_bank_mapping_report(
    db: &Db,
) -> Result<BankMappingReport, String> {

    let conn = db.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "
        SELECT
            p.pledge_no,
            c.name,
            bm.bank_name,
            p.loan_amount,
            bm.mapped_amount,
            bm.status
        FROM bank_mappings bm
        JOIN pledges p ON p.id = bm.pledge_id
        JOIN customers c ON c.id = p.customer_id
        ORDER BY bm.created_at DESC
        "
    ).map_err(|e| e.to_string())?;

    let rows_iter = stmt.query_map([], |row| {

        Ok(BankMappingRow {
            pledge_no: row.get(0)?,
            customer_name: row.get(1)?,
            bank_name: row.get(2)?,
            loan_amount: row.get(3)?,
            mapped_amount: row.get(4)?,
            status: row.get(5)?,
        })

    }).map_err(|e| e.to_string())?;

    let mut rows = Vec::new();

    for r in rows_iter {
        rows.push(r.map_err(|e| e.to_string())?);
    }

    Ok(BankMappingReport { rows })
}


#[tauri::command]
pub fn get_bank_mapping_report_cmd(
    db: tauri::State<Db>,
) -> Result<BankMappingReport, String> {

    get_bank_mapping_report(db.inner())
}