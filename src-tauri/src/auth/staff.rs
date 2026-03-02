use crate::auth::password::hash_password;
use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct StaffUser {
    pub id: i64,
    pub username: String,
    pub is_active: bool,
}

// create a new staff user
pub fn create_staff(db: &Db, username: &str, password: &str) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    let hash = hash_password(password);

    conn.execute(
        "INSERT INTO users (username, password_hash, role, is_active)
         VALUES (?1, ?2, 'STAFF', 1)",
        params![username, hash],
    )
    .map_err(|_| "Staff username already exists")?;

    Ok(())
}

// 📌 Get all staff
pub fn get_all_staff(db: &Db) -> Result<Vec<StaffUser>, String> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT id, username, is_active
             FROM users
             WHERE role = 'STAFF'
             ORDER BY created_at DESC",
        )
        .map_err(|_| "Failed to fetch staff")?;

    let staff_iter = stmt
        .query_map([], |row| {
            Ok(StaffUser {
                id: row.get(0)?,
                username: row.get(1)?,
                is_active: row.get::<_, i64>(2)? == 1,
            })
        })
        .map_err(|_| "Failed to map staff")?;

    let mut staff = Vec::new();
    for user in staff_iter {
        staff.push(user.unwrap());
    }

    Ok(staff)
}

// 📌 Enable / Disable staff
pub fn update_staff_status(db: &Db, staff_id: i64, is_active: bool) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "UPDATE users SET is_active = ?1 WHERE id = ?2 AND role = 'STAFF'",
        params![is_active as i32, staff_id],
    )
    .map_err(|_| "Failed to update staff status")?;

    Ok(())
}
