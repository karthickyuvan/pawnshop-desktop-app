import { useEffect, useState } from "react";
import { searchCustomers } from "../services/customerApi";
import "./CustomerListPage.css";

export default function CustomerListPage({ setActiveMenu }) {

  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers("");
  }, []);

  const loadCustomers = async (query) => {
    try {
      setLoading(true);
      const results = await searchCustomers(query);
      setCustomers(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadCustomers(searchText);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchText]);

//   return (
//     <div className="customer-list-page">
//         <h3>Displaying All Customers</h3>
//       <div className="search-bar">
//         <button className="primary-btn" onClick={() => setActiveMenu("customers")} > + Add New Customer </button>
//         <input className="search-input-container" placeholder="Search by name, phone, or code..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
//       </div>

//       {loading && <div>Loading...</div>}

//       <table className="customer-table">
//         <thead>
//           <tr>
//             <th>Code</th>
//             <th>Name</th>
//             <th>Phone</th>
//             <th>Relation</th>
//             <th>Address</th>
//             <th>ID Proof</th>
//             <th>Visit Count</th>
//           </tr>
//         </thead>

//         <tbody>
//           {customers.map((c) => (
//             <tr key={c.id}>
//               <td>{c.customer_code}</td>
//               <td>{c.name}</td>
//               <td>{c.phone}</td>
//               <td>{c.relation || "-"}</td>
//               <td>{c.address || "-"}</td>
//               <td>
//                 {c.id_proof_type
//                   ? `${c.id_proof_type} - ${c.id_proof_number}`
//                   : "-"}
//               </td>
//               <td style={{  fontWeight: "bold", color: c.visit_count > 3 ? "green" : "black"}}>
//                 {c.visit_count} </td>
//             </tr>
//           ))}

//           {!loading && customers.length === 0 && (
//             <tr>
//               <td colSpan="5" style={{ textAlign: "center" }}>
//                 No customers found
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//     </div>
//   );

return (
    <div className="customer-list-page">
  
      {/* HEADER */}
        <h2>Customers</h2>
        <span>Review all registered customers</span>
        
      {/* SEARCH + SUMMARY BAR */}
      <div className="toolbar">
        <div className="search-wrapper">
        <button className="primary-btn" onClick={() => setActiveMenu("customers")} >
          + Add New Customer
        </button>
          <input className="search-input" placeholder="Search by name, phone, or code..." value={searchText} onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="customer-count">
          Total Customer Count: <strong>{customers.length}</strong>
        </div>
      </div>
  
      {/* TABLE CONTAINER */}
      <div className="table-card">
  
        {loading && (
          <div className="loading-state">Loading customers...</div>
        )}
  
        <table className="customer-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Relation</th>
              <th>Address</th>
              <th>ID Proof</th>
              <th>Visits</th>
            </tr>
          </thead>
  
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="code">{c.customer_code}</td>
                <td className="name">{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.relation || "-"}</td>
                <td className="address">{c.address || "-"}</td>
                <td>
                  {c.id_proof_type
                    ? `${c.id_proof_type} - ${c.id_proof_number}`
                    : "-"}
                </td>
                <td>
                  <span
                    className={`visit-badge ${
                      c.visit_count > 3 ? "high" : "normal"
                    }`}
                  >
                    {c.visit_count}
                  </span>
                </td>
              </tr>
            ))}
  
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-state">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}