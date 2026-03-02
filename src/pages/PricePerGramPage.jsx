import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { getMetalTypes } from "../services/metalTypesApi";
import { getPrices, setPricePerGram } from "../services/pricePerGramApi";
import { TrendingUp, Package, IndianRupee, History, Loader2 } from "lucide-react";
import "./pricePerGram.css";

export default function PricePerGramPage() {
  const user = useAuthStore((s) => s.user);

  const [metals, setMetals] = useState([]);
  const [list, setList] = useState([]);
  const [metalId, setMetalId] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [metalData, priceData] = await Promise.all([
        getMetalTypes(),
        getPrices()
      ]);
      setMetals(metalData);
      setList(priceData);
    } catch (err) {
      console.error("Failed to load price data", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    // 1. Validate existence
    if (!metalId || !price) return alert("Please select a metal and enter a price.");
    
    // 2. Parse values early
    const mId = parseInt(metalId, 10);
    const pVal = parseFloat(price);
  
    if (isNaN(mId) || isNaN(pVal)) return alert("Invalid input values.");
  
    try {
      setLoading(true);
      await setPricePerGram({
        metalTypeId: mId,      // Ensure it's an integer
        pricePerGram: pVal,    // Ensure it's a float
        actorUserId: user.id || user.user_id, // Double check your store's key
      });
      
      setPrice("");
      setMetalId("");
      await load(); // Re-fetch list
      alert("Price updated successfully!");
    } catch (err) {
      console.error("Rust Error:", err);
      alert(`Failed to update price: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="price-container">
      <header className="page-header">
        <div className="title-group">
          <TrendingUp className="icon-main" />
          <div>
            <h1>Metal Rates</h1>
            <p>Update live market prices per gram for inventory valuation.</p>
          </div>
        </div>
      </header>

      <section className="input-card">
        <div className="input-grid">
          <div className="input-group">
            <label><Package size={14} /> Metal Type</label>
            <select value={metalId} onChange={(e) => setMetalId(e.target.value)}>
              <option value="">Select Metal</option>
              {metals.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label><IndianRupee size={14} /> Price / Gram</label>
            <input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <button className="update-btn" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="spinner" size={16} /> : "Update Price"}
          </button>
        </div>
      </section>

      <section className="table-card">
        <div className="table-header">
          <h3><History size={18} /> Current Rates</h3>
        </div>
        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Metal</th>
                <th>Rate / Gram</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.metal_name}</td>
                  <td className="price-cell">₹ {Number(p.price_per_gram).toLocaleString('en-IN')}</td>
                  <td className="time-cell">{new Date(p.updated_at).toLocaleString()}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan="3" className="empty-state">No price data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}