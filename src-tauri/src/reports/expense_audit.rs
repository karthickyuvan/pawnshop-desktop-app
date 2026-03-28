use crate::db::connection::Db;
use rusqlite::params;

#[derive(serde::Serialize)]
pub struct ExpenseCategorySummary {
    pub category: String,
    pub total_amount: f64,
}

#[derive(serde::Serialize)]
pub struct ExpenseAuditItem {
    pub date: String,
    pub category: String,
    pub description: String,
    pub amount: f64,
    pub created_by: String,
}

#[derive(serde::Serialize)]
pub struct ExpenseAuditReport {
    pub summary: Vec<ExpenseCategorySummary>,
    pub expenses: Vec<ExpenseAuditItem>,
}


pub fn get_expense_audit_report(
    db: &Db,
    start_date: String,
    end_date: String,
) -> Result<ExpenseAuditReport, String> {

    let conn = db.0.lock().unwrap();

    // CATEGORY SUMMARY
    let mut stmt = conn.prepare(
        "
        SELECT ec.name,
               COALESCE(SUM(e.amount),0)
        FROM expenses e
        JOIN expense_categories ec ON ec.id = e.category_id
        WHERE date(e.expense_date) BETWEEN ?1 AND ?2
        GROUP BY ec.name
        ORDER BY ec.name
        "
    ).map_err(|e| e.to_string())?;

    let summary_iter = stmt.query_map(
        params![start_date, end_date],
        |row| {
            Ok(ExpenseCategorySummary {
                category: row.get(0)?,
                total_amount: row.get(1)?,
            })
        }
    ).map_err(|e| e.to_string())?;

    let mut summary = vec![];
    for s in summary_iter {
        summary.push(s.map_err(|e| e.to_string())?);
    }

    // DETAILED LIST
    let mut stmt = conn.prepare(
        "
        SELECT 
            e.expense_date,
            ec.name,
            e.description,
            e.amount,
            u.username
        FROM expenses e
        JOIN expense_categories ec ON ec.id = e.category_id
        JOIN users u ON u.id = e.created_by
        WHERE date(e.expense_date) BETWEEN ?1 AND ?2
        ORDER BY e.expense_date DESC
        "
    ).map_err(|e| e.to_string())?;

    let expense_iter = stmt.query_map(
        params![start_date, end_date],
        |row| {
            Ok(ExpenseAuditItem {
                date: row.get(0)?,
                category: row.get(1)?,
                description: row.get(2)?,
                amount: row.get(3)?,
                created_by: row.get(4)?,
            })
        }
    ).map_err(|e| e.to_string())?;

    let mut expenses = vec![];
    for e in expense_iter {
        expenses.push(e.map_err(|e| e.to_string())?);
    }

    Ok(ExpenseAuditReport {
        summary,
        expenses,
    })
}



#[tauri::command]
pub fn get_expense_audit_report_cmd(
    db: tauri::State<Db>,
    start_date: String,
    end_date: String,
) -> Result<ExpenseAuditReport, String> {

    get_expense_audit_report(db.inner(), start_date, end_date)
}