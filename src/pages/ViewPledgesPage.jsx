import { useEffect, useState } from "react";
import { getAllPledges } from "../services/pledgeApi";
import PledgeSummaryCards from "../components/pledges/PledgeSummaryCards";
import PledgeSearchBar from "../components/pledges/PledgeSearchBar";
import PledgeTable from "../components/pledges/PledgeTable";

export default function ViewPledgesPage({ user,setActiveMenu }) {

  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [dateFilterType, setDateFilterType] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
  

  if (!data) return <div className="loading">Loading...</div>;

  const filteredPledges = data.pledges.filter((pledge) => {

    const pledgeDate = new Date(pledge.created_at);
  
    // STATUS FILTER
    const matchesStatus =
      statusFilter === "ALL" ||
      pledge.status === statusFilter;
  
    // DATE FILTER
    let matchesDate = true;
  
    if (dateFilterType === "DATE" && selectedDate) {
      const selected = new Date(selectedDate);
      matchesDate =
        pledgeDate.toDateString() === selected.toDateString();
    }
  
    if (dateFilterType === "CUSTOM" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
  
      matchesDate = pledgeDate >= start && pledgeDate <= end;
    }
  
    return matchesStatus && matchesDate;
  });

  return (
    <div className="pledge-page">
      <div className="page-header1">
        <h2>Active Pledges</h2>
        <p>View and manage all active pledge accounts</p>
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
        <option value="ACTIVE">Active</option>
        <option value="CLOSED">Closed</option>
        <option value="ALL">All</option>
      </select>

      <select
        value={dateFilterType}
        onChange={(e) => setDateFilterType(e.target.value)}
      >
        <option value="ALL">All Dates</option>
        <option value="DATE">Single Date</option>
        <option value="CUSTOM">Custom Range</option>
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

      <PledgeTable pledges={filteredPledges} setActiveMenu={setActiveMenu} />

        {/* Footer text from your second image */}
        <div className="table-footer">
        Showing {filteredPledges.length} of {data.pledges.length} pledges
        </div>
      </div>
    </div>
  );
}
