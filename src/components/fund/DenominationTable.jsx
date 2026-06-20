

// src/components/fundManagement/DenominationTable.jsx
// import CashDenominationInput from "../common/CashDenominationInput";
import CashDenominationInput from "../../constants/CashDenominationInput";

export default function DenominationTable({ data = {}, setData }) {
  return <CashDenominationInput data={data} setData={setData} />;
}