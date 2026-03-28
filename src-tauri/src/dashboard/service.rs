// use crate::db::connection::Db;
// use chrono::Local;
// use rusqlite::params;
// use serde::Serialize;
// use tauri::State;

// #[derive(Serialize)]
// pub struct OwnerDashboardSummary {
//     pub active_pledges: ActivePledgesCard,
//     pub total_loan_amount: f64,
//     pub total_customers: i64,
//     pub opening_balance: f64,
//     pub cash_in_hand: CashInHandCard,
//     pub todays_interest: f64,
//     pub total_expense: f64,
//     pub stock_summary: StockSummary,
//     pub todays_part_payment: PaymentCard,
//     pub todays_redeem: PaymentCard,
// }

// #[derive(Serialize)]
// pub struct ActivePledgesCard {
//     pub count: i64,
//     pub overdue_count: i64,
// }

// #[derive(Serialize)]
// pub struct CashInHandCard {
//     pub cash: f64,
//     pub bank: f64,
//     pub upi: f64,
//     pub total: f64,
// }

// #[derive(Serialize)]
// pub struct StockSummary {
//     pub gold_gross_grams: f64,
//     pub gold_net_grams: f64,
//     pub silver_gross_grams: f64,
//     pub silver_net_grams: f64,
// }

// #[derive(Serialize)]
// pub struct PaymentCard {
//     pub count: i64,
//     pub amount: f64,
// }

// #[tauri::command]
// pub fn get_owner_dashboard_summary(db: State<Db>) -> Result<OwnerDashboardSummary, String> {
//     let conn = db.0.lock().unwrap();
//     let today = Local::now().format("%Y-%m-%d").to_string();

//     // 1️⃣ Active Pledges Count
//     let active_pledges_count: i64 = conn
//         .query_row(
//             "SELECT COUNT(*) FROM pledges WHERE status = 'ACTIVE'",
//             [],
//             |row| row.get(0),
//         )
//         .unwrap_or(0);

//     // Overdue pledges (older than duration)
//     let overdue_count: i64 = conn
//         .query_row(
//             "
//             SELECT COUNT(*)
//             FROM pledges
//             WHERE status = 'ACTIVE'
//             AND DATE(created_at, '+' || loan_duration_months || ' months') < DATE('now')
//             ",
//             [],
//             |row| row.get(0),
//         )
//         .unwrap_or(0);

//     // 2️⃣ Total Loan Amount (Active pledges only)
//     let total_loan_amount: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(loan_amount), 0) FROM pledges WHERE status = 'ACTIVE'",
//             [],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     // 3️⃣ Total Customers
//     let total_customers: i64 = conn
//         .query_row("SELECT COUNT(*) FROM customers", [], |row| row.get(0))
//         .unwrap_or(0);

//     // 4️⃣ Opening Balance (all transactions before today + opening balance entries today)
//     let opening_balance: f64 = conn
//         .query_row(
//             "
//             SELECT COALESCE(SUM(
//                 CASE WHEN type='ADD' THEN total_amount
//                      WHEN type='WITHDRAW' THEN -total_amount
//                 END
//             ), 0)
//             FROM fund_transactions
//             WHERE DATE(created_at) < DATE(?1)
//                OR (DATE(created_at) = DATE(?1) 
//                    AND LOWER(COALESCE(reference, '')) = 'opening balance')
//             ",
//             params![today],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     // 5️⃣ Cash in Hand (by payment method)
//     let cash: f64 = conn
//         .query_row(
//             "
//             SELECT COALESCE(SUM(
//                 CASE WHEN type='ADD' THEN total_amount
//                      WHEN type='WITHDRAW' THEN -total_amount
//                 END
//             ), 0)
//             FROM fund_transactions
//             WHERE payment_method = 'CASH'
//             ",
//             [],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     let bank: f64 = conn
//         .query_row(
//             "
//             SELECT COALESCE(SUM(
//                 CASE WHEN type='ADD' THEN total_amount
//                      WHEN type='WITHDRAW' THEN -total_amount
//                 END
//             ), 0)
//             FROM fund_transactions
//             WHERE payment_method = 'BANK'
//             ",
//             [],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     let upi: f64 = conn
//         .query_row(
//             "
//             SELECT COALESCE(SUM(
//                 CASE WHEN type='ADD' THEN total_amount
//                      WHEN type='WITHDRAW' THEN -total_amount
//                 END
//             ), 0)
//             FROM fund_transactions
//             WHERE payment_method = 'UPI'
//             ",
//             [],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     // 6️⃣ Today's Interest
//     let todays_interest: f64 = conn
//         .query_row(
//             "
//             SELECT COALESCE(SUM(amount), 0)
//             FROM pledge_payments
//             WHERE payment_type = 'INTEREST'
//             AND status = 'COMPLETED'
//             AND DATE(paid_at) = DATE(?1)
//             ",
//             params![today],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     // 7️⃣ Total Expense (all time)
//     let total_expense: f64 = conn
//         .query_row(
//             "SELECT COALESCE(SUM(amount), 0) FROM expenses",
//             [],
//             |row| row.get(0),
//         )
//         .unwrap_or(0.0);

//     // 8️⃣ Stock Summary (Gold & Silver)

//             let mut stmt = conn
//             .prepare(
//                 "
//                 SELECT 
//                 mt.id,
//                 COALESCE(SUM(pi.gross_weight),0),
//                 COALESCE(SUM(pi.net_weight),0)
//                 FROM pledge_items pi
//                 JOIN pledges p ON pi.pledge_id = p.id
//                 JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
//                 JOIN metal_types mt ON mt.id = jt.metal_type_id
//                 WHERE p.status = 'ACTIVE'
//                 GROUP BY mt.id
//             )
//             .map_err(|e| e.to_string())?;

//         let rows = stmt
//             .query_map([], |row| {
//                 Ok((
//                     row.get::<_, i64>(0)?,
//                     row.get::<_, f64>(1)?,
//                     row.get::<_, f64>(2)?,
//                 ))
//             })
//             .map_err(|e| e.to_string())?;

//         let mut gold_gross = 0.0;
//         let mut gold_net = 0.0;
//         let mut silver_gross = 0.0;
//         let mut silver_net = 0.0;

// for row in rows {
//     let (metal_id, gross, net) = row.map_err(|e| e.to_string())?;

//     if metal_id == 1 {
//         gold_gross += gross;
//         gold_net += net;
//     } else if metal_id == 2 {
//         silver_gross += gross;
//         silver_net += net;
//     }
// }
            
//      // 9️⃣ Today's Part Payment (PRINCIPAL payments)

//     let (part_payment_count, part_payment_amount): (i64, f64) = conn
//         .query_row(
//             "
//             SELECT 
//                 COUNT(*),
//                 COALESCE(SUM(amount), 0)
//             FROM pledge_payments
//             WHERE payment_type = 'PRINCIPAL'
//             AND status = 'COMPLETED'
//             AND DATE(paid_at) = DATE(?1)
//             ",
//             params![today],
//             |row| Ok((row.get(0)?, row.get(1)?)),
//         )
//         .unwrap_or((0, 0.0));

//     // 🔟 Today's Redeem (CLOSURE payments)
//     let (redeem_count, redeem_amount): (i64, f64) = conn
//         .query_row(
//             "
//             SELECT 
//                 COUNT(*),
//                 COALESCE(SUM(amount), 0)
//             FROM pledge_payments
//             WHERE payment_type = 'CLOSURE'
//             AND status = 'COMPLETED'
//             AND DATE(paid_at) = DATE(?1)
//             ",
//             params![today],
//             |row| Ok((row.get(0)?, row.get(1)?)),
//         )
//         .unwrap_or((0, 0.0));

//     Ok(OwnerDashboardSummary {
//         active_pledges: ActivePledgesCard {
//             count: active_pledges_count,
//             overdue_count,
//         },
//         total_loan_amount,
//         total_customers,
//         opening_balance,
//         cash_in_hand: CashInHandCard {
//             cash,
//             bank,
//             upi,
//             total: cash + bank + upi,
//         },
//         todays_interest,
//         total_expense,
//         stock_summary: StockSummary {
//             gold_gross_grams: gold_gross,
//             gold_net_grams: gold_net,
//             silver_gross_grams: silver_gross,
//             silver_net_grams: silver_net,
//         },
//         todays_part_payment: PaymentCard {
//             count: part_payment_count,
//             amount: part_payment_amount,
//         },
//         todays_redeem: PaymentCard {
//             count: redeem_count,
//             amount: redeem_amount,
//         },
//     })



use crate::db::connection::Db;
use chrono::Local;
use rusqlite::params;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct OwnerDashboardSummary {
    pub active_pledges: ActivePledgesCard,
    pub total_loan_amount: f64,
    pub total_customers: i64,
    pub opening_balance: f64,
    pub cash_in_hand: CashInHandCard,
    pub todays_interest: f64,
    pub total_expense: f64,
    pub stock_summary: StockSummary,
    pub todays_part_payment: PaymentCard,
    pub todays_redeem: PaymentCard,
}

#[derive(Serialize)]
pub struct ActivePledgesCard {
    pub count: i64,
    pub overdue_count: i64,
}

#[derive(Serialize)]
pub struct CashInHandCard {
    pub cash: f64,
    pub bank: f64,
    pub upi: f64,
    pub total: f64,
}

#[derive(Serialize)]
pub struct PaymentCard {
    pub count: i64,
    pub amount: f64,
}

#[derive(Serialize)]
pub struct MetalStock {
    pub metal_name: String,
    pub gross_weight: f64,
    pub net_weight: f64,
    pub price_per_gram: f64,
    pub stock_value: f64,
}

#[derive(Serialize)]
pub struct StockSummary {
    pub metals: Vec<MetalStock>,
}

#[tauri::command]
pub fn get_owner_dashboard_summary(db: State<Db>) -> Result<OwnerDashboardSummary, String> {
    let conn = db.0.lock().unwrap();
    let today = Local::now().format("%Y-%m-%d").to_string();

    // 1️⃣ Active pledges
    let active_pledges_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pledges WHERE status='ACTIVE'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Overdue pledges
    let overdue_count: i64 = conn
        .query_row(
            r#"
            SELECT COUNT(*)
            FROM pledges
            WHERE status='ACTIVE'
            AND DATE(created_at, '+' || loan_duration_months || ' months') < DATE('now')
            "#,
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // 2️⃣ Total Loan Amount
    let total_loan_amount: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(loan_amount),0) FROM pledges WHERE status='ACTIVE'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // 3️⃣ Total Customers
    let total_customers: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM customers",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // 4️⃣ Opening Balance
    let opening_balance: f64 = conn
        .query_row(
            r#"
            SELECT COALESCE(SUM(
                CASE
                    WHEN type='ADD' THEN total_amount
                    WHEN type='WITHDRAW' THEN -total_amount
                END
            ),0)
            FROM fund_transactions
            WHERE DATE(created_at) < DATE(?1)
            OR (
                DATE(created_at)=DATE(?1)
                AND LOWER(COALESCE(reference,''))='opening balance'
            )
            "#,
            params![today],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // 5️⃣ Cash in Hand
    let cash: f64 = conn
        .query_row(
            r#"
            SELECT COALESCE(SUM(
                CASE
                    WHEN type='ADD' THEN total_amount
                    WHEN type='WITHDRAW' THEN -total_amount
                END
            ),0)
            FROM fund_transactions
            WHERE payment_method='CASH'
            "#,
            [],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let bank: f64 = conn
        .query_row(
            r#"
            SELECT COALESCE(SUM(
                CASE
                    WHEN type='ADD' THEN total_amount
                    WHEN type='WITHDRAW' THEN -total_amount
                END
            ),0)
            FROM fund_transactions
            WHERE payment_method='BANK'
            "#,
            [],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let upi: f64 = conn
        .query_row(
            r#"
            SELECT COALESCE(SUM(
                CASE
                    WHEN type='ADD' THEN total_amount
                    WHEN type='WITHDRAW' THEN -total_amount
                END
            ),0)
            FROM fund_transactions
            WHERE payment_method='UPI'
            "#,
            [],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // 6️⃣ Today's Interest
    let todays_interest: f64 = conn
        .query_row(
            r#"
            SELECT COALESCE(SUM(amount),0)
            FROM pledge_payments
            WHERE payment_type='INTEREST'
            AND status='COMPLETED'
            AND DATE(paid_at)=DATE(?1)
            "#,
            params![today],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // 7️⃣ Total Expense
    let total_expense: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount),0) FROM expenses",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // 8️⃣ Stock Summary (Dynamic Metals)
    let mut stmt = conn
    .prepare(
        r#"
        SELECT
            mt.name,
            COALESCE(SUM(pi.gross_weight),0),
            COALESCE(SUM(pi.net_weight),0),
            COALESCE(ppg.price_per_gram,0),
            COALESCE(SUM(pi.net_weight) * ppg.price_per_gram,0)
        FROM pledge_items pi
        JOIN pledges p ON pi.pledge_id = p.id
        JOIN jewellery_types jt ON jt.id = pi.jewellery_type_id
        JOIN metal_types mt ON mt.id = jt.metal_type_id
        LEFT JOIN price_per_gram ppg ON ppg.metal_type_id = mt.id
        WHERE p.status='ACTIVE'
        GROUP BY mt.id
        ORDER BY mt.name
        "#,
    )
    .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(MetalStock {
                metal_name: row.get(0)?,
    gross_weight: row.get(1)?,
    net_weight: row.get(2)?,
    price_per_gram: row.get(3)?,
    stock_value: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut metals = Vec::new();
    for r in rows {
        metals.push(r.map_err(|e| e.to_string())?);
    }

    // 9️⃣ Today's Part Payment
    let (part_payment_count, part_payment_amount): (i64, f64) = conn
        .query_row(
            r#"
            SELECT COUNT(*), COALESCE(SUM(amount),0)
            FROM pledge_payments
            WHERE payment_type='PRINCIPAL'
            AND status='COMPLETED'
            AND DATE(paid_at)=DATE(?1)
            "#,
            params![today],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap_or((0, 0.0));

    // 🔟 Today's Redeem
    let (redeem_count, redeem_amount): (i64, f64) = conn
        .query_row(
            r#"
            SELECT COUNT(*), COALESCE(SUM(amount),0)
            FROM pledge_payments
            WHERE payment_type='CLOSURE'
            AND status='COMPLETED'
            AND DATE(paid_at)=DATE(?1)
            "#,
            params![today],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap_or((0, 0.0));

    Ok(OwnerDashboardSummary {
        active_pledges: ActivePledgesCard {
            count: active_pledges_count,
            overdue_count,
        },
        total_loan_amount,
        total_customers,
        opening_balance,
        cash_in_hand: CashInHandCard {
            cash,
            bank,
            upi,
            total: cash + bank + upi,
        },
        todays_interest,
        total_expense,
        stock_summary: StockSummary { metals },
        todays_part_payment: PaymentCard {
            count: part_payment_count,
            amount: part_payment_amount,
        },
        todays_redeem: PaymentCard {
            count: redeem_count,
            amount: redeem_amount,
        },
    })
}