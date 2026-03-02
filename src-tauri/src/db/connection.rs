use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Db(pub Mutex<Connection>);

pub fn init_db(db_path: PathBuf) -> Db {
    // 🔴 IMPORTANT: create parent directory
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).expect("Failed to create app data directory");
    }

    println!("USING DATABASE AT: {}", db_path.display());

    let conn = Connection::open(&db_path).expect("Failed to open database");

    Db(Mutex::new(conn))
}
