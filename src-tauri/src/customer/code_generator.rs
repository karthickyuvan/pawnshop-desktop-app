// use crate::db::connection::Db;
// use rusqlite::Result;

// /*
//     Format:
//     A0001
//     B0001
//     ...
//     Z0001
//     AA0001
//     AB0001
// */

// pub fn generate_next_customer_code(db: &Db) -> Result<String> {
//     let conn = db.0.lock().unwrap();

//     // 1️⃣ Get last inserted customer code
//     let last_code: Option<String> = conn
//         .query_row(
//             "SELECT customer_code FROM customers ORDER BY id DESC LIMIT 1",
//             [],
//             |row| row.get(0),
//         )
//         .ok();

//     // 2️⃣ If no customers yet
//     if last_code.is_none() {
//         return Ok("A0001".to_string());
//     }

//     let last_code = last_code.unwrap();

//     // 3️⃣ Split into prefix + number
//     let (prefix, number_part) = split_code(&last_code);

//     let mut number: i32 = number_part.parse().unwrap_or(0);

//     // 4️⃣ Increment number
//     if number < 9999 {
//         number += 1;
//         return Ok(format!("{}{:04}", prefix, number));
//     }

//     // 5️⃣ If number overflow → reset to 0001 and increment prefix
//     let next_prefix = increment_prefix(&prefix);
//     Ok(format!("{}0001", next_prefix))
// }

// /* ---------------- SPLIT PREFIX + NUMBER ---------------- */
// fn split_code(code: &str) -> (String, String) {
//     let mut prefix = String::new();
//     let mut number = String::new();

//     for c in code.chars() {
//         if c.is_alphabetic() {
//             prefix.push(c);
//         } else {
//             number.push(c);
//         }
//     }

//     (prefix, number)
// }

// /* ---------------- INCREMENT PREFIX ---------------- */
// fn increment_prefix(prefix: &str) -> String {
//     let mut chars: Vec<char> = prefix.chars().collect();

//     let mut i = chars.len();

//     while i > 0 {
//         i -= 1;

//         if chars[i] != 'Z' {
//             chars[i] = ((chars[i] as u8) + 1) as char;
//             return chars.into_iter().collect();
//         }

//         chars[i] = 'A';
//     }

//     // If all were Z → add new letter
//     let mut new_prefix = String::from("A");
//     new_prefix.push_str(&chars.into_iter().collect::<String>());
//     new_prefix
// }



use crate::db::connection::Db;
use rusqlite::Result;

pub fn generate_next_customer_code(db: &Db) -> Result<String> {
    let conn = db.0.lock().unwrap();

    let last_code: Option<String> = conn
        .query_row(
            "SELECT customer_code FROM customers ORDER BY id DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    let next_number = match last_code {
        Some(code) => code.parse::<i64>().unwrap_or(0) + 1,
        None => 1,
    };

    Ok(next_number.to_string())
}