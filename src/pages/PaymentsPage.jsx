import { useState } from "react";
import PaymentHistoryCard from "../components/payment/PaymentHistoryCard";
import PaymentHeader from "../components/payment/PaymentHeder";
import PaymentTabs from "../components/payment/PaymentTabs";
import SearchSidebar from "../components/payment/SearchSidebar";
import PaymentEmptyState from "../components/payment/PaymentEmptyState";
import "./payment.css";
import PledgePaymentPanel from "../components/payment/PledgePaymentPanel";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("collect");
  const [selectedPledgeId, setSelectedPledgeId] = useState(null);


  return (
    <div className="payment-page">
      <PaymentHeader />
      <PaymentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* CONDITIONAL RENDERING */}
      {activeTab === "collect" ? (
        <div className="payment-layout">
          <SearchSidebar
        onSelectPledge={(id) => setSelectedPledgeId(id)}
      />
         
      {selectedPledgeId ? (
       <PledgePaymentPanel
       pledgeId={selectedPledgeId}
       onChangePledge={() => setSelectedPledgeId(null)}
     />
      ) : (
        <PaymentEmptyState />
      )}
        </div>
      ) : (
        <PaymentHistoryCard />
      )}
      </div>
  );
}
