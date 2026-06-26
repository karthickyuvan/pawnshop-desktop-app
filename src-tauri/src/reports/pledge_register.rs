use crate::db::connection::Db;

#[derive(serde::Serialize)]
pub struct PledgeRegisterItem {
    pub pledge_id:      i64,
    pub pocket_number:  Option<i64>,  // ← NEW
    pub pledge_no:      String,
    pub created_at:     String,
    pub pledge_date:    String,
    pub customer_name:  String,
    pub customer_code:  String,
    pub metal_type:     String,
    pub jewellery_type: String,
    pub gross_weight:   f64,
    pub net_weight:     f64,
    pub loan_amount:    f64,
    pub scheme_name:    String,
    pub status:         String,
}

#[derive(serde::Serialize)]
pub struct PledgeRegisterReport {
    pub total_pledges: i64,
    pub total_amount:  f64,
    pub active_count:  i64,
    pub overdue_count: i64,
    pub total_interest:      f64,   
    pub total_processing_fee: f64,
    pub pledges:       Vec<PledgeRegisterItem>,
}

pub fn get_pledge_register_report(db: &Db,start_date: String,
    end_date: String,) -> Result<PledgeRegisterReport, String> {

    let conn = db.0.lock().unwrap();

let mut stmt = conn.prepare(
    "
    SELECT
        p.id,
        p.pocket_number,
        p.pledge_no,
        p.pledge_date,               -- col 3 (NEW)
        p.created_at,                -- col 4
        c.name,                      -- col 5
        c.customer_code,             -- col 6
        mt.name   AS metal_type,     -- col 7
        jt.name   AS jewellery_type, -- col 8
        SUM(pi.gross_weight),        -- col 9
        SUM(pi.net_weight),          -- col 10
        p.loan_amount,               -- col 11
        p.scheme_name,               -- col 12
        p.status                     -- col 13
    FROM pledges p
    JOIN customers c        ON c.id  = p.customer_id
    JOIN pledge_items pi    ON pi.pledge_id = p.id
    JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
    JOIN metal_types mt     ON mt.id = jt.metal_type_id
    WHERE DATE(p.pledge_date) BETWEEN DATE(?1) AND DATE(?2)
    GROUP BY p.id
    ORDER BY p.pocket_number ASC
    "
).map_err(|e| e.to_string())?;

let rows = stmt.query_map(rusqlite::params![start_date, end_date], |row| {
    Ok(PledgeRegisterItem {
        pledge_id:      row.get(0)?,
        pocket_number:  row.get(1)?,
        pledge_no:      row.get(2)?,
        pledge_date:    row.get(3)?,   
        created_at:     row.get(4)?,
        customer_name:  row.get(5)?,
        customer_code:  row.get(6)?,
        metal_type:     row.get(7)?,
        jewellery_type: row.get(8)?,
        gross_weight:   row.get(9)?,
        net_weight:     row.get(10)?,
        loan_amount:    row.get(11)?,
        scheme_name:    row.get(12)?,
        status:         row.get(13)?,
    })
}).map_err(|e| e.to_string())?;



    let mut pledges       = Vec::new();
    let mut total_amount  = 0.0;
    let mut active_count  = 0i64;
    let     overdue_count = 0i64;

    for row in rows {
        let pledge = row.map_err(|e| e.to_string())?;

        if pledge.status != "CLOSED" {
            total_amount += pledge.loan_amount;
            active_count += 1;
        }

        pledges.push(pledge);
    }

let total_interest: f64 = conn.query_row(
    "SELECT COALESCE(SUM(total_amount), 0.0)
     FROM fund_transactions
     WHERE module_type = 'INTEREST'
       AND type = 'ADD'
       AND DATE(created_at) BETWEEN DATE(?1) AND DATE(?2)",
    rusqlite::params![start_date, end_date],
    |row| row.get(0),
).unwrap_or(0.0);

let total_processing_fee: f64 = conn.query_row(
    "SELECT COALESCE(SUM(total_amount), 0.0)
     FROM fund_transactions
     WHERE module_type = 'FEE'
       AND type = 'ADD'
       AND DATE(created_at) BETWEEN DATE(?1) AND DATE(?2)",
    rusqlite::params![start_date, end_date],
    |row| row.get(0),
).unwrap_or(0.0);


    Ok(PledgeRegisterReport {
        total_pledges: pledges.len() as i64,
        total_amount,
        active_count,
        overdue_count,
        total_interest,
        total_processing_fee,
        pledges,
    })
}

#[tauri::command]
pub fn get_pledge_register_report_cmd(
    db: tauri::State<Db>,
    start_date: String,
    end_date: String,
) -> Result<PledgeRegisterReport, String> {
    get_pledge_register_report(db.inner(), start_date, end_date)
}