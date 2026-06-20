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
    interest_paid_in_current_cycle: f64,
) -> InterestBreakdown {
    let today = Local::now().naive_local().date();
    
    // 🚀 NEW: Start calculation from last_interest_date
    let start_date = NaiveDate::parse_from_str(&pledge.last_interest_date[..10], "%Y-%m-%d")
        .unwrap_or_else(|_| NaiveDate::parse_from_str(&pledge.created_at[..10], "%Y-%m-%d").unwrap_or(today));

    let days_elapsed = (today - start_date).num_days().max(0);
    let principal = pledge.principal_amount;
    let rate = pledge.interest_rate;

    let monthly_interest = principal * rate / 100.0;
    let half_interest = monthly_interest / 2.0;

    let full_months = days_elapsed / 30;  
    let extra_days = days_elapsed % 30;   

    match settings.interest_calculation_type.as_str() {
        "DAILY" => {
            let daily_rate = monthly_interest / 30.0;
            let total_interest = daily_rate * days_elapsed as f64;
            let interest_pending = (total_interest - interest_paid_in_current_cycle).max(0.0);
            InterestBreakdown { months_elapsed: 0, total_interest, interest_paid: interest_paid_in_current_cycle, interest_pending }
        }
        "MONTHLY" => {
            let months = full_months as i32;
            let total_interest = monthly_interest * months as f64;
            let interest_pending = (total_interest - interest_paid_in_current_cycle).max(0.0);
            InterestBreakdown { months_elapsed: months, total_interest, interest_paid: interest_paid_in_current_cycle, interest_pending }
        }
        "SLAB_WITH_HALF" => {
            let slab_extra = if extra_days == 0 {
                0.0
            } else if extra_days <= 15 {
                half_interest
            } else {
                monthly_interest
            };
            let total_interest = (monthly_interest * full_months as f64) + slab_extra;
            let interest_pending = (total_interest - interest_paid_in_current_cycle).max(0.0);
            InterestBreakdown { months_elapsed: full_months as i32, total_interest, interest_paid: interest_paid_in_current_cycle, interest_pending }
        }
        "SLAB_WITH_CUSTOM" | _ => {
            let grace = settings.grace_days as i64;
            let half_boundary = grace + 15;

            let slab_extra = if extra_days == 0 {
                0.0
            } else if extra_days <= grace {
                0.0                 
            } else if extra_days <= half_boundary {
                half_interest       
            } else {
                monthly_interest    
            };
            let total_interest = (monthly_interest * full_months as f64) + slab_extra;
            let interest_pending = (total_interest - interest_paid_in_current_cycle).max(0.0);
            InterestBreakdown { months_elapsed: full_months as i32, total_interest, interest_paid: interest_paid_in_current_cycle, interest_pending }
        }
    }
}