

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useLanguage } from "../../context/LanguageContext";
const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

export default function ExpenseCharts({ expenses = [] }) {
  /* ===============================
     MONTHLY EXPENSE AGGREGATION
  =============================== */
  const monthlyMap = {};
const {t}=useLanguage();
  expenses.forEach((exp) => {
    const monthKey = new Date(exp.expense_date).toLocaleString("default", {
      month: "short",
    });

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthKey, total: 0 };
    }

    monthlyMap[monthKey].total += exp.amount;
  });

  const monthlyData = Object.values(monthlyMap);

  /* ===============================
     CATEGORY AGGREGATION
  =============================== */
  const categoryMap = {};

  expenses.forEach((exp) => {
    if (!categoryMap[exp.category_name]) {
      categoryMap[exp.category_name] = {
        name: exp.category_name,
        value: 0,
      };
    }

    categoryMap[exp.category_name].value += exp.amount;
  });

  const categoryData = Object.values(categoryMap);

  return (
    <div className="charts-grid">
      {/* Monthly Trend */}
      <div className="chart-card">
      <h3>{t("monthly_expense_trend")}</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="total"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Pie */}
      <div className="chart-card">
      <h3>{t("expense_by_category")}</h3>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {categoryData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}