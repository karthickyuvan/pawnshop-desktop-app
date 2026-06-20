use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct Bank {
    pub id: i64,
    pub bank_name: String,
    pub branch_name: String,
    pub account_number: String,
    pub ifsc_code: String,
    pub is_active: bool,
}

pub fn create_bank(
    db: &Db,
    bank_name: &str,
    branch_name: &str,
    account_number: &str,
    ifsc_code: &str,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "INSERT INTO banks (bank_name, branch_name, account_number, ifsc_code)
         VALUES (?1, ?2, ?3, ?4)",
        params![bank_name, branch_name, account_number, ifsc_code],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_banks(db: &Db) -> Result<Vec<Bank>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT id, bank_name, branch_name, account_number, ifsc_code, is_active
         FROM banks",
        )
        .unwrap();

    let rows = stmt
        .query_map([], |r| {
            Ok(Bank {
                id: r.get(0)?,
                bank_name: r.get(1)?,
                branch_name: r.get(2)?,
                account_number: r.get(3)?,
                ifsc_code: r.get(4)?,
                is_active: r.get::<_, i64>(5)? == 1,
            })
        })
        .unwrap();

    Ok(rows.map(|r| r.unwrap()).collect())
}



// use crate::db::connection::Db;
// use rusqlite::params;

// #[derive(serde::Serialize)]
// pub struct Bank {
//     pub id: i64,
//     pub bank_name: String,
//     pub branch_name: String,
//     pub account_number: String,
//     pub ifsc_code: String,
//     pub is_active: bool,
// }

// /* ---------------- CREATE ---------------- */

// fn create_bank_internal(
//     db: &Db,
//     bank_name: &str,
//     branch_name: &str,
//     account_number: &str,
//     ifsc_code: &str,
// ) -> Result<(), String> {

//     let conn = db.0.lock().unwrap();

//     conn.execute(
//         "
//         INSERT INTO banks
//         (bank_name, branch_name, account_number, ifsc_code)
//         VALUES (?1, ?2, ?3, ?4)
//         ",
//         params![
//             bank_name,
//             branch_name,
//             account_number,
//             ifsc_code
//         ],
//     )
//     .map_err(|e| e.to_string())?;

//     Ok(())
// }

// #[tauri::command]
// pub fn create_bank(
//     db: tauri::State<Db>,
//     bank_name: String,
//     branch_name: String,
//     account_number: String,
//     ifsc_code: String,
// ) -> Result<(), String> {

//     create_bank_internal(
//         &db,
//         &bank_name,
//         &branch_name,
//         &account_number,
//         &ifsc_code,
//     )
// }

// /* ---------------- GET ---------------- */

// fn get_banks_internal(
//     db: &Db,
// ) -> Result<Vec<Bank>, String> {

//     let conn = db.0.lock().unwrap();

//     let mut stmt = conn
//         .prepare(
//             "
//             SELECT
//                 id,
//                 bank_name,
//                 branch_name,
//                 account_number,
//                 ifsc_code,
//                 is_active
//             FROM banks
//             ORDER BY id DESC
//             ",
//         )
//         .map_err(|e| e.to_string())?;

//     let rows = stmt
//         .query_map([], |r| {
//             Ok(Bank {
//                 id: r.get(0)?,
//                 bank_name: r.get(1)?,
//                 branch_name: r.get(2)?,
//                 account_number: r.get(3)?,
//                 ifsc_code: r.get(4)?,
//                 is_active: r.get::<_, i64>(5)? == 1,
//             })
//         })
//         .map_err(|e| e.to_string())?;

//     let mut list = Vec::new();

//     for r in rows {
//         list.push(r.map_err(|e| e.to_string())?);
//     }

//     Ok(list)
// }

// #[tauri::command]
// pub fn get_banks(
//     db: tauri::State<Db>,
// ) -> Result<Vec<Bank>, String> {

//     get_banks_internal(&db)
// }