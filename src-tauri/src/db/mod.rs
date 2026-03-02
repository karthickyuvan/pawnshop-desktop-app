pub mod connection;
pub mod migrations;

use connection::Db;
use migrations::run_migrations;
use std::path::PathBuf;

pub fn setup_database(db_path: PathBuf) -> Db {
    let db = connection::init_db(db_path);

    {
        let conn = db.0.lock().unwrap();
        run_migrations(&conn);
    }

    db
}
