/**
 * Centralized brand configuration and design system tokens.
 * Locked in with Option A: Green & Cream Palette.
 */
export const BRAND = {
  name: "Nsei Skul",
  tagline: "School Management, Simplified",
  supportEmail: "contact@nseiskul.com",
};

export const DESIGN_TOKENS = {
  colors: {
    canvas: "#FFFDF5",
    surface: "#FFFFFF",
    cream: "#FFF8CF",
    warmBorder: "#FBE6C2",
    border: "#E8DFC9",
    primaryText: "#142010",
    secondaryText: "#525E4B",
    primary: "#2A7C13",
    primaryHover: "#20600E",
    accentLeaf: "#76C457",
    darkCta: "#142010",
  },
  radius: {
    card: "12px",
    button: "7px",
  },
  container: "max-w-6xl", // ~1152px
} as const;
