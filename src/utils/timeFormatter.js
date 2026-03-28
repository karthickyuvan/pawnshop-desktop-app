

// 3 

/**
 * timeFormatter.js
 * Centralized utility for handling SQLite UTC strings and converting to IST.
 */

/**
 * 1. Full Format: "26 Feb 2026 | 03:48 PM IST"
 * Used in: Expense Table, Fund Ledger, Pledge Payments
 */
export const formatDateTimeIST = (utcString) => {
  if (!utcString) return "-";

  try {
    let date;
    
    // SQLite format: "2026-02-26 10:18:00"
    // We replace the space with 'T' and add 'Z' to force JS to treat it as UTC
    if (utcString.includes(" ") && !utcString.includes("T") && !utcString.includes("Z")) {
      date = new Date(utcString.replace(" ", "T") + "Z");
    } else {
      date = new Date(utcString);
    }

    if (isNaN(date.getTime())) return "-";

    const datePart = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });

    const timePart = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });

    return `${datePart} | ${timePart} IST`;
  } catch (error) {
    console.error("formatDateTimeIST Error:", error);
    return utcString;
  }
};

/**
 * 2. Time Only: "03:48 PM"
 * Used in: Daybook Audit Blocks
 */
export const formatTimeIST = (utcString) => {
  if (!utcString) return "-";

  try {
    let date;
    
    // Normalize SQLite strings to ISO UTC
    if (utcString.includes(" ") && !utcString.includes("T") && !utcString.includes("Z")) {
      date = new Date(utcString.replace(" ", "T") + "Z");
    } else {
      date = new Date(utcString);
    }

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("formatTimeIST Error:", error);
    return utcString;
  }
};

/**
 * 3. Date Only: "26 Feb 2026"
 * Used in: Summary Cards, Page Headers
 */
export const formatDateIST = (utcString) => {
  if (!utcString) return "-";

  try {
    let date;
    if (utcString.includes(" ") && !utcString.includes("T") && !utcString.includes("Z")) {
      date = new Date(utcString.replace(" ", "T") + "Z");
    } else {
      date = new Date(utcString);
    }

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch (error) {
    return error, utcString;
  }
};