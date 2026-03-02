export default function PaymentTabs({ activeTab, setActiveTab }) {
    return (
      <div className="payment-tabs">
        <button
          className={`tab-btn ${activeTab === "collect" ? "active" : ""}`}
          onClick={() => setActiveTab("collect")}
        >
          Collect Payment
        </button>
  
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Payment History
        </button>
      </div>
    );
  }
  