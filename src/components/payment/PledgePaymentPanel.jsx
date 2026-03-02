import { useEffect, useState } from "react";
import { Phone, User, Calendar } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { invoke } from "@tauri-apps/api/core";




export default function PledgePaymentPanel({ pledgeId, onChangePledge }) {
  const [details, setDetails] = useState(null);
  const [paymentType, setPaymentType] = useState("INTEREST");
  const [paymentModes, setPaymentModes] = useState([
    {
      method: "CASH",
      amount: 0,
      reference: "",
      denominations: {
        500: 0,
        200: 0,
        100: 0,
        50: 0,
        20: 0,
        10: 0,
      },
    },
  ]);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!pledgeId) return;
  
    async function fetchDetails() {
      const data = await invoke("get_single_pledge_cmd", {
        pledgeId,
      });
      setDetails(data);
    }
  
    fetchDetails();
  }, [pledgeId]);
  
  // ✅ IMPORTANT: NULL CHECK FIRST
  if (!details || !details.pledge) {
    return <div>Loading...</div>;
  }
  
  // ✅ Only after that:
  const pledge = details?.pledge;
  const principal = pledge?.principal_amount;
  const pendingInterest = details?.interest_pending;


  if (!details) return <div>Loading...</div>;

  /* ================= PAYMENT CALCULATION ================= */

  const totalCollected = paymentModes.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  let paymentDue = 0;
  let balance = 0;

  if (paymentType === "INTEREST") {
    paymentDue = details.interest_pending;
    balance = paymentDue - totalCollected;
  } else if (paymentType === "FULL") {
    paymentDue = principal + pendingInterest;
    balance = paymentDue - totalCollected;
  } else if (paymentType === "PARTIAL") {
    paymentDue = principal + pendingInterest;
    balance = paymentDue - totalCollected;
  }

  const hasCashMismatch = paymentModes.some(mode => {
    if (mode.method !== "CASH") return false;
  
    const total = Object.entries(mode.denominations)
      .reduce((sum, [n, c]) => sum + (Number(n) * Number(c)), 0);
  
    return total !== mode.amount;
  });
    /* ================= Handle Paymnt process ================= */
    async function handleProcessPayment() {
      try {
        console.log("Processing payment with details:", {
          pledgeId,
          paymentType,
          paymentModes,
        });
        console.log("paymentModes:", paymentModes);
        console.log("First mode:", paymentModes[0]);
    
        const totalCollected = paymentModes.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0
        );
    
        await invoke("add_pledge_payment_cmd", {
          req: {
            pledge_id: Number(pledgeId),  
            payment_type:
              paymentType === "FULL"
                ? "CLOSURE"
                : paymentType === "INTEREST"
                ? "INTEREST"
                : "PRINCIPAL",
            payment_mode: paymentModes[0].method,
            amount: Number(totalCollected),
            created_by: 1,
            reference:
              paymentModes[0].method !== "CASH"
                ? paymentModes[0].reference
                : null,
                denominations: paymentModes[0].method === "CASH" 
                ? paymentModes[0].denominations 
                : null,  // ✅ ADD THIS LINE
            },
        });
    
        alert("Payment processed successfully");

        // ✅ RELOAD PLEDGE DATA
        const updated = await invoke("get_single_pledge_cmd", {
          pledgeId : Number(pledgeId),
        });
    
        setDetails(updated);
    
        // Clear inputs
        setPaymentModes([{ method: "CASH", amount: 0, reference: "", denominations: { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 } }]);
    
      } catch (error) {
            console.error("🚨 FULL ERROR OBJECT:", error);
            alert("Payment failed. Check console.");
          }
    }
  /* ================= RENDER ================= */

  return (
    <div className="pledge-panel">
      {/* ================= HEADER ================= */}
      <div className="pledge-header">
        <div className="header-left">
          <h2>{pledge.pledge_no}</h2>
          <span>Selected Pledge Details</span>
        </div>
        <button className="btn-change" onClick={onChangePledge}>
          Change
        </button>
      </div>

      {/* ================= CUSTOMER + LOAN INFO ================= */}
      <div className="customer-card">
        <div className="customer-top-section">
          <div className="customer-photo">
            {pledge.photo_path ? (
              <img src={convertFileSrc(pledge.photo_path)} alt="customer" />
            ) : (
              <div className="photo-placeholder">
                {pledge.customer_name?.charAt(0)}
              </div>
            )}
          </div>

          <div className="customer-info-area">
            <div className="info-row">
              <div>
                <span className="label">Customer ID</span>
                <h3 className="customer-id">{pledge.customer_id }</h3>
              </div>

              <div>
                <span className="label">Name</span>
                <h2 className="customer-name">{pledge.customer_name}</h2>
                <div className="relation-row">
                  <User size={18} />
                  <span>{pledge.relation || "Self"}</span>
                </div>
              </div>
            </div>

            <div className="info-row">
              <div className="phone-section">
                <Phone size={18} />
                <span>{pledge.phone}</span>
              </div>

              <div className="address-section">
                <span className="label">Address : </span>
                <span>{pledge.address || "No Address"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* ===== LOAN INFO ===== */}
        <div className="loan-section">
          <h3 className="loan-title">Loan Info</h3>
          <div className="loan-grid">
            <div>
              <span className="label">Principal Amount</span>
              <h2 className="amount-blue">
              ₹{pledge.principal_amount.toLocaleString()}
              </h2>
            </div>

            <div>
              <span className="label">Interest Rate</span>
              <h3>{pledge.interest_rate}% per month</h3>
            </div>

            <div>
              <Calendar size={18} />
              <span className="label">Pledge Date</span>
              <h3>{new Date(pledge.created_at).toLocaleDateString()}</h3>
              {/* <h3> <ISTTime value={pledge.created_at} /> </h3> */}
            </div>
          </div>
        </div>
      </div>

      {/* ================= PENDING INTEREST ================= */}
      <div className="pending-box">
        <div>
          <p>Pending Interest</p>
          <small>Calculated till today</small>
        </div>
        <h2>₹{(pendingInterest ?? 0).toLocaleString()}</h2>
      </div>

      {/* ================= PAYMENT DETAILS ================= */}
      <div className="payment-details-wrapper">
        <div className="payment-header">
          <h3>Payment Details</h3>
        </div>

        <div className="payment-body">
          <h4 className="payment-subtitle">Payment Type</h4>

          <div className="payment-type-grid">
            {/* INTEREST */}
            <div
              className={`type-card ${
                paymentType === "INTEREST" ? "active" : ""
              }`}
              onClick={() => {
                const interest = details.interest_pending;
              
                setPaymentType("INTEREST");
              
                const updated = [...paymentModes];
                updated[0].amount = interest;
                setPaymentModes(updated);
              }}
            >
              <div className="type-icon green">$</div>
              <h4>Interest Payment</h4>
              <span>₹{details.interest_pending.toLocaleString()}</span>
            </div>

            {/* PARTIAL */}
            <div
              className={`type-card ${
                paymentType === "PARTIAL" ? "active" : ""
              }`}
              onClick={() => {
                setPaymentType("PARTIAL");
              
                const updated = [...paymentModes];
                updated[0].amount = 0;
                setPaymentModes(updated);
              }}
            >
              <div className="type-icon blue">💳</div>
              <h4>Partial Payment</h4>
              <span>Custom amount</span>
            </div>

            {/* FULL */}
            <div
              className={`type-card ${paymentType === "FULL" ? "active" : ""}`}
              onClick={() => {
                const total = pledge.principal_amount + details.interest_pending;
              
                setPaymentType("FULL");
              
                const updated = [...paymentModes];
                updated[0].amount = total;
                setPaymentModes(updated);
              }}
            >
              <div className="type-icon purple">✔</div>
              <h4>Full Settlement</h4>
              <span>
                ₹
                {(
                  pledge.principal_amount + details.interest_pending
                ).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="total-box">
            <div>
              <h4>Total Payment Amount</h4>
            </div>
            <div className="total-amount">₹{paymentDue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* ================= PAYMENT COLLECTION ================= */}
      <div className="collection-wrapper">
        <div className="collection-header">
          <h3>Payment Collection</h3>
        </div>

        <div className="collection-body">
        {paymentModes.map((mode, index) => {

      const denominationTotal = Object.entries(mode.denominations)
        .reduce((sum, [note, count]) => sum + (Number(note) * Number(count)), 0);

      const difference = mode.amount - denominationTotal;

      return (
        <div key={index} className="payment-mode-card">

          <div className="payment-mode-layout">

            {/* LEFT SIDE */}
            <div className="payment-left">

              <div className="form-group-modern">
                <label className="modern-label">Payment Method</label>
                <select
                  className="modern-select"
                  value={mode.method}
                  onChange={(e) => {
                    const updated = [...paymentModes];
                    updated[index].method = e.target.value;
                    setPaymentModes(updated);
                  }}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK">Bank</option>
                </select>
              </div>

              <div className="form-group-modern">
                <label className="modern-label">Amount (₹)</label>
                <input
                  type="number"
                  className="modern-input"
                  value={mode.amount}
                  onChange={(e) => {
                    const updated = [...paymentModes];
                    updated[index].amount = Number(e.target.value) || 0;
                    setPaymentModes(updated);
                  }}
                />
                

                {mode.method === "CASH" && (
                  <div className="cash-amount-status">
                    <div className="cash-counted">
                      Cash Counted: ₹{denominationTotal.toLocaleString()}
                    </div>

                    {difference !== 0 && (
                      <div className="cash-mismatch">
                        ⚠ Difference: ₹{Math.abs(difference).toLocaleString()}
                      </div>
                    )}

                    {difference === 0 && mode.amount > 0 && (
                      <div className="cash-match">
                        ✓ Cash matches entered amount
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="payment-right">

              {/* REFERENCE FIELD FOR UPI / BANK */}
                {mode.method !== "CASH" && (
                  <div className="form-group-modern">
                    <label className="modern-label">
                      {mode.method === "UPI"
                        ? "UPI Transaction ID"
                        : "Bank Reference No"}
                    </label>
                    <input
                      type="text"
                      className="modern-input"
                      placeholder="Enter reference number"
                      value={mode.reference}
                      onChange={(e) => {
                        const updated = [...paymentModes];
                        updated[index].reference = e.target.value;
                        setPaymentModes(updated);
                      }}
                    />
                  </div>
                )}

              {mode.method === "CASH" && (
                <div className="denomination-box-modern">
                  <h4>Cash Denominations</h4>

                  <div className="denomination-grid">
                    {[500, 200, 100, 50, 20, 10].map(note => (
                      <div key={note} className="denomination-item">
                        <span>₹{note}</span>
                        <input
                          type="number"
                          value={mode.denominations[note]}
                          onChange={(e) => {
                            const count = Number(e.target.value) || 0;
                            const updated = [...paymentModes];
                            updated[index].denominations[note] = count;
                            setPaymentModes(updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      );
      })}
          {/* ADD MORE MODE */}
          <div
            className="add-payment-mode"
            onClick={() =>
              setPaymentModes([
                ...paymentModes,
                {
                  method: "CASH",
                  amount: 0,
                  reference: "",
                  denominations: {
                    500: 0,
                    200: 0,
                    100: 0,
                    50: 0,
                    20: 0,
                    10: 0,
                  },
                },
              ])
            }
          >
            + Add Another Payment Mode
          </div>

          <div className="collection-summary">
            <div className="summary-row">
              <span>Payment Due:</span>
              <strong>₹{paymentDue.toLocaleString()}</strong>
            </div>

            <div className="summary-row">
              <span>Amount Collected:</span>
              <strong className="green">
                ₹{totalCollected.toLocaleString()}
              </strong>
            </div>

            <hr />

            <div className="summary-row balance">
              <span>Balance:</span>
              <strong className={balance > 0 ? "red" : "green"}>
                ₹{balance.toLocaleString()}
              </strong>
            </div>
            {paymentType === "PARTIAL" && (
              <div className="partial-note">
                Partial payment will clear pending interest first. Remaining
                amount will reduce principal.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= ACTION BUTTON ================= */}
      <div className="action-buttons">
        <button className="btn-cancel">Cancel</button>
        <button
            className="btn-primary"
            disabled={
              (paymentType !== "PARTIAL" && balance !== 0) || hasCashMismatch || 
              paymentModes.some(mode =>
                mode.method === "CASH" &&
                Object.entries(mode.denominations)
                  .reduce((sum, [n, c]) => sum + (Number(n) * Number(c)), 0)
                !== mode.amount
              )
            }
            onClick={handleProcessPayment}

            
            
          >
            Process Payment
          </button>
      </div>
    </div>
  );
}


