// use crate::db::connection::Db;
// use rusqlite::{Result, params_from_iter};
// use serde::Serialize;

// #[derive(Serialize)]
// pub struct FundLedgerRow {

//     pub id: i64,
//     pub date: String,
//     pub module_type: String,
//     pub tx_type: String,

//     pub reference: String,
//     pub description: String,
//     pub payment_method: String,

//     pub debit: f64,
//     pub credit: f64,
//     pub balance: f64,
// }

// #[derive(Serialize)]
// pub struct FundLedgerReport {

//     pub rows: Vec<FundLedgerRow>,

//     pub total_in: f64,
//     pub total_out: f64,
//     pub closing_balance: f64,

//     pub cash_in: f64,
//     pub cash_out: f64,

//     pub upi_in: f64,
//     pub upi_out: f64,

//     pub bank_in: f64,
//     pub bank_out: f64,
// }

// pub fn get_fund_ledger_report(
//     db:&Db,
//     year:Option<i32>,
//     month:Option<i32>,
//     week:Option<i32>,
//     module_filter:Option<String>
// ) -> Result<FundLedgerReport>{

//     let conn = db.0.lock().unwrap();

//     let mut query = "
//         SELECT
//             id,
//             type,
//             module_type,
//             total_amount,
//             COALESCE(reference,''),
//             COALESCE(description,''),
//             COALESCE(payment_method,'CASH'),
//             created_at
//         FROM fund_transactions
//         WHERE 1=1
//     ".to_string();


//     if year.is_some() {
//         query.push_str(" AND strftime('%Y', created_at) = ?");
//     }

//     if month.is_some() {
//         query.push_str(" AND strftime('%m', created_at) = ?");
//     }

//     if week.is_some() {
//         query.push_str(" AND strftime('%W', created_at) = ?");
//     }

//     if let Some(module) = &module_filter {

//         if module != "ALL" {
//             query.push_str(" AND module_type = ?");
//         }

//     }

//     query.push_str(" ORDER BY created_at ASC");


//     let mut stmt = conn.prepare(&query)?;

//     let mut params_vec: Vec<String> = Vec::new();

//     if let Some(y) = year {
//         params_vec.push(format!("{:04}", y));
//     }

//     if let Some(m) = month {
//         params_vec.push(format!("{:02}", m));
//     }

//     if let Some(w) = week {
//         params_vec.push(format!("{:02}", w));
//     }

//     if let Some(module) = module_filter {

//         if module != "ALL" {
//             params_vec.push(module);
//         }

//     }

//     let mut rows_iter = stmt.query(params_from_iter(params_vec.iter()))?;


//     let mut rows = Vec::new();

//     let mut balance = 0.0;

//     let mut total_in = 0.0;
//     let mut total_out = 0.0;

//     let mut cash_in = 0.0;
//     let mut cash_out = 0.0;

//     let mut upi_in = 0.0;
//     let mut upi_out = 0.0;

//     let mut bank_in = 0.0;
//     let mut bank_out = 0.0;


//     while let Some(row) = rows_iter.next()? {

//         let tx_type:String = row.get(1)?;
//         let amount:f64 = row.get(3)?;
//         let payment:String = row.get(6)?;

//         let debit;
//         let credit;


//         if tx_type=="WITHDRAW"{

//             debit = amount;
//             credit = 0.0;

//             balance -= amount;
//             total_out += amount;

//             match payment.as_str() {

//                 "CASH" => cash_out += amount,
//                 "UPI" => upi_out += amount,
//                 "BANK" => bank_out += amount,
//                 _ => {}

//             }

//         } else {

//             debit = 0.0;
//             credit = amount;

//             balance += amount;
//             total_in += amount;

//             match payment.as_str() {

//                 "CASH" => cash_in += amount,
//                 "UPI" => upi_in += amount,
//                 "BANK" => bank_in += amount,
//                 _ => {}

//             }

//         }


//         rows.push(

//             FundLedgerRow {

//                 id:row.get(0)?,
//                 date:row.get(7)?,
//                 module_type:row.get(2)?,
//                 tx_type,

//                 reference:row.get(4)?,
//                 description:row.get(5)?,
//                 payment_method:payment,

//                 debit,
//                 credit,
//                 balance

//             }

//         );

//     }


//     Ok(

//         FundLedgerReport {

//             rows,

//             total_in,
//             total_out,
//             closing_balance:balance,

//             cash_in,
//             cash_out,

//             upi_in,
//             upi_out,

//             bank_in,
//             bank_out

//         }

//     )

// }

// #[tauri::command]
// pub fn get_fund_ledger_report_cmd(
//     db:tauri::State<Db>,
//     year:Option<i32>,
//     month:Option<i32>,
//     week:Option<i32>,
//     module_filter:Option<String>
// )->Result<FundLedgerReport,String>{

//     get_fund_ledger_report(
//         db.inner(),
//         year,
//         month,
//         week,
//         module_filter
//     )
//     .map_err(|e|e.to_string())

// }








// src-tauri/src/reports/fund_ledger_report.rs

use crate::db::connection::Db;
use rusqlite::{params, params_from_iter, OptionalExtension, Result};
use serde::Serialize;

#[derive(Serialize)]
pub struct FundLedgerRow {
    pub id: i64,
    pub date: String,
    pub module_type: String,
    pub tx_type: String,
    pub reference: String,
    pub description: String,
    pub payment_method: String,
    pub debit: f64,
    pub credit: f64,
    pub balance: f64,
}

#[derive(Serialize)]
pub struct FundLedgerReport {
    pub rows: Vec<FundLedgerRow>,
    pub total_in: f64,
    pub total_out: f64,
    pub closing_balance: f64,
    pub cash_in: f64,
    pub cash_out: f64,
    pub upi_in: f64,
    pub upi_out: f64,
    pub bank_in: f64,
    pub bank_out: f64,
}

pub fn get_fund_ledger_report(
    db: &Db,
    year: Option<i32>,
    month: Option<i32>,
    week: Option<i32>,
    module_filter: Option<String>
) -> Result<FundLedgerReport> {
    let conn = db.0.lock().unwrap();

    let mut query = "
        SELECT
            id,
            type,
            module_type,
            total_amount,
            COALESCE(reference,''),
            COALESCE(description,''),
            COALESCE(payment_method,'CASH'),
            created_at
        FROM fund_transactions
        WHERE 1=1
    ".to_string();

    if year.is_some() {
        query.push_str(" AND strftime('%Y', created_at) = ?");
    }

    if month.is_some() {
        query.push_str(" AND strftime('%m', created_at) = ?");
    }

    if week.is_some() {
        query.push_str(" AND strftime('%W', created_at) = ?");
    }

    if let Some(module) = &module_filter {
        if module != "ALL" {
            query.push_str(" AND module_type = ?");
        }
    }

    query.push_str(" ORDER BY created_at ASC");

    let mut params_vec: Vec<String> = Vec::new();

    if let Some(y) = year {
        params_vec.push(format!("{:04}", y));
    }

    if let Some(m) = month {
        params_vec.push(format!("{:02}", m));
    }

    if let Some(w) = week {
        params_vec.push(format!("{:02}", w));
    }

    if let Some(ref module) = module_filter {
        if module != "ALL" {
            params_vec.push(module.clone());
        }
    }

    /* -------------------------------------------------------------------------
       ✅ NEW: ACCURATE RUNNING BALANCE (OPENING BALANCE) CALCULATION
    --------------------------------------------------------------------------*/
    // 1. Get the earliest transaction date matching current filters
    let mut min_date_query = "
        SELECT MIN(created_at)
        FROM fund_transactions
        WHERE 1=1
    ".to_string();

    if year.is_some() {
        min_date_query.push_str(" AND strftime('%Y', created_at) = ?");
    }
    if month.is_some() {
        min_date_query.push_str(" AND strftime('%m', created_at) = ?");
    }
    if week.is_some() {
        min_date_query.push_str(" AND strftime('%W', created_at) = ?");
    }
    if let Some(ref module) = module_filter {
        if module != "ALL" {
            min_date_query.push_str(" AND module_type = ?");
        }
    }

    let mut min_stmt = conn.prepare(&min_date_query)?;
    let min_date_opt: Option<String> = min_stmt
        .query_row(params_from_iter(params_vec.iter()), |row| row.get(0))
        .optional()?
        .flatten();

    let mut balance = 0.0;

    // 2. Query cumulative sum of all transactions prior to the earliest matched date
    if let Some(ref min_date) = min_date_opt {
        balance = conn.query_row(
            "
            SELECT COALESCE(SUM(
                CASE 
                    WHEN type='ADD' THEN total_amount
                    WHEN type='WITHDRAW' THEN -total_amount
                    ELSE 0
                END
            ), 0.0)
            FROM fund_transactions
            WHERE created_at < ?1
            ",
            params![min_date],
            |row| row.get(0),
        ).unwrap_or(0.0);
    }

    // 3. Query the transactional rows for the filtered period
    let mut stmt = conn.prepare(&query)?;
    let mut rows_iter = stmt.query(params_from_iter(params_vec.iter()))?;

    let mut rows = Vec::new();

    let mut total_in = 0.0;
    let mut total_out = 0.0;

    let mut cash_in = 0.0;
    let mut cash_out = 0.0;

    let mut upi_in = 0.0;
    let mut upi_out = 0.0;

    let mut bank_in = 0.0;
    let mut bank_out = 0.0;

    while let Some(row) = rows_iter.next()? {
        let tx_type: String = row.get(1)?;
        let amount: f64 = row.get(3)?;
        let payment: String = row.get(6)?;

        let debit;
        let credit;

        let payment_upper = payment.to_uppercase();

        if tx_type == "WITHDRAW" {
            debit = amount;
            credit = 0.0;

            balance -= amount;
            total_out += amount;

            match payment_upper.as_str() {
                "CASH" => cash_out += amount,
                "UPI" => upi_out += amount,
                "BANK" => bank_out += amount,
                _ => {}
            }
        } else {
            debit = 0.0;
            credit = amount;

            balance += amount;
            total_in += amount;

            match payment_upper.as_str() {
                "CASH" => cash_in += amount,
                "UPI" => upi_in += amount,
                "BANK" => bank_in += amount,
                _ => {}
            }
        }

        rows.push(FundLedgerRow {
            id: row.get(0)?,
            date: row.get(7)?,
            module_type: row.get(2)?,
            tx_type,
            reference: row.get(4)?,
            description: row.get(5)?,
            payment_method: payment,
            debit,
            credit,
            balance, // ← Automatically reflects opening balance + current offsets
        });
    }

    Ok(FundLedgerReport {
        rows,
        total_in,
        total_out,
        closing_balance: balance,
        cash_in,
        cash_out,
        upi_in,
        upi_out,
        bank_in,
        bank_out,
    })
}

#[tauri::command]
pub fn get_fund_ledger_report_cmd(
    db: tauri::State<Db>,
    year: Option<i32>,
    month: Option<i32>,
    week: Option<i32>,
    module_filter: Option<String>
) -> Result<FundLedgerReport, String> {
    get_fund_ledger_report(
        db.inner(),
        year,
        month,
        week,
        module_filter
    )
    .map_err(|e| e.to_string())
}