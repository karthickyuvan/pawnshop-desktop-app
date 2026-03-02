import { useEffect, useState } from "react";
import "./expense.css";

import ExpenseHeader from "../components/expense/Expenseheader";
import ExpenseStatsCards from "../components/expense/ExpenseStatscard";
import ExpenseCharts from "../components/expense/ExpenseCharts";
import ExpenseTableLayout from "../components/expense/ExpenseTable";
import {getExpenses,getExpenseStats} from "../services/expenseApi";

export default function ExpensesPage({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);


  useEffect(() => {
    loadStats();
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error("Failed to load expenses", err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getExpenseStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  return (
    <div className="expense-container">
      
      <ExpenseHeader user={user} reload={() => {
        loadExpenses();
        loadStats();
      }} />

      <ExpenseStatsCards  stats={stats}/>


      <ExpenseTableLayout
        expenses={expenses}
        user={user}
        reload={() => {
          loadExpenses();
          loadStats();
        }}
      />

<ExpenseCharts expenses={expenses} />
    </div>
  );
}
