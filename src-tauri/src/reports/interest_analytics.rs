use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct InterestMonthRow {
    pub period: String,
    pub interest_amount: f64,
}

#[derive(serde::Serialize)]
pub struct InterestAnalyticsReport {
    pub rows: Vec<InterestMonthRow>,
}


pub fn get_interest_analytics_report(
    db: &Db,
    start_date: String,
    end_date: String,
) -> Result<InterestAnalyticsReport, String> {

    let conn = db.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "
        SELECT 
            strftime('%Y-%m', paid_at) as period,
            SUM(amount)
        FROM pledge_payments
        WHERE payment_type='INTEREST'
        AND date(paid_at) BETWEEN ?1 AND ?2
        GROUP BY period
        ORDER BY period ASC
        "
    ).map_err(|e| e.to_string())?;

    let rows_iter = stmt.query_map(
        params![start_date, end_date],
        |row| {

            Ok(InterestMonthRow {
                period: row.get(0)?,
                interest_amount: row.get(1)?,
            })

        }).map_err(|e| e.to_string())?;

    let mut rows = vec![];

    for r in rows_iter {
        rows.push(r.map_err(|e| e.to_string())?);
    }

    Ok(InterestAnalyticsReport { rows })
}

#[tauri::command]
pub fn get_interest_analytics_report_cmd(
    db: tauri::State<Db>,
    start_date: String,
    end_date: String,
) -> Result<InterestAnalyticsReport, String> {

    get_interest_analytics_report(db.inner(), start_date, end_date)
}