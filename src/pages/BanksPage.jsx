// import { useEffect, useState } from "react";
// import { useAuthStore } from "../auth/authStore";
// import { getBanks, createBank } from "../services/bankApi";
// import { Building2, Landmark, CreditCard, Hash, Link, Plus, Search } from "lucide-react";
// import "./bank.css";

// export default function BankPage() {
//   const user = useAuthStore((s) => s.user);
//   const [banks, setBanks] = useState([]);
//   const [bankName, setBankName] = useState("");
//   const [branchName, setBranchName] = useState("");
//   const [accountNumber, setAccountNumber] = useState("");
//   const [ifscCode, setIfscCode] = useState("");
//   const [loading, setLoading] = useState(false);

//   const load = async () => {
//     const data = await getBanks();
//     setBanks(data);
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const submit = async () => {
//     if (!bankName || !branchName || !accountNumber || !ifscCode) {
//       alert("All fields are required");
//       return;
//     }

//     try {
//       setLoading(true);
//       await createBank({
//         bankName,
//         branchName,
//         accountNumber,
//         ifscCode,
//         actorUserId: user.user_id,
//       });

//       setBankName("");
//       setBranchName("");
//       setAccountNumber("");
//       setIfscCode("");
//       load();
//     } catch (err) {
//       alert("Error adding bank",err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bank-container">

//       {/* HEADER */}
//       <header className="page-header-with-actions">
//         <div className="title-group">
//           <Building2 className="icon-main" />
//           <div className="title-text">
//             <h1>Bank Accounts</h1>
//             <p>Manage settlement accounts and banking details.</p>
//           </div>
//         </div>

//         <div className="header-actions">
//           <button
//             className="secondary-btn"
//             onClick={() => window.dispatchEvent(
//               new CustomEvent("menu-change", { detail: "bank-mapping" })
//             )}
//           >
//             <Link size={16} /> Bank Mapping
//           </button>
//         </div>
//       </header>

//       {/* FORM CARD */}
//       <section className="input-card">
//         <div className="card-header">
//           <h3>Add New Account</h3>
//         </div>
//         <div className="bank-grid">
//           <div className="input-group">
//             <label><Landmark size={14} /> Bank Name</label>
//             <input
//               placeholder="e.g. HDFC Bank"
//               value={bankName}
//               onChange={(e) => setBankName(e.target.value)}
//             />
//           </div>
//           <div className="input-group">
//             <label><Search size={14} /> Branch</label>
//             <input
//               placeholder="e.g. T-Nagar Branch"
//               value={branchName}
//               onChange={(e) => setBranchName(e.target.value)}
//             />
//           </div>
//           <div className="input-group">
//             <label><CreditCard size={14} /> Account Number</label>
//             <input
//               placeholder="0000 0000 0000"
//               value={accountNumber}
//               onChange={(e) => setAccountNumber(e.target.value)}
//             />
//           </div>
//           <div className="input-group">
//             <label><Hash size={14} /> IFSC Code</label>
//             <input
//               className="uppercase"
//               placeholder="HDFC0001234"
//               value={ifscCode}
//               onChange={(e) => setIfscCode(e.target.value)}
//             />
//           </div>
//         </div>
//         <div className="form-footer">
//           <button className="primary-btn" onClick={submit} disabled={loading}>
//             {loading ? "Adding..." : <><Plus size={18} /> Add Bank Account</>}
//           </button>
//         </div>
//       </section>

//       {/* TABLE CARD */}
//       <section className="table-card">
//         <div className="table-wrapper">
//           <table className="modern-table">
//             <thead>
//               <tr>
//                 <th>Bank & Branch</th>
//                 <th>Account Number</th>
//                 <th>IFSC Details</th>
//               </tr>
//             </thead>
//             <tbody>
//               {banks.map((b) => (
//                 <tr key={b.id}>
//                   <td>
//                     <div className="bank-identity">
//                       <span className="bank-name-text">{b.bank_name}</span>
//                       <span className="branch-sub-text">{b.branch_name}</span>
//                     </div>
//                   </td>
//                   <td className="font-mono">{b.account_number}</td>
//                   <td>
//                     <span className="ifsc-badge">{b.ifsc_code}</span>
//                   </td>
//                 </tr>
//               ))}
//               {banks.length === 0 && (
//                 <tr>
//                   <td colSpan="3" className="empty-state">No bank accounts linked yet.</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </section>
//     </div>
//   );
// }

// version 2 

import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { getBanks, createBank } from "../services/bankApi";
import { Building2, Landmark, CreditCard, Hash, Link, Plus, Search } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import "./bank.css";

export default function BankPage() {

  const user = useAuthStore((s) => s.user);
  const { t } = useLanguage();

  const [banks, setBanks] = useState([]);
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await getBanks();
    setBanks(data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {

    if (!bankName || !branchName || !accountNumber || !ifscCode) {
      alert(t("all_fields_required"));
      return;
    }

    try {

      setLoading(true);

      await createBank({
        bankName,
        branchName,
        accountNumber,
        ifscCode,
        actorUserId: user.user_id,
      });

      setBankName("");
      setBranchName("");
      setAccountNumber("");
      setIfscCode("");

      load();

    } catch (err) {
      alert(t(err,"bank_add_error"));
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="bank-container">

      {/* HEADER */}
      <header className="page-header-with-actions">

        <div className="title-group">

          <Building2 className="icon-main" />

          <div className="title-text">

            <h1>{t("bank_accounts")}</h1>

            <p>{t("bank_accounts_desc")}</p>

          </div>

        </div>

        <div className="header-actions">

          <button
            className="secondary-btn"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("menu-change", { detail: "bank-mapping" })
              )
            }
          >
            <Link size={16} /> {t("bank_mapping")}
          </button>

        </div>

      </header>

      {/* FORM CARD */}
      <section className="input-card">

        <div className="card-header">
          <h3>{t("add_new_account")}</h3>
        </div>

        <div className="bank-grid">

          <div className="input-group">

            <label>
              <Landmark size={14} /> {t("bank_name")}
            </label>

            <input
              placeholder={t("bank_name_placeholder")}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />

          </div>

          <div className="input-group">

            <label>
              <Search size={14} /> {t("branch")}
            </label>

            <input
              placeholder={t("branch_placeholder")}
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
            />

          </div>

          <div className="input-group">

            <label>
              <CreditCard size={14} /> {t("account_number")}
            </label>

            <input
              placeholder="0000 0000 0000"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />

          </div>

          <div className="input-group">

            <label>
              <Hash size={14} /> {t("ifsc_code")}
            </label>

            <input
              className="uppercase"
              placeholder="HDFC0001234"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
            />

          </div>

        </div>

        <div className="form-footer">

          <button
            className="primary-btn"
            onClick={submit}
            disabled={loading}
          >
            {loading
              ? t("adding")
              : (
                <>
                  <Plus size={18} /> {t("add_bank_account")}
                </>
              )}

          </button>

        </div>

      </section>

      {/* TABLE CARD */}
      <section className="table-card">

        <div className="table-wrapper">

          <table className="modern-table">

            <thead>

              <tr>

                <th>{t("bank_branch")}</th>

                <th>{t("account_number")}</th>

                <th>{t("ifsc_details")}</th>

              </tr>

            </thead>

            <tbody>

              {banks.map((b) => (

                <tr key={b.id}>

                  <td>

                    <div className="bank-identity">

                      <span className="bank-name-text">
                        {b.bank_name}
                      </span>

                      <span className="branch-sub-text">
                        {b.branch_name}
                      </span>

                    </div>

                  </td>

                  <td className="font-mono">
                    {b.account_number}
                  </td>

                  <td>
                    <span className="ifsc-badge">
                      {b.ifsc_code}
                    </span>
                  </td>

                </tr>

              ))}

              {banks.length === 0 && (

                <tr>
                  <td colSpan="3" className="empty-state">
                    {t("no_bank_accounts")}
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