/**
 * Pure client-safe utility functions for report cards and academic documents.
 * Free of server-only imports (e.g. next/headers, Supabase server client).
 */

/**
 * Resolves the city/town for the school dynamically from address or name.
 */
export function resolveSchoolCity(address?: string | null, schoolName?: string): string {
  if (address && address.trim()) {
    const segments = address.split(",").map((s) => s.trim()).filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      if (
        !/p\.?o\.?\s*box/i.test(seg) &&
        !/bp\s*\d+/i.test(seg) &&
        !/cameroon|cameroun/i.test(seg) &&
        !/region|région/i.test(seg) &&
        seg.length > 2
      ) {
        return seg;
      }
    }
    return segments[0] || "";
  }

  if (schoolName) {
    const KNOWN_CAMEROON_CITIES = [
      "Bamenda", "Buea", "Limbe", "Douala", "Yaounde", "Yaoundé", "Bafoussam",
      "Garoua", "Maroua", "Ngaoundere", "Ngaoundéré", "Bertoua", "Kumba",
      "Tiko", "Kumbo", "Nkongsamba", "Edea", "Edéa", "Foumban", "Dschang",
      "Bafia", "Kribi", "Ebolowa", "Sangmelima", "Mamfe", "Wum", "Fundong",
      "Ndop", "Mbouda", "Bafut", "Bali", "Mutengene", "Yagoua"
    ];
    for (const city of KNOWN_CAMEROON_CITIES) {
      if (new RegExp(`\\b${city}\\b`, "i").test(schoolName)) {
        return city;
      }
    }
  }

  return "";
}

/**
 * Formats a clean date for report cards (e.g. "31 October 2026").
 */
export function formatReportCardDate(date: Date = new Date()): string {
  const day = date.getDate();
  const monthsEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${day} ${monthsEn[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Resolves the regional and divisional delegations dynamically based on location.
 */
export function resolveDelegations(address?: string | null, schoolName?: string): { regional: string; divisional: string } {
  const text = `${address || ""} ${schoolName || ""}`.toUpperCase();

  if (text.includes("BAMENDA") || text.includes("MEZAM") || text.includes("NORTH WEST") || text.includes("NORD-OUEST") || text.includes("KUMBO") || text.includes("BUI")) {
    return {
      regional: "NORTH WEST REGION",
      divisional: text.includes("KUMBO") || text.includes("BUI") ? "BUI DIVISION" : "MEZAM DIVISION",
    };
  }
  if (text.includes("BUEA") || text.includes("LIMBE") || text.includes("FAKO") || text.includes("SOUTH WEST") || text.includes("SUD-OUEST") || text.includes("KUMBA") || text.includes("MEME")) {
    return {
      regional: "SOUTH WEST REGION",
      divisional: text.includes("KUMBA") || text.includes("MEME") ? "MEME DIVISION" : "FAKO DIVISION",
    };
  }
  if (text.includes("DOUALA") || text.includes("LITTORAL") || text.includes("WOURI")) {
    return {
      regional: "LITTORAL REGION",
      divisional: "WOURI DIVISION",
    };
  }
  if (text.includes("YAOUNDE") || text.includes("YAOUNDÉ") || text.includes("CENTRE") || text.includes("MFOUNDI")) {
    return {
      regional: "CENTRE REGION",
      divisional: "MFOUNDI DIVISION",
    };
  }
  if (text.includes("BAFOUSSAM") || text.includes("OUEST") || text.includes("WEST REGION") || text.includes("MIFI")) {
    return {
      regional: "WEST REGION",
      divisional: "MIFI DIVISION",
    };
  }
  if (text.includes("GAROUA") || text.includes("NORD") || text.includes("NORTH REGION") || text.includes("BENOUE") || text.includes("BÉNOUÉ")) {
    return {
      regional: "NORTH REGION",
      divisional: "BÉNOUÉ DIVISION",
    };
  }
  if (text.includes("MAROUA") || text.includes("EXTREME-NORD") || text.includes("FAR NORTH") || text.includes("DIAMARE")) {
    return {
      regional: "FAR NORTH REGION",
      divisional: "DIAMARÉ DIVISION",
    };
  }
  if (text.includes("BERTOUA") || text.includes("EST") || text.includes("EAST REGION")) {
    return {
      regional: "EAST REGION",
      divisional: "LOM-ET-DJÉREM DIVISION",
    };
  }
  if (text.includes("NGAOUNDERE") || text.includes("NGAOUNDÉRÉ") || text.includes("ADAMAOUA") || text.includes("ADAMAWA")) {
    return {
      regional: "ADAMAWA REGION",
      divisional: "VINA DIVISION",
    };
  }
  if (text.includes("EBOLOWA") || text.includes("KRIBI") || text.includes("SUD") || text.includes("SOUTH REGION")) {
    return {
      regional: "SOUTH REGION",
      divisional: text.includes("KRIBI") ? "OCÉAN DIVISION" : "MVILA DIVISION",
    };
  }

  return {
    regional: "REGIONAL DELEGATION",
    divisional: "DIVISIONAL DELEGATION",
  };
}
