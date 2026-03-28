use crate::db::connection::Db;
use rusqlite::Result;

pub fn generate_next_pledge_no(db: &Db) -> Result<String> {
    let conn = db.0.lock().unwrap();

    let last_code: Option<String> = conn
        .query_row(
            "SELECT pledge_no FROM pledges ORDER BY id DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    if last_code.is_none() {
        return Ok("PLG-A0001".to_string());
    }

    let last_code = last_code.unwrap();
    let clean_code = last_code.replace("PLG-", "");

    let (prefix, number_part) = split_code(&clean_code);

    let mut number: i32 = number_part.parse().unwrap_or(0);

    if number < 9999 {
        number += 1;
        return Ok(format!("PLG-{}{:04}", prefix, number));
    }

    let next_prefix = increment_prefix(&prefix);

    Ok(format!("PLG-{}0001", next_prefix))
}

fn split_code(code: &str) -> (String, String) {
    let mut prefix = String::new();
    let mut number = String::new();

    for c in code.chars() {
        if c.is_alphabetic() {
            prefix.push(c);
        } else {
            number.push(c);
        }
    }

    (prefix, number)
}

fn increment_prefix(prefix: &str) -> String {
    let mut chars: Vec<char> = prefix.chars().collect();
    let mut i = chars.len();

    while i > 0 {
        i -= 1;

        if chars[i] != 'Z' {
            chars[i] = ((chars[i] as u8) + 1) as char;
            return chars.into_iter().collect();
        }

        chars[i] = 'A';
    }

    let mut new_prefix = String::from("A");
    new_prefix.push_str(&chars.into_iter().collect::<String>());
    new_prefix
}