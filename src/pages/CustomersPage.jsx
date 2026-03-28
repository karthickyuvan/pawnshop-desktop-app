import { useState, useEffect, useMemo } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { useAuthStore } from "../auth/authStore";
import { convertFileSrc } from "@tauri-apps/api/core";
import CustomerPhotoCapture from "../components/CustomerPhotoCapture";
import {
  addCustomer,
  searchCustomers,
  getCustomerSummary,
  saveCustomerPhoto,
  updateCustomer,
} from "../services/customerApi";
import "./CustomerPage.css";
import { useLanguage } from "../context/LanguageContext";

export default function CustomerPage({ setActiveMenu }) {
  const user = useAuthStore((state) => state.user);

  const [showCamera, setShowCamera] = useState(false);
  const [photoPath, setPhotoPath] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [repeatedCustomers, setRepeatedCustomers] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  const [form, setForm] = useState({
    name: "",
    relationType: "",
    relationName: "",
    address: "",
    phone: "",
    email: "",
    idProofType: "",
    idProofNumber: "",
  });
  const { t } = useLanguage();

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      try {
        setIsSearching(true);

        const results = await searchCustomers(searchText);
        setCustomers(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchText]);
  useEffect(() => {
    loadSummary();
  }, []);

  // ✅ ADD THIS BELOW
  useEffect(() => {
    // 🔹 1. Check if editing existing customer
    const storedCustomer = localStorage.getItem("editCustomer");

    if (storedCustomer) {
      const c = JSON.parse(storedCustomer);

      setSelectedCustomer(c);

      setForm({
        name: c.name,
        relationType: c.relation_type || "",
        relationName: c.relation_name || "",
        phone: c.phone,
        email: c.email || "",
        address: c.address || "",
        idProofType: c.id_proof_type || "",
        idProofNumber: c.id_proof_number || "",
      });

      setPhotoPath(c.photo_path || "");

      localStorage.removeItem("editCustomer");
      return; // 🔥 Important: stop here
    }

    // 🔹 2. Check if coming from pledge new customer
    const prefill = localStorage.getItem("prefillCustomer");

    if (prefill) {
      const data = JSON.parse(prefill);

      setForm((prev) => ({
        ...prev,
        phone: data.phone || "",
      }));

      localStorage.removeItem("prefillCustomer");
    }
  }, []);

  const loadSummary = async () => {
    try {
      const summary = await getCustomerSummary();
      setTotalCustomers(summary.total_customers);
      setRepeatedCustomers(summary.repeated_customers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    searchCustomers("").then(setCustomers).catch(console.error);
  }, []);

  // ✅ Clear Search & Selection
  const handleClear = () => {
    setSearchText("");
    setCustomers([]);
    resetForm();
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setForm({
      name: customer.name,
      relationType: customer.relation_type || "",
      relationName: customer.relation_name || "",
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
      idProofType: customer.id_proof_type || "",
      idProofNumber: customer.id_proof_number || "",
    });
    setPhotoPath(customer.photo_path || "");
    setPendingPhoto(null);
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setForm({
      name: "",
      relationType: "",     
      relationName: "",
      address: "",
      phone: "",
      email: "",
      idProofType: "",
      idProofNumber: "",
    });
    setPhotoPath("");
    setPendingPhoto(null);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhotoCaptured = (base64, path) => {
    if (path) {
      setPhotoPath(path);
      setPendingPhoto(null);
    } else if (base64) {
      setPendingPhoto(base64);
      setPhotoPath("");
    }
    setShowCamera(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) return alert("Name and Phone required");

    const userId = user?.user_id || user?.id;
    if (!userId) return alert("User not authenticated");

    try {
      const returnPage = localStorage.getItem("returnTo");

      // -----------------------------
      // 🔹 UPDATE CUSTOMER
      // -----------------------------
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, form, userId);

        const updatedCustomer = {
          ...selectedCustomer,
          name: form.name,
          relation_type: form.relationType,     
          relation_name: form.relationName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          id_proof_type: form.idProofType,
          id_proof_number: form.idProofNumber,
        };

        alert("Customer Updated Successfully!");

        if (returnPage && setActiveMenu) {
          localStorage.removeItem("returnTo");
          localStorage.removeItem("editCustomer");

          localStorage.setItem(
            "selectedCustomerForPledge",
            JSON.stringify(updatedCustomer)
          );

          setActiveMenu(returnPage);
          return;
        }

        resetForm();
        loadSummary();
      }

      // -----------------------------
      // 🔹 CREATE NEW CUSTOMER
      // -----------------------------
      else {
        const newCustomer = await addCustomer(form, userId);

        if (pendingPhoto) {
          const path = await saveCustomerPhoto(newCustomer.id, pendingPhoto);
          newCustomer.photo_path = path;
        }

        alert("Customer Created Successfully!");

        if (returnPage && setActiveMenu) {
          localStorage.removeItem("returnTo");

          localStorage.setItem(
            "selectedCustomerForPledge",
            JSON.stringify(newCustomer)
          );

          setActiveMenu(returnPage);
          return;
        }

        resetForm();
        loadSummary();
        // handleSearch();
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + err);
    }
  };

  const displayImage = useMemo(() => {
    // A. If we just took a photo (New Customer), show base64
    if (pendingPhoto) {
      return `data:image/jpeg;base64,${pendingPhoto}`;
    }
    // B. If we have a saved path (Existing Customer), convert it
    if (photoPath) {
      return convertFileSrc(photoPath);
    }
    // C. Fallback
    return "/avatar.png";
  }, [pendingPhoto, photoPath]);

  return (
    <div className="customer-page">
      <div className="customer-content">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="left-summary">
            <div className="summary-card small">
              <div className="summary-title">{t("total")}</div>
              <div className="summary-value">{totalCustomers}</div>
            </div>
            <div className="summary-card small highlight">
            <div className="summary-title">{t("repeated")}</div>
              <div className="summary-value">{repeatedCustomers}</div>
            </div>
          </div>
          {/* ✅ HEADER WITH ACTION BUTTONS */}
          <div className="panel-header-row ">
          <h3>{t("search_customer")}</h3>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                className="primary-btn1"
                onClick={() => setActiveMenu("customer-list")}
              >
                {" "}
                {t("view_all_customers")}
              </button>
              <button
                className="icon-btn danger"
                onClick={handleClear}
                title={t("clear_search")}
              >
                {" "}
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="search-box-row">
            <input
              placeholder={t("search_customer_placeholder")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {showAllCustomers && (
            <div className="search-box-row">
              <input
                placeholder="Search by phone or name..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          )}

          <div className="search-results">
            {showAllCustomers && (
              <div style={{ textAlign: "right", marginBottom: "10px" }}>
                <button
                  className="danger-btn"
                  onClick={() => {
                    setShowAllCustomers(false);
                    setCustomers([]);
                  }}
                >
                  {" "}
                  Close
                </button>
              </div>
            )}
            {/* 🔄 Loading Indicator */}
            {isSearching && <div className="muted">{t("searching")}</div>}

            {/* 👇 Customer List */}
            {!isSearching &&
              customers.map((c) => (
                <div
                  key={c.id}
                  className={`result-item ${
                    selectedCustomer?.id === c.id ? "active" : ""
                  }`}
                  onClick={() => selectCustomer(c)}
                >
                  <div className="result-header">
                    <strong>
                      {c.customer_code} - {c.name} {c.relation_type} {c.relation_name}
                    </strong>
                  </div>
                  <div className="muted">{c.phone}</div>
                </div>
              ))}
            {/* ❌ No Results */}
            {!isSearching && customers.length === 0 && searchText && (
              <div className="no-results">{t("no_customers_found")}</div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>
              {" "}
              {selectedCustomer
                ? `${t("edit_customer")}(${selectedCustomer.customer_code})`
                : t("create_new_customer")}
            </h2>

            {selectedCustomer && (
              
              <span className="customer-id-badge">
                {t("code")}:{selectedCustomer.customer_code}
              </span>
            )}
          </div>

          <div className="photo-section">
            <img src={displayImage} className="photo-preview" alt="Customer" />
            <button
              className="secondary-btn"
              onClick={() => setShowCamera(true)}
            >
              📸  {t("capture_photo")}
            </button>
            {pendingPhoto && <div className="photo-status">✓ {t("photo_ready")}</div>}
          </div>

          <div className="form-grid">
            <input
              name="name"
              placeholder={t("name_required")}
              value={form.name}
              onChange={handleChange}
              required
            />
            <select
              name="relationType"
              value={form.relationType}
              onChange={handleChange}
            >
              <option value="">{t("select_relation")}</option>
              <option value="S/O">S/O</option>
              <option value="D/O">D/O</option>
              <option value="W/O">W/O</option>
            </select>
            <input
            name="relationName"
            placeholder="Relation Name"
            value={form.relationName}
            onChange={handleChange}
          />
            <input
              name="phone"
              placeholder={t("phone_required")}
              value={form.phone}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              placeholder={t("email")}
              type="email"
              value={form.email}
              onChange={handleChange}
            />
            <textarea
              name="address"
              placeholder={t("address")}
              value={form.address}
              onChange={handleChange}
              style={{ gridColumn: "span 2" }}
              rows={3}
            />
            <select
              name="idProofType"
              value={form.idProofType}
              onChange={handleChange}
            >
              <option value="">{t("select_id_proof")}</option>
              <option>{t("aadhaar_card")}</option>
              <option>{t("pan_card")}</option>
              <option>{t("passport")}</option>
              <option>{t("voter_id")}</option>
              <option>{t("driving_license")}</option>
            </select>
            <input
              name="idProofNumber"
              placeholder={t("id_proof_number")}
              value={form.idProofNumber}
              onChange={handleChange}
            />
          </div>

          <button className="primary-btn" onClick={handleSave}>
          {selectedCustomer ? t("update_customer") : t("save_customer")}
          </button>
        </div>

        {/* CAMERA MODAL */}
        {showCamera && (
          <CustomerPhotoCapture
            customerId={selectedCustomer?.id || 0}
            onCapture={handlePhotoCaptured}
            onClose={() => setShowCamera(false)}
          />
        )}
      </div>
    </div>
  );
}
