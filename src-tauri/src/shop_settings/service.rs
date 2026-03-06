// src/shop_settings/service.rs
//
// Matches the project's Db pattern exactly:
//   crate::db::connection::Db  →  Db(pub Mutex<Connection>)
//   access: db.0.lock().unwrap()
//
// Cargo.toml deps needed:
//   argon2 = "0.5"
//   base64 = "0.21"
//   serde = { version = "1", features = ["derive"] }

use crate::db::connection::Db;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::{Manager, State};

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTS
// ─────────────────────────────────────────────────────────────────────────────

/// Returned to frontend after get / save
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ShopSettings {
    pub shop_name:      String,
    pub address:        String,
    pub phone:          String,
    pub email:          String,
    pub website:        String,
    pub license_number: String,
    pub logo_path:      String,
    pub updated_at:     String,
}

/// Payload sent by frontend to update shop profile
#[derive(Debug, Deserialize)]
pub struct UpdateShopSettingsPayload {
    pub shop_name:      String,
    pub address:        String,
    pub phone:          String,
    pub email:          Option<String>,
    pub website:        Option<String>,
    pub license_number: Option<String>,
    /// Raw base64 image data (no data-URL prefix)
    pub logo_base64:    Option<String>,
    /// File extension: "png", "jpg", "svg", etc.
    pub logo_extension: Option<String>,
}

/// Payload for password change
#[derive(Debug, Deserialize)]
pub struct ChangePasswordPayload {
    pub user_id:          i64,
    pub current_password: String,
    pub new_password:     String,
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMANDS
// ─────────────────────────────────────────────────────────────────────────────

/// Fetch the single shop_settings row (id = 1)
#[tauri::command]
pub fn get_shop_settings(db: State<Db>) -> Result<ShopSettings, String> {
    let conn = db.0.lock().unwrap();

    conn.query_row(
        "SELECT shop_name, address, phone,
                COALESCE(email,''), COALESCE(website,''),
                COALESCE(license_number,''), COALESCE(logo_path,''),
                COALESCE(updated_at,'')
         FROM shop_settings WHERE id = 1",
        [],
        |row| {
            Ok(ShopSettings {
                shop_name:      row.get(0)?,
                address:        row.get(1)?,
                phone:          row.get(2)?,
                email:          row.get(3)?,
                website:        row.get(4)?,
                license_number: row.get(5)?,
                logo_path:      row.get(6)?,
                updated_at:     row.get(7)?,
            })
        },
    )
    .map_err(|e| format!("Failed to load shop settings: {e}"))
}

/// Upsert shop settings.
/// If logo_base64 + logo_extension are provided, the image is written to
/// <app_data_dir>/logos/shop_logo.<ext> and the path stored in DB.
/// Otherwise the existing logo_path is preserved.
#[tauri::command]
pub fn save_shop_settings(
    db:         State<Db>,
    app_handle: tauri::AppHandle,
    payload:    UpdateShopSettingsPayload,
) -> Result<ShopSettings, String> {
    // ── 1. Resolve logo path ──────────────────────────────────────────────
    let logo_path: String = match (&payload.logo_base64, &payload.logo_extension) {
        (Some(b64), Some(ext)) if !b64.is_empty() => {
            use base64::Engine;
            let bytes = base64::engine::general_purpose::STANDARD
                .decode(b64)
                .map_err(|e| format!("Invalid base64 logo: {e}"))?;

            let app_dir = app_handle
                .path()
                .app_data_dir()
                .map_err(|e| format!("Cannot resolve app data dir: {e}"))?;

            let logos_dir = app_dir.join("logos");
            std::fs::create_dir_all(&logos_dir)
                .map_err(|e| format!("Cannot create logos dir: {e}"))?;

            let file_path = logos_dir.join(format!("shop_logo.{ext}"));
            std::fs::write(&file_path, &bytes)
                .map_err(|e| format!("Failed to write logo file: {e}"))?;

            file_path.to_string_lossy().into_owned()
        }
        _ => {
            // Keep whatever is already stored
            let conn = db.0.lock().unwrap();
            conn.query_row(
                "SELECT COALESCE(logo_path,'') FROM shop_settings WHERE id = 1",
                [],
                |r| r.get::<_, String>(0),
            )
            .unwrap_or_default()
        }
    };

    // ── 2. Persist to DB ──────────────────────────────────────────────────
    {
        let conn = db.0.lock().unwrap();
        conn.execute(
            "UPDATE shop_settings SET
                shop_name      = ?1,
                address        = ?2,
                phone          = ?3,
                email          = ?4,
                website        = ?5,
                license_number = ?6,
                logo_path      = ?7,
                updated_at     = CURRENT_TIMESTAMP
             WHERE id = 1",
            params![
                payload.shop_name,
                payload.address,
                payload.phone,
                payload.email.unwrap_or_default(),
                payload.website.unwrap_or_default(),
                payload.license_number.unwrap_or_default(),
                logo_path,
            ],
        )
        .map_err(|e| format!("Failed to save shop settings: {e}"))?;
    }

    // ── 3. Return updated row ─────────────────────────────────────────────
    get_shop_settings(db)
}

/// Verify current password then store new argon2 hash.
/// Inserts a PASSWORD_CHANGED audit log entry on success.
#[tauri::command]
pub fn change_password(
    db:      State<Db>,
    payload: ChangePasswordPayload,
) -> Result<String, String> {
    use argon2::{
        password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
        Argon2,
    };

    if payload.new_password.len() < 8 {
        return Err("New password must be at least 8 characters.".into());
    }

    let conn = db.0.lock().unwrap();

    // ── 1. Load stored hash ───────────────────────────────────────────────
    let stored_hash: String = conn
        .query_row(
            "SELECT password_hash FROM users WHERE id = ?1 AND is_active = 1",
            params![payload.user_id],
            |r| r.get(0),
        )
        .map_err(|_| "User not found or inactive.".to_string())?;

    // ── 2. Verify current password ────────────────────────────────────────
    let parsed = PasswordHash::new(&stored_hash)
        .map_err(|e| format!("Hash parse error: {e}"))?;
    Argon2::default()
        .verify_password(payload.current_password.as_bytes(), &parsed)
        .map_err(|_| "Current password is incorrect.".to_string())?;

    // ── 3. Hash new password ──────────────────────────────────────────────
    let salt     = SaltString::generate(&mut OsRng);
    let new_hash = Argon2::default()
        .hash_password(payload.new_password.as_bytes(), &salt)
        .map_err(|e| format!("Hashing error: {e}"))?
        .to_string();

    // ── 4. Persist ────────────────────────────────────────────────────────
    conn.execute(
        "UPDATE users SET password_hash = ?1 WHERE id = ?2",
        params![new_hash, payload.user_id],
    )
    .map_err(|e| format!("DB update failed: {e}"))?;

    // ── 5. Audit log ──────────────────────────────────────────────────────
    conn.execute(
        "INSERT INTO audit_logs (user_id, action) VALUES (?1, 'PASSWORD_CHANGED')",
        params![payload.user_id],
    )
    .ok(); // non-fatal

    Ok("Password updated successfully.".into())
}