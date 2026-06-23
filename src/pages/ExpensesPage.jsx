
// src/pages/ExpensesPage.jsx

import { useEffect, useState } from "react";
import "./expense.css";
import ExpenseHeader from "../components/expense/Expenseheader";
import ExpenseStatsCards from "../components/expense/ExpenseStatscard";
import ExpenseCharts from "../components/expense/ExpenseCharts";
import ExpenseTableLayout from "../components/expense/ExpenseTable";
import { getExpenses, getExpenseStats } from "../services/expenseApi";

export default function ExpensesPage({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  const isStaff = user?.role === "STAFF"; // ✅ Evaluates user role

  const loadStats = async () => {
    try {
      const data = await getExpenseStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  const loadExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
      setFilteredExpenses(data); // initialize
    } catch (err) {
      console.error("Failed to load expenses", err);
    }
  };

  useEffect(() => {
    loadStats();
    loadExpenses();
  }, []);

  return (
    <div className="expense-container">
      <ExpenseHeader
        user={user}
        reload={() => {
          loadExpenses();
          loadStats();
        }}
      />

      {/* ✅ HIDE: Protect aggregate company stats outlays from staff */}
      {!isStaff && <ExpenseStatsCards stats={stats} />}

      <ExpenseTableLayout
        expenses={expenses}               
        user={user}
        reload={() => {
          loadExpenses();
          loadStats();
        }}
        onFilter={setFilteredExpenses}     // send filtered data up
      />

      {/* ✅ HIDE: Protect aggregate charting outlays from staff */}
      {!isStaff && <ExpenseCharts expenses={filteredExpenses} />}
    </div>
  );
}