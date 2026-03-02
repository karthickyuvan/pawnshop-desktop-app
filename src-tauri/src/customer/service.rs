use super::code_generator::generate_next_customer_code;
use crate::db::connection::Db;
use base64::{engine::general_purpose, Engine as _};
use rusqlite::{params, Result};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(serde::Serialize)]
pub struct Customer {
    pub id: i64,
    pub customer_code: String,
    pub name: String,
    pub relation: Option<String>,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
    pub id_proof_type: Option<String>,
    pub id_proof_number: Option<String>,
    pub photo_path: Option<String>,
    pub visit_count: i64,
}

#[derive(serde::Serialize)]
pub struct CustomerSummary {
    pub total_customers: i64,
    pub repeated_customers: i64,
}

/* ---------------- ADD CUSTOMER ---------------- */
pub fn add_customer(
    db: &Db,
    name: &str,
    relation: Option<&str>,
    phone: &str,
    email: Option<&str>,
    address: Option<&str>,
    id_proof_type: Option<&str>,
    id_proof_number: Option<&str>,
) -> Result<Customer> {
    // ✅ FIRST generate code (no lock here yet)
    let customer_code = generate_next_customer_code(db)?;

    // ✅ THEN lock
    let conn = db.0.lock().unwrap();

    conn.execute(
        "
        INSERT INTO customers
        (customer_code, name, relation, phone, email, address, id_proof_type, id_proof_number)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        ",
        params![
            customer_code,
            name,
            relation,
            phone,
            email,
            address,
            id_proof_type,
            id_proof_number
        ],
    )?;

    let id = conn.last_insert_rowid();

    Ok(Customer {
        id,
        customer_code,
        name: name.to_string(),
        relation: relation.map(|v| v.to_string()),
        phone: phone.to_string(),
        email: email.map(|v| v.to_string()),
        address: address.map(|v| v.to_string()),
        id_proof_type: id_proof_type.map(|v| v.to_string()),
        id_proof_number: id_proof_number.map(|v| v.to_string()),
        photo_path: None,
        visit_count:0,
    })
}

/* ---------------- SEARCH CUSTOMER ---------------- */
pub fn search_customers(db: &Db, query: &str) -> Result<Vec<Customer>> {
    let conn = db.0.lock().unwrap();
    let like_query = format!("%{}%", query.trim());


    let mut stmt = conn.prepare(
        "
        SELECT 
            c.id,
            c.customer_code,
            c.name,
            c.relation,
            c.phone,
            c.email,
            c.address,
            c.id_proof_type,
            c.id_proof_number,
            c.photo_path,
            COUNT(p.id) as visit_count
        FROM customers c
        LEFT JOIN pledges p ON p.customer_id = c.id
        WHERE c.customer_code = ?2
        OR LOWER(c.phone) LIKE LOWER(?1)
        OR LOWER(c.name) LIKE LOWER(?1)
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT 50
        ",
    )?;

    let rows = stmt.query_map(
        params![like_query, query], // ✅ PASS TWO PARAMETERS
        |row| {
            Ok(Customer {
                id: row.get(0)?,
                customer_code: row.get(1)?,
                name: row.get(2)?,
                relation: row.get(3)?,
                phone: row.get(4)?,
                email: row.get(5)?,
                address: row.get(6)?,
                id_proof_type: row.get(7)?,
                id_proof_number: row.get(8)?,
                photo_path: row.get(9)?,
                visit_count: row.get(10)?,
            })
        },
    )?;

    let mut customers = Vec::new();
    for c in rows {
        customers.push(c?);
    }

    Ok(customers)
}

/* ---------------- CUSTOMER SUMMARY ---------------- */
pub fn get_customer_summary(db: &Db) -> Result<CustomerSummary> {
    let conn = db.0.lock().unwrap();

    let total_customers: i64 =
        conn.query_row("SELECT COUNT(*) FROM customers", [], |r| r.get(0))?;

    // ✅ Use explicit Result handling for safe execution
    // This query counts how many customers have more than 1 pledge
    let repeated_customers: i64 = conn
        .query_row(
            "
        SELECT COUNT(*)
        FROM (
            SELECT customer_id
            FROM pledges
            GROUP BY customer_id
            HAVING COUNT(*) > 1
        )
        ",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0); // Return 0 if table empty or query fails

    Ok(CustomerSummary {
        total_customers,
        repeated_customers,
    })
}

/* ---------------- SAVE PHOTO ---------------- */
pub fn save_customer_photo(
    db: &Db,
    app_handle: &tauri::AppHandle,
    customer_id: i64,
    base64_image: &str,
) -> Result<String, String> {
    // 1. Resolve the App Data Directory
    // Windows: C:\Users\Name\AppData\Roaming\com.pawnshop.app\customer_photos
    // Mac: /Users/Name/Library/Application Support/com.pawnshop.app/customer_photos
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let photos_dir = app_dir.join("customer_photos");

    // 2. Create directory if it doesn't exist
    if !photos_dir.exists() {
        fs::create_dir_all(&photos_dir).map_err(|e| e.to_string())?;
    }

    // 3. Decode Base64
    // Frontend already stripped "data:image/jpeg;base64,", so we just decode
    let image_bytes = general_purpose::STANDARD
        .decode(base64_image)
        .map_err(|e| format!("Invalid base64: {}", e))?;

    // 4. Generate Filename (e.g., "cust_101.jpg")
    // We overwrite previous photo if exists to save space
    let filename = format!("cust_{}.jpg", customer_id);
    let file_path = photos_dir.join(&filename);

    // 5. Write to Disk
    fs::write(&file_path, image_bytes).map_err(|e| format!("File write error: {}", e))?;

    // 6. Update Database with Path
    let path_string = file_path.to_string_lossy().to_string();

    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE customers SET photo_path = ?1 WHERE id = ?2",
        params![path_string, customer_id],
    )
    .map_err(|e| e.to_string())?;

    // Return the path so frontend can display it
    Ok(path_string)
}

/* ---------------- UPDATE CUSTOMER ---------------- */
pub fn update_customer(
    db: &Db,
    id: i64,
    name: &str,
    relation: Option<&str>,
    phone: &str,
    email: Option<&str>,
    address: Option<&str>,
    id_proof_type: Option<&str>,
    id_proof_number: Option<&str>,
) -> Result<()> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "
        UPDATE customers
        SET name = ?1,
            relation = ?2,
            phone = ?3,
            email = ?4,
            address = ?5,
            id_proof_type = ?6,
            id_proof_number = ?7
        WHERE id = ?8
        ",
        params![
            name,
            relation,
            phone,
            email,
            address,
            id_proof_type,
            id_proof_number,
            id
        ],
    )?;

    Ok(())
}
