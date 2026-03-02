import { useEffect, useState } from "react";
import { getAllPledges } from "../services/pledgeApi";
import PledgeSummaryCards from "../components/pledges/PledgeSummaryCards";
import PledgeSearchBar from "../components/pledges/PledgeSearchBar";
import PledgeTable from "../components/pledges/PledgeTable";

export default function ViewPledgesPage({ user,setActiveMenu }) {

  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");

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

  return (
    <div className="pledge-page">
      <div className="page-header">
        <h2>Active Pledges</h2>
        <p>View and manage all active pledge accounts</p>
      </div>
  
      <PledgeSummaryCards summary={data.summary} />
      <div className="main-content-card1">
      <PledgeSearchBar search={search} setSearch={setSearch} />
      </div>
      {/* This is the new outer white container that wraps both elements */}
      <div className="main-content-card">

      <PledgeTable  pledges={data.pledges} setActiveMenu={setActiveMenu} />

        {/* Footer text from your second image */}
        <div className="table-footer">
          Showing {data.pledges.length} of {data.pledges.length} pledges
        </div>
      </div>
    </div>
  );
}
