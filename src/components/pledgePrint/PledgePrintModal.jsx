import { useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import "./PledgePrintModal.css";

export default function PledgePrintModal({ data, shopSettings, onClose, isReprint = false }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      document.body.style.zoom = "100%";
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  },[]);

  const handlePrint = () => window.print();

  /* ── Helpers ── */
  const getCurrentDate = () =>
    new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const getPocketNumber = () => data.pledgeNo?.slice(-4) || "0000";
  const receiptNumber = data.receipt_number || "N/A";
  const totalItems = data.items?.length || 0;

  /* ── Image helpers ── */
  const shopLogo = shopSettings?.logo_path ? convertFileSrc(shopSettings.logo_path) : null;
  const customerPhoto = data.customer?.photo_path ? convertFileSrc(data.customer.photo_path) : null;
  // const itemPhoto = data.items?.[0]?.photo_path ? convertFileSrc(data.items[0].photo_path) : null;

  const getItemPhoto = () => {
    const firstItem = data.items?.[0];
    if (!firstItem) return null;

    // 1. If it's a new pledge, it uses the base64 string directly from CameraModal
    if (firstItem.img) return firstItem.img;
    if (firstItem.image_base64) return firstItem.image_base64;

    // 2. If it's a reprint fetched from the DB, it uses the saved file path
    if (firstItem.photo_path) return convertFileSrc(firstItem.photo_path);
    if (firstItem.image_path) return convertFileSrc(firstItem.image_path);

    return null;
  };
  const itemPhoto = getItemPhoto();

  /* ── Item Description Generator ── */
  const getItemDescriptions = () => {
    if (!data.items || data.items.length === 0) return "—";
    return data.items
      .map((i) => `${i._typeName}${i.description ? ` - ${i.description}` : ""}`)
      .join(", ");
  };

  /* ════════════════════════════════════════════════════════
     MAIN RECEIPT — UPDATED LAYOUT
     ════════════════════════════════════════════════════════ */
  const renderMainReceipt = (copyLabel, isStoreCopy = false) => (
    <div className="sketch-receipt">
      
      {/* 1. Header Area */}
      <div className="sketch-header">
        <div className="logo-area">
          {shopLogo ? <img src={shopLogo} alt="Logo" /> : <div className="no-logo">LOGO</div>}
        </div>
        <div className="company-details">
          <h2>{shopSettings?.shop_name || "COMPANY NAME"}</h2>
          <p>{shopSettings?.address || "Address"}</p>
          <p>Ph No: {shopSettings?.phone || "—"} | {shopSettings?.email || ""}</p>
        </div>
        <div className="copy-badge-area">
          <span className="badge">{copyLabel}</span>
        </div>
      </div>

      {/* 2. Title Bar */}
      <div className="sketch-title-bar">
        <div className="left-title">Pledge Receipt</div>
        <div className="right-date">Pledged Date: {getCurrentDate()}</div>
      </div>

      {/* 3. Main Split: Customer Info & Photos side-by-side */}
      <div className="sketch-grid-main">
        
        {/* Left Side: Customer Text + Highlight Boxes */}
        <div className="customer-info-box">
          <div className="box-title">Customer Informations</div>
          <div className="info-content-flex">
            
            {/* BIG Customer Text */}
            <div className="info-text">
              <p><b>Name:</b> {data.customer?.name || "—"}</p>
              <p>
                <b>Relation Name:</b>{" "}
                {data.customer?.relation_type && data.customer?.relation_name
                  ? `${data.customer.relation_type} ${data.customer.relation_name}`
                  : "Self"}
              </p>
              <p className="address-text"><b>Address:</b> {data.customer?.address || "—"}</p>
              <p><b>Ph No:</b> {data.customer?.phone || "—"}</p>
            </div>
            
            {/* Single Line Highlights (Loan & Pledge No) */}
            <div className="info-highlights-vertical">
              <div className="hl-box-vert"><b>Pledge No:</b> {data.pledgeNo}</div>
              <div className="hl-box-vert"><b>Loan Amount:</b> ₹{Number(data.finalLoan || 0).toLocaleString()}</div>
            </div>

          </div>
        </div>

        {/* Right Side: Both Photos side-by-side */}
        <div className="photos-box">
          <div className="box-title">Photos</div>
          <div className="photos-wrapper">
            
            <div className="photo-container">
              {customerPhoto ? (
                <img src={customerPhoto} alt="Customer" className="stamp-photo" />
              ) : (
                <div className="stamp-photo no-photo-placeholder">No Photo</div>
              )}
              <span className="photo-label">Customer</span>
            </div>

            <div className="photo-container">
              {itemPhoto ? (
                <img src={itemPhoto} alt="Jewel" className="stamp-photo" />
              ) : (
                <div className="stamp-photo no-photo-placeholder">No Photo</div>
              )}
              <span className="photo-label">Jewel</span>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Item Details (Single Inline Row) */}
      <div className="item-details-box">
        <div className="box-title">Jewel Details</div>
        <div className="item-details-single-line">
          <div className="detail-desc">
            <b>Item Description:</b> {getItemDescriptions()}
          </div>
          <div className="detail-stat">
            <b>N.T:</b> {Number(data.totalNetWt || 0).toFixed(2)}g
          </div>
          <div className="detail-stat">
            <b>G.W.T:</b> {Number(data.totalGrossWt || 0).toFixed(2)}g
          </div>
          <div className="detail-count">
            <b>Total Items:</b> <span className="count-val-inline">{totalItems}</span>
          </div>
        </div>
      </div>

      {/* 5. Rules & Signatures Footer */}
      <div className="sketch-footer">
        <div className="rules-area">
          <b>Rules:</b> 
          <ol>
            <li>6 மாதங்களுக்கு ஒருமுறை வட்டி கட்ட ரசீதை புதுப்பிக்கவும்.</li>
            <li>மீட்கும் போது அசல் ரசீது அவசியம்.</li>
            <li>for {shopSettings?.shop_name || "Pawn Shop"}</li>
          </ol>
        </div>
        <div className="signatures-area">
          <div className="sig-line">
            <div className="line"></div>
            <span>Pledge Signature</span>
          </div>
          <div className="sig-line">
            <div className="line"></div>
            <span>Customer Signature</span>
          </div>
        </div>
      </div>

    </div>
  );

  /* ════════════════════════════════════════════════════════
     POCKET COPY (Unchanged)
     ════════════════════════════════════════════════════════ */
  const renderPocketCopy = () => (
    <div className="pocket-section">
      <div className="pocket-cut-line">✂ ─────────────────────── CUT HERE ───────────────────────── ✂</div>
      <div className="pocket-content">
        <div className="pocket-shop-info">
          <div className="pocket-shop-name">{shopSettings?.shop_name || "PAWN SHOP"}</div>
          <div className="pocket-phone">{shopSettings?.phone || ""}</div>
          <div className="pocket-details-list">
            <div className="pocket-detail-row"><span>Receipt No:</span><span>{receiptNumber}</span></div>
            <div className="pocket-detail-row"><span>Pledge No:</span><span>{data.pledgeNo}</span></div>
            <div className="pocket-detail-row"><span>Pocket No:</span><span className="pocket-no">{getPocketNumber()}</span></div>
            <div className="pocket-detail-row"><span>Name:</span><span>{data.customer?.name || "—"}</span></div>
            <div className="pocket-detail-row"><span>Date:</span><span>{getCurrentDate()}</span></div>
            <div className="pocket-detail-row highlight-row"><span>Loan Amount:</span><span>₹ {Number(data.finalLoan || 0).toLocaleString()}</span></div>
          </div>
        </div>
        <div className="pocket-items-section">
          <div className="pocket-items-title">அடகு பொருட்கள் / Items List <span className="item-count">({totalItems})</span></div>
          <ul className="pocket-items-list">
            {data.items?.map((item, idx) => (
              <li key={idx}>
                {item._typeName} {item.description ? `— ${item.description}` : ""} — {Number(item.net || 0).toFixed(2)}g
              </li>
            ))}
          </ul>
        </div>
        <div className="pocket-vertical-strip">
          <div className="vertical-item">No: {getPocketNumber()}</div>
          <div className="vertical-item">Date: {getCurrentDate()}</div>
          <div className="vertical-item">₹ {Number(data.finalLoan || 0).toLocaleString()}/-</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="print-modal-overlay">
      <div className="print-modal-container">
        <div className="print-action-bar no-print">
          <span>{isReprint ? "🔁 Duplicate Receipt" : "🧾 Pledge Receipt"} — {data.pledgeNo}</span>
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print</button>
            <button className="btn btn-secondary" onClick={onClose}>✕ Close</button>
          </div>
        </div>

        <div className="print-area">
          {renderMainReceipt("CUSTOMER COPY", false)}
          {renderMainReceipt("STORE COPY", true)}
          {renderPocketCopy()}
        </div>
      </div>
    </div>
  );
}