
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext"; // ✅ Imported custom language hook
import "./StockReportPage.css";
import ChartRenderer from "../components/charts/ChartRenderer";

export default function StockReportPage() {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  
  // ✅ Currency formatter function
  const formatCurrency = (amt) => {
    return `₹${(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const [rows, setRows] = useState([]);
  const [totalActivePockets, setTotalActivePockets] = useState(0);
  const [storeActivePockets, setStoreActivePockets] = useState(0);
  const [bankActivePockets, setBankActivePockets] = useState(0);
  const [currentPocketRunning, setCurrentPocketRunning] = useState(0);
  const [metalPockets, setMetalPockets] = useState([]);

  const [activeTab, setActiveTab] = useState("stock");
  const [movementRows, setMovementRows] = useState([]);
  const today = new Date().toISOString().split("T")[0];

  const [movementFilter, setMovementFilter] = useState("month");
  const [movementDate, setMovementDate] = useState(today);
  const [movementFromDate, setMovementFromDate] = useState(today);
  const [movementToDate, setMovementToDate] = useState(today);

  const [movementMonth, setMovementMonth] = useState(new Date().getMonth() + 1);
  const [movementYear, setMovementYear] = useState(new Date().getFullYear());

  const loadReport = async () => {
    try {
      const result = await invoke("get_stock_report_cmd");
      setRows(result.rows || []);
      setTotalActivePockets(result.total_active_pockets);
      setStoreActivePockets(result.store_active_pockets);
      setBankActivePockets(result.bank_active_pockets);
      setCurrentPocketRunning(result.current_pocket_running);
      setMetalPockets(result.metal_pockets || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMovementReport = async () => {
    try {
      const result = await invoke("get_metal_movement_report_cmd", {
        filterType: movementFilter,
        selectedDate: movementDate,
        fromDate: movementFromDate,
        toDate: movementToDate,
        month: movementMonth,
        year: movementYear,
      });
      setMovementRows(result.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  useEffect(() => {
    if (activeTab === "movement") {
      loadMovementReport();
    }
  }, [activeTab]);

  return (
    <div className="stock-page">
      {/* ── Header ── */}
      <div className="report-header">
        <h2>{activeTab === "stock" ? t("gold_stock_report") : t("metal_movement_lbl", "Metal Movement Report")}</h2>
        <p>
          {activeTab === "stock"
            ? t("gold_stock_report_desc")
            : t("metal_movement_desc", "Track jewellery inward and outward movement")}
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="report-tabs">
        <button className={activeTab === "stock" ? "active" : ""} onClick={() => setActiveTab("stock")}>
          {t("all_time", "Current Stock")}
        </button>
        <button className={activeTab === "movement" ? "active" : ""} onClick={() => setActiveTab("movement")}>
          {t("metal_movement_lbl", "Movement Report")}
        </button>
      </div>

      {/* ─── TAB 1: CURRENT STOCK ─── */}
      {activeTab === "stock" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", marginBottom: "24px" }}>
            
            {/* Pocket Count Card Segregated */}
            <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "12px", padding: "20px 24px" }}>
              <div style={{ fontSize: "13px", color: "#1d4ed8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                📊 {t("active_pockets_distribution", "Active Pockets Distribution")}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "12px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>🔒 {t("in_store_pockets_title", "Pockets inside Shop Locker")}</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#334155", marginTop: "4px" }}>{storeActivePockets}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    {metalPockets.map((m, idx) => (
                      <span key={idx} style={{ marginRight: "8px" }}>
                        {m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal}: <strong>{m.store_pockets}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>🏛️ {t("bank_mapped_pockets_title", "Pockets Deposited in Bank")}</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#2563eb", marginTop: "4px" }}>{bankActivePockets}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    {metalPockets.map((m, idx) => (
                      <span key={idx} style={{ marginRight: "8px" }}>
                        {m.metal === "Gold" ? t("gold") : m.metal === "Silver" ? t("silver") : m.metal}: <strong>{m.bank_pockets}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <hr style={{ border: "0", borderTop: "1px solid #bfdbfe", margin: "12px 0" }} />
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#1e3a8a", display: "flex", justifyContent: "space-between" }}>
                <span>{t("total_active_inventory", "Total Active Inventory Pockets")}:</span>
                <span>{totalActivePockets}</span>
              </div>
            </div>

            <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "12px", color: "#b45309", fontWeight: "600", textTransform: "uppercase" }}>
                {t("current_pocket_running_lbl", "Current Pocket Running No.")}
              </div>
              <div style={{ fontSize: "40px", fontWeight: "700", color: "#b45309", marginTop: "8px" }}>
                {currentPocketRunning}
              </div>
            </div>
          </div>

          {/* Expanded Inventory Audit Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr className="main-header-row">
                  <th rowSpan="2" className="metal-header text-left" style={{ verticalAlign: "middle" }}>
                    {t("metal", "Metal")}
                  </th>
                  <th colSpan="4" className="store-group-header">
                    🔒 {t("in_store_locker", "In Store Locker")}
                  </th>
                  <th colSpan="4" className="bank-group-header">
                    🏛️ {t("deposited_in_bank", "Deposited in Bank")}
                  </th>
                  <th colSpan="3" className="total-group-header">
                    ✨ {t("total_stock", "Total Stock")}
                  </th>
                </tr>
                <tr className="sub-header-row">
                  {/* Store */}
                  <th className="text-right">{t("gross_wt_lbl", "Gross")}</th>
                  <th className="text-right">{t("net_wt_lbl", "Net")}</th>
                  <th className="text-center">{t("items_lbl", "Items")}</th>
                  <th className="text-right divider-col">{t("loan_val_lbl", "Loan Val")}</th>
                  
                  {/* Bank */}
                  <th className="text-right">{t("gross_wt_lbl", "Gross")}</th>
                  <th className="text-right">{t("net_wt_lbl", "Net")}</th>
                  <th className="text-center">{t("items_lbl", "Items")}</th>
                  <th className="text-right divider-col">{t("loan_val_lbl", "Loan Val")}</th>
                  
                  {/* Totals */}
                  <th className="text-right">{t("total_gross_lbl", "Gross")}</th>
                  <th className="text-right">{t("total_net_lbl", "Net")}</th>
                  <th className="text-right">{t("total_loan_lbl", "Total Loan")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, index) => (
                    <tr key={index}>
                      <td className="metal-cell text-left">
                        {row.metal === "Gold" ? t("gold") : row.metal === "Silver" ? t("silver") : row.metal}
                      </td>
                      
                      {/* Store Locker Stock */}
                      <td className="text-right">{row.store_gross_weight.toFixed(2)} g</td>
                      <td className="text-right store-weight-cell">{row.store_net_weight.toFixed(2)} g</td>
                      <td className="text-center">{row.store_item_count} pcs</td>
                      <td className="text-right divider-col" style={{ fontWeight: "600" }}>{formatCurrency(row.store_loan_amount)}</td>

                      {/* Bank Stock */}
                      <td className="text-right">{row.bank_gross_weight.toFixed(2)} g</td>
                      <td className="text-right bank-weight-cell">{row.bank_net_weight.toFixed(2)} g</td>
                      <td className="text-center">{row.bank_item_count} pcs</td>
                      <td className="text-right divider-col" style={{ fontWeight: "600" }}>{formatCurrency(row.bank_loan_amount)}</td>

                      {/* Totals */}
                      <td className="text-right" style={{ fontWeight: "600" }}>{row.total_gross_weight.toFixed(2)} g</td>
                      <td className="text-right total-weight-cell">{row.total_net_weight.toFixed(2)} g</td>
                      <td className="text-right total-loan-cell">{formatCurrency(row.total_loan_amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                      {t("no_matching_records", "No active inventory found")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {rows.length > 0 && (
            <ChartRenderer type="pie" data={rows} xKey="metal" dataKey="total_net_weight" />
          )}
        </>
      )}

      {/* ─── TAB 2: MOVEMENT REPORT ─── */}
      {activeTab === "movement" && (
        <div className="movement-report">
          <div className="stock-filters" style={{ marginBottom: "24px", display: "flex", gap: "10px" }}>
            <select value={movementFilter} onChange={(e) => setMovementFilter(e.target.value)}>
              <option value="date">{t("single_date", "Particular Date")}</option>
              <option value="range">{t("custom_range", "Date Range")}</option>
              <option value="month">{t("monthly", "Monthly")}</option>
              <option value="year">{t("yearly", "Yearly")}</option>
            </select>

            {movementFilter === "date" && (
              <input type="date" value={movementDate} onChange={(e) => setMovementDate(e.target.value)} />
            )}

            {movementFilter === "range" && (
              <>
                <input type="date" value={movementFromDate} onChange={(e) => setMovementFromDate(e.target.value)} />
                <input type="date" value={movementToDate} onChange={(e) => setMovementToDate(e.target.value)} />
              </>
            )}

            {movementFilter === "month" && (
              <>
                <select value={movementMonth} onChange={(e) => setMovementMonth(Number(e.target.value))}>
                  <option value={1}>{t("jan")}</option>
                  <option value={2}>{t("feb")}</option>
                  <option value={3}>{t("mar")}</option>
                  <option value={4}>{t("apr")}</option>
                  <option value={5}>{t("may")}</option>
                  <option value={6}>{t("jun")}</option>
                  <option value={7}>{t("jul")}</option>
                  <option value={8}>{t("aug")}</option>
                  <option value={9}>{t("sep")}</option>
                  <option value={10}>{t("oct")}</option>
                  <option value={11}>{t("nov")}</option>
                  <option value={12}>{t("dec")}</option>
                </select>
                <input type="number" value={movementYear} onChange={(e) => setMovementYear(Number(e.target.value))} />
              </>
            )}

            {movementFilter === "year" && (
              <input type="number" value={movementYear} onChange={(e) => setMovementYear(Number(e.target.value))} />
            )}

            <button onClick={loadMovementReport}>{t("load_report_btn", "Load Movement Report")}</button>
          </div>

          {/* ── SEPARATE DYNAMIC CARDS FOR EACH METAL TYPE ── */}
          {movementRows.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "24px" }}>
              {movementRows.map((row, index) => (
                <div key={index} style={{ border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", background: "#f8fafc" }}>
                  
                  {/* Metal Category Header */}
                  <h3 style={{ margin: "0 0 16px 0", color: "#334155", borderBottom: "2px solid #cbd5e1", paddingBottom: "6px", textTransform: "uppercase", fontSize: "16px" }}>
                    🪙 {t("metal")}: {row.metal === "Gold" ? t("gold") : row.metal === "Silver" ? t("silver") : row.metal}
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    
                    {/* Inward Segment (Green Panel) */}
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px 20px" }}>
                      <div style={{ fontSize: "12px", color: "#166534", fontWeight: "600", textTransform: "uppercase" }}>
                        {t("inward_metrics_lbl", "Inward Metrics (Metal In)")}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", alignItems: "baseline" }}>
                        <div>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: "#15803d" }}>
                            ₹ {(row.loan_in || 0).toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "12px", color: "#166534", marginTop: "4px" }}>
                            {t("gross", "Gross")}: <strong>{(row.gross_in || 0).toFixed(2)}g</strong> | {t("net", "Net")}: <strong>{(row.net_in || 0).toFixed(2)}g</strong>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "18px", fontWeight: "700", color: "#166534" }}>{row.items_in || 0}</span>
                          <span style={{ fontSize: "12px", color: "#166534", marginLeft: "4px" }}>{t("pieces_unit_lbl", "pcs")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Outward Segment (Red Panel) */}
                    <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: "12px", padding: "16px 20px" }}>
                      <div style={{ fontSize: "12px", color: "#9b2c2c", fontWeight: "600", textTransform: "uppercase" }}>
                        {t("outward_metrics_lbl", "Outward Metrics (Metal Out / Closed)")}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", alignItems: "baseline" }}>
                        <div>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: "#c53030" }}>
                            ₹ {(row.loan_out || 0).toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "12px", color: "#9b2c2c", marginTop: "4px" }}>
                            {t("gross", "Gross")}: <strong>{(row.gross_out || 0).toFixed(2)}g</strong> | {t("net", "Net")}: <strong>{(row.net_out || 0).toFixed(2)}g</strong>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "18px", fontWeight: "700", color: "#9b2c2c" }}>{row.items_out || 0}</span>
                          <span style={{ fontSize: "12px", color: "#9b2c2c", marginLeft: "4px" }}>{t("pieces_unit_lbl", "pcs")}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table Element */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t("metal")}</th>
                  <th>{t("in_items_tbl_hdr", "In Items")}</th>
                  <th>{t("in_gross_tbl_hdr", "In Gross")}</th>
                  <th>{t("in_net_tbl_hdr", "In Net")}</th>
                  <th>{t("in_loan_amt_tbl_hdr", "In Loan Amt")}</th>
                  <th>{t("out_items_tbl_hdr", "Out Items")}</th>
                  <th>{t("out_gross_tbl_hdr", "Out Gross")}</th>
                  <th>{t("out_net_tbl_hdr", "Out Net")}</th>
                  <th>{t("out_loan_amt_tbl_hdr", "Out Loan Amt")}</th>
                </tr>
              </thead>
              <tbody>
                {movementRows.length > 0 ? (
                  movementRows.map((row, index) => (
                    <tr key={index}>
                      <td><strong>{row.metal === "Gold" ? t("gold") : row.metal === "Silver" ? t("silver") : row.metal}</strong></td>
                      <td>{row.items_in} {t("pieces_unit_lbl", "pcs")}</td>
                      <td>{row.gross_in.toFixed(2)} g</td>
                      <td>{row.net_in.toFixed(2)} g</td>
                      <td>₹ {row.loan_in.toLocaleString("en-IN")}</td>
                      <td>{row.items_out} {t("pieces_unit_lbl", "pcs")}</td>
                      <td>{row.gross_out.toFixed(2)} g</td>
                      <td>{row.net_out.toFixed(2)} g</td>
                      <td>₹ {row.loan_out.toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                      {t("no_matching_records", "No movement data found for selection")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}