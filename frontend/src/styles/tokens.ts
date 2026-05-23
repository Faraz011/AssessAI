/**
 * Design Tokens
 * Extracted from Figma - VedaAI Hiring Assignment
 * Colors, Typography, Spacing, and Border Radius
 */

// Color Palette
export const colors = {
  // Primary Colors
  primary: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9", // Primary brand color
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c3d66",
  },

  // Surface & Background
  surface: {
    background: "#ffffff",
    surface: "#f9fafb",
    surfaceAlt: "#f3f4f6",
    surfaceHover: "#e5e7eb",
    surfaceActive: "#d1d5db",
  },

  // Text Colors
  text: {
    primary: "#1f2937", // High contrast for body text
    secondary: "#6b7280",
    tertiary: "#9ca3af",
    inverse: "#ffffff",
    disabled: "#d1d5db",
  },

  // Semantic Colors
  success: {
    light: "#d1fae5",
    base: "#10b981", // Success state
    dark: "#047857",
  },
  warning: {
    light: "#fed7aa",
    base: "#f59e0b", // Warning state
    dark: "#d97706",
  },
  error: {
    light: "#fee2e2",
    base: "#ef4444", // Error state
    dark: "#dc2626",
  },
  info: {
    light: "#dbeafe",
    base: "#3b82f6", // Info state
    dark: "#1d4ed8",
  },

  // Utility
  transparent: "transparent",
  black: "#000000",
  white: "#ffffff",
};

// Typography Scale
export const typography = {
  fontFamily: {
    sans: "system-ui, -apple-system, sans-serif",
    mono: "Menlo, Monaco, Courier New, monospace",
  },

  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  letterSpacing: {
    tight: "-0.02em",
    normal: "0em",
    wide: "0.025em",
  },
};

// Spacing Scale
export const spacing = {
  0: "0rem",
  px: "1px",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem", // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem", // 12px
  3.5: "0.875rem", // 14px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  7: "1.75rem", // 28px
  8: "2rem", // 32px
  9: "2.25rem", // 36px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  14: "3.5rem", // 56px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  28: "7rem", // 112px
  32: "8rem", // 128px
};

// Border Radius
export const borderRadius = {
  none: "0px",
  sm: "0.125rem", // 2px
  base: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px",
};

// Shadows
export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
};

// Component-Specific Tokens
export const components = {
  button: {
    primary: {
      background: colors.primary[500],
      foreground: colors.text.inverse,
      hover: colors.primary[600],
      active: colors.primary[700],
      disabled: colors.text.disabled,
    },
    secondary: {
      background: colors.surface.surfaceAlt,
      foreground: colors.text.primary,
      hover: colors.surface.surfaceHover,
      active: colors.surface.surfaceActive,
      disabled: colors.text.disabled,
    },
    danger: {
      background: colors.error.base,
      foreground: colors.text.inverse,
      hover: colors.error.dark,
      active: colors.error.dark,
      disabled: colors.text.disabled,
    },
  },

  input: {
    background: colors.surface.background,
    border: "#e5e7eb",
    borderHover: "#d1d5db",
    borderFocus: colors.primary[500],
    placeholder: colors.text.tertiary,
    disabled: colors.surface.surfaceAlt,
  },

  badge: {
    success: {
      background: colors.success.light,
      foreground: colors.success.dark,
    },
    warning: {
      background: colors.warning.light,
      foreground: colors.warning.dark,
    },
    error: {
      background: colors.error.light,
      foreground: colors.error.dark,
    },
    info: {
      background: colors.info.light,
      foreground: colors.info.dark,
    },
  },

  card: {
    background: colors.surface.background,
    border: "#e5e7eb",
    shadow: shadows.base,
  },
};

// Export all tokens as a single object
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
};

export default tokens;
