export default {
  colors: {
    border: "#eeeeee",
    background: "#cfcfd0",
    primaryLight: "#d4ddfa",
    primary: "#5f9831",
    primaryDark: " #3f549d",
    dark: "#3d3e3e",
    light: "#E8E8E6",
    white: "#fff",
    black: "#000",
    pink: "#d59a96",
    alert: "#F73F52",
    hover: "#5f98311a",
    gray: "#5f6673",
    blue: "#007bff",
    disable: "#cfd1d5"
  },
  fontWeight: {
    bold: '800',
    medium: '600',
    light: '300'
  }
};

import theme from "./theme";

export type ThemeType = typeof theme;
