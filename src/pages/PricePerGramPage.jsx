import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { getActiveMetalTypes } from "../services/metalTypesApi";
import { getPrices, setPricePerGram, getPriceHistory } from "../services/pricePerGramApi"; // ✅ added
import { TrendingUp, Package, IndianRupee, History, Loader2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import "./pricePerGram.css";

export default function PricePerGramPage() {

  const user = useAuthStore((s) => s.user);
  const { t } = useLanguage();

  const [metals, setMetals] = useState([]);
  const [list, setList] = useState([]);
  const [history, setHistory] = useState([]);  
  const [metalId, setMetalId] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {

      const [metalData, priceData, historyData] = await Promise.all([
        getActiveMetalTypes(),
        getPrices(),
        getPriceHistory()
      ]);

      setMetals(metalData || []);
      setList(priceData || []);
      setHistory(historyData || []);

    } catch (err) {
      console.error("Failed to load price data", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {

    if (!metalId || !price) {
      return alert(t("select_metal_and_price"));
    }

    const mId = parseInt(metalId, 10);
    const pVal = parseFloat(price);

    if (isNaN(mId) || isNaN(pVal)) {
      return alert(t("invalid_input"));
    }

    try {

      setLoading(true);

      await setPricePerGram({
        metalTypeId: mId,
        pricePerGram: pVal,
        actorUserId: user.id || user.user_id,
      });

      setPrice("");
      setMetalId("");

      await load();

      alert(t("price_updated"));

    } catch (err) {

      console.error("Rust Error:", err);
      alert(`${t("price_update_failed")} ${err}`);

    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="price-container">

      {/* HEADER */}

      <header className="page-header">

        <div className="title-group">

          <TrendingUp className="icon-main" />

          <div className="title-text">

            <h1>{t("metal_rates")}</h1>
            <p>{t("metal_rates_desc")}</p>

          </div>

        </div>

      </header>

      {/* INPUT SECTION */}

      <section className="input-card">

        <div className="input-grid">

          <div className="input-group">

            <label>
              <Package size={14} /> {t("metal_type")}
            </label>

            <select value={metalId} onChange={(e) => setMetalId(e.target.value)}>
              <option value="">{t("select_metal")}</option>

              {metals.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}

            </select>

          </div>

          <div className="input-group">

            <label>
              <IndianRupee size={14} /> {t("price_per_gram")}
            </label>

            <input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

          </div>

          <button
            className="update-btn"
            onClick={submit}
            disabled={loading}
          >
            {loading
              ? <Loader2 className="spinner" size={16} />
              : t("update_price")}
          </button>

        </div>

      </section>

      {/* CURRENT RATES */}

      <section className="table-card">

        <div className="table-header">
          <h3>
            <History size={18} /> {t("current_rates")}
          </h3>
        </div>

        <div className="table-wrapper">

          <table className="modern-table">

            <thead>
              <tr>
                <th>{t("metal")}</th>
                <th>{t("rate_per_gram")}</th>
                <th>{t("last_updated")}</th>
              </tr>
            </thead>

            <tbody>

              {(list || []).map((p) => (

                <tr key={p.id}>

                  <td className="font-medium">
                    {p.metal_name}
                  </td>

                  <td className="price-cell">
                    ₹ {Number(p.price_per_gram).toLocaleString("en-IN")}
                  </td>

                  <td className="time-cell">
                    {new Date(p.updated_at).toLocaleString()}
                  </td>

                </tr>

              ))}

              {list.length === 0 && (
                <tr>
                  <td colSpan="3" className="empty-state">
                    {t("no_price_data")}
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* PRICE HISTORY */}

      <section className="table-card">

        <div className="table-header">

          <h3>
            <History size={18} /> Price History
          </h3>

        </div>

        <div className="table-wrapper">

          <table className="modern-table">

            <thead>
              <tr>
                <th>Metal</th>
                <th>Price</th>
                <th>Changed At</th>
              </tr>
            </thead>

            <tbody>

              {(history || []).map((h, i) => (

                <tr key={i}>
                  <td>{h.metal}</td>
                  <td>₹ {h.price}</td>
                  <td>{new Date(h.changed_at).toLocaleString()}</td>
                </tr>

              ))}

              {history.length === 0 && (
                <tr>
                  <td colSpan="3" className="empty-state">
                    No history found
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}