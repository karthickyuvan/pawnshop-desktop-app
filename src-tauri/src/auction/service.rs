use crate::db::connection::Db;
use rusqlite::params;
use serde::Serialize;

#[derive(Serialize, Debug)]
pub struct AuctionPledgeItem {
    pub pledge_id: i64,
    pub pledge_no: String,
    pub customer_name: String,
    pub customer_code: String,
    pub phone: String,
    pub address: Option<String>,
    pub loan_amount: f64,
    pub interest_rate: f64,
    pub scheme_name: String,
    pub loan_type: String,
    pub pledged_date: String,
    pub years_elapsed: f64,
    pub total_gross_weight: f64,
    pub total_net_weight: f64,
    pub items_count: i64,
}

#[derive(Serialize)]
pub struct AuctionSummary {
    pub total_eligible: i64,
    pub total_loan_value: f64,
    pub oldest_pledge_years: f64,
}

#[derive(Serialize)]
pub struct AuctionListResponse {
    pub summary: AuctionSummary,
    pub pledges: Vec<AuctionPledgeItem>,
}

pub fn get_auction_eligible_pledges(
    db: &Db,
    search: Option<String>,
) -> Result<AuctionListResponse, String> {
    let conn = db.0.lock().unwrap();

    // Base query:
    // - Status = ACTIVE (not already closed/auctioned)
    // - Created 3+ years ago
    // - No non-INIT payments exist (interest or principal after pledge creation)
    let mut query = "
        SELECT
            p.id,
            p.pledge_no,
            c.name,
            c.customer_code,
            c.phone,
            c.address,
            p.loan_amount,
            p.interest_rate,
            p.scheme_name,
            p.loan_type,
            p.created_at,
            ROUND(
                CAST(julianday('now') - julianday(p.created_at) AS REAL) / 365.25,
                2
            ) AS years_elapsed,
            p.total_gross_weight,
            p.total_net_weight,
            (SELECT COUNT(*) FROM pledge_items pi WHERE pi.pledge_id = p.id) AS items_count
        FROM pledges p
        JOIN customers c ON p.customer_id = c.id
        WHERE p.status = 'ACTIVE'
          AND julianday('now') - julianday(p.created_at) >= 1095
          AND NOT EXISTS (
              SELECT 1 FROM pledge_payments pp
              WHERE pp.pledge_id = p.id
                AND pp.status = 'COMPLETED'
                AND pp.receipt_no NOT LIKE 'INIT-%'
          )
    ".to_string();

    let mut params_vec: Vec<String> = vec![];

    if let Some(ref term) = search {
        query.push_str(
            " AND (p.pledge_no LIKE ?1 OR c.name LIKE ?1 OR c.customer_code LIKE ?1 OR c.phone LIKE ?1)"
        );
        params_vec.push(format!("%{}%", term));
    }

    query.push_str(" ORDER BY years_elapsed DESC");

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(
            rusqlite::params_from_iter(params_vec.iter()),
            |row| {
                Ok(AuctionPledgeItem {
                    pledge_id:          row.get(0)?,
                    pledge_no:          row.get(1)?,
                    customer_name:      row.get(2)?,
                    customer_code:      row.get(3)?,
                    phone:              row.get(4)?,
                    address:            row.get(5)?,
                    loan_amount:        row.get(6)?,
                    interest_rate:      row.get(7)?,
                    scheme_name:        row.get(8)?,
                    loan_type:          row.get(9)?,
                    pledged_date:       row.get(10)?,
                    years_elapsed:      row.get(11)?,
                    total_gross_weight: row.get(12)?,
                    total_net_weight:   row.get(13)?,
                    items_count:        row.get(14)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let mut pledges = vec![];
    for row in rows {
        pledges.push(row.map_err(|e| e.to_string())?);
    }

    let total_loan_value: f64 = pledges.iter().map(|p| p.loan_amount).sum();
    let oldest = pledges.iter().map(|p| p.years_elapsed).fold(0.0_f64, f64::max);

    let summary = AuctionSummary {
        total_eligible: pledges.len() as i64,
        total_loan_value,
        oldest_pledge_years: oldest,
    };

    Ok(AuctionListResponse { summary, pledges })
}

/// Mark a pledge as AUCTIONED
pub fn mark_pledge_auctioned(db: &Db, pledge_id: i64) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE pledges SET status = 'AUCTIONED' WHERE id = ?1 AND status = 'ACTIVE'",
        params![pledge_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}