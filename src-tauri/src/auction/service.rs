// use crate::db::connection::Db;
// use rusqlite::params;
// use serde::Serialize;

// #[derive(Serialize, Debug)]
// pub struct AuctionPledgeItem {
//     pub pledge_id: i64,
//     pub pledge_no: String,
//     pub customer_name: String,
//     pub customer_code: String,
//     pub phone: String,
//     pub address: Option<String>,
//     pub loan_amount: f64,
//     pub interest_rate: f64,
//     pub scheme_name: String,
//     pub loan_type: String,
//     pub pledged_date: String,
//     pub years_elapsed: f64,
//     pub total_gross_weight: f64,
//     pub total_net_weight: f64,
//     pub items_count: i64,
//     pub pending_interest:f64,
//     pub outstanding_amount:f64,

//     //  pub auction_amount: f64,
//     // pub auctioned_at: Option<String>,
//     // pub auction_notes: Option<String>,
// }

// #[derive(Serialize)]
// pub struct AuctionSummary {
//     pub total_eligible: i64,
//     pub total_loan_value: f64,
//     pub oldest_pledge_years: f64,
//     //  pub total_auctioned: i64,
//     // pub total_auction_value: f64,
// }

// #[derive(Serialize)]
// pub struct AuctionListResponse {
//     pub summary: AuctionSummary,
//     pub pledges: Vec<AuctionPledgeItem>,
// }

// #[derive(Serialize, Debug)]
// pub struct AuctionedPledgeItem {
//     pub pledge_id: i64,
//     pub pledge_no: String,
//     pub customer_name: String,
//     pub customer_code: String,
//     pub phone: String,
//     pub loan_amount: f64,
//     pub auctioned_at: Option<String>,
// }

// #[derive(Serialize)]
// pub struct AuctionedSummary {
//     pub total_auctioned: i64,
//     pub total_loan_value: f64,
// }

// #[derive(Serialize)]
// pub struct AuctionedListResponse {
//     pub summary: AuctionedSummary,
//     pub pledges: Vec<AuctionedPledgeItem>,
// }

// use serde::Deserialize;

// #[derive(Deserialize)]
// pub struct MarkAuctionRequest {
//     pub pledge_id: i64,
//     pub auction_amount: f64,
//     pub auction_notes: Option<String>,
// }

// pub fn get_auction_eligible_pledges(
//     db: &Db,
//     search: Option<String>,
// ) -> Result<AuctionListResponse, String> {
//     let conn = db.0.lock().unwrap();

//     // Base query:
//     // - Status = ACTIVE (not already closed/auctioned)
//     // - Created 3+ years ago
//     // - No non-INIT payments exist (interest or principal after pledge creation)
//     let mut query = "
// SELECT
//     p.id,
//     p.pledge_no,
//     c.name,
//     c.customer_code,
//     c.phone,
//     c.address,
//     p.loan_amount,
//     p.interest_rate,
//     p.scheme_name,
//     p.loan_type,
//     p.pledge_date,

//     ROUND(
//         CAST(
//             julianday('now') - julianday(p.pledge_date)
//             AS REAL
//         ) / 365.25,
//         2
//     ) AS years_elapsed,

//     p.total_gross_weight,
//     p.total_net_weight,

//     (
//         SELECT COUNT(*)
//         FROM pledge_items pi
//         WHERE pi.pledge_id = p.id
//     ) AS items_count

// FROM pledges p
// JOIN customers c
//     ON p.customer_id = c.id

// WHERE p.status = 'ACTIVE'

//     -- Pledge date older than 3 years
//     AND julianday('now') - julianday(p.pledge_date) >= 1095

//     -- Last payment older than 3 years
//     AND julianday('now') - julianday(
//         COALESCE(
//             (
//                 SELECT MAX(pp.paid_at)
//                 FROM pledge_payments pp
//                 WHERE pp.pledge_id = p.id
//                   AND pp.status = 'COMPLETED'
//             ),
//             p.pledge_date
//         )
//     ) >= 1095
//     ".to_string();

//     let mut params_vec: Vec<String> = vec![];

// if let Some(ref term) = search {
//     query.push_str(
//         " AND (
//             p.pledge_no LIKE ?1
//             OR c.name LIKE ?1
//             OR c.customer_code LIKE ?1
//             OR c.phone LIKE ?1
//         )"
//     );

//     params_vec.push(format!("%{}%", term));
// }

//     query.push_str(" ORDER BY years_elapsed DESC");

//     let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

//     let rows = stmt
//         .query_map(
//             rusqlite::params_from_iter(params_vec.iter()),
//             |row| {
//                 Ok(AuctionPledgeItem {
//                     pledge_id:          row.get(0)?,
//                     pledge_no:          row.get(1)?,
//                     customer_name:      row.get(2)?,
//                     customer_code:      row.get(3)?,
//                     phone:              row.get(4)?,
//                     address:            row.get(5)?,
//                     loan_amount:        row.get(6)?,
//                     interest_rate:      row.get(7)?,
//                     scheme_name:        row.get(8)?,
//                     loan_type:          row.get(9)?,
//                     pledged_date:       row.get(10)?,
//                     years_elapsed:      row.get(11)?,
//                     total_gross_weight: row.get(12)?,
//                     total_net_weight:   row.get(13)?,
//                     items_count:        row.get(14)?,
//                     pending_interest: 0.0,
//                     outstanding_amount: 0.0,
//                 })
//             },
//         )
//         .map_err(|e| e.to_string())?;

//     let mut pledges = vec![];
//     for row in rows {
//         pledges.push(row.map_err(|e| e.to_string())?);
//     }
// drop(stmt);
// drop(conn);

//     for pledge in &mut pledges {

//     let payment_data =
//         crate::pledge::service::get_single_pledge(
//             db,
//             pledge.pledge_id
//         )?;

//     pledge.pending_interest =
//         payment_data.interest_pending;

//     pledge.outstanding_amount =
//         pledge.loan_amount +
//         payment_data.interest_pending;
// }

//     let total_loan_value: f64 = pledges.iter().map(|p| p.loan_amount).sum();
//     let oldest = pledges.iter().map(|p| p.years_elapsed).fold(0.0_f64, f64::max);

//     let summary = AuctionSummary {
//         total_eligible: pledges.len() as i64,
//         total_loan_value,
//         oldest_pledge_years: oldest,
//     };

//     Ok(AuctionListResponse { summary, pledges })
// }


// pub fn get_auctioned_pledges(
//     db: &Db,
//     search: Option<String>,
// ) -> Result<AuctionedListResponse, String> {
//     let conn = db.0.lock().unwrap();

//     let mut query = "
//         SELECT
//             p.id,
//             p.pledge_no,
//             c.name,
//             c.customer_code,
//             c.phone,
//             p.loan_amount,
//             p.auctioned_at
//         FROM pledges p
//         JOIN customers c
//             ON p.customer_id = c.id
//         WHERE p.status = 'AUCTIONED'
//     ".to_string();

//     let mut params_vec: Vec<String> = vec![];

//     if let Some(ref term) = search {
//         query.push_str(
//             " AND (
//                 p.pledge_no LIKE ?1
//                 OR c.name LIKE ?1
//                 OR c.customer_code LIKE ?1
//                 OR c.phone LIKE ?1
//             )"
//         );

//         params_vec.push(format!("%{}%", term));
//     }

//     query.push_str(" ORDER BY p.auctioned_at DESC");

//     let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

//     let rows = stmt.query_map(
//         rusqlite::params_from_iter(params_vec.iter()),
//         |row| {
//             Ok(AuctionedPledgeItem {
//                 pledge_id: row.get(0)?,
//                 pledge_no: row.get(1)?,
//                 customer_name: row.get(2)?,
//                 customer_code: row.get(3)?,
//                 phone: row.get(4)?,
//                 loan_amount: row.get(5)?,
//                 auctioned_at: row.get(6)?,


//             })
//         },
//     )
//     .map_err(|e| e.to_string())?;

//     let mut pledges = vec![];

//     for row in rows {
//         pledges.push(row.map_err(|e| e.to_string())?);
//     }

//     let total_loan_value: f64 =
//         pledges.iter().map(|p| p.loan_amount).sum();

//     let summary = AuctionedSummary {
//         total_auctioned: pledges.len() as i64,
//         total_loan_value,
//     };

//     Ok(AuctionedListResponse {
//         summary,
//         pledges,
//     })
// }



// /// Mark a pledge as AUCTIONED
// pub fn mark_pledge_auctioned(
//     db: &Db,
//     pledge_id: i64,
//     auction_amount: f64,
//     auction_notes: Option<String>,
// ) -> Result<(), String>{
//     let conn = db.0.lock().unwrap();
//     conn.execute(
//         " UPDATE pledges
//     SET
//         status = 'AUCTIONED',
//         auction_amount = ?2,
//         auction_notes = ?3,
//         auctioned_at = datetime('now')
//     WHERE id = ?1
//       AND status = 'ACTIVE'
//     ",
//     params![
//         pledge_id,
//         auction_amount,
//         auction_notes],
//     )
//     .map_err(|e| e.to_string())?;
//     Ok(())
// }


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
    pub pending_interest: f64,
    pub outstanding_amount: f64,
}

#[derive(Serialize)]
pub struct AuctionSummary {
    pub total_eligible: i64,
    pub total_loan_value: f64,
    pub oldest_pledge_years: f64,

    pub auction_after_months: i32,
}

#[derive(Serialize)]
pub struct AuctionListResponse {
    pub summary: AuctionSummary,
    pub pledges: Vec<AuctionPledgeItem>,
}

#[derive(Serialize, Debug)]
pub struct AuctionedPledgeItem {
    pub pledge_id: i64,
    pub pledge_no: String,
    pub customer_name: String,
    pub customer_code: String,
    pub phone: String,

    pub loan_amount: f64,

    pub pending_interest: f64,
    pub outstanding_amount: f64,

    pub auction_amount: Option<f64>,
    pub auction_notes: Option<String>,

    pub total_gross_weight: f64,
    pub total_net_weight: f64,


    pub profit: f64,

    pub auctioned_at: Option<String>,
}

#[derive(Serialize)]
pub struct AuctionedSummary {
    pub total_auctioned: i64,
    pub total_loan_value: f64,
     pub total_profit: f64,
}

#[derive(Serialize)]
pub struct AuctionedListResponse {
    pub summary: AuctionedSummary,
    pub pledges: Vec<AuctionedPledgeItem>,
}

use serde::Deserialize;

#[derive(Deserialize)]
pub struct MarkAuctionRequest {
    pub pledge_id: i64,
    pub auction_amount: f64,
    pub auction_notes: Option<String>,
}

pub fn get_auction_eligible_pledges(
    db: &Db,
    search: Option<String>,
) -> Result<AuctionListResponse, String> {

   let settings =
    crate::settings::service::get_system_settings(db)?;

let auction_months =
    settings.auction_after_months;
    
    let conn = db.0.lock().unwrap();

    // FIX: COALESCE on weight columns prevents NULL crashing .toFixed() in JS
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
    p.pledge_date,

    ROUND(
        CAST(
            julianday('now') - julianday(p.pledge_date)
            AS REAL
        ) / 365.25,
        2
    ) AS years_elapsed,

    COALESCE(p.total_gross_weight, 0.0) AS total_gross_weight,
    COALESCE(p.total_net_weight, 0.0)   AS total_net_weight,

    (
        SELECT COUNT(*)
        FROM pledge_items pi
        WHERE pi.pledge_id = p.id
    ) AS items_count

FROM pledges p
JOIN customers c
    ON p.customer_id = c.id

WHERE p.status = 'ACTIVE'
AND date(p.pledge_date)
    <= date('now', '-' || ?1 || ' months')

AND date(
    COALESCE(
        (
            SELECT MAX(pp.paid_at)
            FROM pledge_payments pp
            WHERE pp.pledge_id = p.id
            AND pp.status = 'COMPLETED'
        ),
        p.pledge_date
    )
)
<= date('now', '-' || ?1 || ' months')
    ".to_string();

   let mut params_vec: Vec<String> =
    vec![auction_months.to_string()];

    if let Some(ref term) = search {
        query.push_str(
            " AND (
                p.pledge_no LIKE ?2
                OR c.name LIKE ?2
                OR c.customer_code LIKE ?2
                OR c.phone LIKE ?2
            )"
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
                    pending_interest:   0.0,
                    outstanding_amount: 0.0,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let mut pledges = vec![];
    for row in rows {
        pledges.push(row.map_err(|e| e.to_string())?);
    }
    drop(stmt);
    drop(conn);

    for pledge in &mut pledges {
        let payment_data =
            crate::pledge::service::get_single_pledge(db, pledge.pledge_id)?;

        pledge.pending_interest   = payment_data.interest_pending;
        pledge.outstanding_amount = pledge.loan_amount + payment_data.interest_pending;
    }

    let total_loan_value: f64 = pledges.iter().map(|p| p.loan_amount).sum();
    let oldest = pledges.iter().map(|p| p.years_elapsed).fold(0.0_f64, f64::max);

    let summary = AuctionSummary {
        total_eligible: pledges.len() as i64,
        total_loan_value,
        oldest_pledge_years: oldest,

        auction_after_months: auction_months,
    };

    Ok(AuctionListResponse { summary, pledges })
}

pub fn get_auctioned_pledges(
    db: &Db,
    search: Option<String>,
) -> Result<AuctionedListResponse, String> {
    let conn = db.0.lock().unwrap();

let mut query = "
SELECT
    p.id,
    p.pledge_no,
    c.name,
    c.customer_code,
    c.phone,

    p.loan_amount,

    COALESCE(p.auction_amount, 0) AS auction_amount,
    COALESCE(p.auction_notes, '') AS auction_notes,

    COALESCE(p.total_gross_weight, 0) AS total_gross_weight,
    COALESCE(p.total_net_weight, 0) AS total_net_weight,


    p.auctioned_at

FROM pledges p

INNER JOIN customers c
    ON p.customer_id = c.id

WHERE p.status = 'AUCTIONED'

".to_string();

    let mut params_vec: Vec<String> = vec![];

    if let Some(ref term) = search {
        query.push_str(
            " AND (
                p.pledge_no LIKE ?1
                OR c.name LIKE ?1
                OR c.customer_code LIKE ?1
                OR c.phone LIKE ?1
            )"
        );
        params_vec.push(format!("%{}%", term));
    }

    query.push_str(" ORDER BY p.auctioned_at DESC");

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(
        rusqlite::params_from_iter(params_vec.iter()),
        |row| {
Ok(AuctionedPledgeItem {
    pledge_id: row.get(0)?,
    pledge_no: row.get(1)?,
    customer_name: row.get(2)?,
    customer_code: row.get(3)?,
    phone: row.get(4)?,

    loan_amount: row.get(5)?,

    pending_interest: 0.0,
    outstanding_amount: 0.0,

    auction_amount: row.get(6)?,
    auction_notes: row.get(7)?,

    total_gross_weight: row.get(8)?,
    total_net_weight: row.get(9)?,


    profit: 0.0,

    auctioned_at: row.get(10)?,
})
        },
    )
    .map_err(|e| e.to_string())?;

    let mut pledges = vec![];
    for row in rows {
        pledges.push(row.map_err(|e| e.to_string())?);
    }
    drop(stmt);
drop(conn);

for pledge in &mut pledges {
    let payment_data =
        crate::pledge::service::get_single_pledge(
            db,
            pledge.pledge_id,
        )?;

    pledge.pending_interest =
        payment_data.interest_pending;

    pledge.outstanding_amount =
        pledge.loan_amount +
        payment_data.interest_pending;

    pledge.profit =
        pledge.auction_amount.unwrap_or(0.0)
        - pledge.outstanding_amount;
}

let total_loan_value: f64 =
    pledges.iter().map(|p| p.loan_amount).sum();

let total_profit: f64 =
    pledges.iter().map(|p| p.profit).sum();

let summary = AuctionedSummary {
    total_auctioned: pledges.len() as i64,
    total_loan_value,
    total_profit,
};
    Ok(AuctionedListResponse { summary, pledges })
}


pub fn mark_pledge_auctioned(
    db: &Db,
    pledge_id: i64,
    auction_amount: f64,
    auction_notes: Option<String>,
) -> Result<(), String> {
    let mut conn = db.0.lock().unwrap();
    
    // Begin an atomic database transaction to prevent partial or mismatched updates
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 1. Fetch vital tracking details from the pledge before making changes
    let (pledge_no, loan_amount): (String, f64) = tx.query_row(
        "SELECT pledge_no, loan_amount FROM pledges WHERE id = ?1 AND status = 'ACTIVE'",
        params![pledge_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(|_| "Pledge not found or is already closed/auctioned.".to_string())?;

    // 2. Fetch the dynamic pending interest using your existing service method
    // Drop the reference lock temporarily or pass DB safely if needed
    let payment_data = crate::pledge::service::get_single_pledge(db, pledge_id)?;
    let pending_interest = payment_data.interest_pending; 
    let total_outstanding = loan_amount + pending_interest;

    // 3. Compute real regulatory splits
    let mut interest_recovered = pending_interest;
    let mut pure_surplus = auction_amount - total_outstanding;

    // Deficit handling safeguard (If auction price didn't cover the full interest)
    if auction_amount < total_outstanding {
        pure_surplus = 0.0;
        interest_recovered = f64::max(0.0, auction_amount - loan_amount);
    }

    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    // 4. Update the main core pledge item record status
    tx.execute(
        "UPDATE pledges
         SET status = 'AUCTIONED',
             auction_amount = ?2,
             auction_notes = ?3,
             auctioned_at = ?4
         WHERE id = ?1",
        params![pledge_id, auction_amount, auction_notes, timestamp],
    ).map_err(|e| e.to_string())?;

    /* -------------------------------------------------------------------------
       5. CAPITAL INFLOW LEDGER SPLITS (Fixes Monthly & Yearly Book Reporting)
    --------------------------------------------------------------------------*/
// A. Principal
tx.execute(
    "INSERT INTO fund_transactions 
        (total_amount, module_type, type, created_at, description, payment_method, reference, created_by)
     VALUES (?1, 'PLEDGE', 'ADD', ?2, ?3, 'AUCTION', ?4, 1)",
    params![
        loan_amount, timestamp,
        format!("Principal recovered from Auction of Loan {}", pledge_no),
        format!("AUCTION-{}", pledge_no),
    ],
).map_err(|e| e.to_string())?;

// B. Interest
if interest_recovered > 0.0 {
    tx.execute(
        "INSERT INTO fund_transactions 
            (total_amount, module_type, type, created_at, description, payment_method, reference, created_by)
         VALUES (?1, 'INTEREST', 'ADD', ?2, ?3, 'AUCTION', ?4, 1)",
        params![
            interest_recovered, timestamp,
            format!("Interest recovered from Auction of Loan {}", pledge_no),
            format!("AUCTION-{}", pledge_no),
        ],
    ).map_err(|e| e.to_string())?;
}

// C. Surplus
if pure_surplus > 0.0 {
    tx.execute(
        "INSERT INTO fund_transactions 
            (total_amount, module_type, type, created_at, description, payment_method, reference, created_by)
         VALUES (?1, 'OTHER_INCOME', 'ADD', ?2, ?3, 'AUCTION', ?4, 1)",
        params![
            pure_surplus, timestamp,
            format!("Excess margin surplus from Auction of Loan {}", pledge_no),
            format!("AUCTION-{}", pledge_no),
        ],
    ).map_err(|e| e.to_string())?;


}

    // Commit the entire sequence securely to SQLite
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}