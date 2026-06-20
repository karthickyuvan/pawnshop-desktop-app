use crate::db::connection::Db;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct AuctionReportItem {
    pub pledge_id: i64,
    pub pledge_no: String,
    pub customer_name: String,
    pub pledge_date: String,
    pub loan_amount: f64,
    pub auction_amount: f64,
    pub auctioned_at: Option<String>,
    pub auction_notes: Option<String>,
}

#[derive(Serialize)]
pub struct AuctionReportSummary {
    pub total_auctioned: i64,
    pub total_loan_amount: f64,
    pub total_auction_amount: f64,
    pub total_profit: f64,
}

#[derive(Serialize)]
pub struct AuctionReportResponse {
    pub summary: AuctionReportSummary,
    pub items: Vec<AuctionReportItem>,
}



#[tauri::command]
pub fn get_auction_report_cmd(
    db: State<Db>,
) -> Result<AuctionReportResponse, String> {
    let db_ref = db.inner();
    let conn = db_ref.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "
        SELECT
            p.id,
            p.pledge_no,
            c.name,
            p.pledge_date,
            p.loan_amount,
            COALESCE(p.auction_amount, 0),
            p.auctioned_at,
            p.auction_notes
        FROM pledges p
        JOIN customers c
            ON c.id = p.customer_id
        WHERE p.status = 'AUCTIONED'
        ORDER BY p.auctioned_at DESC
        "
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(AuctionReportItem {
            pledge_id: row.get(0)?,
            pledge_no: row.get(1)?,
            customer_name: row.get(2)?,
            pledge_date: row.get(3)?,
            loan_amount: row.get(4)?,
            auction_amount: row.get(5)?,
            auctioned_at: row.get(6)?,
            auction_notes: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    
    // Explicitly drop statement and lock references to free up the SQL engine pool
    drop(stmt);
    drop(conn);

    let mut total_loan_amount = 0.0;
    let mut total_auction_amount = 0.0;
    let mut total_profit = 0.0;

    // 🎯 RE-CALCULATE ACCURATE REALIZED PORTFOLIO MARGINS
    for item in &mut items {
        // Fetch accurate interest pending variables context block
        let payment_data = crate::pledge::service::get_single_pledge(db_ref, item.pledge_id)?;
        
        let outstanding_amount = item.loan_amount + payment_data.interest_pending;
        
        // Dynamic localized profit calculation vector modification
        let item_profit = item.auction_amount - outstanding_amount;

        total_loan_amount += item.loan_amount;
        total_auction_amount += item.auction_amount;
        total_profit += item_profit;
    }

    let summary = AuctionReportSummary {
        total_auctioned: items.len() as i64,
        total_loan_amount,
        total_auction_amount,
        total_profit,
    };

    Ok(AuctionReportResponse {
        summary,
        items,
    })
}