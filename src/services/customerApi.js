import { invoke } from "@tauri-apps/api/core";

// 1. Add Customer
export const addCustomer = async (data, userId) => {
  // ✅ Rust returns the full Customer object as JSON
  const result = await invoke("add_customer_cmd", {
    name: data.name,
    relation: data.relation || null,
    phone: data.phone,
    email: data.email || null,
    address: data.address || null,
    idProofType: data.idProofType || null,   
    idProofNumber: data.idProofNumber || null, 
    actorUserId: userId,
  });

  // ✅ The result is already a parsed object from Rust's serde_json::json!
  // It contains: { id, name, relation, phone, email, address, id_proof_type, id_proof_number, photo_path }
  return result;
};

// 2. Search Customers
export const searchCustomers = async (query) => {
  return await invoke("search_customers_cmd", {
    query: query || "",
  });
};

// 3. Get Summary (Total/Repeated)
export const getCustomerSummary = async () => {
  return await invoke("customer_summary_cmd");
};

// 4. Save Photo
export const saveCustomerPhoto = async (customerId, base64Image) => {
  return await invoke("save_customer_photo_cmd", {
    customerId,
    imageBase64: base64Image,
  });
};

// 5. Update Customer 

export const updateCustomer = async (id, data, userId) => {
  return await invoke("update_customer_cmd", {
    id,
    name: data.name,
    relation: data.relation || null,
    phone: data.phone,
    email: data.email || null,
    address: data.address || null,
    idProofType: data.idProofType || null,
    idProofNumber: data.idProofNumber || null,
    actorUserId: userId,
  });
};
