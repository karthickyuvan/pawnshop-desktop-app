import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { getBanks } from "../services/bankApi";
import { mapBankToPledge } from "../services/bankMappingApi";
import { Link2, Fingerprint, Landmark, IndianRupee, ReceiptText, ShieldCheck } from "lucide-react";
import "./bankMapping.css";

export default function BankMappingPage() {
  const user = useAuthStore((s) => s.user);

  const [banks, setBanks] = useState([]);
  const [pledgeId, setPledgeId] = useState("");
  const [bankId, setBankId] = useState("");
  const [amount, setAmount] = useState("");
  const [bankCharges, setBankCharges] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBanks().then(setBanks);
  }, []);

  const submit = async () => {
    if (!pledgeId || !bankId || !amount) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      await mapBankToPledge({
        pledgeId: Number(pledgeId),
        bankId: Number(bankId),
        amount: Number(amount),
        bankCharges: Number(bankCharges || 0),
        actorUserId: user.user_id,
      });

      setPledgeId("");
      setAmount("");
      setBankCharges("");
      setBankId("");
      alert("Bank mapped successfully");
    } catch (err) {
      alert("Mapping failed. Please check the Pledge ID.",err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mapping-container">
      <header className="mapping-header">
        <div className="title-group">
          <div className="icon-wrapper">
            <Link2 className="icon-main" />
          </div>
          <div>
            <h1>Bank Mapping</h1>
            <p>Link pledge transactions to specific bank disbursements.</p>
          </div>
        </div>
      </header>

      <div className="mapping-card">
        <div className="card-section-title">
          <ShieldCheck size={18} /> Transaction Details
        </div>
        
        <div className="mapping-grid">
          {/* LEFT SIDE: IDs */}
          <div className="input-group">
            <label><Fingerprint size={14} /> Pledge ID <span className="req">*</span></label>
            <input 
              type="number"
              placeholder="Enter Pledge ID" 
              value={pledgeId} 
              onChange={(e) => setPledgeId(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label><Landmark size={14} /> Disbursement Bank <span className="req">*</span></label>
            <select value={bankId} onChange={(e) => setBankId(e.target.value)}>
              <option value="">Select Account</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bank_name} ({b.account_number.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          {/* RIGHT SIDE: MONEY */}
          <div className="input-group">
            <label><IndianRupee size={14} /> Transfer Amount <span className="req">*</span></label>
            <input 
              type="number"
              placeholder="0.00" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label><ReceiptText size={14} /> Bank Charges</label>
            <input 
              type="number"
              placeholder="0.00" 
              value={bankCharges} 
              onChange={(e) => setBankCharges(e.target.value)} 
            />
          </div>
        </div>

        <div className="mapping-footer">
          <div className="info-text">
            All fields marked with <span className="req">*</span> are mandatory for settlement.
          </div>
          <button className="submit-btn" onClick={submit} disabled={loading}>
            {loading ? "Processing..." : "Confirm Mapping"}
          </button>
        </div>
      </div>
    </div>
  );
}