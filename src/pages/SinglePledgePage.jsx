import { useEffect, useState ,useCallback} from "react";
import { invoke,convertFileSrc } from "@tauri-apps/api/core";
import "./singlepledgepage.css";


export default function SinglePledgePage({ pledgeId }) {
  const [data, setData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);

 // ✅ Reusable fetch function (PRODUCTION STYLE)
 const fetchData = useCallback(async () => {
  if (!pledgeId) {
    setLoading(false); 
    return;
  }

  try {
    setLoading(true);

    const response = await invoke("get_single_pledge_cmd", {
      pledgeId: Number(pledgeId),
    });

    setData(response);
  } catch (err) {
    console.error("Failed to fetch pledge:", err);
  } finally {
    setLoading(false);
  }
}, [pledgeId]);

// ✅ Load when component mounts
useEffect(() => {
  fetchData();
}, [fetchData]);

if (loading) {
  return (
    <div className="page-loader">
      <div className="loader-box">
        <div className="spinner"></div>
        <p>Loading pledge details...</p>
      </div>
    </div>
  );
}
if (!data) return <div className="loading">No Data Found</div>;

// 1️⃣ EXTRACT `original_principal` FROM BACKEND DATA
const { pledge, items,payments,
  months_elapsed,
  interest_accrued,
  interest_received,
  interest_pending,
  original_principal 
   } = data;

// Setup fallback just in case
const originalAmount = original_principal || pledge.principal_amount;

// ---------- DATE CALCULATIONS (Unified) ----------

  const createdDate = new Date(pledge.created_at);
  const today = new Date();

// Format creation date
  const formattedCreatedDate = createdDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Due date (based on full duration)
  const dueDate = new Date(createdDate);
  dueDate.setMonth(dueDate.getMonth() + pledge.duration_months);

  const formattedDueDate = dueDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Days since pledge created
const daysSinceCreated = Math.floor(
  (today - createdDate) / (1000 * 60 * 60 * 24)
);

// ---------- STATUS CALCULATIONS ----------

// Days elapsed
  const daysElapsed = daysSinceCreated;

  // Sort payments (latest first)
  const sortedPayments = [...(payments || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Last payment date
  const lastPaymentDate =
    sortedPayments.length > 0
      ? new Date(sortedPayments[0].date)
      : createdDate;

  // Next due date (1 month after last payment)
  const nextDueDate = new Date(lastPaymentDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  const formattedNextDueDate = nextDueDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Overdue check
  const isOverdue = today > nextDueDate;

// ----------- ALERT STATUS LOGIC -------------

let alertTitle = "";
let alertMessage = "";
let alertIcon = "🕒";

// If pledge is closed
if (pledge.status === "CLOSED") {
  alertTitle = "Pledge Closed";
  alertMessage = "This pledge has been closed successfully.";
  alertIcon = "✅";
}

// If overdue
else if (isOverdue) {
  const overdueDays = Math.floor(
    (today - nextDueDate) / (1000 * 60 * 60 * 24)
  );

  alertTitle = "Payment Overdue";
  alertMessage = `Interest payment overdue by ${overdueDays} days (Due on ${formattedNextDueDate})`;
  alertIcon = "❌";
}

// Due within 7 days
else if ((nextDueDate - today) / (1000 * 60 * 60 * 24) <= 7) {
  alertTitle = "Payment Due Soon";
  alertMessage = `Next interest payment is due on ${formattedNextDueDate}`;
  alertIcon = "⚠️";
}

// Normal
else {
  alertTitle = "Active Loan";
  alertMessage = `Next interest payment due on ${formattedNextDueDate}`;
}



  // ✅ Safe image conversion
  const photoUrl =
    pledge?.photo_path && pledge.photo_path.trim() !== ""
      ? convertFileSrc(pledge.photo_path)
      : null;


  return (
    <div className="single-pledge-container">
      <header className="page-header">
        {/* Row 1: Back Link */}
        <div className="back-nav">
          <button className="back-btn">← Back to Active Pledges</button>
        </div>

        {/* Row 2: ID, Status, and Print Button */}
        <div className="header-main-row">
          <div className="id-group">
            <h1>{pledge.pledge_no}</h1>
            {/* 2️⃣ DYNAMIC STATUS BADGE */}
            <span 
              className={`status-badge ${pledge.status === "CLOSED" ? "closed" : "active"}`}
              style={pledge.status === "CLOSED" ? { backgroundColor: "#e5e7eb", color: "#374151" } : {}}
            >
              {pledge.status}
            </span>
          </div>
          
          <button className="print-btn">
            <span className="print-icon">⎙</span> Print
          </button>
        </div>

        {/* Row 3: Meta Dates */}
        <div className="header-meta">
          Created on {formattedCreatedDate} • Due on {formattedDueDate}
          <span style={{ marginLeft: "10px", color: "#888" }}>
            ({daysSinceCreated} days ago)
          </span>
        </div>

      </header>

      <main className="content-layout">
        {/* LEFT COLUMN */}
        <div className="main-column">
        <section className="info-card">
          <h3 className="card-title">👤 Customer Information</h3>
          
          <div className="customer-card-body">
            {/* LEFT: PHOTO (Fixed Width) */}
            <div className="customer-photo-container">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Customer"
                  className="customer-photo-rect"
                  
                />
              ) : (
                <div className="photo-placeholder">
                  <span className="placeholder-label">Customer</span>
                  <div className="placeholder-icon-box">?</div>
                </div>
              )}
            

            </div>

            {/* RIGHT: ALL TEXT (Flexible but with min-width) */}
            <div className="info-text-wrapper">
              <div className="info-row three-cols">
                <div className="field">
                  <span>Customer ID</span>
                  <p>{pledge.customer_id}</p>
                </div>
                <div className="field">
                  <span>Full Name</span>
                  <p>{pledge.customer_name}</p>
                </div>
                <div className="field">
                  <span>Relation</span>
                  <p>{pledge.relation }</p>
                </div>
              </div>
              
              <div className="divider-line"></div>
              
              <div className="info-row">
                <div className="field">
                  <span>Phone Number</span>
                  <div className="value-with-icon">
                    <span className="icon-muted">📞</span>
                    <p>{pledge.phone}</p>
                  </div>
                </div>
                <div className="field">
                  <span>Address</span>
                  <div className="value-with-icon">
                    <span className="icon-muted">📍</span>
                    <p>{pledge.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

          <section className="info-card">
            <h3>📄 Loan Details</h3>
            <div className="info-grid four-cols">
              <div className="field"><span>Loan Type</span><p>{pledge.loan_type}</p></div>
              <div className="field"><span>Scheme</span><p>{pledge.scheme_name}</p></div>
              <div className="field"><span>Interest Rate</span><p>{pledge.interest_rate}%</p></div>
              <div className="field"><span>Duration</span><p>{pledge.duration_months} months</p></div>
              <div className="divider-line"></div>
              
              {/* 3️⃣ SHOW ORIGINAL AMOUNT + REMAINING IF PARTIALLY PAID */}
              <div className="field">
                <span>Principal Amount</span>
                <p className="bold">₹{originalAmount.toLocaleString()}</p>
                {originalAmount > pledge.principal_amount && (
                  <span style={{ color: "#e11d48", fontSize: "12px", fontWeight: "600", marginTop: "2px", display: "block" }}>
                    Remaining: ₹{pledge.principal_amount.toLocaleString()}
                  </span>
                )}
              </div>
              
              <div className="field"><span>Price per Gram</span><p>₹{pledge.price_per_gram}</p></div>
            </div>
          </section>

          <section className="info-card">
            <h3>💍 Pledged Jewellery Items</h3>
            <table className="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Type</th>
                  <th>Purity</th>
                  <th>Gross Wt.</th>
                  <th>Net Wt.</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{item.jewellery_type}</td>
                    <td><span className="purity-tag">{item.purity}</span></td>
                    <td>{item.gross_weight}g</td>
                    <td>{item.net_weight}g</td>
                    <td className="bold">₹{item.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-summary-footer">
                <tr>
                  <td colSpan="3" className="total-label">Total Value:</td>
                  <td className="total-value">{pledge.total_gross_weight} g</td>
                  <td className="total-value">{pledge.total_net_weight} g</td>
                  <td className="total-amount-highlight">₹{pledge.total_value?.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </section>
          <section className="info-card">
          <h3 className="card-title">💳 Payment History</h3>
          
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payment Type</th>
                  <th>Mode</th>
                  <th>Receipt No.</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
              {data.payments && data.payments.length > 0 ? (
                data.payments.map((payment, index) => (
                  <tr key={index}>
                    <td>{payment.date?.slice(0, 10)}</td>

                    <td>
                      {payment.payment_type === "INTEREST"
                        ? "Interest Payment"
                        : payment.payment_type === "PRINCIPAL"
                        ? "Principal Payment"
                        : "Closure Payment"}
                    </td>

                    <td>
                      <span className="mode-badge">
                        {payment.mode}
                      </span>
                    </td>

                    <td className="receipt-no">
                      {payment.receipt_no || "-"}
                    </td>

                    <td className="payment-amount">
                      ₹{Number(payment.amount).toLocaleString()}
                    </td>

                    <td>
                      <span
                        className={`status-pill ${
                          payment.status === "COMPLETED"
                            ? "completed"
                            : "reversed"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                    No payments recorded yet
                  </td>
                </tr>
              )}
            </tbody>

            </table>
          </div>
        </section>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="sidebar-column">
        {/* Current Status Card */}
        <div className="side-card status-card">
          <div className="card-header-row">
            <span className="icon-orange">🕒</span>
            <h4 className="status-title">Current Status</h4>
          </div>
          <div className="side-row">
            <span>Days Elapsed</span>
            <span className="bold-val">{daysElapsed} days</span>
          </div>

          <div className="side-row">
            <span>Next Due Date</span>
            <span
              className="due-date-val"
              style={{ color: isOverdue ? "#dc2626" : undefined }}
            >
              {formattedNextDueDate}
            </span>
          </div>

          {sortedPayments.length > 0 && (
            <div className="side-row">
              <span>Last Payment</span>
              <span>
                {new Date(sortedPayments[0].date).toLocaleDateString("en-IN")}
              </span>
            </div>
          )}

        </div>

        {/* Amount Summary Card */}

        <div className="side-card amount-summary-card-old">
          <h4 className="summary-title">Account Summary</h4>

          <div className="summary-row">
            <span>Item Value</span>
            <span>₹{pledge.total_value?.toLocaleString()}</span>
          </div>

          <div className="divider-line"></div>

          {/* 3️⃣ UPDATED SIDEBAR ORIGINAL PRINCIPAL VIEW */}
          <div className="summary-row">
            <span>Original Loan</span>
            <span>₹{originalAmount.toLocaleString()}</span>
          </div>

          {originalAmount > pledge.principal_amount && (
            <div className="summary-row danger">
              <span>Remaining Principal</span>
              <span>₹{pledge.principal_amount.toLocaleString()}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Accrued Interest ({months_elapsed} months)</span>
            <span>₹{Number(interest_accrued || 0).toLocaleString()}</span>
          </div>

          <div className="summary-row success">
            <span>Interest Paid</span>
            <span>₹{Number(interest_received || 0).toLocaleString()}</span>
          </div>

          <div className="summary-row danger">
            <span>Interest Balance</span>
            <span>₹{Number(interest_pending || 0).toLocaleString()}</span>
          </div>

          <div className="divider-line"></div>

          <div className="summary-row total-highlight">
            <span>To Close Today</span>
            <span>
              ₹{Number(
                pledge.principal_amount + (interest_pending || 0)
              ).toLocaleString()}
            </span>
          </div>

          <div className="divider-line"></div>

          <div className="summary-row small">
            <span>Days Since Pledge</span>
            <span>{daysElapsed} days</span>
          </div>

          <div className="summary-row small">
            <span>Next Interest Due</span>
            <span>{formattedNextDueDate}</span>
          </div>

          <div className="summary-row small">
            <span>Payments Count</span>
            <span>{data.payments?.length || 0}</span>
          </div>

          <div className="summary-row small">
            <span>Last Payment</span>
            <span>
              {sortedPayments.length > 0
                ? new Date(sortedPayments[0].date).toLocaleDateString("en-IN")
                : "-"}
            </span>
          </div>
        </div>

        {/* Payment Due Alert */}
        <div className="due-alert-box">
        <span className="alert-icon">{alertIcon}</span>
        <div className="alert-content">
          <p className="alert-title">{alertTitle}</p>
          <p className="alert-sub">{alertMessage}</p>
        </div>
      </div>


        {/* Actions Card */}
        <div className="side-card actions-card">
          <h4>Actions</h4>
          <button className="payment-btn"
            disabled={pledge.status === "CLOSED"}
            onClick={() => setShowPaymentModal(true)} >
            <span>💳</span> Make Payment
          </button>

          <div className="owner-only-group">
            <button className="action-btn-secondary">
              <span className="btn-main">🗓️ Repledge </span>
              <span className="tag-muted">Owner Only</span>
            </button>
            <button className="action-btn-secondary" disabled>
              <span className="btn-main-danger">📄 Close Pledge</span>
              <span className="tag-muted">Owner Only</span>
            </button>
          </div>
        </div>
      </aside>
      </main>

      {showPaymentModal && (
  <PaymentModal
    pledgeId={pledgeId}
    
    onClose={() => setShowPaymentModal(false)}
    onSuccess={fetchData} 
  />
)}

    </div>
  );
}