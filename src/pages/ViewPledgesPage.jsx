import { useEffect, useState } from "react";
import { getAllPledges } from "../services/pledgeApi";
import PledgeSummaryCards from "../components/pledges/PledgeSummaryCards";
import PledgeSearchBar from "../components/pledges/PledgeSearchBar";
import PledgeTable from "../components/pledges/PledgeTable";
import { useLanguage } from "../context/LanguageContext";
import { invoke } from "@tauri-apps/api/core";
import { getSinglePledge } from "../services/pledgeApi";
import PledgePrintModal from "../components/pledgePrint/PledgePrintModal";

export default function ViewPledgesPage({ user, setActiveMenu }) {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [dateFilterType, setDateFilterType] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [printData, setPrintData] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [shopSettings, setShopSettings] = useState(null);

  const fetchPledges = async () => {
    try {
      const response = await getAllPledges(search, user.user_id);
      setData(response);
    } catch (error) {
      console.error("Error fetching pledges:", error);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      fetchPledges();
    }
  }, [search, user]);

  useEffect(() => {
    const loadShopSettings = async () => {
      const settings = await invoke("get_shop_settings");
      setShopSettings(settings);
    };

    loadShopSettings();
  }, []);
  if (!data) return <div className="loading">Loading...</div>;

  const filteredPledges = data.pledges.filter((pledge) => {
    const pledgeDate = new Date(pledge.created_at);

    // STATUS FILTER
    const matchesStatus =
      statusFilter === "ALL" || pledge.status === statusFilter;

    // DATE FILTER
    let matchesDate = true;

    if (dateFilterType === "DATE" && selectedDate) {
      const selected = new Date(selectedDate);
      matchesDate = pledgeDate.toDateString() === selected.toDateString();
    }

    if (dateFilterType === "CUSTOM" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      matchesDate = pledgeDate >= start && pledgeDate <= end;
    }

    return matchesStatus && matchesDate;
  });

  const handlePrintPledge = async (pledgeId) => {
    try {
      const res = await getSinglePledge(pledgeId);
  
      // Split relation: "S/O Kumar" → type: "S/O", name: "Kumar"
      const relationParts = (res.pledge.relation || "").split(" ");
      const relationType = relationParts[0] || null;
      const relationName = relationParts.slice(1).join(" ") || null;
  
      const formatted = {
        pledgeNo: res.pledge.pledge_no,
        receipt_number: res.pledge.receipt_number ||"N/A",  
        finalLoan: res.pledge.principal_amount,     
        totalGrossWt: res.pledge.total_gross_weight,
        totalNetWt: res.pledge.total_net_weight,
        totalValue: res.pledge.total_value,
  
        payload: {
          duration_months: res.pledge.duration_months,
        },
  
        customer: {
          customer_code: res.pledge.customer_code,      
          name: res.pledge.customer_name,
          relation_type: relationType,                 
          relation_name: relationName,                 
          phone: res.pledge.phone,
          address: res.pledge.address,
          photo_path: res.pledge.photo_path,
        },
  
        selectedScheme: {
          scheme_name: res.pledge.scheme_name,
        },
  
        items: res.items.map((item) => ({
          _typeName: item.jewellery_type,              
          description: item.description,
          purity: item.purity,
          gross: item.gross_weight,                    
          net: item.net_weight,                        
          value: item.value,
        })),
      };
  
      setPrintData(formatted);
      setShowPrintModal(true);
  
    } catch (error) {
      console.error("❌ Print error:", error);
      alert("Failed to load pledge for printing");
    }
  };

  return (
    <div className="pledge-page">
      <div className="page-header1">
        <h2>{t("active_pledges")}</h2>
        <p>{t("active_pledges_desc")}</p>
      </div>

      <PledgeSummaryCards summary={data.summary} />
      {/* Replace the content inside <div className="main-content-card1"> with this: */}

      <div className="main-content-card1">
        <div className="filter-bar-container">
          {/* Search Bar now takes up the available space */}
          <div className="search-flex-item">
            <PledgeSearchBar search={search} setSearch={setSearch} />
          </div>

          {/* Filters sit next to it */}
          <div className="pledge-filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ACTIVE">{t("active")}</option>
              <option value="CLOSED">{t("closed")}</option>
              <option value="ALL">{t("all")}</option>
            </select>

            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
            >
              <option value="ALL">{t("all_dates")}</option>
              <option value="DATE">{t("single_date")}</option>
              <option value="CUSTOM">{t("custom_range")}</option>
            </select>

            {/* Date inputs will also flow inline */}
            {dateFilterType === "DATE" && (
              <input
                type="date"
                className="filter-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            )}

            {dateFilterType === "CUSTOM" && (
              <div className="custom-date-inputs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* This is the new outer white container that wraps both elements */}
      <div className="main-content-card">
        <PledgeTable
          pledges={filteredPledges}
          setActiveMenu={setActiveMenu}
          onPrint={handlePrintPledge}
        />

        {/* Footer text from your second image */}
        <div className="table-footer">
          {t("showing")} {filteredPledges.length} {t("of")}{" "}
          {data.pledges.length} {t("pledges")}
        </div>

        {showPrintModal && printData && shopSettings && (
          <PledgePrintModal
            data={printData}
            shopSettings={shopSettings}
            onClose={() => setShowPrintModal(false)}
            isReprint={true}
          />
        )}
      </div>
    </div>
  );
}
