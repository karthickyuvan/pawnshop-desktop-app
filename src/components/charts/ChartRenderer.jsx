import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    Legend
  } from "recharts";
  
  const getMetalColor = (metal) => {
  switch ((metal || "").toUpperCase()) {
    case "GOLD":
      return "#FFD700"; // Gold

    case "SILVER":
      return "#C0C0C0"; // Silver

    case "PLATINUM":
      return "#E5E4E2"; // Platinum

    default:
      return "#1976d2";
  }
};

  export default function ChartRenderer({
    type,
    data,
    xKey,
    yKey,
    dataKey,
    height = 300
  }) {
  
    if (type === "line") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke="#1976d2" />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  
    if (type === "bar") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  
    if (type === "pie") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Tooltip />
            <Legend />
<Pie
  data={data}
  dataKey={dataKey}
  nameKey={xKey}
  outerRadius={100}
  label
>
  {data.map((entry, index) => (
    <Cell
      key={`cell-${index}`}
      fill={getMetalColor(entry.metal)}
    />
  ))}
</Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }
  
    return null;
  }