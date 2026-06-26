// use crate::db::connection::Db;
// use std::collections::HashMap;

// #[derive(serde::Serialize)]
// pub struct MetalMovementRow {
//     pub metal: String,
//     pub items_in: i64,
//     pub loan_in: f64,
//     pub gross_in: f64,
//     pub net_in: f64,
//     pub items_out: i64,
//     pub loan_out: f64,
//     pub gross_out: f64,
//     pub net_out: f64,
// }

// #[derive(serde::Serialize)]
// pub struct MetalMovementReport {
//     pub rows: Vec<MetalMovementRow>,
// }

// fn build_date_condition(
//     filter_type: &str,
//     column_name: &str,
//     selected_date: &Option<String>,
//     from_date: &Option<String>,
//     to_date: &Option<String>,
//     month: Option<i32>,
//     year: Option<i32>,
// ) -> String {
//     match filter_type {
//         "date" => {
//             if let Some(date) = selected_date {
//                 format!(" AND DATE({}) = '{}'", column_name, date)
//             } else {
//                 String::new()
//             }
//         }
//         "range" => {
//             if let (Some(from), Some(to)) = (from_date, to_date) {
//                 format!(" AND DATE({}) BETWEEN '{}' AND '{}'", column_name, from, to)
//             } else {
//                 String::new()
//             }
//         }
//         "month" => {
//             if let (Some(m), Some(y)) = (month, year) {
//                 format!(
//                     " AND strftime('%m', {}) = '{:02}' AND strftime('%Y', {}) = '{}' ",
//                     column_name, m, column_name, y
//                 )
//             } else {
//                 String::new()
//             }
//         }
//         "year" => {
//             if let Some(y) = year {
//                 format!(" AND strftime('%Y', {}) = '{}'", column_name, y)
//             } else {
//                 String::new()
//             }
//         }
//         _ => String::new(),
//     }
// }

// pub fn get_metal_movement_report(
//     db: &Db,
//     filter_type: String,
//     selected_date: Option<String>,
//     from_date: Option<String>,
//     to_date: Option<String>,
//     month: Option<i32>,
//     year: Option<i32>,
// ) -> Result<MetalMovementReport, String> {

//     let conn = db.0.lock().unwrap();

//     let pledge_date_filter = build_date_condition(
//         &filter_type,
//         "p.pledge_date",
//         &selected_date,
//         &from_date,
//         &to_date,
//         month,
//         year,
//     );

//     let closed_date_filter = build_date_condition(
//         &filter_type,
//         "p.closed_at",
//         &selected_date,
//         &from_date,
//         &to_date,
//         month,
//         year,
//     );

//     let mut map: HashMap<String, MetalMovementRow> = HashMap::new();

//     // ── 1. INWARD METRICS SQL (Calculates historical original principal via dynamic case routing) ──
//     let in_sql = format!(
//         "
//         SELECT
//             mt.name,
//             COALESCE(SUM(
//                 CASE 
//                     WHEN p.status = 'ACTIVE' THEN p.loan_amount 
//                     ELSE COALESCE(distinct_payments.pay_loan, 0)
//                 END
//             ), 0),
//             COALESCE(SUM(pi.gross_weight), 0),
//             COALESCE(SUM(pi.net_weight), 0),
//             COALESCE(COUNT(pi.id), 0)
//         FROM metal_types mt
//         JOIN jewellery_types jt ON jt.metal_type_id = mt.id
//         JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
//         JOIN pledges p ON p.id = pi.pledge_id
//         LEFT JOIN (
//             SELECT pledge_id, COALESCE(SUM(amount), 0) as pay_loan 
//             FROM pledge_payments 
//             WHERE payment_type = 'PRINCIPAL' AND status = 'COMPLETED'
//             GROUP BY pledge_id
//         ) distinct_payments ON distinct_payments.pledge_id = p.id
//         WHERE mt.is_active = 1 {}
//         GROUP BY mt.name
//         ",
//         pledge_date_filter
//     );

//     let mut stmt_in = conn.prepare(&in_sql).map_err(|e| e.to_string())?;
//     let rows_in = stmt_in.query_map([], |row| {
//         Ok((
//             row.get::<_, String>(0)?,
//             row.get::<_, f64>(1)?,
//             row.get::<_, f64>(2)?,
//             row.get::<_, f64>(3)?,
//             row.get::<_, i64>(4)?,
//         ))
//     }).map_err(|e| e.to_string())?;

//     for row in rows_in {
//         let (metal, loan, gross, net, items) = row.map_err(|e| e.to_string())?;
//         map.insert(
//             metal.clone(),
//             MetalMovementRow {
//                 metal,
//                 loan_in: loan,
//                 gross_in: gross,
//                 net_in: net,
//                 items_in: items,
//                 loan_out: 0.0,
//                 gross_out: 0.0,
//                 net_out: 0.0,
//                 items_out: 0,
//             },
//         );
//     }

//     // ── 2. OUTWARD METRICS SQL ──
//     let out_sql = format!(
//         "
//         SELECT
//             mt.name,
//             COALESCE(SUM(distinct_payments.pay_loan), 0),
//             COALESCE(SUM(pi.gross_weight), 0),
//             COALESCE(SUM(pi.net_weight), 0),
//             COALESCE(COUNT(pi.id), 0)
//         FROM metal_types mt
//         JOIN jewellery_types jt ON jt.metal_type_id = mt.id
//         JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
//         JOIN pledges p ON p.id = pi.pledge_id
//         LEFT JOIN (
//             SELECT pledge_id, COALESCE(SUM(amount), 0) as pay_loan 
//             FROM pledge_payments 
//             WHERE payment_type = 'PRINCIPAL' AND status = 'COMPLETED'
//             GROUP BY pledge_id
//         ) distinct_payments ON distinct_payments.pledge_id = p.id
//         WHERE mt.is_active = 1 
//           AND p.status = 'CLOSED' {}
//         GROUP BY mt.name
//         ",
//         closed_date_filter
//     );

//     let mut stmt_out = conn.prepare(&out_sql).map_err(|e| e.to_string())?;
//     let rows_out = stmt_out.query_map([], |row| {
//         Ok((
//             row.get::<_, String>(0)?,
//             row.get::<_, f64>(1)?,
//             row.get::<_, f64>(2)?,
//             row.get::<_, f64>(3)?,
//             row.get::<_, i64>(4)?,
//         ))
//     }).map_err(|e| e.to_string())?;

//     for row in rows_out {
//         let (metal, loan, gross, net, items) = row.map_err(|e| e.to_string())?;
//         map.entry(metal.clone())
//             .and_modify(|r| {
//                 r.loan_out = loan;
//                 r.gross_out = gross;
//                 r.net_out = net;
//                 r.items_out = items;
//             })
//             .or_insert(MetalMovementRow {
//                 metal,
//                 loan_in: 0.0,
//                 gross_in: 0.0,
//                 net_in: 0.0,
//                 items_in: 0,
//                 loan_out: loan,
//                 gross_out: gross,
//                 net_out: net,
//                 items_out: items,
//             });
//     }

//     let mut result_rows: Vec<MetalMovementRow> = map.into_values().collect();
//     result_rows.sort_by(|a, b| a.metal.cmp(&b.metal));

//     Ok(MetalMovementReport { rows: result_rows })
// }

// #[tauri::command]
// pub fn get_metal_movement_report_cmd(
//     db: tauri::State<Db>,
//     filter_type: String,
//     selected_date: Option<String>,
//     from_date: Option<String>,
//     to_date: Option<String>,
//     month: Option<i32>,
//     year: Option<i32>,
// ) -> Result<MetalMovementReport, String> {
//     get_metal_movement_report(
//         db.inner(),
//         filter_type,
//         selected_date,
//         from_date,
//         to_date,
//         month,
//         year,
//     )
// }















use crate::db::connection::Db;
use std::collections::HashMap;

#[derive(serde::Serialize)]
pub struct MetalMovementRow {
    pub metal: String,
    pub items_in: i64,
    pub loan_in: f64,
    pub gross_in: f64,
    pub net_in: f64,
    pub items_out: i64,
    pub loan_out: f64,
    pub gross_out: f64,
    pub net_out: f64,
}

#[derive(serde::Serialize)]
pub struct MetalMovementReport {
    pub rows: Vec<MetalMovementRow>,
}

fn build_date_condition(
    filter_type: &str,
    column_name: &str,
    selected_date: &Option<String>,
    from_date: &Option<String>,
    to_date: &Option<String>,
    month: Option<i32>,
    year: Option<i32>,
) -> String {
    match filter_type {
        "date" => {
            if let Some(date) = selected_date {
                format!(" AND DATE({}) = '{}'", column_name, date)
            } else {
                String::new()
            }
        }
        "range" => {
            if let (Some(from), Some(to)) = (from_date, to_date) {
                format!(" AND DATE({}) BETWEEN '{}' AND '{}'", column_name, from, to)
            } else {
                String::new()
            }
        }
        "month" => {
            if let (Some(m), Some(y)) = (month, year) {
                format!(
                    " AND strftime('%m', {}) = '{:02}' AND strftime('%Y', {}) = '{}' ",
                    column_name, m, column_name, y
                )
            } else {
                String::new()
            }
        }
        "year" => {
            if let Some(y) = year {
                format!(" AND strftime('%Y', {}) = '{}'", column_name, y)
            } else {
                String::new()
            }
        }
        _ => String::new(),
    }
}

pub fn get_metal_movement_report(
    db: &Db,
    filter_type: String,
    selected_date: Option<String>,
    from_date: Option<String>,
    to_date: Option<String>,
    month: Option<i32>,
    year: Option<i32>,
) -> Result<MetalMovementReport, String> {
    let conn = db.0.lock().unwrap();

    // Inward date parsing matches the original setup
    let pledge_date_filter = build_date_condition(
        &filter_type,
        "p.pledge_date",
        &selected_date,
        &from_date,
        &to_date,
        month,
        year,
    );

    let mut map: HashMap<String, MetalMovementRow> = HashMap::new();

    // ── 1. INWARD METRICS SQL ──
        let in_sql = format!(
            "
            SELECT
                mt.name,
                COALESCE(SUM(
                    p.loan_amount / (SELECT COUNT(*) FROM pledge_items pi2 WHERE pi2.pledge_id = p.id)
                ), 0),
                COALESCE(SUM(pi.gross_weight), 0),
                COALESCE(SUM(pi.net_weight), 0),
                COALESCE(COUNT(DISTINCT p.id), 0)
            FROM metal_types mt
            JOIN jewellery_types jt ON jt.metal_type_id = mt.id
            JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
            JOIN pledges p ON p.id = pi.pledge_id
            WHERE mt.is_active = 1 {}
            GROUP BY mt.name
            ",
            pledge_date_filter
        );

    let mut stmt_in = conn.prepare(&in_sql).map_err(|e| e.to_string())?;
    let rows_in = stmt_in.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, f64>(1)?,
            row.get::<_, f64>(2)?,
            row.get::<_, f64>(3)?,
            row.get::<_, i64>(4)?,
        ))
    }).map_err(|e| e.to_string())?;

    for row in rows_in {
        let (metal, loan, gross, net, items) = row.map_err(|e| e.to_string())?;
        map.insert(
            metal.clone(),
            MetalMovementRow {
                metal,
                loan_in: loan,
                gross_in: gross,
                net_in: net,
                items_in: items,
                loan_out: 0.0,
                gross_out: 0.0,
                net_out: 0.0,
                items_out: 0,
            },
        );
    }

    // ── 2. OUTWARD METRICS SQL (FIXED: Uses conditional timestamp parsing based on structural status) ──
    let closed_filter_fragment = build_date_condition(&filter_type, "p.closed_at", &selected_date, &from_date, &to_date, month, year);
    let auction_filter_fragment = build_date_condition(&filter_type, "p.auctioned_at", &selected_date, &from_date, &to_date, month, year);

let out_sql = format!(
    "
    SELECT
        mt.name,
        COALESCE(SUM(
            p.loan_amount / (SELECT COUNT(*) FROM pledge_items pi2 WHERE pi2.pledge_id = p.id)
        ), 0) as loan_out,
        COALESCE(SUM(pi.gross_weight), 0) as gross_out,
        COALESCE(SUM(pi.net_weight), 0) as net_out,
        COALESCE(COUNT(DISTINCT p.id), 0) as items_out
    FROM metal_types mt
    JOIN jewellery_types jt ON jt.metal_type_id = mt.id
    JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
    JOIN pledges p ON p.id = pi.pledge_id
    WHERE mt.is_active = 1 
      AND (
           (p.status = 'CLOSED' {})
           OR 
           (p.status = 'AUCTIONED' {})
      )
    GROUP BY mt.name
    ",
    closed_filter_fragment, auction_filter_fragment
);

    let mut stmt_out = conn.prepare(&out_sql).map_err(|e| e.to_string())?;
    let rows_out = stmt_out.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, f64>(1)?,
            row.get::<_, f64>(2)?,
            row.get::<_, f64>(3)?,
            row.get::<_, i64>(4)?,
        ))
    }).map_err(|e| e.to_string())?;

    for row in rows_out {
        let (metal, loan, gross, net, items) = row.map_err(|e| e.to_string())?;
        map.entry(metal.clone())
            .and_modify(|r| {
                r.loan_out = loan;
                r.gross_out = gross;
                r.net_out = net;
                r.items_out = items;
            })
            .or_insert(MetalMovementRow {
                metal,
                loan_in: 0.0,
                gross_in: 0.0,
                net_in: 0.0,
                items_in: 0,
                loan_out: loan,
                gross_out: gross,
                net_out: net,
                items_out: items,
            });
    }

    let mut result_rows: Vec<MetalMovementRow> = map.into_values().collect();
    result_rows.sort_by(|a, b| a.metal.cmp(&b.metal));

    Ok(MetalMovementReport { rows: result_rows })
}

#[tauri::command]
pub fn get_metal_movement_report_cmd(
    db: tauri::State<Db>,
    filterType: String,
    selectedDate: Option<String>,
    fromDate: Option<String>,
    toDate: Option<String>,
    month: Option<i32>,
    year: Option<i32>,
) -> Result<MetalMovementReport, String> {
    get_metal_movement_report(
        db.inner(),
        filterType,
        selectedDate,
        fromDate,
        toDate,
        month,
        year,
    )
}