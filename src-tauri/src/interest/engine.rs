
use crate::pledge::service::PledgeDetails;
use crate::settings::service::SystemSettings;
use chrono::{Local, NaiveDate};

pub struct InterestBreakdown {
    pub months_elapsed: i32,
    pub total_interest: f64,
    pub interest_paid: f64,
    pub interest_pending: f64,
}

// ─────────────────────────────────────────────────────────────────────────────
// Interest Calculation Rules (all modes share the same first-month-paid assumption)
//
// When a pledge is created, the first month's interest is deducted upfront.
// So "months_elapsed = 1" means the customer owes nothing extra yet.
//
// MONTHLY:
//   Only complete 30-day blocks are charged after the first month.
//   Day 31–60  → 1 extra month  (₹2,500)
//   Day 61–90  → 2 extra months (₹5,000)
//
// DAILY:
//   Every day accrues interest. (monthly_rate / 30) × days_elapsed.
//   First month interest already paid is subtracted from pending.
//
// SLAB_WITH_HALF:
//   Fixed 15-day slab boundary. No grace period.
//   After each completed month:
//     Extra day 1–15  → charge half a month
//     Extra day 16–30 → charge a full month
//   Day 31–45  → 1 month + half  (₹3,750 total, ₹1,250 pending since 1st paid)
//   Day 46–60  → 2 full months   (₹5,000 total, ₹2,500 pending)
//   Day 61–75  → 2 months + half (₹6,250 total, ₹3,750 pending)
//
// SLAB_WITH_CUSTOM (grace_days configurable, e.g. grace = 5):
//   After each completed month:
//     Extra day 1–grace_days     → no charge (grace period)
//     Extra day grace+1–(grace+15) → charge half a month
//     Extra day grace+16–30      → charge a full month
//   With grace=5:
//     Day 1–35   → ₹0 pending (1st month paid, within grace)
//     Day 36–50  → ₹1,250 pending (half month)
//     Day 51–60  → ₹2,500 pending (full 2nd month)
// ─────────────────────────────────────────────────────────────────────────────

pub fn calculate_interest(
    pledge: &PledgeDetails,
    settings: &SystemSettings,
    interest_paid: f64,
) -> InterestBreakdown {
    let today = Local::now().naive_local().date();
    let created_date =
        NaiveDate::parse_from_str(&pledge.created_at[..10], "%Y-%m-%d").unwrap_or(today);

    let days_elapsed = (today - created_date).num_days();
    let principal = pledge.principal_amount;
    let rate = pledge.interest_rate;

    let monthly_interest = principal * rate / 100.0;
    let half_interest = monthly_interest / 2.0;

    let full_months = days_elapsed / 30;  // complete 30-day blocks
    let extra_days = days_elapsed % 30;   // leftover days after full months

    match settings.interest_calculation_type.as_str() {

        // ── DAILY ─────────────────────────────────────────────────────────────
        // (monthly_interest / 30) × every day elapsed
        // first month interest already paid is subtracted from pending
        "DAILY" => {
            let daily_rate = monthly_interest / 30.0;
            let total_interest = daily_rate * days_elapsed as f64;
            let interest_pending = (total_interest - interest_paid).max(0.0);
            InterestBreakdown {
                months_elapsed: 0,
                total_interest,
                interest_paid,
                interest_pending,
            }
        }

        // ── MONTHLY ───────────────────────────────────────────────────────────
        // Only complete 30-day blocks after the first month.
        // Day 1–30 = 0 extra, day 31–60 = 1 extra month, etc.
        // The first month is already paid so pending = (full_months - 1) × monthly
        // but we track total_interest as full_months × monthly for consistency,
        // and let interest_paid cover the first month deducted at pledge time.
        "MONTHLY" => {
            let months = full_months as i32;
            let total_interest = monthly_interest * months as f64;
            let interest_pending = (total_interest - interest_paid).max(0.0);
            InterestBreakdown {
                months_elapsed: months,
                total_interest,
                interest_paid,
                interest_pending,
            }
        }

        // ── SLAB_WITH_HALF ────────────────────────────────────────────────────
        // Fixed 15-day boundary. No grace period.
        //   extra 1–15 days  → + half month interest
        //   extra 16–30 days → + full month interest
        //   extra 0 days     → nothing extra
        "SLAB_WITH_HALF" => {
            let slab_extra = if extra_days == 0 {
                0.0
            } else if extra_days <= 15 {
                half_interest
            } else {
                monthly_interest
            };

            let total_interest = (monthly_interest * full_months as f64) + slab_extra;
            let interest_pending = (total_interest - interest_paid).max(0.0);

            InterestBreakdown {
                months_elapsed: full_months as i32,
                total_interest,
                interest_paid,
                interest_pending,
            }
        }

        // ── SLAB_WITH_CUSTOM ──────────────────────────────────────────────────
        // Configurable grace period (grace_days from system_settings).
        // After each completed month, extra days are split into 3 zones:
        //   Zone 1: extra 1–grace_days          → no charge (grace)
        //   Zone 2: extra grace+1–(grace+15)    → half month interest
        //   Zone 3: extra grace+16–30           → full month interest
        //   extra 0 days                        → nothing extra
        "SLAB_WITH_CUSTOM" | _ => {
            let grace = settings.grace_days as i64;
            let half_boundary = grace + 15;

            let slab_extra = if extra_days == 0 {
                0.0
            } else if extra_days <= grace {
                0.0                 // within grace period — no charge
            } else if extra_days <= half_boundary {
                half_interest       // grace+1 to grace+15 — half month
            } else {
                monthly_interest    // grace+16 to 30 — full month
            };

            let total_interest = (monthly_interest * full_months as f64) + slab_extra;
            let interest_pending = (total_interest - interest_paid).max(0.0);

            InterestBreakdown {
                months_elapsed: full_months as i32,
                total_interest,
                interest_paid,
                interest_pending,
            }
        }
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// Unit Tests
// Run: cargo test interest_engine
// ─────────────────────────────────────────────────────────────────────────────
#[cfg(test)]
mod tests {
    use super::*;
    use crate::settings::service::SystemSettings;

    fn pledge_n_days_old(days: i64, principal: f64, rate: f64) -> PledgeDetails {
        let date = chrono::Local::now().naive_local().date()
            - chrono::Duration::days(days);
        PledgeDetails {
            pledge_no: "TEST-001".into(),
            status: "ACTIVE".into(),
            created_at: format!("{} 00:00:00", date),
            duration_months: 12,
            customer_code: "C001".into(),
            customer_name: "Test".into(),
            relation_type: None,
            relation_name: None,
            phone: "9999999999".into(),
            address: "Test".into(),
            photo_path: None,
            loan_type: "Gold".into(),
            scheme_name: "Standard".into(),
            interest_rate: rate,
            price_per_gram: 6000.0,
            principal_amount: principal,
            total_gross_weight: 10.0,
            total_net_weight: 9.5,
            total_value: 57000.0,
            is_bank_mapped: false,
        }
    }

    fn s(calc_type: &str, grace: i32) -> SystemSettings {
        SystemSettings {
            interest_calculation_type: calc_type.into(),
            grace_days: grace,
        }
    }

    // ── MONTHLY ───────────────────────────────────────────────────────────────

    #[test]
    fn monthly_day_30_no_extra() {
        // Day 30: exactly 1 full month. First month already paid → ₹0 pending.
        let r = calculate_interest(&pledge_n_days_old(30, 50000.0, 5.0), &s("MONTHLY", 15), 2500.0);
        assert_eq!(r.total_interest, 2500.0);
        assert_eq!(r.interest_pending, 0.0);
    }

    #[test]
    fn monthly_day_31_no_extra() {
        // Day 31: still 1 full month (30-day block). No extra charge.
        let r = calculate_interest(&pledge_n_days_old(31, 50000.0, 5.0), &s("MONTHLY", 15), 2500.0);
        assert_eq!(r.total_interest, 2500.0);
        assert_eq!(r.interest_pending, 0.0);
    }

    #[test]
    fn monthly_day_61_two_months() {
        // Day 61: 2 full months. First paid → ₹2,500 pending.
        let r = calculate_interest(&pledge_n_days_old(61, 50000.0, 5.0), &s("MONTHLY", 15), 2500.0);
        assert_eq!(r.total_interest, 5000.0);
        assert_eq!(r.interest_pending, 2500.0);
    }

    // ── SLAB_WITH_HALF ────────────────────────────────────────────────────────

    #[test]
    fn slab_half_day_30_nothing_extra() {
        // Exactly 30 days, no remainder → 0 slab extra
        let r = calculate_interest(&pledge_n_days_old(30, 50000.0, 5.0), &s("SLAB_WITH_HALF", 15), 2500.0);
        assert_eq!(r.total_interest, 2500.0);
        assert_eq!(r.interest_pending, 0.0);
    }

    #[test]
    fn slab_half_day_31_half_month() {
        // Day 31: 1 full month + 1 extra day (≤15) → half month added
        // total = 2500 + 1250 = 3750, first paid = 2500, pending = 1250
        let r = calculate_interest(&pledge_n_days_old(31, 50000.0, 5.0), &s("SLAB_WITH_HALF", 15), 2500.0);
        assert!((r.total_interest - 3750.0).abs() < 0.01);
        assert!((r.interest_pending - 1250.0).abs() < 0.01);
    }

    #[test]
    fn slab_half_day_45_half_month() {
        // Day 45: 1 full month + 15 extra days (≤15) → still half month
        let r = calculate_interest(&pledge_n_days_old(45, 50000.0, 5.0), &s("SLAB_WITH_HALF", 15), 2500.0);
        assert!((r.total_interest - 3750.0).abs() < 0.01);
        assert!((r.interest_pending - 1250.0).abs() < 0.01);
    }

    #[test]
    fn slab_half_day_46_full_second_month() {
        // Day 46: 1 full month + 16 extra days (>15) → full 2nd month
        // total = 2500 + 2500 = 5000, pending = 2500
        let r = calculate_interest(&pledge_n_days_old(46, 50000.0, 5.0), &s("SLAB_WITH_HALF", 15), 2500.0);
        assert!((r.total_interest - 5000.0).abs() < 0.01);
        assert!((r.interest_pending - 2500.0).abs() < 0.01);
    }

    #[test]
    fn slab_half_day_61_half_of_third_month() {
        // Day 61: 2 full months + 1 extra day → 2 months + half
        // total = 5000 + 1250 = 6250, pending = 3750
        let r = calculate_interest(&pledge_n_days_old(61, 50000.0, 5.0), &s("SLAB_WITH_HALF", 15), 2500.0);
        assert!((r.total_interest - 6250.0).abs() < 0.01);
        assert!((r.interest_pending - 3750.0).abs() < 0.01);
    }

    // ── SLAB_WITH_CUSTOM (grace = 5) ──────────────────────────────────────────

    #[test]
    fn slab_custom_day_35_within_grace() {
        // Day 35: 1 full month + 5 extra days (≤grace=5) → no extra charge
        let r = calculate_interest(&pledge_n_days_old(35, 50000.0, 5.0), &s("SLAB_WITH_CUSTOM", 5), 2500.0);
        assert_eq!(r.total_interest, 2500.0);
        assert_eq!(r.interest_pending, 0.0);
    }

    #[test]
    fn slab_custom_day_36_half_month() {
        // Day 36: 1 full month + 6 extra days (grace+1=6 ≤ grace+15=20) → half month
        let r = calculate_interest(&pledge_n_days_old(36, 50000.0, 5.0), &s("SLAB_WITH_CUSTOM", 5), 2500.0);
        assert!((r.total_interest - 3750.0).abs() < 0.01);
        assert!((r.interest_pending - 1250.0).abs() < 0.01);
    }

    #[test]
    fn slab_custom_day_50_still_half_month() {
        // Day 50: 1 full month + 20 extra days (grace+15=20) → still half month
        let r = calculate_interest(&pledge_n_days_old(50, 50000.0, 5.0), &s("SLAB_WITH_CUSTOM", 5), 2500.0);
        assert!((r.total_interest - 3750.0).abs() < 0.01);
        assert!((r.interest_pending - 1250.0).abs() < 0.01);
    }

    #[test]
    fn slab_custom_day_51_full_second_month() {
        // Day 51: 1 full month + 21 extra days (>grace+15=20) → full 2nd month
        let r = calculate_interest(&pledge_n_days_old(51, 50000.0, 5.0), &s("SLAB_WITH_CUSTOM", 5), 2500.0);
        assert!((r.total_interest - 5000.0).abs() < 0.01);
        assert!((r.interest_pending - 2500.0).abs() < 0.01);
    }

    // ── DAILY ─────────────────────────────────────────────────────────────────

    #[test]
    fn daily_15_days() {
        // daily rate = 2500/30 = 83.33, × 15 = 1250
        let r = calculate_interest(&pledge_n_days_old(15, 50000.0, 5.0), &s("DAILY", 15), 2500.0);
        assert!((r.total_interest - 1250.0).abs() < 0.5);
        assert_eq!(r.interest_pending, 0.0); // less than already paid
    }

    #[test]
    fn daily_45_days() {
        // daily rate = 83.33, × 45 = 3750, paid 2500 → pending 1250
        let r = calculate_interest(&pledge_n_days_old(45, 50000.0, 5.0), &s("DAILY", 15), 2500.0);
        assert!((r.total_interest - 3750.0).abs() < 1.0);
        assert!((r.interest_pending - 1250.0).abs() < 1.0);
    }

    // ── Overpayment guard ─────────────────────────────────────────────────────

    #[test]
    fn pending_never_negative() {
        // interest_paid > total_interest → pending must be 0, never negative
        let r = calculate_interest(&pledge_n_days_old(10, 50000.0, 5.0), &s("SLAB_WITH_HALF", 15), 9999.0);
        assert_eq!(r.interest_pending, 0.0);
    }
}