use crate::db::connection::Db;
// use rusqlite::params;

#[derive(serde::Serialize)]
pub struct MetalSummary {
    pub metal: String,
    pub pledged_net_weight: f64,
    pub pledged_gross_weight: f64,
    pub closed_net_weight: f64,
    pub closed_gross_weight: f64,
}

#[derive(serde::Serialize)]
pub struct YearlyReportRow {
    pub year: String,
    pub total_pledges: i64,
    pub total_loan_amount: f64,
    pub interest_income: f64,
    pub expenses: f64,
    pub net_profit: f64,
}

#[derive(serde::Serialize)]
pub struct YearlyReport {
    pub rows: Vec<YearlyReportRow>,
    pub metals: Vec<MetalSummary>,
}

pub fn get_yearly_report(
    db: &Db,
) -> Result<YearlyReport, String> {

    let conn = db.0.lock().unwrap();

    /* ---------------------------
       YEARLY FINANCIAL SUMMARY
    ----------------------------*/

    let mut stmt = conn.prepare(
        "
        SELECT
            strftime('%Y', p.created_at) as year,

            COUNT(p.id),

            COALESCE(SUM(p.loan_amount),0),

            (
                SELECT COALESCE(SUM(total_amount),0)
                FROM fund_transactions
                WHERE type='ADD'
                AND module_type='INTEREST'
                AND strftime('%Y', created_at)=strftime('%Y', p.created_at)
            ),

            (
                SELECT COALESCE(SUM(amount),0)
                FROM expenses
                WHERE strftime('%Y', expense_date)=strftime('%Y', p.created_at)
            )

        FROM pledges p

        GROUP BY year
        ORDER BY year DESC
        "
    ).map_err(|e| e.to_string())?;

    let rows_iter = stmt.query_map([], |row| {

        let interest: f64 = row.get(3)?;
        let expenses: f64 = row.get(4)?;

        Ok(YearlyReportRow {
            year: row.get(0)?,
            total_pledges: row.get(1)?,
            total_loan_amount: row.get(2)?,
            interest_income: interest,
            expenses,
            net_profit: interest - expenses,
        })

    }).map_err(|e| e.to_string())?;

    let mut rows = Vec::new();

    for r in rows_iter {
        rows.push(r.map_err(|e| e.to_string())?);
    }

    /* ---------------------------
       METAL PORTFOLIO SUMMARY
    ----------------------------*/

    let mut stmt = conn.prepare(
        "
        SELECT
            mt.name,

            SUM(CASE
                WHEN LOWER(p.status)='active'
                THEN pi.net_weight ELSE 0 END),

            SUM(CASE
                WHEN LOWER(p.status)='active'
                THEN pi.gross_weight ELSE 0 END),

            SUM(CASE
                WHEN LOWER(p.status)='closed'
                THEN pi.net_weight ELSE 0 END),

            SUM(CASE
                WHEN LOWER(p.status)='closed'
                THEN pi.gross_weight ELSE 0 END)

        FROM pledge_items pi

        JOIN pledges p ON p.id = pi.pledge_id
        JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
        JOIN metal_types mt ON mt.id = jt.metal_type_id

        GROUP BY mt.name
        "
    ).map_err(|e| e.to_string())?;

    let metal_iter = stmt.query_map([], |row| {

        Ok(MetalSummary{

            metal: row.get(0)?,

            pledged_net_weight: row.get::<_, Option<f64>>(1)?.unwrap_or(0.0),
            pledged_gross_weight: row.get::<_, Option<f64>>(2)?.unwrap_or(0.0),

            closed_net_weight: row.get::<_, Option<f64>>(3)?.unwrap_or(0.0),
            closed_gross_weight: row.get::<_, Option<f64>>(4)?.unwrap_or(0.0),

        })

    }).map_err(|e| e.to_string())?;

    let mut metals = Vec::new();

    for m in metal_iter {
        metals.push(m.map_err(|e| e.to_string())?);
    }

    Ok(YearlyReport{
        rows,
        metals
    })

}


#[tauri::command]
pub fn get_yearly_report_cmd(
    db: tauri::State<Db>,
) -> Result<YearlyReport,String>{

    get_yearly_report(db.inner())

}