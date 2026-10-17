/**
 * Utility functions for CFA Franc currency formatting and receipt wording.
 */

export function formatFCFA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 FCFA";
  return `${amount.toLocaleString("en-US")} FCFA`;
}

/**
 * Converts numbers into words for official financial receipts.
 * Example: 125000 -> "One Hundred and Twenty-Five Thousand Francs CFA"
 */
export function numberToWordsFCFA(amount: number): string {
  if (amount === 0) return "Zero Francs CFA";
  
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertChunk(num: number): string {
    let chunkStr = "";
    if (num >= 100) {
      chunkStr += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      chunkStr += tens[Math.floor(num / 10)] + (num % 10 !== 0 ? "-" + ones[num % 10] : "");
    } else if (num > 0) {
      chunkStr += ones[num];
    }
    return chunkStr.trim();
  }

  const thousands = Math.floor(amount / 1000);
  const remainder = Math.floor(amount % 1000);

  let result = "";
  if (thousands > 0) {
    if (thousands >= 1000) {
      const millions = Math.floor(thousands / 1000);
      const subThousands = thousands % 1000;
      result += convertChunk(millions) + " Million ";
      if (subThousands > 0) {
        result += convertChunk(subThousands) + " Thousand ";
      }
    } else {
      result += convertChunk(thousands) + " Thousand ";
    }
  }

  if (remainder > 0) {
    result += convertChunk(remainder);
  }

  return `${result.trim()} Francs CFA`;
}

/**
 * Formats a customizable sequential receipt number pattern.
 * e.g. "GBHS-2026-0042"
 */
export function formatReceiptNumber(
  prefix: string = "REC",
  academicYear: string = "2026",
  seq: number = 1
): string {
  const padded = seq.toString().padStart(4, "0");
  const cleanYear = academicYear.replace("/", "-");
  return `${prefix}-${cleanYear}-${padded}`;
}
