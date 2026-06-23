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

    // 🔥 FIX 1: WAL Mode configuration (Concurrent Reads allow panna)
    conn.pragma_update(None, "journal_mode", "WAL")
        .expect("Failed to set SQLite journal mode to WAL");

    // 🔥 FIX 2: Synchronous to NORMAL (Bayangarama speed upgrade aagum)
    conn.pragma_update(None, "synchronous", "NORMAL")
        .expect("Failed to set SQLite synchronous mode to NORMAL");

    // 🔥 FIX 3: Busy Timeout configuration (5000ms delay for thread locks)
    conn.busy_timeout(std::time::Duration::from_millis(5000))
        .expect("Failed to set SQLite busy timeout");

    // 🛡️ CRITICAL FIX 4: Enforce Foreign Key Constraints (Data Integrity Safety)
    conn.pragma_update(None, "foreign_keys", "ON")
        .expect("Failed to set SQLite foreign_keys to ON");

    Db(Mutex::new(conn))
}