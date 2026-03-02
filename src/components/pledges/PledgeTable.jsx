import PledgeTableRow from "./PledgeTableRow";

export default function PledgeTable({ pledges,setActiveMenu }) {
  return (
    <div className="table-container">
      <table className="pledge-table">
        <thead>
          <tr>
            <th>Pledge Number</th>
            <th>Customer</th>
            <th>Principal Amount</th>
            <th>Created Date</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        {pledges.map((pledge) => (
        <PledgeTableRow  key={pledge.id}  pledge={pledge} 
        setActiveMenu={setActiveMenu} /> ))}

        </tbody>
      </table>
    </div>
  );
}
