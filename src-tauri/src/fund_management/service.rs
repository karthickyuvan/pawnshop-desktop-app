// use crate::db::connection::Db;
// use rusqlite::{params, Error, Result, Row};


// /// ===============================
// /// Drawer total
// /// ===============================
// pub fn get_available_cash(db: &Db) -> Result<f64> {
//     let conn = db.0.lock().unwrap();
//     conn.query_row(
//         "
//         SELECT
//             COALESCE(SUM(CASE WHEN type='ADD' THEN total_amount ELSE 0 END), 0)
//           - COALESCE(SUM(CASE WHEN type='WITHDRAW' THEN total_amount ELSE 0 END), 0)
//         FROM fund_transactions
//         ",
//         [],
//         |row: &Row| row.get(0),
//     )
// }

// /// ===============================
// /// Internal save
// /// ===============================
// fn save_fund_transaction(
//     db: &Db,
//     tx_type: &str, // "ADD" or "WITHDRAW"
//     reason: String,
//     created_by: i64,
//     payment_method: String,
//     transaction_ref: Option<String>,
//     amount: f64,
//     transaction_date: Option<String>,
//     denominations: Vec<(i32, i32)>,
// ) -> Result<(i64)> {
//     // 1️⃣ Basic Validation
//     if amount <= 0.0 {
//         return Err(Error::InvalidQuery);
//     }

//     // 2️⃣ Cash Validation
//     if payment_method == "CASH" {
//         if denominations.is_empty() {
//             return Err(Error::InvalidQuery);
//         }

//         let calc_total: f64 = denominations
//             .iter()
//             .map(|(d, q)| (*d as f64) * (*q as f64))
//             .sum();

//         if (calc_total - amount).abs() > 0.01 {
//             return Err(Error::InvalidQuery);
//         }
//     }

//     let mut conn = db.0.lock().unwrap();
//     let tx = conn.transaction()?;

//     // 3️⃣ Withdraw balance check
//     if tx_type == "WITHDRAW" {
//         let balance: f64 = tx.query_row(
//             "
//             SELECT
//                 COALESCE(SUM(CASE WHEN type='ADD' THEN total_amount ELSE 0 END), 0)
//               - COALESCE(SUM(CASE WHEN type='WITHDRAW' THEN total_amount ELSE 0 END), 0)
//             FROM fund_transactions
//             ",
//             [],
//             |row: &Row| row.get(0),
//         )?;

//         if amount > balance {
//             return Err(Error::InvalidQuery);
//         }
//     }

//     // 4️⃣ Insert Transaction (CORRECTED)
   
// let created_at = match transaction_date {
//     Some(date) => {
//         if date.trim().is_empty() {
//             chrono::Utc::now().to_rfc3339() // Standard ISO 8601
//         } else if date.contains('T') {
//             date // It's already fully qualified
//         } else {
//             // If it's a bare date "2026-06-13", join it cleanly with UTC time bounds
//             format!("{}T{}.000Z", date.trim(), chrono::Utc::now().format("%H:%M:%S"))
//         }
//     }
//     None => chrono::Utc::now().to_rfc3339(),
// };

// tx.execute(
//     "
//     INSERT INTO fund_transactions
//     (
//         type,
//         total_amount,
//         module_type,
//         module_id,
//         reference,
//         description,
//         payment_method,
//         transaction_ref,
//         created_by,
//         created_at
        
//     )
//     VALUES (?1, ?2, 'CAPITAL', NULL, ?3, ?4, ?5, ?6, ?7 , ?8)
//     ",
//     params![
//         tx_type,
//         amount,
//         transaction_ref.clone().unwrap_or("CAPITAL".to_string()),
//         reason,
//         payment_method,
//         transaction_ref,
//         created_by,
//         created_at,

//     ],
// )?;

//     let fund_tx_id = tx.last_insert_rowid();

//     // 5️⃣ Insert Denominations
//     for (denom, qty) in denominations {
//         let line_amount = denom as f64 * qty as f64;

//         tx.execute(
//             "
//             INSERT INTO fund_denominations
//             (fund_transaction_id, denomination, quantity, amount)
//             VALUES (?1, ?2, ?3, ?4)
//             ",
//             params![fund_tx_id, denom, qty, line_amount],
//         )?;
//     }
// tx.commit()?;
// Ok(fund_tx_id)
// }

// /// ===============================
// /// OWNER APIs
// /// ===============================
// pub fn add_fund(
//     db: &Db,
//     created_by: i64,
//     reason: String,
//     payment_method: String,
//     transaction_ref: Option<String>,
//     amount: f64,
//     transaction_date: Option<String>,
//     denominations: Vec<(i32, i32)>,
// ) -> Result<(i64)> {
//     save_fund_transaction(
//         db,
//         "ADD",
//         reason,
//         created_by,
//         payment_method,
//         transaction_ref,
//         amount,
//         transaction_date,
//         denominations,
//     )
// }

// pub fn withdraw_fund(
//     db: &Db,
//     created_by: i64,
//     reason: String,
//     payment_method: String,
//     transaction_ref: Option<String>,
//     amount: f64,
//     transaction_date: Option<String>,
//     denominations: Vec<(i32, i32)>,
// ) -> Result<(i64)> {
//     save_fund_transaction(
//         db,
//         "WITHDRAW",
//         reason,
//         created_by,
//         payment_method,
//         transaction_ref,
//         amount,
//         transaction_date,
//         denominations,
//     )
// }

// // pub fn get_fund_ledger(db: &Db) -> Result<Vec<(i64, String, f64, String, String, String,String)>> {
// //     let conn = db.0.lock().unwrap();

// //     let mut stmt = conn.prepare(
// //         "
// //         SELECT
// //             id,
// //             type,
// //             total_amount,
// //             COALESCE(reference, ''),
// //             COALESCE(description, ''),
// //             created_at,
// //             COALESCE(payment_method, 'CASH') -- 6th Column
// //         FROM fund_transactions
// //         ORDER BY created_at DESC
// //         ",
// //     )?;

// //     let rows = stmt.query_map([], |row: &Row| {
// //         Ok((
// //             row.get(0)?,
// //             row.get(1)?,
// //             row.get(2)?,
// //             row.get(3)?,
// //             row.get(4)?,
// //             row.get(5)?,
// //             row.get(6)?,

// //         ))
// //     })?;

// //     let mut result = Vec::new();
// //     for r in rows {
// //         result.push(r?);
// //     }

// //     Ok(result)
// // }


// pub fn get_fund_ledger(db: &Db) -> Result<Vec<(i64, String, f64, String, String, String, String)>> {
//     let conn = db.0.lock().unwrap();

//     // Enhanced to explicitly format and structure auction recovery line entries cleanly
//    let mut stmt = conn.prepare(
//     "
//     SELECT
//         id,
//         UPPER(type) as type,
//         total_amount,
//         COALESCE(reference, module_type, 'CAPITAL') as reference,
//         CASE 
//             WHEN description LIKE '%Auction%' 
//               OR reference LIKE '%Auction%'
//               OR payment_method = 'AUCTION'
//             THEN '🔨 [AUCTION RECOVERY] ' || COALESCE(description, '')
//             ELSE COALESCE(description, 'No Narration Available')
//         END as description,
//         COALESCE(created_at, datetime('now', 'localtime')) as created_at,
//         COALESCE(UPPER(payment_method), 'CASH') as payment_method
//     FROM fund_transactions
//     ORDER BY created_at DESC
//     ",
// )?;

//     let rows = stmt.query_map([], |row: &rusqlite::Row| {
//         Ok((
//             row.get(0)?,
//             row.get(1)?,
//             row.get(2)?,
//             row.get(3)?,
//             row.get(4)?,
//             row.get(5)?,
//             row.get(6)?,
//         ))
//     })?;

//     let mut result = Vec::new();
//     for r in rows {
//         result.push(r?);
//     }

//     Ok(result)
// }

// pub fn get_current_denominations(db: &Db) -> Result<Vec<(i32, i32)>, String> {
//     let conn = db.0.lock().unwrap();

//     let mut stmt = conn
//         .prepare(
//             "
//         SELECT
//             fd.denomination,
//             COALESCE(SUM(
//                 CASE
//                     WHEN ft.type = 'ADD' THEN fd.quantity
//                     WHEN ft.type = 'WITHDRAW' THEN -fd.quantity
//                 END
//             ), 0) as balance_qty
//         FROM fund_denominations fd
//         JOIN fund_transactions ft
//             ON fd.fund_transaction_id = ft.id
//         GROUP BY fd.denomination
//         ",
//         )
//         .map_err(|e| e.to_string())?;

//     let rows = stmt
//         .query_map([], |row| Ok((row.get::<_, i32>(0)?, row.get::<_, i32>(1)?)))
//         .map_err(|e| e.to_string())?;

//     let mut result = Vec::new();
//     for r in rows {
//         result.push(r.map_err(|e| e.to_string())?);
//     }

//     Ok(result)
// }



// pub fn process_denomination_exchange(
//     db: &Db,
//     created_by: i64,
//     amount: f64,
//     received_denominations: Vec<(i32, i32)>,
//     given_denominations: Vec<(i32, i32)>,
// ) -> Result<(), String> {
//     let mut conn = db.0.lock().unwrap();
//     let tx = conn.transaction().map_err(|e| e.to_string())?;

//     // 1️⃣ Verify physical note stock for the denominations being given out
//     for (note, qty) in &given_denominations {
//         if *qty <= 0 { continue; }
//         let stock: i32 = tx
//             .query_row(
//                 "SELECT COALESCE(SUM(
//                     CASE WHEN ft.type='ADD' THEN fd.quantity
//                          WHEN ft.type='WITHDRAW' THEN -fd.quantity
//                     END
//                 ),0)
//                 FROM fund_denominations fd
//                 JOIN fund_transactions ft 
//                 ON fd.fund_transaction_id = ft.id
//                 WHERE fd.denomination = ?1",
//                 params![note],
//                 |row| row.get(0),
//             )
//             .unwrap_or(0);

//         if stock < *qty {
//             return Err(format!("Not enough ₹{} notes in drawer. Available: {}", note, stock));
//         }
//     }

//     // 2️⃣ Record ADD transaction (Cash received into the drawer)
//     tx.execute(
//         "INSERT INTO fund_transactions (type, total_amount, module_type, reference, description, payment_method, created_by)
//          VALUES ('ADD', ?1, 'CAPITAL', 'DRAWER_EXCHANGE', 'Denomination Exchange (Inward)', 'CASH', ?2)",
//         params![amount, created_by],
//     ).map_err(|e| e.to_string())?;
//     let add_tx_id = tx.last_insert_rowid();

//     for (note, qty) in received_denominations {
//         if qty <= 0 { continue; }
//         tx.execute(
//             "INSERT INTO fund_denominations (fund_transaction_id, denomination, quantity, amount)
//              VALUES (?1, ?2, ?3, ?4)",
//             params![add_tx_id, note, qty, (note as f64) * (qty as f64)],
//         ).map_err(|e| e.to_string())?;
//     }

//     // 3️⃣ Record WITHDRAW transaction (Cash given out from the drawer)
//     tx.execute(
//         "INSERT INTO fund_transactions (type, total_amount, module_type, reference, description, payment_method, created_by)
//          VALUES ('WITHDRAW', ?1, 'CAPITAL', 'DRAWER_EXCHANGE', 'Denomination Exchange (Outward)', 'CASH', ?2)",
//         params![amount, created_by],
//     ).map_err(|e| e.to_string())?;
//     let withdraw_tx_id = tx.last_insert_rowid();

//     for (note, qty) in given_denominations {
//         if qty <= 0 { continue; }
//         tx.execute(
//             "INSERT INTO fund_denominations (fund_transaction_id, denomination, quantity, amount)
//              VALUES (?1, ?2, ?3, ?4)",
//             params![withdraw_tx_id, note, qty, (note as f64) * (qty as f64)],
//         ).map_err(|e| e.to_string())?;
//     }

//     tx.commit().map_err(|e| e.to_string())?;
//     Ok(())
// }















use crate::db::connection::Db;
use rusqlite::{params, Connection, Error, Result, Row};

/// ===============================
/// Drawer total
/// ===============================
pub fn get_available_cash(db: &Db) -> Result<f64> {
    let conn = db.0.lock().unwrap();
    conn.query_row(
        "
        SELECT
            COALESCE(SUM(CASE WHEN type='ADD' THEN total_amount ELSE 0 END), 0)
          - COALESCE(SUM(CASE WHEN type='WITHDRAW' THEN total_amount ELSE 0 END), 0)
        FROM fund_transactions
        ",
        [],
        |row: &Row| row.get(0),
    )
}

/// ===============================
/// Internal save
/// ===============================
fn save_fund_transaction(
    db: &Db,
    tx_type: &str, // "ADD" or "WITHDRAW"
    reference: Option<String>,
    description: Option<String>,
    created_by: i64,
    payment_method: String,
    transaction_ref: Option<String>,
    amount: f64,
    transaction_date: Option<String>,
    denominations: Vec<(i32, i32)>,
) -> Result<i64> {
    // 1️⃣ Basic Validation
    if amount <= 0.0 {
        return Err(Error::InvalidQuery);
    }

    // 2️⃣ Cash Validation
    if payment_method == "CASH" {
        if denominations.is_empty() {
            return Err(Error::InvalidQuery);
        }

        let calc_total: f64 = denominations
            .iter()
            .map(|(d, q)| (*d as f64) * (*q as f64))
            .sum();

        if (calc_total - amount).abs() > 0.01 {
            return Err(Error::InvalidQuery);
        }
    }

    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction()?;

    // 3️⃣ Withdraw balance check
    if tx_type == "WITHDRAW" {
        let balance: f64 = tx.query_row(
            "
            SELECT
                COALESCE(SUM(CASE WHEN type='ADD' THEN total_amount ELSE 0 END), 0)
              - COALESCE(SUM(CASE WHEN type='WITHDRAW' THEN total_amount ELSE 0 END), 0)
            FROM fund_transactions
            ",
            [],
            |row: &Row| row.get(0),
        )?;

        if amount > balance {
            return Err(Error::InvalidQuery);
        }
    }

    // 4️⃣ Format Date
    let created_at = match transaction_date {
        Some(date) => {
            if date.trim().is_empty() {
                chrono::Utc::now().to_rfc3339()
            } else if date.contains('T') {
                date
            } else {
                format!("{}T{}.000Z", date.trim(), chrono::Utc::now().format("%H:%M:%S"))
            }
        }
        None => chrono::Utc::now().to_rfc3339(),
    };

    // 5️⃣ Insert Transaction
    tx.execute(
        "
        INSERT INTO fund_transactions
        (
            type,
            total_amount,
            module_type,
            module_id,
            reference,
            description,
            payment_method,
            transaction_ref,
            created_by,
            created_at
        )
        VALUES (?1, ?2, 'CAPITAL', NULL, ?3, ?4, ?5, ?6, ?7, ?8)
        ",
        params![
            tx_type,
            amount,
            reference.or_else(|| transaction_ref.clone()).unwrap_or_else(|| "CAPITAL".to_string()),
            description,
            payment_method,
            transaction_ref,
            created_by,
            created_at,
        ],
    )?;

    let fund_tx_id = tx.last_insert_rowid();

    // 6️⃣ Insert Denominations
    for (denom, qty) in denominations {
        let line_amount = denom as f64 * qty as f64;

        tx.execute(
            "
            INSERT INTO fund_denominations
            (fund_transaction_id, denomination, quantity, amount)
            VALUES (?1, ?2, ?3, ?4)
            ",
            params![fund_tx_id, denom, qty, line_amount],
        )?;
    }
    tx.commit()?;
    Ok(fund_tx_id)
}

/// ===============================
/// Backward-Compatible APIs (Keeps other modules compiling)
/// ===============================
pub fn add_fund(
    db: &Db,
    created_by: i64,
    reason: String,
    payment_method: String,
    transaction_ref: Option<String>,
    amount: f64,
    transaction_date: Option<String>,
    denominations: Vec<(i32, i32)>,
) -> Result<i64> {
    save_fund_transaction(
        db,
        "ADD",
        None,
        Some(reason),
        created_by,
        payment_method,
        transaction_ref,
        amount,
        transaction_date,
        denominations,
    )
}

pub fn withdraw_fund(
    db: &Db,
    created_by: i64,
    reason: String,
    payment_method: String,
    transaction_ref: Option<String>,
    amount: f64,
    transaction_date: Option<String>,
    denominations: Vec<(i32, i32)>,
) -> Result<i64> {
    save_fund_transaction(
        db,
        "WITHDRAW",
        None,
        Some(reason),
        created_by,
        payment_method,
        transaction_ref,
        amount,
        transaction_date,
        denominations,
    )
}

/// ===============================
/// Custom Multi-field Description APIs
/// ===============================
pub fn add_fund_with_desc(
    db: &Db,
    created_by: i64,
    reference: Option<String>,
    description: Option<String>,
    payment_method: String,
    transaction_ref: Option<String>,
    amount: f64,
    transaction_date: Option<String>,
    denominations: Vec<(i32, i32)>,
) -> Result<i64> {
    save_fund_transaction(
        db,
        "ADD",
        reference,
        description,
        created_by,
        payment_method,
        transaction_ref,
        amount,
        transaction_date,
        denominations,
    )
}

pub fn withdraw_fund_with_desc(
    db: &Db,
    created_by: i64,
    reference: Option<String>,
    description: Option<String>,
    payment_method: String,
    transaction_ref: Option<String>,
    amount: f64,
    transaction_date: Option<String>,
    denominations: Vec<(i32, i32)>,
) -> Result<i64> {
    save_fund_transaction(
        db,
        "WITHDRAW",
        reference,
        description,
        created_by,
        payment_method,
        transaction_ref,
        amount,
        transaction_date,
        denominations,
    )
}

pub fn get_fund_ledger(db: &Db) -> Result<Vec<(i64, String, f64, String, String, String, String)>> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "
        SELECT
            id,
            UPPER(type) as type,
            total_amount,
            COALESCE(reference, module_type, 'CAPITAL') as reference,
            CASE 
                WHEN description LIKE '%Auction%' 
                  OR reference LIKE '%Auction%'
                  OR payment_method = 'AUCTION'
                THEN '🔨 [AUCTION RECOVERY] ' || COALESCE(description, '')
                ELSE COALESCE(description, 'No Narration Available')
            END as description,
            COALESCE(created_at, datetime('now', 'localtime')) as created_at,
            COALESCE(UPPER(payment_method), 'CASH') as payment_method
        FROM fund_transactions
        ORDER BY created_at DESC
        ",
    )?;

    let rows = stmt.query_map([], |row| {
        Ok((
            row.get(0)?,
            row.get(1)?,
            row.get(2)?,
            row.get(3)?,
            row.get(4)?,
            row.get(5)?,
            row.get(6)?,
        ))
    })?;

    let mut result = Vec::new();
    for r in rows {
        result.push(r?);
    }

    Ok(result)
}

pub fn get_current_denominations(db: &Db) -> Result<Vec<(i32, i32)>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "
        SELECT
            fd.denomination,
            COALESCE(SUM(
                CASE
                    WHEN ft.type = 'ADD' THEN fd.quantity
                    WHEN ft.type = 'WITHDRAW' THEN -fd.quantity
                END
            ), 0) as balance_qty
        FROM fund_denominations fd
        JOIN fund_transactions ft
            ON fd.fund_transaction_id = ft.id
        GROUP BY fd.denomination
        ",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| Ok((row.get::<_, i32>(0)?, row.get::<_, i32>(1)?)))
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for r in rows {
        result.push(r.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

pub fn process_denomination_exchange(
    db: &Db,
    created_by: i64,
    amount: f64,
    received_denominations: Vec<(i32, i32)>,
    given_denominations: Vec<(i32, i32)>,
) -> Result<(), String> {
    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for (note, _qty) in &given_denominations {
        tx.execute(
            "SELECT COALESCE(SUM(
                CASE WHEN ft.type='ADD' THEN fd.quantity
                     WHEN ft.type='WITHDRAW' THEN -fd.quantity
                END
            ), 0)
            FROM fund_denominations fd
            JOIN fund_transactions ft ON fd.fund_transaction_id = ft.id
            WHERE fd.denomination = ?1",
            params![note],
        ).map_err(|e| e.to_string())?;
    }

    tx.execute(
        "INSERT INTO fund_transactions (type, total_amount, module_type, reference, description, payment_method, created_by)
         VALUES ('ADD', ?1, 'CAPITAL', 'DRAWER_EXCHANGE', 'Denomination Exchange (Inward)', 'CASH', ?2)",
        params![amount, created_by],
    ).map_err(|e| e.to_string())?;
    let add_tx_id = tx.last_insert_rowid();

    for (note, qty) in received_denominations {
        if qty <= 0 { continue; }
        tx.execute(
            "INSERT INTO fund_denominations (fund_transaction_id, denomination, quantity, amount)
             VALUES (?1, ?2, ?3, ?4)",
            params![add_tx_id, note, qty, (note as f64) * (qty as f64)],
        ).map_err(|e| e.to_string())?;
    }

    tx.execute(
        "INSERT INTO fund_transactions (type, total_amount, module_type, reference, description, payment_method, created_by)
         VALUES ('WITHDRAW', ?1, 'CAPITAL', 'DRAWER_EXCHANGE', 'Denomination Exchange (Outward)', 'CASH', ?2)",
        params![amount, created_by],
    ).map_err(|e| e.to_string())?;
    let withdraw_tx_id = tx.last_insert_rowid();

    for (note, qty) in given_denominations {
        if qty <= 0 { continue; }
        tx.execute(
            "INSERT INTO fund_denominations (fund_transaction_id, denomination, quantity, amount)
             VALUES (?1, ?2, ?3, ?4)",
            params![withdraw_tx_id, note, qty, (note as f64) * (qty as f64)],
        ).map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

