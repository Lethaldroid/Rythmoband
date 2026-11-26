import { createTheme } from "@mui/material/styles";

// DubMaster MUI theme. Values mirror the CSS tokens in index.css so MUI
// components and plain CSS stay in sync.
export const brand = {
  primary: "#ff5a36",
  primaryHover: "#ff7656",
  onPrimary: "#140805",
  amber: "#ffb547",
  bg: "#0b0b0d",
  surface: "#131316",
  raised: "#1a1a1f",
  hover: "#222228",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.16)",
  text: "#f4f4f5",
  muted: "#a1a1aa",
  subtle: "#8b8b94",
  success: "#3ddc97",
  danger: "#ff5c6c",
};

const display = "'Bricolage Grotesque', 'Inter', system-ui, sans-serif";
const sans = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: brand.primary,
      light: brand.primaryHover,
      dark: "#e8461f",
      contrastText: brand.onPrimary,
    },
    secondary: { main: brand.amber, contrastText: "#1a1205" },
    success: { main: brand.success },
    error: { main: brand.danger },
    background: { default: brand.bg, paper: brand.surface },
    text: { primary: brand.text, secondary: brand.muted, disabled: "#5c5c66" },
    divider: brand.border,
    action: {
      hover: "rgba(255, 255, 255, 0.06)",
      selected: "rgba(255, 90, 54, 0.14)",
      focus: "rgba(255, 90, 54, 0.2)",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: sans,
    h1: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.05 },
    h2: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1 },
    h3: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15 },
    h4: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontFamily: display, fontWeight: 600, letterSpacing: "-0.01em" },
    h6: { fontFamily: display, fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    overline: { fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: brand.bg } },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: false },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 9999,
          paddingInline: 18,
          minHeight: 40,
          transition: "background-color 120ms, border-color 120ms, box-shadow 120ms",
        },
        sizeLarge: { minHeight: 48, paddingInline: 26, fontSize: 16 },
        sizeSmall: { minHeight: 32, paddingInline: 12 },
        containedPrimary: {
          fontWeight: 700,
          "&:hover": {
            backgroundColor: brand.primaryHover,
            boxShadow: "0 0 0 1px rgba(255,90,54,.35), 0 10px 30px -8px rgba(255,90,54,.45)",
          },
        },
        outlined: {
          borderColor: brand.borderStrong,
          color: brand.text,
          "&:hover": { borderColor: "rgba(255,255,255,.32)", backgroundColor: "rgba(255,255,255,.05)" },
        },
        text: { color: brand.text },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { "&:hover": { backgroundColor: "rgba(255,255,255,.07)" } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: { borderColor: brand.border },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: "none", border: `1px solid ${brand.border}`, borderRadius: 16 },
      },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: brand.raised,
          borderRadius: 12,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.border },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: brand.borderStrong },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: brand.primary,
            borderWidth: 1,
            boxShadow: "0 0 0 3px rgba(255,90,54,.18)",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: brand.muted } },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: {
          backgroundColor: "#26262c",
          border: `1px solid ${brand.borderStrong}`,
          fontSize: 12,
          fontWeight: 500,
        },
        arrow: { color: "#26262c" },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundColor: brand.surface, border: `1px solid ${brand.border}`, borderRadius: 20 },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { backgroundColor: brand.raised, border: `1px solid ${brand.border}` },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: brand.surface, borderColor: brand.border },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: brand.border } },
    },
    MuiLink: {
      defaultProps: { underline: "hover" },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: brand.surface,
          border: `1px solid ${brand.border}`,
          borderRadius: 14,
          "&:before": { display: "none" },
          "&.Mui-expanded": { margin: 0 },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
  },
});

export default theme;
