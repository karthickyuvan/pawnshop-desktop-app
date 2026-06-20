// use super::password::hash_password;
// use crate::db::connection::Db;
// use rusqlite::params;

// pub fn owner_exists(db: &Db) -> bool {
//     let conn = db.0.lock().unwrap();

//     let count: i64 = conn
//         .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
//         .unwrap();

//     count > 0
// }

// #[tauri::command]
// pub fn create_owner(db: &Db, username: &str, password: &str) -> Result<(), String> {
//     if owner_exists(db) {
//         return Err("Owner already exists".into());
//     }

//     let password_hash = hash_password(password);
//     let conn = db.0.lock().unwrap();

//     conn.execute(
//         "INSERT INTO users (username, password_hash, role) VALUES (?1, ?2, 'OWNER')",
//         params![username, password_hash],
//     )
//     .map_err(|_| "Failed to create owner")?;

//     Ok(())
// }


// version 2 

// use super::password::hash_password;
// use crate::db::connection::Db;
// use rusqlite::params;

// pub fn owner_exists(db: &Db) -> bool {
//     let conn = db.0.lock().unwrap();

//     let count: i64 = conn
//         .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
//         .unwrap();

//     count > 0
// }


// pub fn check_owner(db: tauri::State<Db>) -> bool {
//     owner_exists(&db)
// }


// pub fn create_owner(
//     db: tauri::State<Db>,
//     username: String,
//     password: String,
// ) -> Result<(), String> {
//     if owner_exists(&db) {
//         return Err("Owner already exists".into());
//     }

//     let password_hash = hash_password(&password);

//     let conn = db.0.lock().unwrap();

//     conn.execute(
//         "INSERT INTO users (username, password_hash, role)
//          VALUES (?1, ?2, 'OWNER')",
//         params![username, password_hash],
//     )
//     .map_err(|_| "Failed to create owner")?;

//     Ok(())
// }



// version 3 
use super::password::hash_password;
use crate::db::connection::Db;
use rusqlite::params;

/* ---------------- CHECK OWNER ---------------- */

pub fn owner_exists(db: &Db) -> bool {

    let conn = db.0.lock().unwrap();

    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM users",
            [],
            |row| row.get(0),
        )
        .unwrap();

    count > 0
}

/* ---------------- CREATE OWNER ---------------- */

pub fn create_owner(
    db: &Db,
    username: &str,
    password: &str,
) -> Result<(), String> {

    if owner_exists(db) {
        return Err("Owner already exists".into());
    }

    let password_hash = hash_password(password);

    let conn = db.0.lock().unwrap();

    conn.execute(
        "
        INSERT INTO users
        (username, password_hash, role)
        VALUES (?1, ?2, 'OWNER')
        ",
        params![username, password_hash],
    )
    .map_err(|_| "Failed to create owner")?;

    Ok(())
}