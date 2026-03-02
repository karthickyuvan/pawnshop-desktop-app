use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct AuditLog {
    pub id: i64,
    pub user_id: i64,
    pub action: String,
    pub created_at: String,
}

pub fn log_action(db: &Db, user_id: i64, action: &str) {
    println!("AUDIT LOG => user_id: {}, action: {}", user_id, action);

    let conn = db.0.lock().unwrap();

    let _ = conn.execute(
        "INSERT INTO audit_logs (user_id, action) VALUES (?1, ?2)",
        params![user_id, action],
    );
}

pub fn get_audit_logs(db: &Db) -> Result<Vec<AuditLog>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT id, user_id, action, created_at
             FROM audit_logs
             ORDER BY created_at DESC",
        )
        .map_err(|_| "Failed to load audit logs")?;

    let rows = stmt
        .query_map([], |row| {
            Ok(AuditLog {
                id: row.get(0)?,
                user_id: row.get(1)?,
                action: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|_| "Failed to map audit logs")?;

    let mut logs = Vec::new();
    for log in rows {
        logs.push(log.unwrap());
    }

    Ok(logs)
}
