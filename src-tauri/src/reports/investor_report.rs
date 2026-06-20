use crate::db::connection::Db;
use tauri::State;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct GlobalInvestorTransaction {
    pub id: i64,
    pub investor_name: String,
    pub investor_code: String,
    pub transaction_date: String,
    pub transaction_type: String,
    pub amount: f64,
    pub payment_method: String,
    pub remarks: Option<String>,
}

#[tauri::command]
pub fn get_global_investor_transactions_cmd(
    db: State<Db>,
) -> Result<Vec<GlobalInvestorTransaction>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "
        SELECT
            it.id,
            i.investor_name,
            i.investor_code,
            ft.created_at,
            it.transaction_type,
            ft.total_amount,
            ft.payment_method,
            it.remarks
        FROM investor_transactions it
        JOIN investors i ON i.id = it.investor_id
        JOIN fund_transactions ft ON ft.id = it.fund_transaction_id
        ORDER BY ft.created_at DESC
        "
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(GlobalInvestorTransaction {
            id: row.get(0)?,
            investor_name: row.get(1)?,
            investor_code: row.get(2)?,
            transaction_date: row.get(3)?,
            transaction_type: row.get(4)?,
            amount: row.get(5)?,
            payment_method: row.get(6)?,
            remarks: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }
    Ok(list)
}