// use super::password::verify_password;
// use crate::db::connection::Db;
// use rusqlite::params;

// #[derive(serde::Serialize)]
// pub struct LoginResponse {
//     pub user_id: i64,
//     pub role: String,
// }

// pub fn login_user(db: &Db, username: &str, password: &str) -> Result<LoginResponse, String> {
//     let conn = db.0.lock().unwrap();

//     let mut stmt = conn
//         .prepare(
//             "SELECT id, password_hash, role, is_active
//          FROM users
//          WHERE username = ?1",
//         )
//         .map_err(|_| "User not found")?;

//     let mut rows = stmt.query(params![username]).map_err(|_| "Query failed")?;

//     let row = match rows.next().unwrap() {
//         Some(row) => row,
//         None => return Err("Invalid username or password".into()),
//     };

//     let user_id: i64 = row.get(0).unwrap();
//     let password_hash: String = row.get(1).unwrap();
//     let role: String = row.get(2).unwrap();
//     let is_active: i64 = row.get(3).unwrap();

//     if is_active == 0 {
//         return Err("User account is disabled".into());
//     }

//     if !verify_password(&password_hash, password) {
//         return Err("Invalid username or password".into());
//     }

//     Ok(LoginResponse { user_id, role })
// }


// // version 2 

// use super::password::verify_password;
// use crate::db::connection::Db;
// use rusqlite::params;

// #[derive(serde::Serialize)]
// pub struct LoginResponse {
//     pub user_id: i64,
//     pub role: String,
// }

// // ✅ Internal login logic
// pub fn login_user(
//     db: &Db,
//     username: &str,
//     password: &str,
// ) -> Result<LoginResponse, String> {
//     let conn = db.0.lock().unwrap();

//     let mut stmt = conn
//         .prepare(
//             "SELECT id, password_hash, role, is_active
//              FROM users
//              WHERE username = ?1",
//         )
//         .map_err(|_| "User not found".to_string())?;

//     let mut rows = stmt
//         .query(params![username])
//         .map_err(|_| "Query failed".to_string())?;

//     let row = match rows.next().unwrap() {
//         Some(row) => row,
//         None => return Err("Invalid username or password".into()),
//     };

//     let user_id: i64 = row.get(0).unwrap();
//     let password_hash: String = row.get(1).unwrap();
//     let role: String = row.get(2).unwrap();
//     let is_active: i64 = row.get(3).unwrap();

//     // ✅ Check active status
//     if is_active == 0 {
//         return Err("User account is disabled".into());
//     }

//     // ✅ Verify password
//     if !verify_password(&password_hash, password) {
//         return Err("Invalid username or password".into());
//     }

//     Ok(LoginResponse { user_id, role })
// }

// // ✅ Tauri command wrapper
// // #[tauri::command]
// pub fn login(
//     db: tauri::State<Db>,
//     username: String,
//     password: String,
// ) -> Result<LoginResponse, String> {
//     login_user(&db, &username, &password)
// }


// version 3 
use super::password::verify_password;
use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct LoginResponse {
    pub user_id: i64,
    pub role: String,
}

/* ---------------- LOGIN ---------------- */

pub fn login_user(
    db: &Db,
    username: &str,
    password: &str,
) -> Result<LoginResponse, String> {

    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "
            SELECT
                id,
                password_hash,
                role,
                is_active
            FROM users
            WHERE username = ?1
            ",
        )
        .map_err(|_| "User not found".to_string())?;

    let mut rows = stmt
        .query(params![username])
        .map_err(|_| "Query failed".to_string())?;

    let row = match rows.next().unwrap() {
        Some(row) => row,
        None => return Err("Invalid username or password".into()),
    };

    let user_id: i64 = row.get(0).unwrap();
    let password_hash: String = row.get(1).unwrap();
    let role: String = row.get(2).unwrap();
    let is_active: i64 = row.get(3).unwrap();

    if is_active == 0 {
        return Err("User account is disabled".into());
    }

    if !verify_password(&password_hash, password) {
        return Err("Invalid username or password".into());
    }

    Ok(LoginResponse {
        user_id,
        role,
    })
}