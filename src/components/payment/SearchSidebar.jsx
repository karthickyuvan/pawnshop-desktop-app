


// import { useEffect, useState, useRef } from "react";
// import { Search, Clock } from "lucide-react";
// import {
//   searchPledges,
//   getQuickAccessPledges,
// } from "../../services/paymentHistoryApi";

// export default function SearchSidebar({ onSelectPledge }) {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState([]);
//   const [quickList, setQuickList] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const debounceRef = useRef(null);

//   /* ===============================
//      LOAD QUICK ACCESS
//   =============================== */
//   async function loadQuickAccess() {
//     try {
//       const data = await getQuickAccessPledges();
//       setQuickList(data || []);
//     } catch (err) {
//       console.error("Quick access error:", err);
//     }
//   }

//   useEffect(() => {
//     loadQuickAccess();
//   }, []);

//   /* ===============================
//      LIVE SEARCH (DEBOUNCED)
//   =============================== */
//   useEffect(() => {
//     if (!query.trim()) {
//       setResults([]);
//       return;
//     }

//     // Clear previous timer
//     if (debounceRef.current) {
//       clearTimeout(debounceRef.current);
//     }

//     // Wait 300ms before calling API
//     debounceRef.current = setTimeout(async () => {
//       try {
//         setLoading(true);
//         const data = await searchPledges(query);
//         setResults(data || []);
//       } catch (err) {
//         console.error("Search error:", err);
//       } finally {
//         setLoading(false);
//       }
//     }, 300);

//     return () => clearTimeout(debounceRef.current);
//   }, [query]);

//   /* ===============================
//      HANDLE SELECT
//   =============================== */
//   function handleSelect(id) {
//     onSelectPledge(id);
//     setQuery("");
//     setResults([]);
//   }

//   return (
//     <div className="sidebar-container">
//       {/* SEARCH CARD */}
//       <div className="search-card">
//         <div className="search-card-header">
//           <Search size={22} />
//           <h3>Search Pledge</h3>
//         </div>

//         <div className="search-card-body">
//           <label>Pledge No / Customer Name / Phone</label>

//           <div className="search-input-wrapper">
//             <input
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               placeholder="Start typing..."
//             />
//             <Search size={18} />
//           </div>

//           {/* LOADING */}
//           {loading && (
//             <div className="search-loading">Searching...</div>
//           )}

//           {/* LIVE RESULTS DROPDOWN */}
//           {results.length > 0 && (
//             <div className="search-dropdown">
//               {results.map((item) => (
//                 <div
//                   key={item.id}
//                   className="quick-item clickable"
//                   onClick={() => handleSelect(item.id)}
//                 >
//                   <div>
//                     <div className="pledge-id">
//                       {item.pledge_no}
//                     </div>
//                     <div className="customer-name">
//                       {item.customer_name}
//                     </div>
//                   </div>

//                   {item.is_overdue && (
//                     <span className="status-dot"></span>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* QUICK ACCESS */}
//       <div className="quick-card">
//         <div className="quick-header">
//           <Clock size={20} />
//           <h3>Quick Access</h3>
//         </div>

//         {quickList.map((item) => (
//           <div
//             key={item.id}
//             className="quick-item clickable"
//             onClick={() => handleSelect(item.id)}
//           >
//             <div>
//               <div className="pledge-id">{item.pledge_no}</div>
//               <div className="customer-name">
//                 {item.customer_name}
//               </div>
//             </div>

//             {item.is_overdue && (
//               <span className="status-dot"></span>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }



import { useEffect, useState, useRef } from "react";
import { Search, Clock } from "lucide-react";
import {
  searchPledges,
  getQuickAccessPledges,
} from "../../services/paymentHistoryApi";

export default function SearchSidebar({ onSelectPledge }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [quickList, setQuickList] = useState([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);

  async function loadQuickAccess() {
    try {
      const data = await getQuickAccessPledges();
      setQuickList(data || []);
    } catch (err) {
      console.error("Quick access error:", err);
    }
  }

  useEffect(() => {
    loadQuickAccess();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchPledges(query);
        setResults(data || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ✅ Pass just the id — same as original
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
          <h3>Search Pledge</h3>
        </div>

        <div className="search-card-body">
          <label>Pledge No / Customer Name / Phone</label>

          <div className="search-input-wrapper">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Start typing..."
            />
            <Search size={18} />
          </div>

          {loading && <div className="search-loading">Searching...</div>}

          {results.length > 0 && (
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