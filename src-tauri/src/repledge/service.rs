// // src-tauri/src/repledge/service.rs

// use crate::db::connection::Db;
// use chrono::Local;
// use rusqlite::params;
// use serde::{Deserialize, Serialize};
// use crate::pledge::service as pledge_service;

// // ─────────────────────────────────────────────────────────────────────────────
// // Structs — matching your PledgeDetails / PledgeListItem naming conventions
// // ─────────────────────────────────────────────────────────────────────────────

// #[derive(Serialize)]
// pub struct RepledgeListItem {
//     pub id: i64,
//     pub pledge_no: String,
//     pub customer_code: String,
//     pub customer_name: String,
//     pub phone: String,
//     pub photo_path: Option<String>,
//     pub scheme_name: String,
//     pub loan_type: String,
//     pub interest_rate: f64,
//     pub loan_amount: f64,
//     pub total_gross_weight: f64,
//     pub total_net_weight: f64,
//     pub total_estimated_value: f64,
//     pub price_per_gram: f64,
//     pub created_at: String,
//     pub loan_duration_months: i32,
//     pub max_repledge_amount: f64,   // 80% of estimated value
//     pub loan_to_value_pct: f64,     // loan_amount / estimated_value * 100
//     pub is_overlimit: bool,         // true when loan_to_value_pct > 80%
//     pub pending_interest: f64,
//     pub is_bank_mapped: bool,
// }

// #[derive(Serialize)]
// pub struct RepledgeItemDetail {
//     pub id: i64,
//     pub jewellery_type: String,
//     pub purity: String,
//     pub gross_weight: f64,
//     pub net_weight: f64,
//     pub item_value: f64,
//     pub image_path: Option<String>,
// }

// #[derive(Serialize)]
// pub struct RepledgeDetailResponse {
//     pub pledge: RepledgeListItem,
//     pub items: Vec<RepledgeItemDetail>,
// }

// #[derive(Deserialize)]
// pub struct ExecuteRepledgeRequest {
//     pub old_pledge_id: i64,
//     pub new_loan_amount: f64,
//     pub new_interest_rate: f64,
//     pub new_scheme_name: String,
//     pub new_loan_duration_months: i32,
//     pub processing_fee_amount: f64,     // collected upfront for new pledge
//     pub first_interest_amount: f64,     // first month interest collected upfront
//     pub payment_method: String,
//     pub reference: Option<String>,
//     pub denominations: Option<std::collections::HashMap<i32, i32>>,
//     pub created_by: i64,
// }

// #[derive(Serialize)]
// pub struct RepledgeResult {
//     pub old_pledge_no: String,
//     pub new_pledge_no: String,
//     pub new_pledge_id: i64,
//     pub cash_difference: f64,      // positive = we paid out more to customer
//                                     // negative = customer paid us the difference
//     pub pending_interest_settled: f64,
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CONFIGURATION: LTV Limits
// // ─────────────────────────────────────────────────────────────────────────────
// const MAX_LTV_PERCENTAGE: f64 = 80.0;  // Maximum allowed LTV for repledge
// const OVERLIMIT_THRESHOLD: f64 = 80.0; // Threshold to mark as overlimit

// // ─────────────────────────────────────────────────────────────────────────────
// // Helper: calculate pending interest for a pledge using centralized engine
// // ─────────────────────────────────────────────────────────────────────────────
// fn calc_pending_interest(
//     db: &Db,
//     pledge_id: i64,
// ) -> Result<f64, String> {
//     let pledge_response = pledge_service::get_single_pledge(db, pledge_id)?;
//     Ok(pledge_response.interest_pending)
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // get_eligible_pledges_for_repledge
// // Returns ACTIVE pledges that are NOT bank-mapped, supporting live search
// // ─────────────────────────────────────────────────────────────────────────────
// pub fn get_eligible_pledges_for_repledge(
//     db: &Db,
//     query: &str,
// ) -> Result<Vec<RepledgeListItem>, String> {
//     let conn = db.0.lock().unwrap();

//     let like_param = format!("%{}%", query);

//     let mut stmt = conn
//         .prepare(
//             "SELECT
//                 p.id,
//                 p.pledge_no,
//                 c.customer_code,
//                 c.name,
//                 c.phone,
//                 c.photo_path,
//                 p.scheme_name,
//                 p.loan_type,
//                 p.interest_rate,
//                 p.loan_amount,
//                 p.total_gross_weight,
//                 p.total_net_weight,
//                 p.total_estimated_value,
//                 p.price_per_gram,
//                 p.created_at,
//                 p.loan_duration_months,
//                 CASE WHEN EXISTS (
//                     SELECT 1 FROM bank_mappings
//                     WHERE pledge_id = p.id AND status = 'ACTIVE'
//                 ) THEN 1 ELSE 0 END AS is_bank_mapped
//              FROM pledges p
//              JOIN customers c ON c.id = p.customer_id
//              WHERE p.status = 'ACTIVE'
//                AND (
//                    p.pledge_no     LIKE ?1 OR
//                    c.name          LIKE ?1 OR
//                    c.phone         LIKE ?1 OR
//                    c.customer_code LIKE ?1
//                )
//              ORDER BY p.created_at DESC
//              LIMIT 50",
//         )
//         .map_err(|e| e.to_string())?;

//     let rows = stmt
//         .query_map(params![like_param], |row| {
//             Ok((
//                 row.get::<_, i64>(0)?,
//                 row.get::<_, String>(1)?,
//                 row.get::<_, String>(2)?,
//                 row.get::<_, String>(3)?,
//                 row.get::<_, String>(4)?,
//                 row.get::<_, Option<String>>(5)?,
//                 row.get::<_, String>(6)?,
//                 row.get::<_, String>(7)?,
//                 row.get::<_, f64>(8)?,
//                 row.get::<_, f64>(9)?,
//                 row.get::<_, f64>(10)?,
//                 row.get::<_, f64>(11)?,
//                 row.get::<_, f64>(12)?,
//                 row.get::<_, f64>(13)?,
//                 row.get::<_, String>(14)?,
//                 row.get::<_, i32>(15)?,
//                 row.get::<_, i64>(16)?,
//             ))
//         })
//         .map_err(|e| e.to_string())?;

//     let mut collected_rows = Vec::new();
//     for row in rows {
//         collected_rows.push(row.map_err(|e| e.to_string())?);
//     }

//     drop(stmt);
//     drop(conn);

//     let mut list = Vec::new();
//     for row_data in collected_rows {
//         let (
//             id, pledge_no, customer_code, customer_name, phone, photo_path,
//             scheme_name, loan_type, interest_rate, loan_amount,
//             total_gross_weight, total_net_weight, total_estimated_value,
//             price_per_gram, created_at, loan_duration_months, is_bank_mapped_i64,
//         ) = row_data;

//         let max_repledge_amount = (total_estimated_value * MAX_LTV_PERCENTAGE / 100.0).floor();
        
//         let loan_to_value_pct = if total_estimated_value > 0.0 {
//             (loan_amount / total_estimated_value) * 100.0
//         } else {
//             0.0
//         };
        
//         let is_overlimit = loan_to_value_pct > OVERLIMIT_THRESHOLD;
        
//         let pending_interest = calc_pending_interest(db, id)?;

//         list.push(RepledgeListItem {
//             id,
//             pledge_no,
//             customer_code,
//             customer_name,
//             phone,
//             photo_path,
//             scheme_name,
//             loan_type,
//             interest_rate,
//             loan_amount,
//             total_gross_weight,
//             total_net_weight,
//             total_estimated_value,
//             price_per_gram,
//             created_at,
//             loan_duration_months,
//             max_repledge_amount,
//             loan_to_value_pct,
//             is_overlimit,
//             pending_interest,
//             is_bank_mapped: is_bank_mapped_i64 == 1,
//         });
//     }

//     Ok(list)
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // get_repledge_detail
// // ─────────────────────────────────────────────────────────────────────────────
// pub fn get_repledge_detail(
//     db: &Db,
//     pledge_id: i64,
// ) -> Result<RepledgeDetailResponse, String> {
//     let conn = db.0.lock().unwrap();

//     let pledge = conn
//         .query_row(
//             "SELECT
//                 p.id,
//                 p.pledge_no,
//                 c.customer_code,
//                 c.name,
//                 c.phone,
//                 c.photo_path,
//                 p.scheme_name,
//                 p.loan_type,
//                 p.interest_rate,
//                 p.loan_amount,
//                 p.total_gross_weight,
//                 p.total_net_weight,
//                 p.total_estimated_value,
//                 p.price_per_gram,
//                 p.created_at,
//                 p.loan_duration_months,
//                 CASE WHEN EXISTS (
//                     SELECT 1 FROM bank_mappings
//                     WHERE pledge_id = p.id AND status = 'ACTIVE'
//                 ) THEN 1 ELSE 0 END AS is_bank_mapped
//              FROM pledges p
//              JOIN customers c ON c.id = p.customer_id
//              WHERE p.id = ?1 AND p.status = 'ACTIVE'",
//             params![pledge_id],
//             |row| {
//                 Ok((
//                     row.get::<_, i64>(0)?,
//                     row.get::<_, String>(1)?,
//                     row.get::<_, String>(2)?,
//                     row.get::<_, String>(3)?,
//                     row.get::<_, String>(4)?,
//                     row.get::<_, Option<String>>(5)?,
//                     row.get::<_, String>(6)?,
//                     row.get::<_, String>(7)?,
//                     row.get::<_, f64>(8)?,
//                     row.get::<_, f64>(9)?,
//                     row.get::<_, f64>(10)?,
//                     row.get::<_, f64>(11)?,
//                     row.get::<_, f64>(12)?,
//                     row.get::<_, f64>(13)?,
//                     row.get::<_, String>(14)?,
//                     row.get::<_, i32>(15)?,
//                     row.get::<_, i64>(16)?,
//                 ))
//             },
//         )
//         .map_err(|e| format!("Pledge not found or not active: {}", e))?;

//     let (
//         id, pledge_no, customer_code, customer_name, phone, photo_path,
//         scheme_name, loan_type, interest_rate, loan_amount,
//         total_gross_weight, total_net_weight, total_estimated_value,
//         price_per_gram, created_at, loan_duration_months, is_bank_mapped_i64,
//     ) = pledge;

//     let max_repledge_amount = (total_estimated_value * MAX_LTV_PERCENTAGE / 100.0).floor();
    
//     let loan_to_value_pct = if total_estimated_value > 0.0 {
//         (loan_amount / total_estimated_value) * 100.0
//     } else {
//         0.0
//     };
    
//     let is_overlimit = loan_to_value_pct > OVERLIMIT_THRESHOLD;

//     let mut stmt = conn
//         .prepare(
//             "SELECT
//                 pi.id,
//                 jt.name,
//                 pi.purity,
//                 pi.gross_weight,
//                 pi.net_weight,
//                 pi.item_value,
//                 pi.image_path
//              FROM pledge_items pi
//              JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
//              WHERE pi.pledge_id = ?1
//              ORDER BY pi.id ASC",
//         )
//         .map_err(|e| e.to_string())?;

//     let items_iter = stmt
//         .query_map(params![pledge_id], |row| {
//             Ok(RepledgeItemDetail {
//                 id: row.get(0)?,
//                 jewellery_type: row.get(1)?,
//                 purity: row.get(2)?,
//                 gross_weight: row.get(3)?,
//                 net_weight: row.get(4)?,
//                 item_value: row.get(5)?,
//                 image_path: row.get(6)?,
//             })
//         })
//         .map_err(|e| e.to_string())?;

//     let mut items = Vec::new();
//     for item in items_iter {
//         items.push(item.map_err(|e| e.to_string())?);
//     }

//     drop(stmt);
//     drop(conn);

//     let pending_interest = calc_pending_interest(db, id)?;

//     let pledge_item = RepledgeListItem {
//         id,
//         pledge_no,
//         customer_code,
//         customer_name,
//         phone,
//         photo_path,
//         scheme_name,
//         loan_type,
//         interest_rate,
//         loan_amount,
//         total_gross_weight,
//         total_net_weight,
//         total_estimated_value,
//         price_per_gram,
//         created_at,
//         loan_duration_months,
//         max_repledge_amount,
//         loan_to_value_pct,
//         is_overlimit,
//         pending_interest,
//         is_bank_mapped: is_bank_mapped_i64 == 1,
//     };

//     Ok(RepledgeDetailResponse {
//         pledge: pledge_item,
//         items,
//     })
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // execute_repledge
// // ─────────────────────────────────────────────────────────────────────────────
// pub fn execute_repledge(
//     db: &Db,
//     req: &ExecuteRepledgeRequest,
// ) -> Result<RepledgeResult, String> {

//     let mut conn = db.0.lock().unwrap();
//     let tx = conn.transaction().map_err(|e| e.to_string())?;

//     // ── 1. Fetch old pledge data ─────────────────────────────────────────────
//     let (
//         old_pledge_no,
//         old_loan_amount,
//         old_customer_id,
//         old_loan_type,
//         old_price_per_gram,
//         old_gross,
//         old_net,
//         old_estimated,
//         _old_created_at,
//         _old_interest_rate,
//     ) = tx
//         .query_row(
//             "SELECT
//                 pledge_no,
//                 loan_amount,
//                 customer_id,
//                 loan_type,
//                 price_per_gram,
//                 total_gross_weight,
//                 total_net_weight,
//                 total_estimated_value,
//                 created_at,
//                 interest_rate
//              FROM pledges
//              WHERE id = ?1 AND status = 'ACTIVE'",
//             params![req.old_pledge_id],
//             |row| {
//                 Ok((
//                     row.get::<_, String>(0)?,
//                     row.get::<_, f64>(1)?,
//                     row.get::<_, i64>(2)?,
//                     row.get::<_, String>(3)?,
//                     row.get::<_, f64>(4)?,
//                     row.get::<_, f64>(5)?,
//                     row.get::<_, f64>(6)?,
//                     row.get::<_, f64>(7)?,
//                     row.get::<_, String>(8)?,
//                     row.get::<_, f64>(9)?,
//                 ))
//             },
//         )
//         .map_err(|e| format!("Old pledge not found or not active: {}", e))?;

//     let max_allowed_amount = (old_estimated * MAX_LTV_PERCENTAGE / 100.0).floor();
//     let new_ltv = if old_estimated > 0.0 {
//         (req.new_loan_amount / old_estimated) * 100.0
//     } else {
//         0.0
//     };

//     if req.new_loan_amount > max_allowed_amount {
//         return Err(format!(
//             "❌ Repledge rejected: New loan amount ₹{:.2} exceeds maximum allowed ₹{:.2} ({}% of estimated value ₹{:.2}). Current LTV would be {:.1}%.",
//             req.new_loan_amount,
//             max_allowed_amount,
//             MAX_LTV_PERCENTAGE,
//             old_estimated,
//             new_ltv
//         ));
//     }

//     // ── 2. Calculate pending interest ───────────────
//     drop(tx);
//     drop(conn);
    
//     let pending_interest = calc_pending_interest(db, req.old_pledge_id)?;

//     let mut conn = db.0.lock().unwrap();
//     let tx = conn.transaction().map_err(|e| e.to_string())?;

//     // ── 3. Close old pledge: write INTEREST payment if any pending ───────────
//     if pending_interest > 0.0 {
//         // Pass None to use the current calendar year for real-time interest settlement
//         let receipt_no = crate::receipt::generator::generate_next_receipt_no(&tx, None)?;
        
//         tx.execute(
//             "INSERT INTO pledge_payments
//                 (pledge_id, payment_type, payment_mode, receipt_no, amount, created_by)
//              VALUES (?1, 'INTEREST', ?2, ?3, ?4, ?5)",
//             params![
//                 req.old_pledge_id,
//                 req.payment_method,
//                 receipt_no.clone(),
//                 pending_interest,
//                 req.created_by
//             ],
//         )
//         .map_err(|e| e.to_string())?;

//         tx.execute(
//             "INSERT INTO fund_transactions
//                 (type, total_amount, module_type, module_id, reference, payment_method, created_by)
//              VALUES ('ADD', ?1, 'INTEREST', ?2, ?3, ?4, ?5)",
//             params![
//                 pending_interest,
//                 req.old_pledge_id,
//                 format!("Interest settled on repledge of {} - {}", old_pledge_no, receipt_no),
//                 req.payment_method,
//                 req.created_by
//             ],
//         )
//         .map_err(|e| e.to_string())?;
//     }

//     // ── 4. CLOSURE payment on old pledge ─────────────────────────
//     // Pass None to use the current calendar year for real-time closure settlement
//     let closure_receipt = crate::receipt::generator::generate_next_receipt_no(&tx, None)?;
    
//     tx.execute(
//         "INSERT INTO pledge_payments
//             (pledge_id, payment_type, payment_mode, receipt_no, amount, created_by)
//          VALUES (?1, 'CLOSURE', ?2, ?3, ?4, ?5)",
//         params![
//             req.old_pledge_id,
//             req.payment_method,
//             closure_receipt,
//             old_loan_amount,
//             req.created_by
//         ],
//     )
//     .map_err(|e| e.to_string())?;

//     // ── 5. Mark old pledge CLOSED ─────────────────────────────────────────────
//     tx.execute(
//         "UPDATE pledges SET status = 'CLOSED' WHERE id = ?1",
//         params![req.old_pledge_id],
//     )
//     .map_err(|e| e.to_string())?;

//     // ── 6. Generate new pledge_no ─────────────────────────────────────────────
//     let year = Local::now().format("%Y").to_string();
//     let pattern = format!("PLG-{}-%", year);
//     let last_no: rusqlite::Result<String> = tx.query_row(
//         "SELECT pledge_no FROM pledges
//          WHERE pledge_no LIKE ?1
//          ORDER BY id DESC LIMIT 1",
//         params![pattern],
//         |row| row.get(0),
//     );

//     let next_seq = match last_no {
//         Ok(last) => last
//             .split('-')
//             .last()
//             .and_then(|n| n.parse::<i64>().ok())
//             .unwrap_or(0)
//             + 1,
//         Err(_) => 1,
//     };

//     let new_pledge_no = format!("PLG-{}-{:05}", year, next_seq);

//     // ── 7. Generate receipt for new pledge ────────────────────────────────────
//     // Pass None to use the current calendar year for real-time receipt numbering
//     let new_pledge_receipt = crate::receipt::generator::generate_next_receipt_no(&tx, None)?;

//     // ── 8. INSERT new pledge ──────────────────────────────────────────────────
//     tx.execute(
//         "INSERT INTO pledges (
//             pledge_no, receipt_number, customer_id, scheme_name, loan_type, interest_rate,
//             loan_duration_months, price_per_gram,
//             total_gross_weight, total_net_weight,
//             total_estimated_value, loan_amount, created_by
//          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
//         params![
//             new_pledge_no.clone(),
//             new_pledge_receipt,
//             old_customer_id,
//             req.new_scheme_name,
//             old_loan_type,
//             req.new_interest_rate,
//             req.new_loan_duration_months,
//             old_price_per_gram,
//             old_gross,
//             old_net,
//             old_estimated,
//             req.new_loan_amount,
//             req.created_by
//         ],
//     )
//     .map_err(|e| e.to_string())?;

//     let new_pledge_id = tx.last_insert_rowid();

//     // ── 9. Copy pledge_items ──────────────────────────────────────────────────
//     tx.execute(
//         "INSERT INTO pledge_items
//             (pledge_id, jewellery_type_id, purity, gross_weight, net_weight, item_value, image_path)
//          SELECT ?1, jewellery_type_id, purity, gross_weight, net_weight, item_value, image_path
//          FROM pledge_items
//          WHERE pledge_id = ?2",
//         params![new_pledge_id, req.old_pledge_id],
//     )
//     .map_err(|e| e.to_string())?;

//     // ── 10. Processing Fee for new pledge ────────────────────────────────────
//     if req.processing_fee_amount > 0.01 {
//         tx.execute(
//             "INSERT INTO fund_transactions
//                 (type, total_amount, module_type, module_id, reference, payment_method, created_by)
//              VALUES ('ADD', ?1, 'FEE', ?2, ?3, ?4, ?5)",
//             params![
//                 req.processing_fee_amount,
//                 new_pledge_id,
//                 format!("Processing Fee {}", new_pledge_no.clone()),
//                 req.payment_method,
//                 req.created_by
//             ],
//         )
//         .map_err(|e| e.to_string())?;
//     }

//     // ── 11. First Interest for new pledge ────────────────────────────────────
//     if req.first_interest_amount > 0.01 {
//         tx.execute(
//             "INSERT INTO pledge_payments
//                 (pledge_id, payment_type, payment_mode, receipt_no, amount, created_by)
//              VALUES (?1, 'INTEREST', ?2, ?3, ?4, ?5)",
//             params![
//                 new_pledge_id,
//                 req.payment_method,
//                 new_pledge_receipt,               
//                 req.first_interest_amount,
//                 req.created_by
//             ],
//         )
//         .map_err(|e| e.to_string())?;
 
//         tx.execute(
//             "INSERT INTO fund_transactions
//                 (type, total_amount, module_type, module_id, reference, payment_method, created_by)
//              VALUES ('ADD', ?1, 'INTEREST', ?2, ?3, ?4, ?5)",
//             params![
//                 req.first_interest_amount,
//                 new_pledge_id,
//                 format!("First Interest {}", new_pledge_receipt),
//                 req.payment_method,
//                 req.created_by
//             ],
//         )
//         .map_err(|e| e.to_string())?;
//     }

//     // ── 12. Fund transaction for cash difference ──────────────────────────────
//     let cash_diff = req.new_loan_amount - old_loan_amount;

//     if cash_diff.abs() > 0.01 {
//         if cash_diff > 0.0 {
//             if req.payment_method == "CASH" {
//                 tx.execute(
//                     "INSERT INTO fund_transactions
//                         (type, total_amount, module_type, module_id, reference, payment_method, created_by)
//                      VALUES ('WITHDRAW', ?1, 'PLEDGE', ?2, ?3, 'CASH', ?4)",
//                     params![
//                         cash_diff,
//                         new_pledge_id,
//                         format!("Repledge extra disbursement: {} → {}", old_pledge_no, new_pledge_no.clone()),
//                         req.created_by
//                     ],
//                 )
//                 .map_err(|e| e.to_string())?;

//                 let fund_tx_id = tx.last_insert_rowid();

//                 if let Some(ref denoms) = req.denominations {
//                     for (note, qty) in denoms {
//                         if *qty > 0 {
//                             tx.execute(
//                                 "INSERT INTO fund_denominations
//                                     (fund_transaction_id, denomination, quantity, amount)
//                                  VALUES (?1, ?2, ?3, ?4)",
//                                 params![fund_tx_id, note, qty, (*note as f64) * (*qty as f64)],
//                             )
//                             .map_err(|e| e.to_string())?;
//                         }
//                     }
//                 }
//             } else {
//                 tx.execute(
//                     "INSERT INTO fund_transactions
//                         (type, total_amount, module_type, module_id, reference, payment_method, created_by)
//                      VALUES ('WITHDRAW', ?1, 'PLEDGE', ?2, ?3, ?4, ?5)",
//                     params![
//                         cash_diff,
//                         new_pledge_id,
//                         format!("Repledge extra disbursement: {} → {}", old_pledge_no, new_pledge_no.clone()),
//                         req.payment_method,
//                         req.created_by
//                     ],
//                 )
//                 .map_err(|e| e.to_string())?;
//             }
//         } else {
//             if req.payment_method == "CASH" {
//                 tx.execute(
//                     "INSERT INTO fund_transactions
//                         (type, total_amount, module_type, module_id, reference, payment_method, created_by)
//                      VALUES ('ADD', ?1, 'PAYMENT', ?2, ?3, 'CASH', ?4)",
//                     params![
//                         cash_diff.abs(),
//                         req.old_pledge_id,
//                         format!("Repledge shortfall collected: {} → {}", old_pledge_no, new_pledge_no.clone()),
//                         req.created_by
//                     ],
//                 )
//                 .map_err(|e| e.to_string())?;

//                 let fund_tx_id = tx.last_insert_rowid();

//                 if let Some(ref denoms) = req.denominations {
//                     for (note, qty) in denoms {
//                         if *qty > 0 {
//                             tx.execute(
//                                 "INSERT INTO fund_denominations
//                                     (fund_transaction_id, denomination, quantity, amount)
//                                  VALUES (?1, ?2, ?3, ?4)",
//                                 params![fund_tx_id, note, qty, (*note as f64) * (*qty as f64)],
//                             )
//                             .map_err(|e| e.to_string())?;
//                         }
//                     }
//                 }
//             } else {
//                 tx.execute(
//                     "INSERT INTO fund_transactions
//                         (type, total_amount, module_type, module_id, reference, payment_method, created_by)
//                      VALUES ('ADD', ?1, 'PAYMENT', ?2, ?3, ?4, ?5)",
//                     params![
//                         cash_diff.abs(),
//                         req.old_pledge_id,
//                         format!("Repledge shortfall collected: {} → {}", old_pledge_no, new_pledge_no.clone()),
//                         req.payment_method,
//                         req.created_by
//                     ],
//                 )
//                 .map_err(|e| e.to_string())?;
//             }
//         }
//     }

//     tx.commit().map_err(|e| e.to_string())?;

//     Ok(RepledgeResult {
//         old_pledge_no,
//         new_pledge_no,
//         new_pledge_id,
//         cash_difference: cash_diff,
//         pending_interest_settled: pending_interest,
//     })
// }






// src-tauri/src/repledge/service.rs

use crate::db::connection::Db;
use chrono::Local;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use crate::pledge::service as pledge_service;

// ─────────────────────────────────────────────────────────────────────────────
// Structs — matching your PledgeDetails / PledgeListItem naming conventions
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct RepledgeListItem {
    pub id: i64,
    pub pledge_no: String,
    pub customer_code: String,
    pub customer_name: String,
    pub phone: String,
    pub photo_path: Option<String>,
    pub scheme_name: String,
    pub loan_type: String,
    pub interest_rate: f64,
    pub loan_amount: f64,
    pub total_gross_weight: f64,
    pub total_net_weight: f64,
    pub total_estimated_value: f64,
    pub price_per_gram: f64,
    pub created_at: String,
    pub loan_duration_months: i32,
    pub max_repledge_amount: f64,   // 80% of estimated value
    pub loan_to_value_pct: f64,     // loan_amount / estimated_value * 100
    pub is_overlimit: bool,         // true when loan_to_value_pct > 80%
    pub pending_interest: f64,
    pub is_bank_mapped: bool,
}

#[derive(Serialize)]
pub struct RepledgeItemDetail {
    pub id: i64,
    pub jewellery_type: String,
    pub purity: String,
    pub gross_weight: f64,
    pub net_weight: f64,
    pub item_value: f64,
    pub image_path: Option<String>,
}

#[derive(Serialize)]
pub struct RepledgeDetailResponse {
    pub pledge: RepledgeListItem,
    pub items: Vec<RepledgeItemDetail>,
}

#[derive(Deserialize)]
pub struct ExecuteRepledgeRequest {
    pub old_pledge_id: i64,
    pub new_loan_amount: f64,
    pub new_interest_rate: f64,
    pub new_scheme_name: String,
    pub new_loan_duration_months: i32,
    pub processing_fee_amount: f64,     
    pub first_interest_amount: f64,     
    pub payment_method: String,
    pub reference: Option<String>,
    pub denominations: Option<std::collections::HashMap<i32, i32>>,
    pub created_by: i64,
}

#[derive(Serialize)]
pub struct RepledgeResult {
    pub old_pledge_no: String,
    pub new_pledge_no: String,
    pub new_pledge_id: i64,
    pub cash_difference: f64,      
    pub pending_interest_settled: f64,
}

const MAX_LTV_PERCENTAGE: f64 = 80.0;  
const OVERLIMIT_THRESHOLD: f64 = 80.0; 

fn calc_pending_interest(
    db: &Db,
    pledge_id: i64,
) -> Result<f64, String> {
    let pledge_response = pledge_service::get_single_pledge(db, pledge_id)?;
    Ok(pledge_response.interest_pending)
}

pub fn get_eligible_pledges_for_repledge(
    db: &Db,
    query: &str,
) -> Result<Vec<RepledgeListItem>, String> {
    let conn = db.0.lock().unwrap();
    let like_param = format!("%{}%", query);

    let mut stmt = conn
        .prepare(
            "SELECT
                p.id, p.pledge_no, c.customer_code, c.name, c.phone, c.photo_path,
                p.scheme_name, p.loan_type, p.interest_rate, p.loan_amount,
                p.total_gross_weight, p.total_net_weight, p.total_estimated_value,
                p.price_per_gram, p.created_at, p.loan_duration_months,
                CASE WHEN EXISTS (
                    SELECT 1 FROM bank_mappings WHERE pledge_id = p.id AND status = 'ACTIVE'
                ) THEN 1 ELSE 0 END AS is_bank_mapped
             FROM pledges p
             JOIN customers c ON c.id = p.customer_id
             WHERE p.status = 'ACTIVE'
               AND (
                   p.pledge_no     LIKE ?1 OR
                   c.name          LIKE ?1 OR
                   c.phone         LIKE ?1 OR
                   c.customer_code LIKE ?1
               )
             ORDER BY p.created_at DESC
             LIMIT 50",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![like_param], |row| {
            Ok((
                row.get::<_, i64>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?,
                row.get::<_, String>(3)?, row.get::<_, String>(4)?, row.get::<_, Option<String>>(5)?,
                row.get::<_, String>(6)?, row.get::<_, String>(7)?, row.get::<_, f64>(8)?,
                row.get::<_, f64>(9)?, row.get::<_, f64>(10)?, row.get::<_, f64>(11)?,
                row.get::<_, f64>(12)?, row.get::<_, f64>(13)?, row.get::<_, String>(14)?,
                row.get::<_, i32>(15)?, row.get::<_, i64>(16)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut collected_rows = Vec::new();
    for row in rows {
        collected_rows.push(row.map_err(|e| e.to_string())?);
    }

    drop(stmt);
    drop(conn);

    let mut list = Vec::new();
    for row_data in collected_rows {
        let (
            id, pledge_no, customer_code, customer_name, phone, photo_path,
            scheme_name, loan_type, interest_rate, loan_amount,
            total_gross_weight, total_net_weight, total_estimated_value,
            price_per_gram, created_at, loan_duration_months, is_bank_mapped_i64,
        ) = row_data;

        let max_repledge_amount = (total_estimated_value * MAX_LTV_PERCENTAGE / 100.0).floor();
        let loan_to_value_pct = if total_estimated_value > 0.0 { (loan_amount / total_estimated_value) * 100.0 } else { 0.0 };
        let is_overlimit = loan_to_value_pct > OVERLIMIT_THRESHOLD;
        let pending_interest = calc_pending_interest(db, id)?;

        list.push(RepledgeListItem {
            id, pledge_no, customer_code, customer_name, phone, photo_path,
            scheme_name, loan_type, interest_rate, loan_amount,
            total_gross_weight, total_net_weight, total_estimated_value,
            price_per_gram, created_at, loan_duration_months, max_repledge_amount,
            loan_to_value_pct, is_overlimit, pending_interest, is_bank_mapped: is_bank_mapped_i64 == 1,
        });
    }

    Ok(list)
}

pub fn get_repledge_detail(
    db: &Db,
    pledge_id: i64,
) -> Result<RepledgeDetailResponse, String> {
    let conn = db.0.lock().unwrap();

    let pledge = conn
        .query_row(
            "SELECT
                p.id, p.pledge_no, c.customer_code, c.name, c.phone, c.photo_path,
                p.scheme_name, p.loan_type, p.interest_rate, p.loan_amount,
                p.total_gross_weight, p.total_net_weight, p.total_estimated_value,
                p.price_per_gram, p.created_at, p.loan_duration_months,
                CASE WHEN EXISTS (
                    SELECT 1 FROM bank_mappings WHERE pledge_id = p.id AND status = 'ACTIVE'
                ) THEN 1 ELSE 0 END AS is_bank_mapped
             FROM pledges p
             JOIN customers c ON c.id = p.customer_id
             WHERE p.id = ?1 AND p.status = 'ACTIVE'",
            params![pledge_id],
            |row| {
                Ok((
                    row.get::<_, i64>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?, row.get::<_, String>(4)?, row.get::<_, Option<String>>(5)?,
                    row.get::<_, String>(6)?, row.get::<_, String>(7)?, row.get::<_, f64>(8)?,
                    row.get::<_, f64>(9)?, row.get::<_, f64>(10)?, row.get::<_, f64>(11)?,
                    row.get::<_, f64>(12)?, row.get::<_, f64>(13)?, row.get::<_, String>(14)?,
                    row.get::<_, i32>(15)?, row.get::<_, i64>(16)?,
                ))
            },
        )
        .map_err(|e| format!("Pledge not found or not active: {}", e))?;

    let (
        id, pledge_no, customer_code, customer_name, phone, photo_path,
        scheme_name, loan_type, interest_rate, loan_amount,
        total_gross_weight, total_net_weight, total_estimated_value,
        price_per_gram, created_at, loan_duration_months, is_bank_mapped_i64,
    ) = pledge;

    let max_repledge_amount = (total_estimated_value * MAX_LTV_PERCENTAGE / 100.0).floor();
    let loan_to_value_pct = if total_estimated_value > 0.0 { (loan_amount / total_estimated_value) * 100.0 } else { 0.0 };
    let is_overlimit = loan_to_value_pct > OVERLIMIT_THRESHOLD;

    let mut stmt = conn
        .prepare(
            "SELECT pi.id, jt.name, pi.purity, pi.gross_weight, pi.net_weight, pi.item_value, pi.image_path
             FROM pledge_items pi
             JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
             WHERE pi.pledge_id = ?1
             ORDER BY pi.id ASC",
        )
        .map_err(|e| e.to_string())?;

    let items_iter = stmt
        .query_map(params![pledge_id], |row| {
            Ok(RepledgeItemDetail {
                id: row.get(0)?, jewellery_type: row.get(1)?, purity: row.get(2)?,
                gross_weight: row.get(3)?, net_weight: row.get(4)?, item_value: row.get(5)?,
                image_path: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for item in items_iter {
        items.push(item.map_err(|e| e.to_string())?);
    }

    drop(stmt);
    drop(conn);

    let pending_interest = calc_pending_interest(db, id)?;

    let pledge_item = RepledgeListItem {
        id, pledge_no, customer_code, customer_name, phone, photo_path,
        scheme_name, loan_type, interest_rate, loan_amount,
        total_gross_weight, total_net_weight, total_estimated_value,
        price_per_gram, created_at, loan_duration_months, max_repledge_amount,
        loan_to_value_pct, is_overlimit, pending_interest, is_bank_mapped: is_bank_mapped_i64 == 1,
    };

    Ok(RepledgeDetailResponse { pledge: pledge_item, items })
}

pub fn execute_repledge(
    db: &Db,
    req: &ExecuteRepledgeRequest,
) -> Result<RepledgeResult, String> {
    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // ── 1. Fetch old pledge data ─────────────────────────────────────────────
    let (
        old_pledge_no, old_loan_amount, old_customer_id, old_loan_type, old_price_per_gram,
        old_gross, old_net, old_estimated, _old_created_at, _old_interest_rate,
    ) = tx
        .query_row(
            "SELECT pledge_no, loan_amount, customer_id, loan_type, price_per_gram,
                    total_gross_weight, total_net_weight, total_estimated_value, created_at, interest_rate
             FROM pledges WHERE id = ?1 AND status = 'ACTIVE'",
            params![req.old_pledge_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?, row.get::<_, f64>(1)?, row.get::<_, i64>(2)?,
                    row.get::<_, String>(3)?, row.get::<_, f64>(4)?, row.get::<_, f64>(5)?,
                    row.get::<_, f64>(6)?, row.get::<_, f64>(7)?, row.get::<_, String>(8)?,
                    row.get::<_, f64>(9)?,
                ))
            },
        )
        .map_err(|e| format!("Old pledge not found or not active: {}", e))?;

    let max_allowed_amount = (old_estimated * MAX_LTV_PERCENTAGE / 100.0).floor();
    let new_ltv = if old_estimated > 0.0 { (req.new_loan_amount / old_estimated) * 100.0 } else { 0.0 };

    if req.new_loan_amount > max_allowed_amount {
        return Err(format!(
            "❌ Repledge rejected: New loan amount ₹{:.2} exceeds maximum allowed ₹{:.2}. Current LTV would be {:.1}%.",
            req.new_loan_amount, max_allowed_amount, new_ltv
        ));
    }

    drop(tx);
    drop(conn);
    
    let pending_interest = calc_pending_interest(db, req.old_pledge_id)?;

    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // ── 2. Close old pledge: write INTEREST payment if any pending ───────────
    if pending_interest > 0.0 {
        let receipt_no = crate::receipt::generator::generate_next_receipt_no(&tx, None)?;
        
        tx.execute(
            "INSERT INTO pledge_payments (pledge_id, payment_type, payment_mode, receipt_no, amount, created_by)
             VALUES (?1, 'INTEREST', ?2, ?3, ?4, ?5)",
            params![req.old_pledge_id, req.payment_method, receipt_no.clone(), pending_interest, req.created_by],
        ).map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO fund_transactions (type, total_amount, module_type, module_id, reference, payment_method, created_by)
             VALUES ('ADD', ?1, 'INTEREST', ?2, ?3, ?4, ?5)",
            params![pending_interest, req.old_pledge_id, format!("Interest settled on repledge of {} - {}", old_pledge_no, receipt_no), req.payment_method, req.created_by],
        ).map_err(|e| e.to_string())?;
    }

    // ── 3. CLOSURE payment on old pledge ─────────────────────────
    let closure_receipt = crate::receipt::generator::generate_next_receipt_no(&tx, None)?;
    
    tx.execute(
        "INSERT INTO pledge_payments (pledge_id, payment_type, payment_mode, receipt_no, amount, created_by)
         VALUES (?1, 'CLOSURE', ?2, ?3, ?4, ?5)",
        params![req.old_pledge_id, req.payment_method, closure_receipt, old_loan_amount, req.created_by],
    ).map_err(|e| e.to_string())?;

tx.execute(
    "UPDATE pledges SET status = 'CLOSED' WHERE id = ?1", 
    params![req.old_pledge_id]
)
.map_err(|e| e.to_string())?;


    // ── 4. Generate new pledge_no ─────────────────────────────────────────────
    let year = Local::now().format("%Y").to_string();
    let pattern = format!("PLG-{}-%", year);
    let last_no: rusqlite::Result<String> = tx.query_row(
        "SELECT pledge_no FROM pledges WHERE pledge_no LIKE ?1 ORDER BY id DESC LIMIT 1",
        params![pattern],
        |row| row.get(0),
    );

    let next_seq = match last_no {
        Ok(last) => last.split('-').last().and_then(|n| n.parse::<i64>().ok()).unwrap_or(0) + 1,
        Err(_) => 1,
    };
    let new_pledge_no = format!("PLG-{}-{:05}", year, next_seq);

    // ── 5. Generate receipt for new pledge ────────────────────────────────────
    let new_pledge_receipt = crate::receipt::generator::generate_next_receipt_no(&tx, None)?;

    // ── 6. INSERT new pledge ──────────────────────────────────────────────────
    // 🛡️ CRITICAL FIX: Changed column parameter from receipt_number to receipt_no
    tx.execute(
        "INSERT INTO pledges (
            pledge_no, receipt_no, customer_id, scheme_name, loan_type, interest_rate,
            loan_duration_months, price_per_gram, total_gross_weight, total_net_weight,
            total_estimated_value, loan_amount, created_by
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            new_pledge_no.clone(), new_pledge_receipt, old_customer_id, req.new_scheme_name,
            old_loan_type, req.new_interest_rate, req.new_loan_duration_months, old_price_per_gram,
            old_gross, old_net, old_estimated, req.new_loan_amount, req.created_by
        ],
    ).map_err(|e| e.to_string())?;

    let new_pledge_id = tx.last_insert_rowid();

    // ── 7. Copy pledge_items ──────────────────────────────────────────────────
    tx.execute(
        "INSERT INTO pledge_items (pledge_id, jewellery_type_id, purity, gross_weight, net_weight, item_value, image_path)
         SELECT ?1, jewellery_type_id, purity, gross_weight, net_weight, item_value, image_path
         FROM pledge_items WHERE pledge_id = ?2",
        params![new_pledge_id, req.old_pledge_id],
    ).map_err(|e| e.to_string())?;

    // ── 8. Processing Fee for new pledge ────────────────────────────────────
    if req.processing_fee_amount > 0.01 {
        tx.execute(
            "INSERT INTO fund_transactions (type, total_amount, module_type, module_id, reference, payment_method, created_by)
             VALUES ('ADD', ?1, 'FEE', ?2, ?3, ?4, ?5)",
            params![req.processing_fee_amount, new_pledge_id, format!("Processing Fee {}", new_pledge_no.clone()), req.payment_method, req.created_by],
        ).map_err(|e| e.to_string())?;
    }

    // ── 9. First Interest for new pledge ────────────────────────────────────
    if req.first_interest_amount > 0.01 {
        tx.execute(
            "INSERT INTO pledge_payments (pledge_id, payment_type, payment_mode, receipt_no, amount, created_by)
             VALUES (?1, 'INTEREST', ?2, ?3, ?4, ?5)",
            params![new_pledge_id, req.payment_method, new_pledge_receipt, req.first_interest_amount, req.created_by],
        ).map_err(|e| e.to_string())?;
 
        tx.execute(
            "INSERT INTO fund_transactions (type, total_amount, module_type, module_id, reference, payment_method, created_by)
             VALUES ('ADD', ?1, 'INTEREST', ?2, ?3, ?4, ?5)",
            params![req.first_interest_amount, new_pledge_id, format!("First Interest {}", new_pledge_receipt), req.payment_method, req.created_by],
        ).map_err(|e| e.to_string())?;
    }

    // ── 10. Fund transaction for cash difference ──────────────────────────────
    let cash_diff = req.new_loan_amount - old_loan_amount;

    if cash_diff.abs() > 0.01 {
        if cash_diff > 0.0 {
            if req.payment_method == "CASH" {
                tx.execute(
                    "INSERT INTO fund_transactions (type, total_amount, module_type, module_id, reference, payment_method, created_by)
                     VALUES ('WITHDRAW', ?1, 'PLEDGE', ?2, ?3, 'CASH', ?4)",
                    params![cash_diff, new_pledge_id, format!("Repledge extra disbursement: {} → {}", old_pledge_no, new_pledge_no.clone()), req.created_by],
                ).map_err(|e| e.to_string())?;

                let fund_tx_id = tx.last_insert_rowid();

                if let Some(ref denoms) = req.denominations {
                    for (note, qty) in denoms {
                        if *qty > 0 {
                            tx.execute("INSERT INTO fund_denominations (fund_transaction_id, denomination, quantity, amount) VALUES (?1, ?2, ?3, ?4)",
                                params![fund_tx_id, note, qty, (*note as f64) * (*qty as f64)],
                            ).map_err(|e| e.to_string())?;
                        }
                    }
                }
            } else {
                tx.execute(
                    "INSERT INTO fund_transactions (type, total_amount, module_type, module_id, reference, payment_method, created_by)
                     VALUES ('WITHDRAW', ?1, 'PLEDGE', ?2, ?3, ?4, ?5)",
                    params![cash_diff, new_pledge_id, format!("Repledge extra disbursement: {} → {}", old_pledge_no, new_pledge_no.clone()), req.payment_method, req.created_by],
                ).map_err(|e| e.to_string())?;
            }
        } else {
            // 🛡️ CRITICAL FIX: Fixed data entry mapping logic for Shortfall collections sign matching 
            let absolute_shortfall = cash_diff.abs();
            if req.payment_method == "CASH" {
                tx.execute(
                    "INSERT INTO fund_transactions (type, total_amount, module_type, module_id, reference, payment_method, created_by)
                     VALUES ('ADD', ?1, 'PAYMENT', ?2, ?3, 'CASH', ?4)",
                    params![absolute_shortfall, req.old_pledge_id, format!("Repledge shortfall collected: {} → {}", old_pledge_no, new_pledge_no.clone()), req.created_by],
                ).map_err(|e| e.to_string())?;

                let fund_tx_id = tx.last_insert_rowid();

                if let Some(ref denoms) = req.denominations {
                    for (note, qty) in denoms {
                        if *qty > 0 {
                            tx.execute("INSERT INTO fund_denominations (fund_transaction_id, denomination, quantity, amount) VALUES (?1, ?2, ?3, ?4)",
                                params![fund_tx_id, note, qty, (*note as f64) * (*qty as f64)],
                            ).map_err(|e| e.to_string())?;
                        }
                    }
                }
            } else {
                tx.execute(
                    "INSERT INTO fund_transactions (type, total_amount, module_type, module_id, reference, payment_method, created_by)
                     VALUES ('ADD', ?1, 'PAYMENT', ?2, ?3, ?4, ?5)",
                    params![absolute_shortfall, req.old_pledge_id, format!("Repledge shortfall collected: {} → {}", old_pledge_no, new_pledge_no.clone()), req.payment_method, req.created_by],
                ).map_err(|e| e.to_string())?;
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(RepledgeResult {
        old_pledge_no,
        new_pledge_no,
        new_pledge_id,
        cash_difference: cash_diff,
        pending_interest_settled: pending_interest,
    })
}