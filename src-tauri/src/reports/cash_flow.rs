use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct CashFlowRow {
    pub period: String,
    pub cash_in: f64,
    pub cash_out: f64,
    pub net: f64,
}

#[derive(serde::Serialize)]
pub struct CashFlowReport {
    pub rows: Vec<CashFlowRow>,
}



pub fn get_cash_flow_report(
    db: &Db,
    start_date: String,
    end_date: String,
) -> Result<CashFlowReport, String> {

    let conn = db.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "
        SELECT 
            strftime('%Y-%m', created_at) as period,
            SUM(CASE WHEN type='ADD' THEN total_amount ELSE 0 END) as cash_in,
            SUM(CASE WHEN type='WITHDRAW' THEN total_amount ELSE 0 END) as cash_out
        FROM fund_transactions
        WHERE date(created_at) BETWEEN ?1 AND ?2
        GROUP BY period
        ORDER BY period ASC
        "
    ).map_err(|e| e.to_string())?;

    let rows_iter = stmt.query_map(
        params![start_date, end_date],
        |row| {
            let cash_in: f64 = row.get(1)?;
            let cash_out: f64 = row.get(2)?;

            Ok(CashFlowRow {
                period: row.get(0)?,
                cash_in,
                cash_out,
                net: cash_in - cash_out,
            })
        }
    ).map_err(|e| e.to_string())?;

    let mut rows = vec![];

    for r in rows_iter {
        rows.push(r.map_err(|e| e.to_string())?);
    }

    Ok(CashFlowReport { rows })
}



#[tauri::command]
pub fn get_cash_flow_report_cmd(
    db: tauri::State<Db>,
    start_date: String,
    end_date: String,
) -> Result<CashFlowReport, String> {

    get_cash_flow_report(db.inner(), start_date, end_date)
}