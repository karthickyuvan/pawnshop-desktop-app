// import { useState, useRef } from "react";
// import "./PledgePrintModal.css";

// // ── Inline SVG Icons ──────────────────────────────────────────────────────────
// const IconPrint  = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <polyline points="6 9 6 2 18 2 18 9"/>
//     <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
//     <rect x="6" y="14" width="12" height="8"/>
//   </svg>
// );
// const IconClose  = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//     <line x1="18" y1="6"  x2="6"  y2="18"/>
//     <line x1="6"  y1="6"  x2="18" y2="18"/>
//   </svg>
// );
// const IconUser   = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//     <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
//     <circle cx="12" cy="7" r="4"/>
//   </svg>
// );
// const IconStore  = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//     <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
//     <polyline points="9 22 9 12 15 12 15 22"/>
//   </svg>
// );
// const IconPocket = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//     <path d="M4 3h16a2 2 0 0 1 2 2v6a10 10 0 0 1-10 10A10 10 0 0 1 2 11V5a2 2 0 0 1 2-2z"/>
//     <polyline points="8 10 12 14 16 10"/>
//   </svg>
// );
// const IconCheck  = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//     <polyline points="20 6 9 17 4 12"/>
//   </svg>
// );

// // ── Copy type config ──────────────────────────────────────────────────────────
// const COPY_TYPES = [
//   {
//     id:       "customer",
//     label:    "Customer Copy",
//     sublabel: "Full details for the customer",
//     Icon:     IconUser,
//     color:    "#2563eb",
//     bg:       "#eff6ff",
//     border:   "#bfdbfe",
//   },
//   {
//     id:       "store",
//     label:    "Store Copy",
//     sublabel: "Office record with all fields",
//     Icon:     IconStore,
//     color:    "#059669",
//     bg:       "#ecfdf5",
//     border:   "#a7f3d0",
//   },
//   {
//     id:       "pocket",
//     label:    "Pocket Copy",
//     sublabel: "Compact slip for the customer",
//     Icon:     IconPocket,
//     color:    "#d97706",
//     bg:       "#fffbeb",
//     border:   "#fde68a",
//   },
// ];

// // ── Formatting helpers ────────────────────────────────────────────────────────
// const fmt    = (n) => Number(n || 0).toLocaleString("en-IN");
// const fmtWt  = (n) => Number(n || 0).toFixed(2);
// const today  = () =>
//   new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
// const nowStr = () =>
//   new Date().toLocaleString("en-IN", {
//     day: "2-digit", month: "short", year: "numeric",
//     hour: "2-digit", minute: "2-digit",
//   });

// // ── Shared receipt sub-components ─────────────────────────────────────────────
// function ReceiptHeader({ shopSettings, copyLabel }) {
//   return (
//     <div className="receipt-header">
//       {shopSettings?.logo_path && (
//         <img src={shopSettings.logo_path} alt="logo" className="receipt-logo" />
//       )}
//       <div className="receipt-shop-info">
//         <div className="receipt-shop-name">{shopSettings?.shop_name || "Pawn Shop"}</div>
//         {shopSettings?.address        && <div className="receipt-shop-line">{shopSettings.address}</div>}
//         {shopSettings?.phone          && <div className="receipt-shop-line">Ph: {shopSettings.phone}</div>}
//         {shopSettings?.email          && <div className="receipt-shop-line">{shopSettings.email}</div>}
//         {shopSettings?.license_number && <div className="receipt-shop-line">Lic: {shopSettings.license_number}</div>}
//       </div>
//       <div className="receipt-copy-badge">{copyLabel}</div>
//     </div>
//   );
// }

// function ReceiptDivider({ dashed = false }) {
//   return <div className={`receipt-divider${dashed ? " receipt-divider--dashed" : ""}`} />;
// }

// function ReceiptRow({ label, value, bold }) {
//   return (
//     <div className={`receipt-row${bold ? " receipt-row--bold" : ""}`}>
//       <span className="receipt-row-label">{label}</span>
//       <span className="receipt-row-value">{value}</span>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 1. CUSTOMER COPY
// // ─────────────────────────────────────────────────────────────────────────────
// function CustomerReceipt({ data, shopSettings }) {
//   const {
//     pledgeNo, customer, selectedScheme, finalLoan, interestAmt,
//     processingFeeAmount, netDisbursed, items,
//     totalNetWt, totalGrossWt, totalValue,
//   } = data;

//   return (
//     <div className="receipt receipt--customer" id="receipt-customer">
//       <ReceiptHeader shopSettings={shopSettings} copyLabel="CUSTOMER COPY" />
//       <ReceiptDivider />

//       <div className="receipt-title">PLEDGE RECEIPT</div>
//       <div className="receipt-pledge-no">{pledgeNo}</div>
//       <div className="receipt-date">{nowStr()}</div>

//       <ReceiptDivider dashed />

//       <div className="receipt-section-label">CUSTOMER DETAILS</div>
//       <ReceiptRow label="Name"    value={customer?.name} />
//       <ReceiptRow label="Code"    value={customer?.customer_code} />
//       <ReceiptRow label="Phone"   value={customer?.phone} />
//       {customer?.address && <ReceiptRow label="Address" value={customer.address} />}

//       <ReceiptDivider dashed />

//       <div className="receipt-section-label">LOAN DETAILS</div>
//       <ReceiptRow label="Scheme"         value={selectedScheme?.scheme_name} />
//       <ReceiptRow label="Loan Amount"    value={`₹ ${fmt(finalLoan)}`} bold />
//       <ReceiptRow label="Interest"       value={`₹ ${fmt(interestAmt)}`} />
//       <ReceiptRow label="Processing Fee" value={`₹ ${fmt(processingFeeAmount)}`} />

//       <ReceiptDivider />
//       <ReceiptRow label="NET DISBURSED" value={`₹ ${fmt(netDisbursed)}`} bold />
//       <ReceiptDivider />

//       <div className="receipt-section-label">PLEDGED ITEMS</div>
//       <table className="receipt-items-table">
//         <thead>
//           <tr>
//             <th>Item</th><th>Purity</th><th>Gross</th><th>Net</th><th>Value</th>
//           </tr>
//         </thead>
//         <tbody>
//           {items.map((item, i) => (
//             <tr key={i}>
//               <td>{item._typeName || item.jewellery_type_id}</td>
//               <td>{item.purity}</td>
//               <td>{fmtWt(item.gross)}g</td>
//               <td>{fmtWt(item.net)}g</td>
//               <td>₹{fmt(item.value)}</td>
//             </tr>
//           ))}
//         </tbody>
//         <tfoot>
//           <tr>
//             <td colSpan="2"><strong>Total</strong></td>
//             <td><strong>{fmtWt(totalGrossWt)}g</strong></td>
//             <td><strong>{fmtWt(totalNetWt)}g</strong></td>
//             <td><strong>₹{fmt(totalValue)}</strong></td>
//           </tr>
//         </tfoot>
//       </table>

//       <ReceiptDivider dashed />

//       <div className="receipt-terms">
//         <div className="receipt-terms-title">Terms &amp; Conditions</div>
//         <div>1. Please keep this receipt safe for future reference.</div>
//         <div>2. Interest is calculated as per the scheme selected.</div>
//         <div>3. Items must be redeemed within the loan duration.</div>
//         <div>4. Management is not responsible for items after the due date.</div>
//       </div>

//       <ReceiptDivider />

//       <div className="receipt-signatures">
//         <div className="receipt-sig-box">
//           <div className="receipt-sig-line" />
//           <div>Customer Signature</div>
//         </div>
//         <div className="receipt-sig-box">
//           <div className="receipt-sig-line" />
//           <div>Authorised Signatory</div>
//         </div>
//       </div>

//       <div className="receipt-footer">Thank you for your trust</div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 2. STORE COPY
// // ─────────────────────────────────────────────────────────────────────────────
// function StoreReceipt({ data, shopSettings }) {
//   const {
//     pledgeNo, customer, selectedScheme, finalLoan, interestAmt,
//     processingFeeAmount, netDisbursed, items,
//     totalNetWt, totalGrossWt, totalValue, payload,
//   } = data;

//   return (
//     <div className="receipt receipt--store" id="receipt-store">
//       <ReceiptHeader shopSettings={shopSettings} copyLabel="STORE COPY" />
//       <ReceiptDivider />

//       <div className="receipt-title">PLEDGE RECEIPT — OFFICE RECORD</div>
//       <div className="receipt-pledge-no">{pledgeNo}</div>
//       <div className="receipt-date">{nowStr()}</div>

//       <ReceiptDivider dashed />

//       <div className="receipt-two-col">
//         <div>
//           <div className="receipt-section-label">CUSTOMER</div>
//           <ReceiptRow label="Name"  value={customer?.name} />
//           <ReceiptRow label="Code"  value={customer?.customer_code} />
//           <ReceiptRow label="Phone" value={customer?.phone} />
//           <ReceiptRow label="ID"    value={`${customer?.id_proof_type || "—"}: ${customer?.id_proof_number || "—"}`} />
//         </div>
//         <div>
//           <div className="receipt-section-label">LOAN</div>
//           <ReceiptRow label="Scheme"   value={selectedScheme?.scheme_name} />
//           <ReceiptRow label="Type"     value={payload?.loan_type} />
//           <ReceiptRow label="Rate"     value={`${payload?.interest_rate}% / month`} />
//           <ReceiptRow label="Duration" value={`${payload?.duration_months} months`} />
//           <ReceiptRow label="Price/g"  value={`₹ ${fmt(payload?.price_per_gram)}`} />
//         </div>
//       </div>

//       <ReceiptDivider dashed />

//       <div className="receipt-section-label">FINANCIAL SUMMARY</div>
//       <ReceiptRow label="Total Jewellery Value" value={`₹ ${fmt(totalValue)}`} />
//       <ReceiptRow label="Loan Amount"           value={`₹ ${fmt(finalLoan)}`} bold />
//       <ReceiptRow label="First Interest"        value={`₹ ${fmt(interestAmt)}`} />
//       <ReceiptRow label="Processing Fee"        value={`₹ ${fmt(processingFeeAmount)}`} />
//       <ReceiptRow label="Payment Method"        value={payload?.payment_method} />

//       <ReceiptDivider />
//       <ReceiptRow label="NET DISBURSED" value={`₹ ${fmt(netDisbursed)}`} bold />
//       <ReceiptDivider />

//       <div className="receipt-section-label">PLEDGED ITEMS</div>
//       <table className="receipt-items-table receipt-items-table--store">
//         <thead>
//           <tr>
//             <th>#</th><th>Item Type</th><th>Purity</th>
//             <th>Gross(g)</th><th>Net(g)</th><th>Value(₹)</th>
//           </tr>
//         </thead>
//         <tbody>
//           {items.map((item, i) => (
//             <tr key={i}>
//               <td>{i + 1}</td>
//               <td>{item._typeName || item.jewellery_type_id}</td>
//               <td>{item.purity}</td>
//               <td>{fmtWt(item.gross)}</td>
//               <td>{fmtWt(item.net)}</td>
//               <td>{fmt(item.value)}</td>
//             </tr>
//           ))}
//         </tbody>
//         <tfoot>
//           <tr>
//             <td colSpan="3"><strong>TOTAL</strong></td>
//             <td><strong>{fmtWt(totalGrossWt)}</strong></td>
//             <td><strong>{fmtWt(totalNetWt)}</strong></td>
//             <td><strong>{fmt(totalValue)}</strong></td>
//           </tr>
//         </tfoot>
//       </table>

//       <ReceiptDivider dashed />

//       <div className="receipt-signatures receipt-signatures--3">
//         <div className="receipt-sig-box">
//           <div className="receipt-sig-line" />
//           <div>Customer Signature</div>
//         </div>
//         <div className="receipt-sig-box">
//           <div className="receipt-sig-line" />
//           <div>Staff / Appraiser</div>
//         </div>
//         <div className="receipt-sig-box">
//           <div className="receipt-sig-line" />
//           <div>Authorised Signatory</div>
//         </div>
//       </div>

//       <div className="receipt-footer">
//         Pledge created on {today()} · {shopSettings?.shop_name}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 3. POCKET COPY
// // ─────────────────────────────────────────────────────────────────────────────
// function PocketReceipt({ data, shopSettings }) {
//   const { pledgeNo, customer, finalLoan, netDisbursed, totalNetWt, payload } = data;

//   return (
//     <div className="receipt receipt--pocket" id="receipt-pocket">
//       <div className="receipt-pocket-shop">{shopSettings?.shop_name || "Pawn Shop"}</div>
//       {shopSettings?.phone && (
//         <div className="receipt-pocket-phone">{shopSettings.phone}</div>
//       )}

//       <ReceiptDivider />

//       <div className="receipt-pocket-pledgeno">{pledgeNo}</div>
//       <div className="receipt-pocket-date">{today()}</div>

//       <ReceiptDivider dashed />

//       <ReceiptRow label="Customer"  value={customer?.name} />
//       <ReceiptRow label="Phone"     value={customer?.phone} />
//       <ReceiptRow label="Net Wt"    value={`${fmtWt(totalNetWt)} g`} />
//       <ReceiptRow label="Loan Amt"  value={`₹ ${fmt(finalLoan)}`} bold />
//       <ReceiptRow label="Disbursed" value={`₹ ${fmt(netDisbursed)}`} bold />
//       <ReceiptRow label="Via"       value={payload?.payment_method} />

//       <ReceiptDivider />

//       <div className="receipt-pocket-note">Keep this slip for redemption</div>

//       <div className="receipt-signatures">
//         <div className="receipt-sig-box">
//           <div className="receipt-sig-line" />
//           <div>Customer</div>
//         </div>
//         <div className="receipt-sig-box">
//           <div className="receipt-sig-line" />
//           <div>Staff</div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN MODAL COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────
// export default function PledgePrintModal({ data, shopSettings, onClose }) {
//   const [selected, setSelected] = useState(null);   // "customer" | "store" | "pocket"
//   const [printed,  setPrinted]  = useState([]);
//   const previewRef = useRef();

//   const handlePrint = () => {
//     if (!selected) return;
//     const el = document.getElementById(`receipt-${selected}`);
//     if (!el) return;

//     const html = el.outerHTML;
//     const win  = window.open("", "_blank", "width=800,height=600");
//     if (!win) { alert("Pop-up blocked. Please allow pop-ups to print."); return; }

//     win.document.write(`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>Pledge Receipt — ${data.pledgeNo}</title>
//           <style>
//             @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Lora:wght@400;600;700&display=swap');
//             * { box-sizing: border-box; margin: 0; padding: 0; }
//             body { font-family: 'Lora', Georgia, serif; font-size: 11px; color: #000; background: #fff; }
//             .receipt { width: 100%; max-width: ${selected === "pocket" ? "58mm" : "80mm"}; margin: 0 auto; padding: 8px; }
//             .receipt-header { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
//             .receipt-logo { width: 36px; height: 36px; object-fit: contain; }
//             .receipt-shop-info { flex: 1; }
//             .receipt-shop-name { font-size: 13px; font-weight: 700; }
//             .receipt-shop-line { font-size: 9px; color: #444; line-height: 1.4; }
//             .receipt-copy-badge { font-size: 8px; font-weight: 700; border: 1px solid #000; padding: 2px 5px; white-space: nowrap; margin-left: auto; align-self: flex-start; }
//             .receipt-title { text-align: center; font-weight: 700; font-size: 11px; letter-spacing: 0.06em; margin: 6px 0 2px; text-transform: uppercase; }
//             .receipt-pledge-no { text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 700; }
//             .receipt-date { text-align: center; font-size: 9px; color: #555; margin-bottom: 4px; }
//             .receipt-divider { border: none; border-top: 1.5px solid #000; margin: 5px 0; }
//             .receipt-divider--dashed { border-top: 1px dashed #999 !important; }
//             .receipt-section-label { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #333; margin: 4px 0 2px; }
//             .receipt-row { display: flex; justify-content: space-between; margin: 1.5px 0; font-size: 10px; gap: 6px; }
//             .receipt-row--bold { font-weight: 700; font-size: 11px; }
//             .receipt-row-label { color: #444; }
//             .receipt-row-value { font-weight: 600; text-align: right; }
//             .receipt-items-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 4px; }
//             .receipt-items-table th { border-bottom: 1px solid #000; padding: 2px; text-align: left; font-size: 8px; font-weight: 700; text-transform: uppercase; }
//             .receipt-items-table td { padding: 1.5px 2px; border-bottom: 1px dashed #ddd; }
//             .receipt-items-table tfoot td { border-top: 1.5px solid #000; border-bottom: none; font-weight: 700; }
//             .receipt-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 4px 0; }
//             .receipt-terms { font-size: 8px; color: #444; line-height: 1.5; }
//             .receipt-terms-title { font-weight: 700; font-size: 9px; margin-bottom: 2px; }
//             .receipt-signatures { display: flex; justify-content: space-between; gap: 8px; margin-top: 14px; }
//             .receipt-signatures--3 { gap: 4px; }
//             .receipt-sig-box { flex: 1; text-align: center; font-size: 8px; color: #555; }
//             .receipt-sig-line { border-top: 1px solid #333; margin-bottom: 3px; margin-top: 18px; }
//             .receipt-footer { text-align: center; font-size: 8px; color: #999; margin-top: 10px; font-style: italic; }
//             .receipt-pocket-shop { text-align: center; font-size: 14px; font-weight: 700; }
//             .receipt-pocket-phone { text-align: center; font-size: 9px; color: #555; }
//             .receipt-pocket-pledgeno { text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 700; margin: 3px 0; }
//             .receipt-pocket-date { text-align: center; font-size: 9px; color: #555; margin-bottom: 4px; }
//             .receipt-pocket-note { text-align: center; font-size: 9px; font-style: italic; color: #666; margin: 4px 0; }
//             @media print { @page { margin: 4mm; size: ${selected === "pocket" ? "58mm 150mm" : "80mm 200mm"}; } }
//           </style>
//         </head>
//         <body>${html}</body>
//       </html>
//     `);
//     win.document.close();
//     win.focus();
//     setTimeout(() => { win.print(); win.close(); }, 400);

//     setPrinted(prev => [...new Set([...prev, selected])]);
//   };

//   // Receipt map — render all three so their IDs exist in the DOM for printing
//   const receiptMap = {
//     customer: <CustomerReceipt data={data} shopSettings={shopSettings} />,
//     store:    <StoreReceipt    data={data} shopSettings={shopSettings} />,
//     pocket:   <PocketReceipt   data={data} shopSettings={shopSettings} />,
//   };

//   return (
//     <div
//       className="ppm-overlay"
//       onClick={(e) => e.target === e.currentTarget && onClose()}
//     >
//       <div className="ppm-modal">

//         {/* ── Header ── */}
//         <div className="ppm-header">
//           <div className="ppm-header-left">
//             <div className="ppm-success-icon"><IconCheck /></div>
//             <div>
//               <div className="ppm-title">Pledge Created Successfully</div>
//               <div className="ppm-subtitle">
//                 <span className="ppm-pledge-no">{data.pledgeNo}</span>
//                 &nbsp;· Select receipt type to print
//               </div>
//             </div>
//           </div>
//           <button className="ppm-close" onClick={onClose}><IconClose /></button>
//         </div>

//         <div className="ppm-body">

//           {/* ── Left: Selector ── */}
//           <div className="ppm-selector">
//             <div className="ppm-selector-title">Choose Copy Type</div>

//             {COPY_TYPES.map(({ id, label, sublabel, Icon, color, bg, border }) => {
//               const isActive  = selected === id;
//               const isPrinted = printed.includes(id);
//               return (
//                 <button
//                   key={id}
//                   className={[
//                     "ppm-copy-btn",
//                     isActive  ? "ppm-copy-btn--active"  : "",
//                     isPrinted ? "ppm-copy-btn--printed" : "",
//                   ].join(" ").trim()}
//                   style={isActive ? {
//                     "--copy-color":  color,
//                     "--copy-bg":     bg,
//                     "--copy-border": border,
//                   } : {}}
//                   onClick={() => setSelected(id)}
//                 >
//                   <div
//                     className="ppm-copy-icon"
//                     style={{ color, background: bg, border: `1px solid ${border}` }}
//                   >
//                     <Icon />
//                   </div>
//                   <div className="ppm-copy-text">
//                     <span className="ppm-copy-label">{label}</span>
//                     <span className="ppm-copy-sub">{sublabel}</span>
//                   </div>
//                   {isPrinted && (
//                     <div
//                       className="ppm-printed-badge"
//                       style={{ color, background: bg, border: `1px solid ${border}` }}
//                     >
//                       <IconCheck /> Printed
//                     </div>
//                   )}
//                   {isActive && !isPrinted && (
//                     <div className="ppm-active-dot" style={{ background: color }} />
//                   )}
//                 </button>
//               );
//             })}

//             {/* Print button */}
//             <button
//               className={`ppm-print-btn${!selected ? " ppm-print-btn--disabled" : ""}`}
//               onClick={handlePrint}
//               disabled={!selected}
//             >
//               <IconPrint />
//               {selected
//                 ? `Print ${COPY_TYPES.find(c => c.id === selected)?.label}`
//                 : "Select a copy type to print"
//               }
//             </button>

//             {/* Done button */}
//             <button className="ppm-done-btn" onClick={onClose}>
//               Done &amp; Close
//             </button>
//           </div>

//           {/* ── Right: Preview ── */}
//           <div className="ppm-preview-panel" ref={previewRef}>
//             {selected ? (
//               <div className="ppm-preview-scroll">
//                 <div className="ppm-preview-label">
//                   Preview — {COPY_TYPES.find(c => c.id === selected)?.label}
//                 </div>
//                 <div className={`ppm-preview-paper ppm-preview-paper--${selected}`}>
//                   {receiptMap[selected]}
//                 </div>
//               </div>
//             ) : (
//               <div className="ppm-preview-empty">
//                 <div className="ppm-preview-empty-icon"><IconPrint /></div>
//                 <div className="ppm-preview-empty-text">
//                   Select a copy type on the left<br />to preview the receipt
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Hidden render area so all receipt IDs exist in DOM for printing */}
//           <div style={{ display: "none" }} aria-hidden="true">
//             {Object.values(receiptMap)}
//           </div>

//         </div>{/* /ppm-body */}
//       </div>{/* /ppm-modal */}
//     </div>
//   );
// }






import { useState, useRef } from "react";
import "./PledgePrintModal.css";

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
const IconPrint  = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);
const IconClose  = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6"  x2="6"  y2="18"/>
    <line x1="6"  y1="6"  x2="18" y2="18"/>
  </svg>
);
const IconUser   = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconStore  = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconPocket = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 3h16a2 2 0 0 1 2 2v6a10 10 0 0 1-10 10A10 10 0 0 1 2 11V5a2 2 0 0 1 2-2z"/>
    <polyline points="8 10 12 14 16 10"/>
  </svg>
);
const IconCheck  = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Copy type config ──────────────────────────────────────────────────────────
const COPY_TYPES = [
  { id:"customer", label:"Customer Copy", sublabel:"Full details for the customer", Icon:IconUser,   color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" },
  { id:"store",    label:"Store Copy",    sublabel:"Office record with all fields",  Icon:IconStore,  color:"#059669", bg:"#ecfdf5", border:"#a7f3d0" },
  { id:"pocket",   label:"Pocket Copy",   sublabel:"Compact slip for the customer",  Icon:IconPocket, color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtWt = (n) => Number(n || 0).toFixed(2);

// Date only — no time
const today = () =>
  new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

// today + N months
const addMonths = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() + (Number(months) || 12));
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

// CHANGE 1 — phone · email · lic on ONE side-by-side row
function ReceiptHeader({ shopSettings, copyLabel }) {
  const contacts = [
    shopSettings?.phone          ? `Ph: ${shopSettings.phone}`           : null,
    shopSettings?.email          ? shopSettings.email                    : null,
    shopSettings?.license_number ? `Lic: ${shopSettings.license_number}` : null,
  ].filter(Boolean);

  return (
    <div className="receipt-header">
      {shopSettings?.logo_path && (
        <img src={shopSettings.logo_path} alt="logo" className="receipt-logo" />
      )}
      <div className="receipt-shop-info">
        <div className="receipt-shop-name">{shopSettings?.shop_name || "Pawn Shop"}</div>
        {shopSettings?.address && (
          <div className="receipt-shop-line">{shopSettings.address}</div>
        )}
        {contacts.length > 0 && (
          <div className="receipt-contact-row">
            {contacts.map((c, i) => (
              <span key={i} className="receipt-contact-item">{c}</span>
            ))}
          </div>
        )}
      </div>
      <div className="receipt-copy-badge">{copyLabel}</div>
    </div>
  );
}

function ReceiptDivider({ dashed = false }) {
  return <div className={`receipt-divider${dashed ? " receipt-divider--dashed" : ""}`} />;
}

function ReceiptRow({ label, value, bold }) {
  return (
    <div className={`receipt-row${bold ? " receipt-row--bold" : ""}`}>
      <span className="receipt-row-label">{label}</span>
      <span className="receipt-row-value">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CUSTOMER COPY
// ─────────────────────────────────────────────────────────────────────────────
function CustomerReceipt({ data, shopSettings }) {
  const {
    pledgeNo, customer, selectedScheme,
    finalLoan, interestAmt, processingFeeAmount, netDisbursed,
    items, totalNetWt, totalGrossWt,
    payload,
  } = data;

  // CHANGE 2 values
  const pledgeDate  = today();
  const closureDate = addMonths(payload?.duration_months);
  const receiptNo   = `RCP-${new Date().getFullYear()}-${pledgeNo}`;

  return (
    <div className="receipt receipt--customer" id="receipt-customer">

      <ReceiptHeader shopSettings={shopSettings} copyLabel="CUSTOMER COPY" />
      <ReceiptDivider />

      <div className="receipt-title">PLEDGE RECEIPT</div>

      {/* CHANGE 2 — 2x2 meta grid, date only, no time */}
      <div className="receipt-meta-grid">
        <div className="receipt-meta-cell">
          <span className="receipt-meta-label">Pledge No</span>
          <span className="receipt-meta-value">{pledgeNo}</span>
        </div>
        <div className="receipt-meta-cell">
          <span className="receipt-meta-label">Pledge Date</span>
          <span className="receipt-meta-value">{pledgeDate}</span>
        </div>
        <div className="receipt-meta-cell">
          <span className="receipt-meta-label">Receipt No</span>
          <span className="receipt-meta-value">{receiptNo}</span>
        </div>
        <div className="receipt-meta-cell">
          <span className="receipt-meta-label">Closure Date</span>
          <span className="receipt-meta-value">{closureDate}</span>
        </div>
      </div>

      <ReceiptDivider />

      {/* CHANGE 3 — Customer + Loan side by side */}
      <div className="receipt-two-col">
        <div>
          <div className="receipt-section-label">CUSTOMER</div>
          {customer?.photo_path && (
            <img src={customer.photo_path} alt={customer.name} className="receipt-cust-photo" />
          )}
          <ReceiptRow label="Name"     value={customer?.name} />
          <ReceiptRow label="Relation" value={customer?.relation || "Self"} />
          <ReceiptRow label="Code"     value={customer?.customer_code} />
          <ReceiptRow label="Phone"    value={customer?.phone} />
          {customer?.address && (
            <ReceiptRow label="Address" value={customer.address} />
          )}
        </div>
        <div>
          <div className="receipt-section-label">LOAN DETAILS</div>
          <ReceiptRow label="Scheme"   value={selectedScheme?.scheme_name} />
          <ReceiptRow label="Type"     value={payload?.loan_type} />
          <ReceiptRow label="Rate"     value={`${payload?.interest_rate}%/mo`} />
          <ReceiptRow label="Duration" value={`${payload?.duration_months} mo`} />
          <ReceiptRow label="Price/g"  value={`Rs.${fmt(payload?.price_per_gram)}`} />
          <ReceiptRow label="Loan Amt" value={`Rs. ${fmt(finalLoan)}`}           bold />
          <ReceiptRow label="Interest" value={`Rs. ${fmt(interestAmt)}`} />
          <ReceiptRow label="Proc Fee" value={`Rs. ${fmt(processingFeeAmount)}`} />
        </div>
      </div>

      <ReceiptDivider />
      <ReceiptRow label="NET DISBURSED" value={`Rs. ${fmt(netDisbursed)}`} bold />
      <ReceiptDivider />

      {/* CHANGE 4 — Value column removed from items table */}
      <div className="receipt-section-label">PLEDGED ITEMS</div>
      <table className="receipt-items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Purity</th>
            <th>Gross (g)</th>
            <th>Net (g)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{item._typeName || item.jewellery_type_id}</td>
              <td>{item.purity}</td>
              <td>{fmtWt(item.gross)}</td>
              <td>{fmtWt(item.net)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3"><strong>Total</strong></td>
            <td><strong>{fmtWt(totalGrossWt)}g</strong></td>
            <td><strong>{fmtWt(totalNetWt)}g</strong></td>
          </tr>
        </tfoot>
      </table>

      <ReceiptDivider dashed />

      <div className="receipt-terms">
        <div className="receipt-terms-title">Terms &amp; Conditions</div>
        <div>1. Please keep this receipt safe for future reference.</div>
        <div>2. Interest is calculated as per the scheme selected.</div>
        <div>3. Items must be redeemed within the loan duration.</div>
        <div>4. Management is not responsible for items after the due date.</div>
      </div>

      <ReceiptDivider />

      <div className="receipt-signatures">
        <div className="receipt-sig-box">
          <div className="receipt-sig-line" />
          <div>Customer Signature</div>
        </div>
        <div className="receipt-sig-box">
          <div className="receipt-sig-line" />
          <div>Authorised Signatory</div>
        </div>
      </div>

      <div className="receipt-footer">Thank you for your trust</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. STORE COPY
// ─────────────────────────────────────────────────────────────────────────────
function StoreReceipt({ data, shopSettings }) {
  const {
    pledgeNo, customer, selectedScheme, finalLoan, interestAmt,
    processingFeeAmount, netDisbursed, items,
    totalNetWt, totalGrossWt, totalValue, payload,
  } = data;

  return (
    <div className="receipt receipt--store" id="receipt-store">
      <ReceiptHeader shopSettings={shopSettings} copyLabel="STORE COPY" />
      <ReceiptDivider />

      <div className="receipt-title">PLEDGE RECEIPT — OFFICE RECORD</div>
      <div className="receipt-pledge-no">{pledgeNo}</div>
      <div className="receipt-date">{today()}</div>

      <ReceiptDivider dashed />

      <div className="receipt-two-col">
        <div>
          <div className="receipt-section-label">CUSTOMER</div>
          <ReceiptRow label="Name"  value={customer?.name} />
          <ReceiptRow label="Code"  value={customer?.customer_code} />
          <ReceiptRow label="Phone" value={customer?.phone} />
          <ReceiptRow label="ID"    value={`${customer?.id_proof_type || "—"}: ${customer?.id_proof_number || "—"}`} />
        </div>
        <div>
          <div className="receipt-section-label">LOAN</div>
          <ReceiptRow label="Scheme"   value={selectedScheme?.scheme_name} />
          <ReceiptRow label="Type"     value={payload?.loan_type} />
          <ReceiptRow label="Rate"     value={`${payload?.interest_rate}% / month`} />
          <ReceiptRow label="Duration" value={`${payload?.duration_months} months`} />
          <ReceiptRow label="Price/g"  value={`Rs. ${fmt(payload?.price_per_gram)}`} />
        </div>
      </div>

      <ReceiptDivider dashed />

      <div className="receipt-section-label">FINANCIAL SUMMARY</div>
      <ReceiptRow label="Total Jewellery Value" value={`Rs. ${fmt(totalValue)}`} />
      <ReceiptRow label="Loan Amount"           value={`Rs. ${fmt(finalLoan)}`}           bold />
      <ReceiptRow label="First Interest"        value={`Rs. ${fmt(interestAmt)}`} />
      <ReceiptRow label="Processing Fee"        value={`Rs. ${fmt(processingFeeAmount)}`} />
      <ReceiptRow label="Payment Method"        value={payload?.payment_method} />
      <ReceiptDivider />
      <ReceiptRow label="NET DISBURSED"         value={`Rs. ${fmt(netDisbursed)}`} bold />
      <ReceiptDivider />

      <div className="receipt-section-label">PLEDGED ITEMS</div>
      <table className="receipt-items-table receipt-items-table--store">
        <thead>
          <tr>
            <th>#</th><th>Item Type</th><th>Purity</th>
            <th>Gross(g)</th><th>Net(g)</th><th>Value(Rs.)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{item._typeName || item.jewellery_type_id}</td>
              <td>{item.purity}</td>
              <td>{fmtWt(item.gross)}</td>
              <td>{fmtWt(item.net)}</td>
              <td>{fmt(item.value)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3"><strong>TOTAL</strong></td>
            <td><strong>{fmtWt(totalGrossWt)}</strong></td>
            <td><strong>{fmtWt(totalNetWt)}</strong></td>
            <td><strong>{fmt(totalValue)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <ReceiptDivider dashed />

      <div className="receipt-signatures receipt-signatures--3">
        <div className="receipt-sig-box"><div className="receipt-sig-line" /><div>Customer Signature</div></div>
        <div className="receipt-sig-box"><div className="receipt-sig-line" /><div>Staff / Appraiser</div></div>
        <div className="receipt-sig-box"><div className="receipt-sig-line" /><div>Authorised Signatory</div></div>
      </div>

      <div className="receipt-footer">
        Pledge created on {today()} · {shopSettings?.shop_name}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. POCKET COPY
// ─────────────────────────────────────────────────────────────────────────────
function PocketReceipt({ data, shopSettings }) {
  const { pledgeNo, customer, finalLoan, netDisbursed, totalNetWt, payload } = data;

  return (
    <div className="receipt receipt--pocket" id="receipt-pocket">
      <div className="receipt-pocket-shop">{shopSettings?.shop_name || "Pawn Shop"}</div>
      {shopSettings?.phone && (
        <div className="receipt-pocket-phone">{shopSettings.phone}</div>
      )}
      <ReceiptDivider />
      <div className="receipt-pocket-pledgeno">{pledgeNo}</div>
      <div className="receipt-pocket-date">{today()}</div>
      <ReceiptDivider dashed />
      <ReceiptRow label="Customer"  value={customer?.name} />
      <ReceiptRow label="Phone"     value={customer?.phone} />
      <ReceiptRow label="Net Wt"    value={`${fmtWt(totalNetWt)} g`} />
      <ReceiptRow label="Loan Amt"  value={`Rs. ${fmt(finalLoan)}`}    bold />
      <ReceiptRow label="Disbursed" value={`Rs. ${fmt(netDisbursed)}`} bold />
      <ReceiptRow label="Via"       value={payload?.payment_method} />
      <ReceiptDivider />
      <div className="receipt-pocket-note">Keep this slip for redemption</div>
      <div className="receipt-signatures">
        <div className="receipt-sig-box"><div className="receipt-sig-line" /><div>Customer</div></div>
        <div className="receipt-sig-box"><div className="receipt-sig-line" /><div>Staff</div></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Print CSS injected into pop-up window
// ─────────────────────────────────────────────────────────────────────────────
function buildPrintCss(size) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Lora:wght@400;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Lora',Georgia,serif;font-size:11px;color:#000;background:#fff}
    .receipt{width:100%;max-width:${size==="pocket"?"58mm":"80mm"};margin:0 auto;padding:8px}
    .receipt-header{display:flex;align-items:flex-start;gap:8px;margin-bottom:6px}
    .receipt-logo{width:36px;height:36px;object-fit:contain;flex-shrink:0}
    .receipt-shop-info{flex:1}
    .receipt-shop-name{font-size:13px;font-weight:700}
    .receipt-shop-line{font-size:9px;color:#444;line-height:1.4}
    .receipt-copy-badge{font-size:8px;font-weight:700;border:1px solid #000;padding:2px 5px;white-space:nowrap;margin-left:auto;align-self:flex-start}
    /* CHANGE 1 */
    .receipt-contact-row{display:flex;flex-wrap:wrap;gap:3px 0;margin-top:2px}
    .receipt-contact-item{font-size:8px;color:#444;white-space:nowrap}
    .receipt-contact-item:not(:last-child)::after{content:" · ";color:#aaa}
    .receipt-title{text-align:center;font-weight:700;font-size:11px;letter-spacing:.06em;margin:6px 0 4px;text-transform:uppercase}
    /* CHANGE 2 */
    .receipt-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;margin:4px 0 6px;padding:5px 6px;background:#f7f7f7;border:1px solid #e4e4e4;border-radius:3px}
    .receipt-meta-cell{display:flex;flex-direction:column;gap:1px}
    .receipt-meta-label{font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#888}
    .receipt-meta-value{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;color:#111}
    .receipt-pledge-no{text-align:center;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700}
    .receipt-date{text-align:center;font-size:9px;color:#555;margin-bottom:4px}
    .receipt-divider{border:none;border-top:1.5px solid #000;margin:5px 0}
    .receipt-divider--dashed{border-top:1px dashed #999!important}
    .receipt-section-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#333;margin:4px 0 2px}
    .receipt-row{display:flex;justify-content:space-between;margin:1.5px 0;font-size:10px;gap:4px}
    .receipt-row--bold{font-weight:700;font-size:11px}
    .receipt-row-label{color:#444}
    .receipt-row-value{font-weight:600;text-align:right}
    /* CHANGE 3 */
    .receipt-two-col{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0}
    .receipt-cust-photo{width:42px;height:42px;object-fit:cover;border-radius:3px;border:1px solid #ccc;display:block;margin-bottom:4px}
    /* CHANGE 4 */
    .receipt-items-table{width:100%;border-collapse:collapse;font-size:9px;margin-top:4px}
    .receipt-items-table th{border-bottom:1px solid #000;padding:2px;text-align:left;font-size:8px;font-weight:700;text-transform:uppercase}
    .receipt-items-table td{padding:1.5px 2px;border-bottom:1px dashed #ddd}
    .receipt-items-table tfoot td{border-top:1.5px solid #000;border-bottom:none;font-weight:700}
    .receipt-terms{font-size:8px;color:#444;line-height:1.5}
    .receipt-terms-title{font-weight:700;font-size:9px;margin-bottom:2px}
    .receipt-signatures{display:flex;justify-content:space-between;gap:8px;margin-top:14px}
    .receipt-signatures--3{gap:4px}
    .receipt-sig-box{flex:1;text-align:center;font-size:8px;color:#555}
    .receipt-sig-line{border-top:1px solid #333;margin-bottom:3px;margin-top:18px}
    .receipt-footer{text-align:center;font-size:8px;color:#999;margin-top:10px;font-style:italic}
    .receipt-pocket-shop{text-align:center;font-size:14px;font-weight:700}
    .receipt-pocket-phone{text-align:center;font-size:9px;color:#555}
    .receipt-pocket-pledgeno{text-align:center;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;margin:3px 0}
    .receipt-pocket-date{text-align:center;font-size:9px;color:#555;margin-bottom:4px}
    .receipt-pocket-note{text-align:center;font-size:9px;font-style:italic;color:#666;margin:4px 0}
    @media print{@page{margin:4mm;size:${size==="pocket"?"58mm 150mm":"80mm 230mm"}}}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────
export default function PledgePrintModal({ data, shopSettings, onClose }) {
  const [selected, setSelected] = useState(null);
  const [printed,  setPrinted]  = useState([]);
  const previewRef = useRef();

  const handlePrint = () => {
    if (!selected) return;
    const el = document.getElementById(`receipt-${selected}`);
    if (!el) return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) { alert("Pop-up blocked — please allow pop-ups to print."); return; }
    win.document.write(
      `<!DOCTYPE html><html><head><title>Pledge Receipt — ${data.pledgeNo}</title>` +
      `<style>${buildPrintCss(selected)}</style></head><body>${el.outerHTML}</body></html>`
    );
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
    setPrinted(prev => [...new Set([...prev, selected])]);
  };

  const receiptMap = {
    customer: <CustomerReceipt data={data} shopSettings={shopSettings} />,
    store:    <StoreReceipt    data={data} shopSettings={shopSettings} />,
    pocket:   <PocketReceipt   data={data} shopSettings={shopSettings} />,
  };

  return (
    <div className="ppm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ppm-modal">

        <div className="ppm-header">
          <div className="ppm-header-left">
            <div className="ppm-success-icon"><IconCheck /></div>
            <div>
              <div className="ppm-title">Pledge Created Successfully</div>
              <div className="ppm-subtitle">
                <span className="ppm-pledge-no">{data.pledgeNo}</span>
                &nbsp;· Select receipt type to print
              </div>
            </div>
          </div>
          <button className="ppm-close" onClick={onClose}><IconClose /></button>
        </div>

        <div className="ppm-body">

          <div className="ppm-selector">
            <div className="ppm-selector-title">Choose Copy Type</div>

            {COPY_TYPES.map(({ id, label, sublabel, Icon, color, bg, border }) => {
              const isActive  = selected === id;
              const isPrinted = printed.includes(id);
              return (
                <button
                  key={id}
                  className={["ppm-copy-btn", isActive?"ppm-copy-btn--active":"", isPrinted?"ppm-copy-btn--printed":""].join(" ").trim()}
                  style={isActive ? {"--copy-color":color,"--copy-bg":bg,"--copy-border":border} : {}}
                  onClick={() => setSelected(id)}
                >
                  <div className="ppm-copy-icon" style={{color,background:bg,border:`1px solid ${border}`}}>
                    <Icon />
                  </div>
                  <div className="ppm-copy-text">
                    <span className="ppm-copy-label">{label}</span>
                    <span className="ppm-copy-sub">{sublabel}</span>
                  </div>
                  {isPrinted && (
                    <div className="ppm-printed-badge" style={{color,background:bg,border:`1px solid ${border}`}}>
                      <IconCheck /> Printed
                    </div>
                  )}
                  {isActive && !isPrinted && (
                    <div className="ppm-active-dot" style={{background:color}} />
                  )}
                </button>
              );
            })}

            <button
              className={`ppm-print-btn${!selected?" ppm-print-btn--disabled":""}`}
              onClick={handlePrint}
              disabled={!selected}
            >
              <IconPrint />
              {selected
                ? `Print ${COPY_TYPES.find(c=>c.id===selected)?.label}`
                : "Select a copy type to print"
              }
            </button>

            <button className="ppm-done-btn" onClick={onClose}>
              Done &amp; Close
            </button>
          </div>

          <div className="ppm-preview-panel" ref={previewRef}>
            {selected ? (
              <div className="ppm-preview-scroll">
                <div className="ppm-preview-label">
                  Preview — {COPY_TYPES.find(c=>c.id===selected)?.label}
                </div>
                <div className={`ppm-preview-paper ppm-preview-paper--${selected}`}>
                  {receiptMap[selected]}
                </div>
              </div>
            ) : (
              <div className="ppm-preview-empty">
                <div className="ppm-preview-empty-icon"><IconPrint /></div>
                <div className="ppm-preview-empty-text">
                  Select a copy type on the left<br />to preview the receipt
                </div>
              </div>
            )}
          </div>

          {/* Hidden — keeps all 3 receipt IDs in DOM for printing */}
          <div style={{display:"none"}} aria-hidden="true">
            {Object.values(receiptMap)}
          </div>

        </div>
      </div>
    </div>
  );
}