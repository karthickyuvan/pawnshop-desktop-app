import { useEffect, useState } from "react";
import "./expense.css";
import ExpenseHeader from "../components/expense/Expenseheader";
import ExpenseStatsCards from "../components/expense/ExpenseStatscard";
import ExpenseCharts from "../components/expense/ExpenseCharts";
import ExpenseTableLayout from "../components/expense/ExpenseTable";
import { getExpenses, getExpenseStats } from "../services/expenseApi";
import CashDenominationInput,{calcDenomTotal,
  emptyDenominations,} from "../constants/CashDenominationInput";


export default function ExpensesPage({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [denominations, setDenominations] = useState(emptyDenominations());
const totalCash = calcDenomTotal(denominations);

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
      setFilteredExpenses(data); // ✅ initialize
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

      <ExpenseStatsCards stats={stats} />

      <ExpenseTableLayout
        expenses={expenses}               
        user={user}
        reload={() => {
          loadExpenses();
          loadStats();
        }}
        onFilter={setFilteredExpenses}     // send filtered data up
      />

      <ExpenseCharts expenses={filteredExpenses} /> {/* charts update */}
    </div>
  );
}