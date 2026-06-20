

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
  if (!utcString) return "—";

  try {
    let cleanedString = utcString.trim();

    // Clean up malformed double-time string formats if present
    if (cleanedString.includes("Z ")) {
      cleanedString = cleanedString.split(" ")[0];
    }

    // Return placeholder if it is just a plain date without any time segment
    if (
      cleanedString.length <= 10 &&
      !cleanedString.includes("T") &&
      !cleanedString.includes(" ") &&
      !cleanedString.includes(":")
    ) {
      return "—";
    }

    let date;
    // 💡 FIX: Normalize space separation into UTC ISO format BEFORE parsing
    // This forces JavaScript to parse the raw SQLite timestamp as UTC rather than local time
    if (cleanedString.includes(" ") && !cleanedString.includes("T") && !cleanedString.includes("Z")) {
      date = new Date(cleanedString.replace(" ", "T") + "Z");
    } else {
      date = new Date(cleanedString);
    }

    // Bulletproof Fallback: extract HH:MM:SS using regex if JS Date parser still fails
    if (isNaN(date.getTime())) {
      if (cleanedString.includes(":")) {
        const timeMatch = cleanedString.match(/\d{2}:\d{2}:\d{2}/);
        if (timeMatch) {
          const parts = timeMatch[0].split(":");
          let hours = parseInt(parts[0], 10);
          const minutes = parts[1];
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12 || 12;
          return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
        }
      }
      return "—";
    }

    return date.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toUpperCase(); 
  } catch (error) {
    console.error("formatTimeIST Error:", error);
    return "—";
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



/**
 * Format string or object date specifically to DD-MM-YYYY
 * Used in: Staff Management Meta Lists
 */
export const formatDateToDMY = (dateInput) => {
  if (!dateInput) return "—";
  
  try {
    const dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) return dateInput;

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("formatDateToDMY Error:", error);
    return dateInput;
  }
};



/**
 * 4. Transaction Table Format: "13-06-2026 03:56:30 PM" (12-Hour)
 * Handles malformed strings safely and converts UTC/Local entries to a clean 12-hour format with AM/PM
 */
export const formatTransactionTimestamp = (rawString) => {
  if (!rawString) return "—";

  try {
    let cleanedString = rawString;

    // Fix malformed double-time string format: "2026-06-13T10:26:30.187Z 15:56:30"
    if (cleanedString.includes("Z ")) {
      cleanedString = cleanedString.split(" ")[0]; 
    }

    let date;
    // Normalize raw SQLite space separation into ISO format
    if (cleanedString.includes(" ") && !cleanedString.includes("T") && !cleanedString.includes("Z")) {
      date = new Date(cleanedString.replace(" ", "T") + "Z");
    } else {
      date = new Date(cleanedString);
    }

    // Fallback if the date object remains invalid
    if (isNaN(date.getTime())) return rawString;

    // Extract individual date components
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    // 12-Hour Conversion Logic
    const rawHours = date.getHours();
    const isPm = rawHours >= 12;
    const hours12 = rawHours % 12 || 12; // Converts '0' or '13+' hours correctly
    
    const hours = String(hours12).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ampm = isPm ? "PM" : "AM";

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm}`;
  } catch (error) {
    console.error("formatTransactionTimestamp Error:", error);
    return rawString;
  }
};