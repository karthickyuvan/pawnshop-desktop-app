import { invoke } from "@tauri-apps/api/core";

export const createExpense = async (data) => {
  return await invoke("create_expense", { req: data });
};

export const getExpenses = async () => {
  return await invoke("get_expenses");
};

export const deleteExpense = async (expense_id, actor_user_id) => {
  return await invoke("delete_expense", {
    expense_id,
    actor_user_id
  });
};


export const getExpenseCategories = async () => {
  return await invoke("get_expense_categories");
};


export const getExpenseStats = async () => {
  return await invoke("get_expense_stats");
};
