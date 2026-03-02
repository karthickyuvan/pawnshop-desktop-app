import { useEffect, useState } from "react";
import { Search, Clock } from "lucide-react";
import {
  searchPledges,
  getQuickAccessPledges,
} from "../../services/paymentHistoryApi";

export default function SearchSidebar({ onSelectPledge }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [quickList, setQuickList] = useState([]);

  useEffect(() => {
    loadQuickAccess();
  }, []);

  async function loadQuickAccess() {
    try {
      const data = await getQuickAccessPledges();
      setQuickList(data || []);
    } catch (err) {
      console.error("Quick access error:", err);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;

    try {
      const data = await searchPledges(query);
      setResults(data || []);
    } catch (err) {
      console.error("Search error:", err);
    }
  }

  return (
    <div className="sidebar-container">
      {/* SEARCH CARD */}
      <div className="search-card">
        <div className="search-card-header">
          <Search size={22} />
          <h3>Search Pledge</h3>
        </div>

        <div className="search-card-body">
          <label>Pledge Number / Customer Name / Phone</label>

          <div className="search-input-wrapper">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <button onClick={handleSearch}>
              <Search size={18} />
            </button>
          </div>

          {/* SEARCH RESULTS */}
          {results.map((item) => (
            <div
              key={item.id}
              className="quick-item clickable"
              onClick={() => onSelectPledge(item.id)}
            >
              <div>
                <div className="pledge-id">{item.pledge_no}</div>
                <div className="customer-name">
                  {item.customer_name}
                </div>
              </div>

              {item.is_overdue && (
                <span className="status-dot"></span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ACCESS */}
      <div className="quick-card">
        <div className="quick-header">
          <Clock size={20} />
          <h3>Quick Access</h3>
        </div>

        {quickList.map((item) => (
          <div
            key={item.id}
            className="quick-item clickable"
            onClick={() => onSelectPledge(item.id)}
          >
            <div>
              <div className="pledge-id">{item.pledge_no}</div>
              <div className="customer-name">
                {item.customer_name}
              </div>
            </div>

            {item.is_overdue && (
              <span className="status-dot"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}