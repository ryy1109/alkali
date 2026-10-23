"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { ReactNode } from "react";

const theme = createTheme({
  palette: {
    primary: { main: "#351477" },
    secondary: { main: "#176447" },
    background: { default: "#f8f6fc", paper: "#ffffff" },
    text: { primary: "#261b36", secondary: "#65596f" },
    error: { main: "#b42318" },
    success: { main: "#176447" },
  },
  typography: { fontFamily: '"Segoe UI", Arial, sans-serif' },
  shape: { borderRadius: 12 },
  components: { MuiButton: { defaultProps: { disableElevation: true } } },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
