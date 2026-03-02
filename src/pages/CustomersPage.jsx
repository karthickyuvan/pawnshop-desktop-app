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
    name: "", relation: "", address: "", phone: "",
    email: "", idProofType: "", idProofNumber: "",
  });


  // useEffect(() => {

  //   // If search box empty → clear results
  //   if (!searchText.trim()) {
  //     setCustomers([]);
  //     return;
  //   }
  
  //   const delayDebounce = setTimeout(async () => {
  //     try {
  //       setIsSearching(true);
  //       const results = await searchCustomers(searchText);
  //       setCustomers(results);
  //     } catch (err) {
  //       console.error(err);
  //     } finally {
  //       setIsSearching(false);
  //     }
  //   }, 400);
  
  //   return () => clearTimeout(delayDebounce);
  
  // }, [searchText]);

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
        relation: c.relation || "",
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
        phone: data.phone || ""
      }));
  
      localStorage.removeItem("prefillCustomer");
    }
  
  }, []);
  



  const loadSummary = async () => {
    try {
      const summary = await getCustomerSummary();
      setTotalCustomers(summary.total_customers);
      setRepeatedCustomers(summary.repeated_customers);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    searchCustomers("")
      .then(setCustomers)
      .catch(console.error);
  }, []);

  // const handleSearch = async () => {
  //   try {
  //     const results = await searchCustomers(searchText);
  //     setCustomers(results);
  //   } catch (err) { console.error(err); }
  // };

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
      relation: customer.relation || "",
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
       name: "", relation: "", address: "", phone: "",
       email: "", idProofType: "", idProofNumber: ""
    });
    setPhotoPath("");
    setPendingPhoto(null);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
    if (!form.name || !form.phone)
      return alert("Name and Phone required");
  
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
          relation: form.relation,
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
  
  // const loadAllCustomers = async () => {
  //   try {
  //     setIsSearching(true);
  //     const results = await searchCustomers("");
  //     setCustomers(results);
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setIsSearching(false);
  //   }
  // };

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
            <div className="summary-title">Total</div>
            <div className="summary-value">{totalCustomers}</div>
          </div>
          <div className="summary-card small highlight">
            <div className="summary-title">Repeated</div>
            <div className="summary-value">{repeatedCustomers}</div>
          </div>
        </div>
          {/* ✅ HEADER WITH ACTION BUTTONS */}
          <div className="panel-header-row ">
          <h3>Search Customer</h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            
           <button className="primary-btn1" onClick={() => setActiveMenu("customer-list")} > View All Customers
          </button>
          <button className="icon-btn danger" onClick={handleClear} title="Clear Search"> <X size={18} />
          </button>
         </div>
          </div>
          <div className="search-box-row">
            <input 
              placeholder="Search by phone or name..." 
              value={searchText} 
              onChange={(e) => setSearchText(e.target.value)} 
            />
          </div>
          {/* <div className="panel-header-row">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Customer</h3>
          <button className="secondary-btn" onClick={() => setActiveMenu("customer-list")} >
          View All Customers  </button>
        </div>
            <div className="header-actions">
                <button className="icon-btn" onClick={resetForm} title="Add New Customer">
                    <UserPlus size={18} />
                </button>
                <button className="icon-btn danger" onClick={handleClear} title="Clear Search">
                    <X size={18} />
                </button>
            </div>
          </div> */}

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
          <button className="danger-btn" onClick={() => {
              setShowAllCustomers(false);
              setCustomers([]);
            }}> Close</button></div> )}
            {/* 🔄 Loading Indicator */}
            {isSearching && (
              <div className="muted">Searching...</div>
            )}

            {/* 👇 Customer List */}
            {!isSearching && customers.map((c) => (
              <div 
                key={c.id} 
                className={`result-item ${selectedCustomer?.id === c.id ? "active" : ""}`} 
                onClick={() => selectCustomer(c)}
              >
                <div className="result-header">
                  <strong>{c.customer_code} - {c.name}</strong>
                </div>
                <div className="muted">{c.phone}</div>

              </div>
            ))}
            {/* ❌ No Results */}
            {!isSearching && customers.length === 0 && searchText && (
              <div className="no-results">No customers found</div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2> {selectedCustomer
              ? `Edit Customer (${selectedCustomer.customer_code})`
              : "Create New Customer"}
          </h2>

             {selectedCustomer && (
              <span className="customer-id-badge">
                Code: {selectedCustomer.customer_code}
              </span>
            )}

          </div>

          <div className="photo-section">
            <img src={displayImage} className="photo-preview" alt="Customer" />
            <button className="secondary-btn" onClick={() => setShowCamera(true)}>
              📸 Capture Photo
            </button>
            {pendingPhoto && (
              <div className="photo-status">✓ Photo Ready</div>
            )}
          </div>

          <div className="form-grid">
            <input name="name" placeholder="Name *" value={form.name} onChange={handleChange} required />
            <input name="relation" placeholder="Relation" value={form.relation} onChange={handleChange} />
            <input name="phone" placeholder="Phone *" value={form.phone} onChange={handleChange} required />
            <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} />
            <textarea name="address" placeholder="Address" value={form.address} onChange={handleChange} style={{gridColumn: "span 2"}} rows={3} />
            <select name="idProofType" value={form.idProofType} onChange={handleChange}>
              <option value="">Select ID Proof</option>
              <option>Aadhaar Card</option><option>PAN Card</option><option>Passport</option><option>Voter ID</option><option>Driving License</option>
            </select>
            <input name="idProofNumber" placeholder="ID Proof Number" value={form.idProofNumber} onChange={handleChange} />
          </div>

          <button className="primary-btn" onClick={handleSave}>
            {selectedCustomer ? "Update Customer (Pending)" : "Save Customer"}
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