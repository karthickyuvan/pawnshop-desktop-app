// use crate::db::connection::Db;
// // use rusqlite::params;

// #[derive(serde::Serialize)]
// pub struct PledgeRegisterItem {
//     pub pledge_id: i64,
//     pub pledge_no: String,
//     pub created_at: String,
//     pub customer_name: String,
//     pub customer_code: String,
//     pub metal_type: String,
//     pub jewellery_type: String,
//     pub gross_weight: f64,
//     pub net_weight: f64,
//     pub loan_amount: f64,
//     pub scheme_name: String,
//     pub status: String,
// }

// #[derive(serde::Serialize)]
// pub struct PledgeRegisterReport {
//     pub total_pledges: i64,
//     pub total_amount: f64,
//     pub active_count: i64,
//     pub overdue_count: i64,
//     pub pledges: Vec<PledgeRegisterItem>,
// }

// pub fn get_pledge_register_report(
//     db: &Db,
// ) -> Result<PledgeRegisterReport, String> {

//     let conn = db.0.lock().unwrap();

//     let mut stmt = conn.prepare(
//         "
//         SELECT
//             p.id,
//             p.pledge_no,
//             p.created_at,
//             c.name,
//             c.customer_code,
//             mt.name as metal_type,
//             jt.name as jewellery_type,
//             SUM(pi.gross_weight) as gross_weight,
//             SUM(pi.net_weight) as net_weight,
//             p.loan_amount,
//             p.scheme_name,
//             p.status
//         FROM pledges p
//         JOIN customers c ON c.id = p.customer_id
//         JOIN pledge_items pi ON pi.pledge_id = p.id
//         JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
//         JOIN metal_types mt ON mt.id = jt.metal_type_id
//         GROUP BY p.id
//         ORDER BY p.created_at DESC
//         "
//     ).map_err(|e| e.to_string())?;

//     let rows = stmt.query_map([], |row| {
//         Ok(PledgeRegisterItem {
//             pledge_id: row.get(0)?,
//             pledge_no: row.get(1)?,
//             created_at: row.get(2)?,
//             customer_name: row.get(3)?,
//             customer_code: row.get(4)?,
//             metal_type: row.get(5)?,
//             jewellery_type: row.get(6)?,
//             gross_weight: row.get(7)?,
//             net_weight: row.get(8)?,
//             loan_amount: row.get(9)?,
//             scheme_name: row.get(10)?,
//             status: row.get(11)?,
//         })
//     }).map_err(|e| e.to_string())?;

//     let mut pledges = Vec::new();

//     let mut total_amount = 0.0;
//     let mut active_count = 0;
//     let  overdue_count = 0;

//     for row in rows {
//         let pledge = row.map_err(|e| e.to_string())?;

//         if pledge.status == "CLOSED" {
//             // skip for totals
//         } else {
//             total_amount += pledge.loan_amount;
//             active_count += 1;
//         }

//         pledges.push(pledge);
//     }

//     Ok(PledgeRegisterReport {
//         total_pledges: pledges.len() as i64,
//         total_amount,
//         active_count,
//         overdue_count,
//         pledges,
//     })
// }

// #[tauri::command]
// pub fn get_pledge_register_report_cmd(
//     db: tauri::State<Db>,
// ) -> Result<PledgeRegisterReport, String> {

//     get_pledge_register_report(db.inner())
// }




use crate::db::connection::Db;

#[derive(serde::Serialize)]
pub struct PledgeRegisterItem {
    pub pledge_id:      i64,
    pub pocket_number:  Option<i64>,  // ← NEW
    pub pledge_no:      String,
    pub created_at:     String,
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
    pub pledges:       Vec<PledgeRegisterItem>,
}

pub fn get_pledge_register_report(db: &Db) -> Result<PledgeRegisterReport, String> {

    let conn = db.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "
        SELECT
            p.id,
            p.pocket_number,
            p.pledge_no,
            p.created_at,
            c.name,
            c.customer_code,
            mt.name              AS metal_type,
            jt.name              AS jewellery_type,
            SUM(pi.gross_weight) AS gross_weight,
            SUM(pi.net_weight)   AS net_weight,
            p.loan_amount,
            p.scheme_name,
            p.status
        FROM pledges p
        JOIN customers c        ON c.id  = p.customer_id
        JOIN pledge_items pi    ON pi.pledge_id = p.id
        JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
        JOIN metal_types mt     ON mt.id = jt.metal_type_id
        GROUP BY p.id
        ORDER BY p.pocket_number ASC
        "
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(PledgeRegisterItem {
            pledge_id:      row.get(0)?,
            pocket_number:  row.get(1)?,   // ← NEW (col 1)
            pledge_no:      row.get(2)?,   // all others shifted +1
            created_at:     row.get(3)?,
            customer_name:  row.get(4)?,
            customer_code:  row.get(5)?,
            metal_type:     row.get(6)?,
            jewellery_type: row.get(7)?,
            gross_weight:   row.get(8)?,
            net_weight:     row.get(9)?,
            loan_amount:    row.get(10)?,
            scheme_name:    row.get(11)?,
            status:         row.get(12)?,
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

    Ok(PledgeRegisterReport {
        total_pledges: pledges.len() as i64,
        total_amount,
        active_count,
        overdue_count,
        pledges,
    })
}

#[tauri::command]
pub fn get_pledge_register_report_cmd(
    db: tauri::State<Db>,
) -> Result<PledgeRegisterReport, String> {
    get_pledge_register_report(db.inner())
}