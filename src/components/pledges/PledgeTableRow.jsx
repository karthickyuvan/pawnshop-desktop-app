// import { formatDateTimeIST } from "../../utils/timeFormatter";
import { formatDateTimeIST } from "../../utils/timeFormatter";

export default function PledgeTableRow({ pledge,setActiveMenu }) {
  const getStatusClass = () => {
    if (pledge.status === "CLOSED") return "status closed";   
    if (pledge.status === "OVERDUE") return "status red";
    if (pledge.status === "DUE_SOON") return "status orange";
    return "status green";
  };

  return (
    <tr>
      <td className="pledge-link">{pledge.pledge_no}</td>
      <td>
        <div className="customer-cell">
          <div className="avatar">
             {/* Use a user icon here */}
             <span style={{opacity: 0.5}}>👤</span> 
          </div>
          <div>
            <div style={{fontWeight: '600'}}>{pledge.customer_name}</div>
            <div className="customer-code">{pledge.customer_code}</div>
          </div>
        </div>
      </td>
      <td style={{fontWeight: '600'}}>₹{pledge.loan_amount.toLocaleString()}</td>
      <td> {formatDateTimeIST(pledge.created_at)}</td>
      <td>
      <div> {formatDateTimeIST(pledge.due_date)} </div>
        <div className="days-remaining">{pledge.days_remaining} days remaining</div>
      </td>
      <td>
        <span className={getStatusClass()}>
          {pledge.status.replace("_", " ")}
        </span>
      </td>
      <td>
        <button className="view-btn" onClick={() => 
          setActiveMenu(`single-pledge-${pledge.id}`)}>
          <span>👁️</span> View
        </button>
      </td>
    </tr>
  );
}