use crate::pledge::service::PledgeDetails;
use crate::settings::service::SystemSettings;
use chrono::{Local, NaiveDate};

pub struct InterestBreakdown {
    pub months_elapsed: i32,
    pub total_interest: f64,
    pub interest_paid: f64,
    pub interest_pending: f64,
}

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

    // 🔥 Calculate months_elapsed based on system setting
    let months_elapsed = match settings.interest_calculation_type.as_str() {
        // 🟢 FIXED MONTHLY
        "MONTHLY" => (days_elapsed / 30) as i32,

        // 🟢 DAILY
        "DAILY" => {
            let total_interest = (monthly_interest / 30.0) * days_elapsed as f64;

            let interest_pending = if total_interest > interest_paid {
                total_interest - interest_paid
            } else {
                0.0
            };

            return InterestBreakdown {
                months_elapsed: 0,
                total_interest,
                interest_paid,
                interest_pending,
            };
        }

        // 🟢 SLAB WITH 15 (Auto)
        "SLAB_WITH_15" => {
            let months = days_elapsed / 30;
            let extra_days = days_elapsed % 30;

            if extra_days >= 16 {
                (months + 1) as i32
            } else if extra_days >= 1 {
                (months + 1) as i32 // treat half month as full
            } else {
                months as i32
            }
        }

        // 🟢 SLAB WITH CUSTOM
        "SLAB_WITH_CUSTOM" => {
            let months = days_elapsed / 30;
            let extra_days = days_elapsed % 30;

            if extra_days > settings.grace_days as i64 {
                (months + 1) as i32
            } else {
                months as i32
            }
        }

        _ => (days_elapsed / 30) as i32,
    };

    // 🔥 Total interest based on months
    let total_interest = monthly_interest * months_elapsed as f64;

    let interest_pending = if total_interest > interest_paid {
        total_interest - interest_paid
    } else {
        0.0
    };

    InterestBreakdown {
        months_elapsed,
        total_interest,
        interest_paid,
        interest_pending,
    }
}
