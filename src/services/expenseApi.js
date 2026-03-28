// import { invoke } from "@tauri-apps/api/core";

// export const createExpense = async (data) => {
//   return await invoke("create_expense", { req: data });
// };

// export const getExpenses = async () => {
//   return await invoke("get_expenses");
// };

// export const deleteExpense = async (expense_id, actor_user_id) => {
//   return await invoke("delete_expense", {
//     expense_id,
//     actor_user_id
//   });
// };


// export const getExpenseCategories = async () => {
//   return await invoke("get_expense_categories");
// };


// export const getExpenseStats = async () => {
//   return await invoke("get_expense_stats");
// };




import { invoke } from "@tauri-apps/api/core";

export const createExpense = async (data) => {
  try {
    return await invoke("create_expense", { req: data });
  } catch (error) {
    console.error("Create Expense Error:", error);
    throw error;
  }
};

export const getExpenses = async () => {
  try {
    return await invoke("get_expenses");
  } catch (error) {
    console.error("Get Expenses Error:", error);
    throw error;
  }
};

export const deleteExpense = async (expense_id, actor_user_id) => {
  try {
    return await invoke("delete_expense", {
      expense_id,
      actor_user_id,
    });
  } catch (error) {
    console.error("Delete Expense Error:", error);
    throw error;
  }
};

export const getExpenseCategories = async () => {
  try {
    return await invoke("get_expense_categories");
  } catch (error) {
    console.error("Get Categories Error:", error);
    throw error;
  }
};

export const getExpenseStats = async () => {
  try {
    return await invoke("get_expense_stats");
  } catch (error) {
    console.error("Get Stats Error:", error);
    throw error;
  }
};

export const createExpenseCategory = async (name) => {
  try {
    return await invoke("create_expense_category", { name });
  } catch (error) {
    console.error("Create Category Error:", error);
    throw error;
  }
};


export const updateExpenseCategory = async (id, name) => {
  return await invoke("update_expense_category", { id, name });
};

export const toggleExpenseCategoryStatus = async (id, is_active) => {
  return await invoke("toggle_expense_category_status", {
    id,
    is_active,
  });
};