// import { useState, useEffect } from "react";
// import "./InvestorFormModal.css";

// export default function InvestorFormModal({ investor, onClose, onSave }) {
//   const [formData, setFormData] = useState({
//     investor_name: investor?.investor_name || "",
//     mobile: investor?.mobile || "",
//     address: investor?.address || "",
//     notes: investor?.notes || "",
//     investor_type: "FIXED_INTEREST",
//     fixed_interest_percentage: investor?.fixed_interest_percentage || "",
//   });

//   useEffect(() => {
//     setFormData({
//       investor_name: investor?.investor_name || "",
//       mobile: investor?.mobile || "",
//       address: investor?.address || "",
//       notes: investor?.notes || "",
//       investor_type: "FIXED_INTEREST",
//       fixed_interest_percentage: investor?.fixed_interest_percentage || "",
//     });
//   }, [investor]);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = () => {
//     if (!formData.investor_name.trim()) {
//       alert("Investor Name Required");
//       return;
//     }

//     if (!formData.fixed_interest_percentage) {
//       alert("Enter Fixed Interest Percentage");
//       return;
//     }

//     onSave({
//       ...formData,
//       fixed_interest_percentage: Number(formData.fixed_interest_percentage) || 0,
//     });
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-card">
//         <div className="modal-header">
//           <h2>{investor ? "Edit Investor" : "Add Investor"}</h2>
//           <button className="close-btn" onClick={onClose}>
//             ✕
//           </button>
//         </div>

//         <div className="modal-body">
//           {/* Row 1: Name and Mobile */}
//           <div className="form-row">
//             <div className="form-group">
//               <label>Investor Name *</label>
//               <input
//                 type="text"
//                 name="investor_name"
//                 value={formData.investor_name}
//                 onChange={handleChange}
//                 placeholder="Enter Investor Name"
//               />
//             </div>

//             <div className="form-group">
//               <label>Mobile</label>
//               <input
//                 type="text"
//                 name="mobile"
//                 value={formData.mobile}
//                 onChange={handleChange}
//                 placeholder="Enter Mobile Number"
//               />
//             </div>
//           </div>

//           {/* Row 2: Address */}
//           <div className="form-group">
//             <label>Address</label>
//             <textarea
//               name="address"
//               value={formData.address}
//               onChange={handleChange}
//               placeholder="Enter Address"
//               rows={2}
//             />
//           </div>

//           {/* Row 3: Investor Type and Fixed Interest % */}
//           <div className="form-row">
//             <div className="form-group">
//               <label>Investor Type</label>
//               <select
//                 name="investor_type"
//                 value={formData.investor_type}
//                 onChange={handleChange}
//                 disabled
//               >
//                 <option value="FIXED_INTEREST">Fixed Interest</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label>Fixed Interest % *</label>
//               <input
//                 type="number"
//                 name="fixed_interest_percentage"
//                 value={formData.fixed_interest_percentage}
//                 onChange={handleChange}
//                 placeholder="Example: 12"
//               />
//             </div>
//           </div>

//           {/* Row 4: Notes */}
//           <div className="form-group">
//             <label>Notes</label>
//             <textarea
//               name="notes"
//               value={formData.notes}
//               onChange={handleChange}
//               placeholder="Enter Notes"
//               rows={2}
//             />
//           </div>
//         </div>

//         <div className="modal-actions">
//           <button className="cancel-btn" onClick={onClose}>
//             Cancel
//           </button>
//           <button className="save-btn" onClick={handleSubmit}>
//             {investor ? "Update Investor" : "Save Investor"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }








// import { useState, useEffect } from "react";
// import { useLanguage } from "../../context/LanguageContext"; // ✅ Imported custom language hook
// import "./InvestorFormModal.css";

// export default function InvestorFormModal({ investor, onClose, onSave }) {
//   const { t } = useLanguage(); // ✅ Initialized translation hook
//   const [formData, setFormData] = useState({
//     investor_name: investor?.investor_name || "",
//     mobile: investor?.mobile || "",
//     address: investor?.address || "",
//     notes: investor?.notes || "",
//     investor_type: "FIXED_INTEREST",
//     fixed_interest_percentage: investor?.fixed_interest_percentage || "",
//   });

//   useEffect(() => {
//     setFormData({
//       investor_name: investor?.investor_name || "",
//       mobile: investor?.mobile || "",
//       address: investor?.address || "",
//       notes: investor?.notes || "",
//       investor_type: "FIXED_INTEREST",
//       fixed_interest_percentage: investor?.fixed_interest_percentage || "",
//     });
//   }, [investor]);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = () => {
//     if (!formData.investor_name.trim()) {
//       alert(t("investor_name_required_alert", "Investor Name Required"));
//       return;
//     }

//     if (!formData.fixed_interest_percentage) {
//       alert(t("fixed_interest_required_alert", "Enter Fixed Interest Percentage"));
//       return;
//     }

//     onSave({
//       ...formData,
//       fixed_interest_percentage: Number(formData.fixed_interest_percentage) || 0,
//     });
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-card">
//         <div className="modal-header">
//           <h2>{investor ? t("edit_investor_title", "Edit Investor") : t("add_investor")}</h2>
//           <button className="close-btn" onClick={onClose}>
//             ✕
//           </button>
//         </div>

//         <div className="modal-body">
//           {/* Row 1: Name and Mobile */}
//           <div className="form-row">
//             <div className="form-group">
//               <label>{t("investor_name_label", "Investor Name *")}</label>
//               <input
//                 type="text"
//                 name="investor_name"
//                 value={formData.investor_name}
//                 onChange={handleChange}
//                 placeholder={t("enter_investor_name_placeholder", "Enter Investor Name")}
//               />
//             </div>

//             <div className="form-group">
//               <label>{t("phone", "Mobile")}</label>
//               <input
//                 type="text"
//                 name="mobile"
//                 value={formData.mobile}
//                 onChange={handleChange}
//                 placeholder={t("search_customer_placeholder", "Enter Mobile Number")}
//               />
//             </div>
//           </div>

//           {/* Row 2: Address */}
//           <div className="form-group">
//             <label>{t("address", "Address")}</label>
//             <textarea
//               name="address"
//               value={formData.address}
//               onChange={handleChange}
//               placeholder={t("address", "Enter Address")}
//               rows={2}
//             />
//           </div>

//           {/* Row 3: Investor Type and Fixed Interest % */}
//           <div className="form-row">
//             <div className="form-group">
//               <label>{t("investor_type_label", "Investor Type")}</label>
//               <select
//                 name="investor_type"
//                 value={formData.investor_type}
//                 onChange={handleChange}
//                 disabled
//               >
//                 <option value="FIXED_INTEREST">{t("fixed_interest_option", "Fixed Interest")}</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label>{t("fixed_interest_percentage_label", "Fixed Interest % *")}</label>
//               <input
//                 type="number"
//                 name="fixed_interest_percentage"
//                 value={formData.fixed_interest_percentage}
//                 onChange={handleChange}
//                 placeholder={t("interest_percentage_example_placeholder", "Example: 12")}
//               />
//             </div>
//           </div>

//           {/* Row 4: Notes */}
//           <div className="form-group">
//             <label>{t("description", "Notes")}</label>
//             <textarea
//               name="notes"
//               value={formData.notes}
//               onChange={handleChange}
//               placeholder={t("optional_details", "Enter Notes")}
//               rows={2}
//             />
//           </div>
//         </div>

//         <div className="modal-actions">
//           <button className="cancel-btn" onClick={onClose}>
//             {t("cancel")}
//           </button>
//           <button className="save-btn" onClick={handleSubmit}>
//             {investor ? t("investor_updated") : t("save_customer")}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }






// version 3 

import { useState, useEffect } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useLanguage } from "../../context/LanguageContext"; // ✅ Imported custom language hook
import "./InvestorFormModal.css";

export default function InvestorFormModal({ investor, onClose, onSave }) {
  const { t } = useLanguage(); // ✅ Initialized translation hook
  const [formData, setFormData] = useState({
    investor_name: investor?.investor_name || "",
    mobile: investor?.mobile || "",
    address: investor?.address || "",
    notes: investor?.notes || "",
    investor_type: "FIXED_INTEREST",
    fixed_interest_percentage: investor?.fixed_interest_percentage || "",
  });

  useEffect(() => {
    setFormData({
      investor_name: investor?.investor_name || "",
      mobile: investor?.mobile || "",
      address: investor?.address || "",
      notes: investor?.notes || "",
      investor_type: "FIXED_INTEREST",
      fixed_interest_percentage: investor?.fixed_interest_percentage || "",
    });
  }, [investor]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    if (!formData.investor_name.trim()) {
      // 🚀 Upgraded alert to error toast
      toast.error(t("investor_name_required_alert", "Investor Name Required"));
      return;
    }

    if (!formData.fixed_interest_percentage) {
      // 🚀 Upgraded alert to error toast
      toast.error(t("fixed_interest_required_alert", "Enter Fixed Interest Percentage"));
      return;
    }

    // Success notification can follow on the parent component's api call handler,
    // or you can safely trigger a standard toast context here if save executes immediately.
    onSave({
      ...formData,
      fixed_interest_percentage: Number(formData.fixed_interest_percentage) || 0,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>{investor ? t("edit_investor_title", "Edit Investor") : t("add_investor")}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Row 1: Name and Mobile */}
          <div className="form-row">
            <div className="form-group">
              <label>{t("investor_name_label", "Investor Name *")}</label>
              <input
                type="text"
                name="investor_name"
                value={formData.investor_name}
                onChange={handleChange}
                placeholder={t("enter_investor_name_placeholder", "Enter Investor Name")}
              />
            </div>

            <div className="form-group">
              <label>{t("phone", "Mobile")}</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder={t("search_customer_placeholder", "Enter Mobile Number")}
              />
            </div>
          </div>

          {/* Row 2: Address */}
          <div className="form-group">
            <label>{t("address", "Address")}</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder={t("address", "Enter Address")}
              rows={2}
            />
          </div>

          {/* Row 3: Investor Type and Fixed Interest % */}
          <div className="form-row">
            <div className="form-group">
              <label>{t("investor_type_label", "Investor Type")}</label>
              <select
                name="investor_type"
                value={formData.investor_type}
                onChange={handleChange}
                disabled
              >
                <option value="FIXED_INTEREST">{t("fixed_interest_option", "Fixed Interest")}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t("fixed_interest_percentage_label", "Fixed Interest % *")}</label>
              <input
                type="number"
                name="fixed_interest_percentage"
                value={formData.fixed_interest_percentage}
                onChange={handleChange}
                placeholder={t("interest_percentage_example_placeholder", "Example: 12")}
              />
            </div>
          </div>

          {/* Row 4: Notes */}
          <div className="form-group">
            <label>{t("description", "Notes")}</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder={t("optional_details", "Enter Notes")}
              rows={2}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="save-btn" onClick={handleSubmit}>
            {investor ? t("investor_updated") : t("save_customer")}
          </button>
        </div>
      </div>
    </div>
  );
}