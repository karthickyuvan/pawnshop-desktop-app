#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// 1. MODULE REGISTRATION
mod audit;
mod auth;
mod bank_mapping;
mod banks;
mod customer;
mod db;
mod expense;
mod fund_management;
mod interest;
mod jewellery_types;
mod metal_types;
mod payments;
mod pledge;
mod price_per_gram;
mod schemes;
mod settings;
mod daybook;
mod dashboard;
mod repledge;
mod shop_settings; 

// 2. IMPORTS
use crate::db::connection::Db;
use tauri::{Manager, State};

// Auth
use auth::login::{login_user, LoginResponse};
use auth::owner::{create_owner, owner_exists};
use auth::staff::{create_staff, get_all_staff, update_staff_status};

// Audit
use audit::audit_service::{get_audit_logs, log_action};

// Masters
use bank_mapping::service::{BankMappingRequest as MapBankRequest, BankUnmappingRequest as UnmapBankRequest};


use banks::service::*;
use jewellery_types::services::{
    create_jewellery_type, get_jewellery_types, toggle_jewellery_type, JewelleryType,
};
use metal_types::service::*;
use price_per_gram::service::*;
use schemes::service::*;

// settings for interest calcuation
use settings::service::SystemSettings;

use payments::service::{get_quick_access_pledges, get_today_payment_history, search_pledges};
use crate::payments::service::get_payment_history;

use crate::daybook::service::DaybookResponse;

use dashboard::service::get_owner_dashboard_summary;

// ---------------- AUTH COMMANDS ----------------
#[tauri::command]
fn login_cmd(db: State<Db>, username: String, password: String) -> Result<LoginResponse, String> {
    let result = login_user(&db, &username, &password)?;
    log_action(&db, result.user_id, "LOGIN");
    Ok(result)
}

#[tauri::command]
fn logout_cmd(db: State<Db>, user_id: i64) {
    log_action(&db, user_id, "LOGOUT");
}

#[tauri::command]
fn check_owner(db: State<Db>) -> bool {
    owner_exists(&db)
}

#[tauri::command]
fn create_owner_cmd(db: State<Db>, username: String, password: String) -> Result<(), String> {
    create_owner(&db, &username, &password)
}

// ---------------- STAFF COMMANDS ----------------
#[tauri::command]
fn create_staff_cmd(
    db: State<Db>,
    username: String,
    password: String,
    actor_user_id: i64,
) -> Result<(), String> {
    create_staff(&db, &username, &password)?;
    log_action(&db, actor_user_id, "STAFF_CREATED");
    Ok(())
}

#[tauri::command]
fn get_staff_cmd(db: State<Db>) -> Result<Vec<auth::staff::StaffUser>, String> {
    get_all_staff(&db)
}

#[tauri::command]
fn toggle_staff_cmd(
    db: State<Db>,
    staff_id: i64,
    is_active: bool,
    actor_user_id: i64,
) -> Result<(), String> {
    update_staff_status(&db, staff_id, is_active)?;
    log_action(
        &db,
        actor_user_id,
        if is_active {
            "STAFF_ENABLED"
        } else {
            "STAFF_DISABLED"
        },
    );
    Ok(())
}

// ---------------- AUDIT COMMANDS ----------------
#[tauri::command]
fn get_audit_logs_cmd(db: State<Db>) -> Result<Vec<audit::audit_service::AuditLog>, String> {
    get_audit_logs(&db)
}

// ---------------- METAL TYPE COMMANDS ----------------
#[tauri::command]
fn create_metal_type_cmd(
    db: State<Db>,
    name: String,
    description: Option<String>,
    actor_user_id: i64,
) -> Result<(), String> {
    create_metal_type(&db, &name, description.as_deref())?;
    log_action(&db, actor_user_id, "METAL_TYPE_CREATED");
    Ok(())
}

#[tauri::command]
fn get_metal_types_cmd(db: State<Db>) -> Result<Vec<MetalType>, String> {
    get_metal_types(&db)
}

#[tauri::command]
fn toggle_metal_type_cmd(
    db: State<Db>,
    metal_type_id: i64,
    is_active: bool,
    actor_user_id: i64,
) -> Result<(), String> {
    toggle_metal_type(&db, metal_type_id, is_active)?;
    log_action(&db, actor_user_id, "METAL_TYPE_STATUS_CHANGED");
    Ok(())
}

// ---------------- JEWELLERY TYPE COMMANDS ----------------
#[tauri::command]
fn create_jewellery_type_cmd(
    db: State<Db>,
    metal_type_id: i64,
    name: String,
    description: Option<String>,
    actor_user_id: i64,
) -> Result<(), String> {
    create_jewellery_type(&db, metal_type_id, &name, description.as_deref())?;
    log_action(&db, actor_user_id, "JEWELLERY_TYPE_CREATED");
    Ok(())
}

#[tauri::command]
fn get_jewellery_types_cmd(db: State<Db>) -> Result<Vec<JewelleryType>, String> {
    get_jewellery_types(&db)
}

#[tauri::command]
fn toggle_jewellery_type_cmd(
    db: State<Db>,
    jewellery_type_id: i64,
    is_active: bool,
    actor_user_id: i64,
) -> Result<(), String> {
    toggle_jewellery_type(&db, jewellery_type_id, is_active)?;
    log_action(&db, actor_user_id, "JEWELLERY_TYPE_STATUS_CHANGED");
    Ok(())
}


#[tauri::command]
fn fetch_daybook(db: tauri::State<Db>, date: String) -> Result<DaybookResponse, String> {
    daybook::service::get_daybook(&db, date)
}

// ---------------- SCHEME COMMANDS ----------------
#[tauri::command]
fn create_scheme_cmd(
    db: State<Db>,
    metal_type_id: i64,
    scheme_name: String,
    loan_percentage: f64,
    price_program: String,
    interest_rate: f64,
    interest_type: String,
    processing_fee_type: String,
    processing_fee_value: Option<f64>,
    actor_user_id: i64,
) -> Result<(), String> {
    create_scheme(
        &db,
        metal_type_id,
        &scheme_name,
        loan_percentage,
        &price_program,
        interest_rate,
        &interest_type,
        &processing_fee_type,
        processing_fee_value,
    )?;
    log_action(&db, actor_user_id, "SCHEME_CREATED");
    Ok(())
}

#[tauri::command]
fn get_schemes_cmd(db: State<Db>) -> Result<Vec<Scheme>, String> {
    get_schemes(&db)
}

#[tauri::command]
fn toggle_scheme_cmd(
    db: State<Db>,
    scheme_id: i64,
    is_active: bool,
    actor_user_id: i64,
) -> Result<(), String> {
    toggle_scheme(&db, scheme_id, is_active)?;
    log_action(&db, actor_user_id, "SCHEME_STATUS_CHANGED");
    Ok(())
}

#[tauri::command]
fn update_scheme_cmd(
    db: State<Db>,
    id: i64,
    metal_type_id: i64,
    scheme_name: String,
    loan_percentage: f64,
    price_program: String,
    interest_rate: f64,
    interest_type: String,
    processing_fee_type: String,
    processing_fee_value: Option<f64>,
    actor_user_id: i64,
) -> Result<(), String> {
    schemes::service::update_scheme(
        &db,
        id,
        metal_type_id,
        &scheme_name,
        loan_percentage,
        &price_program,
        interest_rate,
        &interest_type,
        &processing_fee_type,
        processing_fee_value,
    )
    .map_err(|e| e.to_string())?;

    log_action(&db, actor_user_id, "SCHEME_UPDATED");
    Ok(())
}

// ---------------- PRICE COMMANDS ----------------
#[tauri::command]
fn set_price_per_gram_cmd(
    db: State<Db>,
    metal_type_id: i64,
    price_per_gram: f64,
    actor_user_id: i64,
) -> Result<(), String> {
    set_price_per_gram(&db, metal_type_id, price_per_gram)?;
    log_action(&db, actor_user_id, "PRICE_PER_GRAM_UPDATED");
    Ok(())
}

#[tauri::command]
fn get_price_per_gram_cmd(db: State<Db>) -> Result<Vec<PricePerGram>, String> {
    get_prices(&db)
}

// ---------------- BANK COMMANDS ----------------
#[tauri::command]
fn create_bank_cmd(
    db: State<Db>,
    bank_name: String,
    branch_name: String,
    account_number: String,
    ifsc_code: String,
    actor_user_id: i64,
) -> Result<(), String> {
    create_bank(&db, &bank_name, &branch_name, &account_number, &ifsc_code)?;
    audit::audit_service::log_action(&db, actor_user_id, "BANK_CREATED");
    Ok(())
}

#[tauri::command]
fn get_banks_cmd(db: State<Db>) -> Result<Vec<Bank>, String> {
    get_banks(&db)
}

// ---------------- BANK MAPPING COMMANDS ----------------

#[tauri::command]
fn get_pledge_by_number_cmd(
    db: State<Db>,
    pledge_no: String,
) -> Result<bank_mapping::service::PledgeDetails, String> {
    bank_mapping::service::get_pledge_by_number(&db, &pledge_no)
}


#[tauri::command]
fn map_bank_to_pledge(
    db: tauri::State<Db>,
    req: MapBankRequest,
) -> Result<(), String> {
    let _ = bank_mapping::service::map_bank_to_pledge(&db, &req)?;
    audit::audit_service::log_action(&db, req.actor_user_id, "BANK_MAPPED");
    Ok(())
}

#[tauri::command]
fn unmap_bank_from_pledge(
    db: tauri::State<Db>,
    req: UnmapBankRequest,
) -> Result<(), String> {
    bank_mapping::service::unmap_bank_from_pledge(&db, &req)?;
    audit::audit_service::log_action(&db, req.actor_user_id, "BANK_UNMAPPED");
    Ok(())
}

#[tauri::command]
fn get_bank_mappings_list_cmd(
    db: State<Db>,
) -> Result<Vec<serde_json::Value>, String> {
    bank_mapping::service::get_bank_mappings(&db)
}


#[tauri::command]
fn search_pledges_for_mapping_cmd(
    db: State<Db>,
    query: String,
) -> Result<Vec<bank_mapping::service::PledgeDetails>, String> {
    bank_mapping::service::search_pledges_for_mapping(&db, &query)
}

// ---------------- FUND COMMANDS ----------------
#[tauri::command]
fn get_available_cash_cmd(db: State<Db>) -> Result<f64, String> {
    fund_management::service::get_available_cash(&db).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_fund_cmd(
    db: State<Db>,
    created_by: i64,
    reason: String,
    payment_method: String,
    transaction_ref: Option<String>,
    amount: f64,
    denominations: Vec<(i32, i32)>,
) -> Result<(), String> {
    fund_management::service::add_fund(
        &db,
        created_by,
        reason,
        payment_method,
        transaction_ref,
        amount,
        denominations,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn withdraw_fund_cmd(
    db: State<Db>,
    created_by: i64,
    reason: String,
    payment_method: String,
    transaction_ref: Option<String>,
    amount: f64,
    denominations: Vec<(i32, i32)>,
) -> Result<(), String> {
    fund_management::service::withdraw_fund(
        &db,
        created_by,
        reason,
        payment_method,
        transaction_ref,
        amount,
        denominations,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_fund_ledger_cmd(
    db: State<Db>,
) -> Result<Vec<(i64, String, f64, String, String, String)>, String> {
    fund_management::service::get_fund_ledger(&db).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_current_denominations_cmd(db: State<Db>) -> Result<Vec<(i32, i32)>, String> {
    fund_management::service::get_current_denominations(&db)
}

// ---------------- CUSTOMER COMMANDS ----------------
#[tauri::command]
fn add_customer_cmd(
    db: State<Db>,
    name: String,
    relation: Option<String>,
    phone: String,
    email: Option<String>,
    address: Option<String>,
    id_proof_type: Option<String>,
    id_proof_number: Option<String>,
    actor_user_id: i64,
) -> Result<serde_json::Value, String> {
    let customer = customer::service::add_customer(
        &db,
        &name,
        relation.as_deref(),
        &phone,
        email.as_deref(),
        address.as_deref(),
        id_proof_type.as_deref(),
        id_proof_number.as_deref(),
    )
    .map_err(|e| e.to_string())?;

    log_action(&db, actor_user_id, "CUSTOMER_CREATED");
    Ok(serde_json::json!(customer))
}

#[tauri::command]
fn search_customers_cmd(db: State<Db>, query: String) -> Result<serde_json::Value, String> {
    let customers = customer::service::search_customers(&db, &query).map_err(|e| e.to_string())?;
    Ok(serde_json::json!(customers))
}

#[tauri::command]
fn customer_summary_cmd(db: State<Db>) -> Result<serde_json::Value, String> {
    let summary = customer::service::get_customer_summary(&db).map_err(|e| e.to_string())?;
    Ok(serde_json::json!(summary))
}

#[tauri::command]
fn save_customer_photo_cmd(
    app: tauri::AppHandle,
    db: State<Db>,
    customer_id: i64,
    image_base64: String,
) -> Result<String, String> {
    println!("📸 Saving photo for customer ID: {}", customer_id);
    println!("📸 Base64 length: {}", image_base64.len());

    let result = customer::service::save_customer_photo(&db, &app, customer_id, &image_base64);

    match &result {
        Ok(path) => println!("✅ Photo saved: {}", path),
        Err(e) => println!("❌ Photo save failed: {}", e),
    }

    result
}
#[tauri::command]
fn update_customer_cmd(
    db: State<Db>,
    id: i64,
    name: String,
    relation: Option<String>,
    phone: String,
    email: Option<String>,
    address: Option<String>,
    id_proof_type: Option<String>,
    id_proof_number: Option<String>,
    actor_user_id: i64,
) -> Result<(), String> {
    customer::service::update_customer(
        &db,
        id,
        &name,
        relation.as_deref(),
        &phone,
        email.as_deref(),
        address.as_deref(),
        id_proof_type.as_deref(),
        id_proof_number.as_deref(),
    )
    .map_err(|e| e.to_string())?;

    log_action(&db, actor_user_id, "CUSTOMER_UPDATED");
    Ok(())
}

// ---------------- PLEDGE COMMANDS ----------------
#[tauri::command]
fn create_pledge_cmd(
    app: tauri::AppHandle,
    db: State<Db>,
    request: pledge::service::CreatePledgeRequest,
) -> Result<String, String> {
    pledge::service::create_pledge(&db, &app, request)
}

#[tauri::command]
fn get_all_pledges_cmd(
    db: State<Db>,
    search: Option<String>,
    actor_user_id: i64,
) -> Result<pledge::service::PledgeListResponse, String> {
    let result = pledge::service::get_all_pledges(&db, search)?;

    audit::audit_service::log_action(&db, actor_user_id, "VIEW_PLEDGES");

    Ok(result)
}

#[tauri::command]
fn get_single_pledge_cmd(
    db: State<Db>,
    pledge_id: i64,
) -> Result<pledge::service::SinglePledgeResponse, String> {
    pledge::service::get_single_pledge(&db, pledge_id)
}

// system settings for interest calculation
#[tauri::command]
fn get_system_settings_cmd(db: tauri::State<Db>) -> Result<SystemSettings, String> {
    settings::service::get_system_settings(&db)
}

#[tauri::command]
fn update_system_settings_cmd(
    db: tauri::State<Db>,
    settings: SystemSettings,
) -> Result<(), String> {
    settings::service::update_system_settings(&db, settings)
}

#[tauri::command]
fn calculate_payment_cmd(db: State<Db>, pledge_id: i64) -> Result<serde_json::Value, String> {
    pledge::service::calculate_payment(&db, pledge_id)
}

#[tauri::command]
fn add_pledge_payment_cmd(
    db: tauri::State<Db>,
    req: pledge::service::AddPaymentRequest,
) -> Result<(), String> {
    pledge::service::add_pledge_payment(&db, req)
}

// ----------------REPLEDGE ----------------

#[tauri::command]
fn get_eligible_pledges_for_repledge_cmd(
    db: tauri::State<Db>,
    query: String,
) -> Result<Vec<repledge::service::RepledgeListItem>, String> {
    repledge::service::get_eligible_pledges_for_repledge(&db, &query)
}

#[tauri::command]
fn get_repledge_detail_cmd(
    db: tauri::State<Db>,
    pledge_id: i64,
) -> Result<repledge::service::RepledgeDetailResponse, String> {
    repledge::service::get_repledge_detail(&db, pledge_id)
}

#[tauri::command]
fn execute_repledge_cmd(
    db: tauri::State<Db>,
    req: repledge::service::ExecuteRepledgeRequest,
) -> Result<repledge::service::RepledgeResult, String> {
    let result = repledge::service::execute_repledge(&db, &req)?;
    audit::audit_service::log_action(&db, req.created_by, "REPLEDGE_EXECUTED");
    Ok(result)
}
// ---------------- MAIN ----------------
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let db_path = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir")
                .join("pawnshop.db");
            let db = db::setup_database(db_path);
            app.manage(db);
            Ok(())
        })
        
       
        .invoke_handler(tauri::generate_handler![
            // Auth
            check_owner,
            create_owner_cmd,
            login_cmd,
            logout_cmd,
            // Staff
            create_staff_cmd,
            get_staff_cmd,
            toggle_staff_cmd,
            // Audit
            get_audit_logs_cmd,
            // Metal Types
            create_metal_type_cmd,
            get_metal_types_cmd,
            toggle_metal_type_cmd,
            // Jewellery Types
            create_jewellery_type_cmd,
            get_jewellery_types_cmd,
            toggle_jewellery_type_cmd,
            // Schemes
            create_scheme_cmd,
            get_schemes_cmd,
            toggle_scheme_cmd,
            update_scheme_cmd,
            // Price
            set_price_per_gram_cmd,
            get_price_per_gram_cmd,
            // Banks
            create_bank_cmd,
            get_banks_cmd,
            // Bank Mapping
            get_pledge_by_number_cmd,        
            get_bank_mappings_list_cmd,     
            map_bank_to_pledge,              
            unmap_bank_from_pledge,
            search_pledges_for_mapping_cmd,
            // Funds
            get_available_cash_cmd,
            add_fund_cmd,
            withdraw_fund_cmd,
            get_fund_ledger_cmd,
            get_current_denominations_cmd,
            // Customers
            add_customer_cmd,
            search_customers_cmd,
            customer_summary_cmd,
            save_customer_photo_cmd,
            update_customer_cmd,
            // Pledges
            create_pledge_cmd,
            get_all_pledges_cmd,
            get_single_pledge_cmd,
            // interest calc setting
            get_system_settings_cmd,
            update_system_settings_cmd,
            // payment
            calculate_payment_cmd,
            add_pledge_payment_cmd,
            // expense
            expense::service::create_expense,
            expense::service::get_expenses,
            expense::service::delete_expense,
            expense::service::get_expense_categories,
            expense::service::get_expense_stats,
            // Payment
            get_today_payment_history,
            search_pledges,
            get_quick_access_pledges,
            get_payment_history,

            // daybook
            fetch_daybook,

            //dashboard
            get_owner_dashboard_summary,

            // repledge
            get_eligible_pledges_for_repledge_cmd,
            get_repledge_detail_cmd,
            execute_repledge_cmd,

            // ── Shop Settings (NEW) ───────────────────────────────────────
            shop_settings::service::get_shop_settings,
            shop_settings::service::save_shop_settings,
            shop_settings::service::change_password,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
