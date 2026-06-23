

import { useEffect, useState, useRef } from "react";
import { Search, Clock } from "lucide-react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useLanguage } from "../../context/LanguageContext";
import {
  searchPledges,
  getQuickAccessPledges,
} from "../../services/paymentHistoryApi";

export default function SearchSidebar({ onSelectPledge }) {
  const { t } = useLanguage();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [quickList, setQuickList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false); // 🚀 Track inline search anomalies

  const debounceRef = useRef(null);

  async function loadQuickAccess() {
    try {
      const data = await getQuickAccessPledges();
      setQuickList(data || []);
    } catch (err) {
      console.error("Quick access error:", err);
      // 🚀 Notify once on mount if the critical quick-access panel fails to fetch
      toast.error(t("failed_load_quick_access") || "Failed to load recent quick access records.");
    }
  }

  useEffect(() => {
    loadQuickAccess();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchError(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setSearchError(false);
        const data = await searchPledges(query);
        setResults(data || []);
      } catch (err) {
        console.error("Search error:", err);
        setSearchError(true); // 🚀 Set inline error instead of an annoying toast on typing
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(id) {
    onSelectPledge(id);
    setQuery("");
    setResults([]);
  }

  return (
    <div className="sidebar-container">
      {/* SEARCH CARD */}
      <div className="search-card">
        <div className="search-card-header">
          <Search size={22} />
          <h3>{t("search_pledge")}</h3>
        </div>

        <div className="search-card-body">
          <label>{t("search_pledge_label")}</label>

          <div className="search-input-wrapper">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("start_typing")}
            />
            <Search size={18} />
          </div>

          {loading && <div className="search-loading">{t("searching")}</div>}

          {/* 🚀 Inline subtle error message */}
          {searchError && (
            <div className="search-inline-error" style={{ color: "#ef4444", fontSize: "13px", marginTop: "8px" }}>
              ⚠️ {t("search_failed", "Failed to retrieve results")}
            </div>
          )}

          {results.length > 0 && !searchError && (
            <div className="search-dropdown">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="quick-item clickable"
                  onClick={() => handleSelect(item.id)}
                >
                  <div>
                    <div className="pledge-id">{item.pledge_no}</div>
                    <div className="customer-name">{item.customer_name}</div>
                  </div>
                  {item.is_overdue && <span className="status-dot" />}
                </div>
              ))}
            </div>
          )}
          
          {query.trim() && results.length === 0 && !loading && !searchError && (
            <div className="search-no-results" style={{ color: "#64748b", fontSize: "13px", marginTop: "8px" }}>
              {t("no_matching_records", "No pledges found")}
            </div>
          )}
        </div>
      </div>

      {/* QUICK ACCESS */}
      <div className="quick-card">
        <div className="quick-header">
          <Clock size={20} />
          <h3>{t("quick_access")}</h3>
        </div>

        {quickList.length === 0 && !loading && (
          <div style={{ padding: "12px 16px", color: "#94a3b8", fontSize: "13px" }}>
            {t("no_recent_activity", "No recent activity records")}
          </div>
        )}

        {quickList.map((item) => (
          <div
            key={item.id}
            className="quick-item clickable"
            onClick={() => handleSelect(item.id)}
          >
            <div>
              <div className="pledge-id">{item.pledge_no}</div>
              <div className="customer-name">{item.customer_name}</div>
            </div>
            {item.is_overdue && <span className="status-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}