
// use crate::db::connection::Db;

// #[derive(serde::Serialize)]
// pub struct StockRow {
//     pub metal: String,
    
//     // Store Inventory (லாக்கர் இருப்பு)
//     pub store_gross_weight: f64,
//     pub store_net_weight: f64,
//     pub store_item_count: i64,
//     pub store_loan_amount: f64,
    
//     // Bank Mapped Inventory (வங்கி இருப்பு)
//     pub bank_gross_weight: f64,
//     pub bank_net_weight: f64,
//     pub bank_item_count: i64,
//     pub bank_loan_amount: f64,
    
//     // Combined Inventory (மொத்த இருப்பு)
//     pub total_gross_weight: f64,
//     pub total_net_weight: f64,
//     pub total_item_count: i64,
//     pub total_loan_amount: f64,
// }

// #[derive(serde::Serialize)]
// pub struct MetalPocketSummary {
//     pub metal: String,
//     pub store_pockets: i64,
//     pub bank_pockets: i64,
//     pub total_pockets: i64,
// }

// #[derive(serde::Serialize)]
// pub struct StockReport {
//     pub rows: Vec<StockRow>,
//     pub store_active_pockets: i64,
//     pub bank_active_pockets: i64,
//     pub total_active_pockets: i64,
//     pub current_pocket_running: i64,
//     pub metal_pockets: Vec<MetalPocketSummary>,
// }

// pub fn get_stock_report(db: &Db) -> Result<StockReport, String> {
//     let conn = db.0.lock().unwrap();

//     // 1. Core Stock Weights Matrix (Segregated by Store vs Bank)
//     let mut stmt = conn.prepare(
//         "
//         SELECT
//             mt.name,
//             -- Store Inventory (Active & Not Mapped)
//             COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN pi.gross_weight ELSE 0 END), 0.0),
//             COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN pi.net_weight ELSE 0 END), 0.0),
//             COALESCE(COUNT(CASE WHEN p.status='ACTIVE' AND NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN pi.id END), 0),
//             COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN p.loan_amount ELSE 0 END), 0.0),
            
//             -- Bank Inventory (Active & Mapped)
//             COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN pi.gross_weight ELSE 0 END), 0.0),
//             COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN pi.net_weight ELSE 0 END), 0.0),
//             COALESCE(COUNT(CASE WHEN p.status='ACTIVE' AND EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN pi.id END), 0),
//             COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN p.loan_amount ELSE 0 END), 0.0)
//         FROM metal_types mt
//         LEFT JOIN jewellery_types jt ON jt.metal_type_id = mt.id
//         LEFT JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
//         LEFT JOIN pledges p ON p.id = pi.pledge_id
//         WHERE mt.is_active = 1
//         GROUP BY mt.name
//         ORDER BY mt.name
//         "
//     ).map_err(|e| e.to_string())?;

//     let rows_iter = stmt.query_map([], |row| {
//         let store_gross: f64 = row.get(1)?;
//         let store_net: f64 = row.get(2)?;
//         let store_items: i64 = row.get(3)?;
//         let store_loan: f64 = row.get(4)?;

//         let bank_gross: f64 = row.get(5)?;
//         let bank_net: f64 = row.get(6)?;
//         let bank_items: i64 = row.get(7)?;
//         let bank_loan: f64 = row.get(8)?;

//         Ok(StockRow {
//             metal: row.get(0)?,
//             store_gross_weight: store_gross,
//             store_net_weight: store_net,
//             store_item_count: store_items,
//             store_loan_amount: store_loan,
            
//             bank_gross_weight: bank_gross,
//             bank_net_weight: bank_net,
//             bank_item_count: bank_items,
//             bank_loan_amount: bank_loan,
            
//             total_gross_weight: store_gross + bank_gross,
//             total_net_weight: store_net + bank_net,
//             total_item_count: store_items + bank_items,
//             total_loan_amount: store_loan + bank_loan,
//         })
//     }).map_err(|e| e.to_string())?;

//     let mut rows = vec![];
//     for r in rows_iter {
//         rows.push(r.map_err(|e| e.to_string())?);
//     }

//     // 2. Segregated Active Pockets Count
//     let store_active_pockets: i64 = conn
//         .query_row(
//             "SELECT COUNT(*) FROM pledges p WHERE p.status = 'ACTIVE' AND p.pocket_number IS NOT NULL AND NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE')",
//             [],
//             |row| row.get(0),
//         )
//         .unwrap_or(0);

//     let bank_active_pockets: i64 = conn
//         .query_row(
//             "SELECT COUNT(*) FROM pledges p WHERE p.status = 'ACTIVE' AND p.pocket_number IS NOT NULL AND EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE')",
//             [],
//             |row| row.get(0),
//         )
//         .unwrap_or(0);

//     let total_active_pockets = store_active_pockets + bank_active_pockets;

//     // 3. Category Breakdowns with physical location
//     let mut metal_stmt = conn.prepare(
//         "
//         SELECT
//             mt.name,
//             COUNT(DISTINCT CASE WHEN NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN p.id END),
//             COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN p.id END)
//         FROM metal_types mt
//         LEFT JOIN jewellery_types jt ON jt.metal_type_id = mt.id
//         LEFT JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
//         LEFT JOIN pledges p ON p.id = pi.pledge_id AND p.status = 'ACTIVE'
//         WHERE mt.is_active = 1
//         GROUP BY mt.id, mt.name
//         ORDER BY mt.name
//         "
//     ).map_err(|e| e.to_string())?;

//     let metal_rows = metal_stmt
//         .query_map([], |row| {
//             let store_p: i64 = row.get(1)?;
//             let bank_p: i64 = row.get(2)?;
//             Ok(MetalPocketSummary {
//                 metal: row.get(0)?,
//                 store_pockets: store_p,
//                 bank_pockets: bank_p,
//                 total_pockets: store_p + bank_p,
//             })
//         })
//         .map_err(|e| e.to_string())?;

//     let mut metal_pockets = vec![];
//     for row in metal_rows {
//         metal_pockets.push(row.map_err(|e| e.to_string())?);
//     }

//     let current_pocket_running: i64 = conn
//         .query_row(
//             "SELECT COALESCE(MAX(pocket_number), 0) FROM pledges",
//             [],
//             |row| row.get(0),
//         ).unwrap_or(0);

//     Ok(StockReport {
//         rows,
//         store_active_pockets,
//         bank_active_pockets,
//         total_active_pockets,
//         current_pocket_running,
//         metal_pockets,
//     })
// }

// #[tauri::command]
// pub fn get_stock_report_cmd(db: tauri::State<Db>) -> Result<StockReport, String> {
//     get_stock_report(db.inner())
// }









// src-tauri/src/reports/stock_report.rs

use crate::db::connection::Db;
use rusqlite::Result;

#[derive(serde::Serialize)]
pub struct StockRow {
    pub metal: String,
    
    // Store Inventory (லாக்கர் இருப்பு)
    pub store_gross_weight: f64,
    pub store_net_weight: f64,
    pub store_item_count: i64, // Maps to distinct pockets count
    pub store_loan_amount: f64,
    
    // Bank Mapped Inventory (வங்கி இருப்பு)
    pub bank_gross_weight: f64,
    pub bank_net_weight: f64,
    pub bank_item_count: i64, // Maps to distinct pockets count
    pub bank_loan_amount: f64,
    
    // Combined Inventory (மொத்த இருப்பு)
    pub total_gross_weight: f64,
    pub total_net_weight: f64,
    pub total_item_count: i64,
    pub total_loan_amount: f64,
}

#[derive(serde::Serialize)]
pub struct MetalPocketSummary {
    pub metal: String,
    pub store_pockets: i64,
    pub bank_pockets: i64,
    pub total_pockets: i64,
}

#[derive(serde::Serialize)]
pub struct StockReport {
    pub rows: Vec<StockRow>,
    pub store_active_pockets: i64,
    pub bank_active_pockets: i64,
    pub total_active_pockets: i64,
    pub current_pocket_running: i64,
    pub metal_pockets: Vec<MetalPocketSummary>,
}

pub fn get_stock_report(db: &Db) -> Result<StockReport, String> {
    let conn = db.0.lock().unwrap();

    // 1. Core Stock Weights Matrix (Deduplicated principal amounts and distinct pocket counts)
    let mut stmt = conn.prepare(
        "
        SELECT
            m.name,
            -- Store Inventory Gross & Net Weight
            COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN pi.gross_weight ELSE 0 END), 0.0),
            COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN pi.net_weight ELSE 0 END), 0.0),
            
            -- Store Pockets Count (Distinct unique p.id instances)
            COUNT(DISTINCT CASE WHEN p.status='ACTIVE' AND NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN p.id END),
            
            -- Store Loan Amount (Deduplicated principal sum)
            COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN p.loan_amount / (SELECT COUNT(*) FROM pledge_items pi2 WHERE pi2.pledge_id = p.id) ELSE 0 END), 0.0),
            
            -- Bank Inventory Gross & Net Weight
            COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN pi.gross_weight ELSE 0 END), 0.0),
            COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN pi.net_weight ELSE 0 END), 0.0),
            
            -- Bank Pockets Count (Distinct unique p.id instances)
            COUNT(DISTINCT CASE WHEN p.status='ACTIVE' AND EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN p.id END),
            
            -- Bank Loan Amount (Deduplicated principal sum)
            COALESCE(SUM(CASE WHEN p.status='ACTIVE' AND EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN p.loan_amount / (SELECT COUNT(*) FROM pledge_items pi2 WHERE pi2.pledge_id = p.id) ELSE 0 END), 0.0)
        FROM metal_types m
        LEFT JOIN jewellery_types jt ON jt.metal_type_id = m.id
        LEFT JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
        LEFT JOIN pledges p ON p.id = pi.pledge_id
        WHERE m.is_active = 1
        GROUP BY m.name
        ORDER BY m.name
        "
    ).map_err(|e| e.to_string())?;

    let rows_iter = stmt.query_map([], |row| {
        let store_gross: f64 = row.get(1)?;
        let store_net: f64 = row.get(2)?;
        let store_items: i64 = row.get(3)?;
        let store_loan: f64 = row.get(4)?;

        let bank_gross: f64 = row.get(5)?;
        let bank_net: f64 = row.get(6)?;
        let bank_items: i64 = row.get(7)?;
        let bank_loan: f64 = row.get(8)?;

        Ok(StockRow {
            metal: row.get(0)?,
            store_gross_weight: store_gross,
            store_net_weight: store_net,
            store_item_count: store_items,
            store_loan_amount: store_loan,
            
            bank_gross_weight: bank_gross,
            bank_net_weight: bank_net,
            bank_item_count: bank_items,
            bank_loan_amount: bank_loan,
            
            total_gross_weight: store_gross + bank_gross,
            total_net_weight: store_net + bank_net,
            total_item_count: store_items + bank_items,
            total_loan_amount: store_loan + bank_loan,
        })
    }).map_err(|e| e.to_string())?;

    let mut rows = vec![];
    for r in rows_iter {
        rows.push(r.map_err(|e| e.to_string())?);
    }

    // 2. Segregated Active Pockets Count
    let store_active_pockets: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pledges p WHERE p.status = 'ACTIVE' AND p.pocket_number IS NOT NULL AND NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE')",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let bank_active_pockets: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pledges p WHERE p.status = 'ACTIVE' AND p.pocket_number IS NOT NULL AND EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE')",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let total_active_pockets = store_active_pockets + bank_active_pockets;

    // 3. Category Breakdowns with physical location (Distinct pockets)
    let mut metal_stmt = conn.prepare(
        "
        SELECT
            mt.name,
            COUNT(DISTINCT CASE WHEN NOT EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN p.id END),
            COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM bank_mappings bm WHERE bm.pledge_id = p.id AND bm.status = 'ACTIVE') THEN p.id END)
        FROM metal_types mt
        LEFT JOIN jewellery_types jt ON jt.metal_type_id = mt.id
        LEFT JOIN pledge_items pi ON pi.jewellery_type_id = jt.id
        LEFT JOIN pledges p ON p.id = pi.pledge_id AND p.status = 'ACTIVE'
        WHERE mt.is_active = 1
        GROUP BY mt.id, mt.name
        ORDER BY mt.name
        "
    ).map_err(|e| e.to_string())?;

    let metal_rows = metal_stmt
        .query_map([], |row| {
            let store_p: i64 = row.get(1)?;
            let bank_p: i64 = row.get(2)?;
            Ok(MetalPocketSummary {
                metal: row.get(0)?,
                store_pockets: store_p,
                bank_pockets: bank_p,
                total_pockets: store_p + bank_p,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut metal_pockets = vec![];
    for row in metal_rows {
        metal_pockets.push(row.map_err(|e| e.to_string())?);
    }

    let current_pocket_running: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(pocket_number), 0) FROM pledges",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

    Ok(StockReport {
        rows,
        store_active_pockets,
        bank_active_pockets,
        total_active_pockets,
        current_pocket_running,
        metal_pockets,
    })
}

#[tauri::command]
pub fn get_stock_report_cmd(db: tauri::State<Db>) -> Result<StockReport, String> {
    get_stock_report(db.inner())
}