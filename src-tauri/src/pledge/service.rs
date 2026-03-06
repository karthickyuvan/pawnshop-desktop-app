use crate::db::connection::Db;
use base64::{engine::general_purpose, Engine as _};
use chrono::{Local, NaiveDate};
use rusqlite::params_from_iter;
use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::Manager;

#[derive(Deserialize, Serialize, Debug)]
pub struct PledgeItemRequest {
    pub jewellery_type_id: i64,
    pub purity: String,
    pub gross_weight: f64,
    pub net_weight: f64,
    pub item_value: f64,
    pub image_base64: Option<String>,
}

#[derive(Serialize)]
pub struct PledgeSummary {
    pub total_pledges: i64,
    pub total_amount: f64,
    pub active_count: i64,
    pub overdue_count: i64,
}

#[derive(Serialize)]
pub struct PledgeListItem {
    pub id: i64,
    pub pledge_no: String,
    pub customer_name: String,
    pub customer_code: String,
    pub loan_amount: f64,
    pub created_at: String,
    pub due_date: String,
    pub days_remaining: i64,
    pub status: String,
}

#[derive(Serialize)]
pub struct PledgeListResponse {
    pub summary: PledgeSummary,
    pub pledges: Vec<PledgeListItem>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct CreatePledgeRequest {
    pub customer_id: i64,
    pub scheme_name: String,
    pub loan_type: String,
    pub interest_rate: f64,
    pub duration_months: i32,
    pub price_per_gram: f64,
    pub loan_amount: f64,
    pub created_by: i64,
    pub payment_method: String,
    pub transaction_ref: Option<String>,
    pub denominations: Option<std::collections::HashMap<i32, i32>>,
    pub processing_fee_amount: f64,
    pub first_interest_amount: f64,
    pub items: Vec<PledgeItemRequest>,
}

#[derive(Serialize)]
pub struct SinglePledgeResponse {
    pub pledge: PledgeDetails,
    pub items: Vec<PledgeItemDetails>,
    pub payments: Vec<PaymentHistoryItem>,
    pub months_elapsed: i32,
    pub interest_accrued: f64,
    pub interest_received: f64,
    pub interest_pending: f64,
    pub original_principal: f64,
}

#[derive(Serialize)]
pub struct PledgeDetails {
    pub pledge_no: String,
    pub status: String,
    pub created_at: String,
    pub duration_months: i32,
    // Customer
    pub customer_id: String,
    pub customer_name: String,
    pub relation: String,
    pub phone: String,
    pub address: String,
    pub photo_path: Option<String>,
    // Loan
    pub loan_type: String,
    pub scheme_name: String,
    pub interest_rate: f64,
    pub price_per_gram: f64,
    pub principal_amount: f64,
    pub total_gross_weight: f64,
    pub total_net_weight: f64,
    pub total_value: f64,

    pub is_bank_mapped:bool,
}

#[derive(Serialize)]
pub struct PledgeItemDetails {
    pub jewellery_type: String,
    pub purity: String,
    pub gross_weight: f64,
    pub net_weight: f64,
    pub value: f64,
}

#[derive(Serialize)]
pub struct PaymentHistoryItem {
    pub date: String,
    pub payment_type: String,
    pub mode: String,
    pub receipt_no: String,
    pub amount: f64,
    pub status: String,
}

#[derive(Deserialize)]
pub struct AddPaymentRequest {
    pub pledge_id: i64,
    pub payment_type: String, 
    pub payment_mode: String, 
    pub amount: f64,
    pub created_by: i64,
    pub reference: Option<String>,
    pub denominations: Option<std::collections::HashMap<i32, i32>>,
}

pub fn create_pledge(
    db: &Db,
    app_handle: &tauri::AppHandle,
    req: CreatePledgeRequest,
) -> Result<String, String> {
    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // ===============================
    // 1️⃣ Generate Pledge Number
    // ===============================
    let year = Local::now().format("%Y").to_string();
    let pattern = format!("PLG-{}-%", year);

    let last_number: Result<String> = tx.query_row(
        "SELECT pledge_no FROM pledges 
         WHERE pledge_no LIKE ?1
         ORDER BY id DESC LIMIT 1",
        params![pattern],
        |row| row.get(0),
    );

    let next_sequence = match last_number {
        Ok(last) => {
            last.split('-')
                .last()
                .and_then(|n| n.parse::<i64>().ok())
                .unwrap_or(0)
                + 1
        }
        Err(_) => 1,
    };

    let pledge_no = format!("PLG-{}-{:05}", year, next_sequence);

    // ===============================
    // 2️⃣ Calculate Totals
    // ===============================
    let total_gross: f64 = req.items.iter().map(|i| i.gross_weight).sum();
    let total_net: f64 = req.items.iter().map(|i| i.net_weight).sum();
    let total_value: f64 = req.items.iter().map(|i| i.item_value).sum();

    // ===============================
    // 3️⃣ CASH VALIDATION
    // ===============================
    if req.payment_method == "CASH" {
        let balance: f64 = tx
            .query_row(
                "SELECT COALESCE(SUM(
                CASE WHEN type='ADD' THEN total_amount
                     WHEN type='WITHDRAW' THEN -total_amount
                END
            ),0) FROM fund_transactions",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        if balance < req.loan_amount {
            return Err(format!("Insufficient fund balance. Available ₹{}", balance));
        }

        if let Some(ref denoms) = req.denominations {
            for (note, qty) in denoms {
                let stock: i32 = tx
                    .query_row(
                        "SELECT COALESCE(SUM(
                        CASE WHEN ft.type='ADD' THEN fd.quantity
                             WHEN ft.type='WITHDRAW' THEN -fd.quantity
                        END
                    ),0)
                    FROM fund_denominations fd
                    JOIN fund_transactions ft 
                    ON fd.fund_transaction_id = ft.id
                    WHERE fd.denomination = ?1",
                        params![note],
                        |row| row.get(0),
                    )
                    .unwrap_or(0);

                if stock < *qty {
                    return Err(format!("Not enough ₹{} notes. Available: {}", note, stock));
                }
            }
        }
    }

    // ===============================
    // 4️⃣ Insert Pledge
    // ===============================
    tx.execute(
        "INSERT INTO pledges (
            pledge_no, customer_id, scheme_name, loan_type, interest_rate,
            loan_duration_months, price_per_gram,
            total_gross_weight, total_net_weight,
            total_estimated_value, loan_amount, created_by
        ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
        params![
            pledge_no,
            req.customer_id,
            req.scheme_name,
            req.loan_type,
            req.interest_rate,
            req.duration_months,
            req.price_per_gram,
            total_gross,
            total_net,
            total_value,
            req.loan_amount,
            req.created_by
        ],
    )
    .map_err(|e| e.to_string())?;

    let pledge_id = tx.last_insert_rowid();

    // ===============================
    // 5️⃣ DISBURSEMENT ENTRY (CASH or DIGITAL)
    // ===============================
    if req.payment_method == "CASH" {
        tx.execute(
            "INSERT INTO fund_transactions
            (type,total_amount,module_type,module_id,reference,payment_method,created_by)
            VALUES ('WITHDRAW',?1,'PLEDGE',?2,?3,'CASH',?4)",
            params![
                req.loan_amount,
                pledge_id,
                format!("Pledge Disbursement {}", pledge_no),
                req.created_by
            ],
        )
        .map_err(|e| e.to_string())?;

        let fund_tx_id = tx.last_insert_rowid();

        if let Some(ref denoms) = req.denominations {
            for (note, qty) in denoms {
                tx.execute(
                    "INSERT INTO fund_denominations
                    (fund_transaction_id,denomination,quantity,amount)
                    VALUES (?1,?2,?3,?4)",
                    params![fund_tx_id, note, qty, (*note as f64) * (*qty as f64)],
                )
                .map_err(|e| e.to_string())?;
            }
        }
    } else {
        // UPI / BANK disbursement
        tx.execute(
            "INSERT INTO fund_transactions
            (type,total_amount,module_type,module_id,reference,payment_method,created_by)
            VALUES ('WITHDRAW',?1,'PLEDGE',?2,?3,?4,?5)",
            params![
                req.loan_amount,
                pledge_id,
                format!("Pledge Disbursement {}", pledge_no),
                req.payment_method,
                req.created_by
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // ===============================
    // 6️⃣ Processing Fee (Income)
    // ===============================
    if req.processing_fee_amount > 0.0 {
        tx.execute(
            "INSERT INTO fund_transactions
            (type,total_amount,module_type,module_id,reference,payment_method,created_by)
            VALUES ('ADD',?1,'FEE',?2,?3,?4,?5)",
            params![
                req.processing_fee_amount,
                pledge_id,
                format!("Processing Fee {}", pledge_no),
                req.payment_method,
                req.created_by
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // ===============================
    // 7️⃣ First Interest Record
    // ===============================
    if req.first_interest_amount > 0.0 {
        let receipt_no = format!("INIT-{}-{}", Local::now().format("%Y"), pledge_no);

        tx.execute(
            "INSERT INTO pledge_payments
            (pledge_id,payment_type,payment_mode,receipt_no,amount,created_by)
            VALUES (?1,'INTEREST',?2,?3,?4,?5)",
            params![
                pledge_id,
                req.payment_method,
                req.transaction_ref.clone().unwrap_or(receipt_no),
                req.first_interest_amount,
                req.created_by
            ],
        )
        .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO fund_transactions
            (type,total_amount,module_type,module_id,reference,payment_method,created_by)
            VALUES ('ADD',?1,'INTEREST',?2,?3,?4,?5)",
            params![
                req.first_interest_amount,
                pledge_id,
                format!("First Interest {}", pledge_no),
                req.payment_method,
                req.created_by
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // ===============================
    // 8️⃣ Insert Items + Images
    // ===============================
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let images_dir = app_data_dir.join("pledge_images");
    if !images_dir.exists() {
        fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;
    }

    for (index, item) in req.items.iter().enumerate() {
        let mut image_path_db: Option<String> = None;

        if let Some(base64_str) = &item.image_base64 {
            let b64 = base64_str
                .replace("data:image/jpeg;base64,", "")
                .replace("data:image/png;base64,", "");

            if let Ok(decoded) = general_purpose::STANDARD.decode(b64) {
                let filename = format!("{}_{}_{}.jpg", pledge_no, pledge_id, index);
                let target_path = images_dir.join(&filename);

                if fs::write(&target_path, decoded).is_ok() {
                    image_path_db = Some(target_path.to_string_lossy().to_string());
                }
            }
        }

        tx.execute(
            "INSERT INTO pledge_items
            (pledge_id,jewellery_type_id,purity,gross_weight,net_weight,item_value,image_path)
            VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![
                pledge_id,
                item.jewellery_type_id,
                item.purity,
                item.gross_weight,
                item.net_weight,
                item.item_value,
                image_path_db
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(pledge_no)
}

pub fn get_all_pledges(db: &Db, search: Option<String>) -> Result<PledgeListResponse, String> {
    let conn = db.0.lock().unwrap();

    let mut query = "
        SELECT 
            p.id,
            p.pledge_no,
            c.name,
            c.customer_code,
            p.loan_amount,
            p.created_at,
            p.loan_duration_months,
            p.status
        FROM pledges p
        JOIN customers c ON p.customer_id = c.id
        WHERE 1=1
    "
    .to_string();

    let mut params_vec: Vec<String> = vec![];

    if let Some(search_term) = search {
        query.push_str(
            " AND (
                p.pledge_no LIKE ?1 OR
                c.name LIKE ?1 OR
                c.customer_code LIKE ?1
            )",
        );

        params_vec.push(format!("%{}%", search_term));
    }

    query.push_str(" ORDER BY p.created_at DESC");

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params_from_iter(params_vec.iter()), |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, f64>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, i32>(6)?,
                row.get::<_, String>(7)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let today = Local::now().naive_local().date();

    let mut pledges = vec![];
    let mut total_amount = 0.0;
    let mut active_count = 0;
    let mut overdue_count = 0;

    for pledge in rows {
        let (
            id,
            pledge_no,
            customer_name,
            customer_code,
            loan_amount,
            created_at,
            duration,
            db_status,
        ) = pledge.map_err(|e| e.to_string())?;

        let created_date =
            NaiveDate::parse_from_str(&created_at[..10], "%Y-%m-%d").unwrap_or(today);

        let due_date = created_date
            .checked_add_months(chrono::Months::new(duration as u32))
            .unwrap_or(created_date);

        let days_remaining = (due_date - today).num_days();

        let status = if db_status == "CLOSED" {
            "CLOSED"
        } else if days_remaining < 0 {
            overdue_count += 1;
            "OVERDUE"
        } else if days_remaining <= 30 {
            active_count += 1;
            "DUE_SOON"
        } else {
            active_count += 1;
            "ACTIVE"
        };

        if db_status != "CLOSED" {
            total_amount += loan_amount;
        }

        pledges.push(PledgeListItem {
            id,
            pledge_no,
            customer_name,
            customer_code,
            loan_amount,
            created_at,
            due_date: due_date.to_string(),
            days_remaining,
            status: status.to_string(),
        });
    }

    let summary = PledgeSummary {
        total_pledges: pledges.len() as i64,
        total_amount,
        active_count,
        overdue_count,
    };

    Ok(PledgeListResponse { summary, pledges })
}

pub fn get_single_pledge(db: &Db, pledge_id: i64) -> Result<SinglePledgeResponse, String> {
    let (pledge, items, payments) = {
        let conn = db.0.lock().unwrap();

        let pledge = conn
            .query_row(
                "
            SELECT 
                p.pledge_no,
                p.status,
                p.created_at,
                p.loan_duration_months,
                c.customer_code,
                c.name,
                c.relation,
                c.phone,
                c.address,
                c.photo_path,
                p.loan_type,
                p.scheme_name,
                p.interest_rate,
                p.price_per_gram,
                p.loan_amount,
                p.total_gross_weight,
                p.total_net_weight,
                p.total_estimated_value,
                CASE WHEN EXISTS (
            SELECT 1 FROM bank_mappings 
            WHERE pledge_id = p.id AND status = 'ACTIVE'
        ) THEN 1 ELSE 0 END as is_bank_mapped
            FROM pledges p
            JOIN customers c ON p.customer_id = c.id
            WHERE p.id = ?1
            ",
                params![pledge_id],
                |row| {
                    Ok(PledgeDetails {
                        pledge_no: row.get(0)?,
                        status: row.get(1)?,
                        created_at: row.get(2)?,
                        duration_months: row.get(3)?,
                        customer_id: row.get(4)?,
                        customer_name: row.get(5)?,
                        relation: row.get(6)?,
                        phone: row.get(7)?,
                        address: row.get(8)?,
                        photo_path: row.get(9)?,
                        loan_type: row.get(10)?,
                        scheme_name: row.get(11)?,
                        interest_rate: row.get(12)?,
                        price_per_gram: row.get(13)?,
                        principal_amount: row.get(14)?,
                        total_gross_weight: row.get(15)?,
                        total_net_weight: row.get(16)?,
                        total_value: row.get(17)?,
                        is_bank_mapped: row.get::<_, i64>(18)? == 1,
                    })
                },
            )
            .map_err(|e| e.to_string())?;

            let mut stmt = conn
            .prepare(
                "
                SELECT 
                    jt.name,
                    pi.purity,
                    pi.gross_weight,
                    pi.net_weight,
                    pi.item_value
                FROM pledge_items pi
                JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
                WHERE pi.pledge_id = ?1
                ",
            )
            .map_err(|e| e.to_string())?;

        let items_iter = stmt
            .query_map(params![pledge_id], |row| {
                Ok(PledgeItemDetails {
                    jewellery_type: row.get(0)?,
                    purity: row.get(1)?,
                    gross_weight: row.get(2)?,
                    net_weight: row.get(3)?,
                    value: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut items = vec![];
        for item in items_iter {
            items.push(item.map_err(|e| e.to_string())?);
        }

        let mut stmt = conn
            .prepare(
                "SELECT paid_at, payment_type, payment_mode, receipt_no, amount, status
             FROM pledge_payments
             WHERE pledge_id = ?1
             ORDER BY paid_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let payments_iter = stmt
            .query_map(params![pledge_id], |row| {
                Ok(PaymentHistoryItem {
                    date: row.get(0)?,
                    payment_type: row.get(1)?,
                    mode: row.get(2)?,
                    receipt_no: row.get(3)?,
                    amount: row.get(4)?,
                    status: row.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut payments = vec![];
        for payment in payments_iter {
            payments.push(payment.map_err(|e| e.to_string())?);
        }

        (pledge, items, payments)
    };

    let settings = crate::settings::service::get_system_settings(db)?;

    let interest_paid: f64 = payments
        .iter()
        .filter(|p| p.payment_type == "INTEREST" && p.status == "COMPLETED")
        .map(|p| p.amount)
        .sum();

    let breakdown = crate::interest::engine::calculate_interest(&pledge, &settings, interest_paid);

    let principal_paid: f64 = payments
        .iter()
        .filter(|p| p.payment_type == "PRINCIPAL" && p.status == "COMPLETED")
        .map(|p| p.amount)
        .sum();

    let original_principal = pledge.principal_amount + principal_paid;

    Ok(SinglePledgeResponse {
        pledge,
        items,
        payments,
        months_elapsed: breakdown.months_elapsed,
        interest_accrued: breakdown.total_interest,
        interest_received: breakdown.interest_paid,
        interest_pending: breakdown.interest_pending,
        original_principal,
    })
}

pub fn calculate_payment(db: &Db, pledge_id: i64) -> Result<serde_json::Value, String> {
    let pledge_data = get_single_pledge(db, pledge_id)?;

    let settings = crate::settings::service::get_system_settings(db)?;

    let interest_paid: f64 = pledge_data
        .payments
        .iter()
        .filter(|p| p.payment_type == "INTEREST" && p.status == "COMPLETED")
        .map(|p| p.amount)
        .sum();

    let breakdown =
        crate::interest::engine::calculate_interest(&pledge_data.pledge, &settings, interest_paid);

    Ok(serde_json::json!({
        "months_elapsed": breakdown.months_elapsed,
        "total_interest": breakdown.total_interest,
        "interest_paid": breakdown.interest_paid,
        "interest_pending": breakdown.interest_pending,
        "total_payable": pledge_data.pledge.principal_amount + breakdown.interest_pending
    }))
}

pub fn add_pledge_payment(db: &Db, req: AddPaymentRequest) -> Result<(), String> {
    println!(
        "🚀 [RUST] Processing payment for pledge_id: {}",
        req.pledge_id
    );

    let pledge_data = get_single_pledge(db, req.pledge_id)?;
    let settings = crate::settings::service::get_system_settings(db)?;

    // ── NEW: Block closure if pledge is bank-mapped ──────────────────────────
    if req.payment_type == "CLOSURE" {
        let conn_check = db.0.lock().unwrap();
        let is_bank_mapped: bool = conn_check
            .query_row(
                "SELECT COUNT(*) FROM bank_mappings WHERE pledge_id = ?1 AND status = 'ACTIVE'",
                params![req.pledge_id],
                |row| row.get::<_, i64>(0),
            )
            .unwrap_or(0) > 0;
        drop(conn_check); // release lock before continuing

        if is_bank_mapped {
            return Err(
                "This pledge is bank-mapped. Please use Bank Unmapping to close this pledge.".to_string()
            );
        }
    }


    let interest_paid: f64 = pledge_data
        .payments
        .iter()
        .filter(|p| p.payment_type == "INTEREST" && p.status == "COMPLETED")
        .map(|p| p.amount)
        .sum();

    let breakdown =
        crate::interest::engine::calculate_interest(&pledge_data.pledge, &settings, interest_paid);

    let interest_pending = breakdown.interest_pending;
    let total_payable = pledge_data.pledge.principal_amount + interest_pending;

    let mut interest_portion = 0.0;
    let mut principal_portion = 0.0;

    if req.payment_type == "INTEREST" {
        if req.amount > interest_pending {
            return Err(format!(
                "Interest overpayment. Pending: ₹{}",
                interest_pending
            ));
        }
        interest_portion = req.amount;
    } else {
        if req.amount >= interest_pending {
            interest_portion = interest_pending;
            principal_portion = req.amount - interest_pending;
        } else {
            interest_portion = req.amount;
            principal_portion = 0.0;
        }
    }

    if req.payment_type == "CLOSURE" && req.amount > total_payable {
        return Err(format!(
            "Overpayment not allowed. Total payable: ₹{}",
            total_payable
        ));
    }

    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let year = chrono::Local::now().format("%Y").to_string();
    let receipt_base = format!("RCP-{}", year);

    if req.payment_mode == "CASH" {
        let is_closure = req.payment_type == "CLOSURE" || (total_payable - req.amount) <= 0.0;

        let module_type = if is_closure { "CLOSURE" } else { "PAYMENT" };
        let reference_text = if is_closure {
            format!("Pledge Closure {}", pledge_data.pledge.pledge_no)
        } else {
            format!("Payment for Pledge {}", pledge_data.pledge.pledge_no)
        };

        tx.execute(
            "INSERT INTO fund_transactions 
             (type, total_amount, module_type, module_id, reference, payment_method, created_by)
             VALUES ('ADD', ?1, ?2, ?3, ?4, 'CASH', ?5)",
            params![
                req.amount,
                module_type,
                req.pledge_id,
                reference_text,
                req.created_by
            ],
        )
        .map_err(|e| e.to_string())?;

        let fund_tx_id = tx.last_insert_rowid();

        if let Some(ref denoms) = req.denominations {
            for (note, qty) in denoms {
                tx.execute(
                    "INSERT INTO fund_denominations
                     (fund_transaction_id, denomination, quantity, amount)
                     VALUES (?1, ?2, ?3, ?4)",
                    params![fund_tx_id, note, qty, (*note as f64) * (*qty as f64)],
                )
                .map_err(|e| e.to_string())?;
            }
        }
    }

    if interest_portion > 0.0 {
        let receipt_no = format!(
            "{}-{}-INT",
            receipt_base,
            chrono::Local::now().timestamp_subsec_millis()
        );
        tx.execute(
            "INSERT INTO pledge_payments (pledge_id, payment_type, payment_mode, receipt_no, amount, created_by)
             VALUES (?1, 'INTEREST', ?2, ?3, ?4, ?5)",
            params![req.pledge_id, req.payment_mode, req.reference.clone().unwrap_or(receipt_no), interest_portion, req.created_by],
        )
        .map_err(|e| e.to_string())?;
    }

    if principal_portion > 0.0 {
        let receipt_no = format!(
            "{}-{}-PRN",
            receipt_base,
            chrono::Local::now().timestamp_subsec_millis()
        );
        tx.execute(
            "INSERT INTO pledge_payments (pledge_id, payment_type, payment_mode, receipt_no, amount, created_by)
             VALUES (?1, 'PRINCIPAL', ?2, ?3, ?4, ?5)",
            params![req.pledge_id, req.payment_mode, req.reference.clone().unwrap_or(receipt_no), principal_portion, req.created_by],
        )
        .map_err(|e| e.to_string())?;

        tx.execute(
            "UPDATE pledges SET loan_amount = loan_amount - ?1 WHERE id = ?2",
            params![principal_portion, req.pledge_id],
        )
        .map_err(|e| e.to_string())?;
    }

    if req.payment_type == "CLOSURE" || (total_payable - req.amount) <= 0.0 {
        tx.execute(
            "UPDATE pledges SET status = 'CLOSED' WHERE id = ?1",
            params![req.pledge_id],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    println!("✅ [RUST] Payment split & processed successfully!");
    Ok(())
}