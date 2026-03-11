export type ThemeName = "dracula" | "catppuccin" | "tokyonight";

export interface Theme {
  name: ThemeName;
  label: string;
  accent: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  muted: string;
  modes: { ask: string; plan: string; build: string };
}

export const themes: Record<ThemeName, Theme> = {
  dracula: {
    name: "dracula",
    label: "Dracula",
    accent: "magenta",
    primary: "#bd93f9",
    secondary: "#ff79c6",
    success: "#50fa7b",
    warning: "#f1fa8c",
    error: "#ff5555",
    muted: "gray",
    modes: { ask: "cyan", plan: "#f1fa8c", build: "#50fa7b" },
  },
  catppuccin: {
    name: "catppuccin",
    label: "Catppuccin",
    accent: "blue",
    primary: "#cba6f7",
    secondary: "#f5c2e7",
    success: "#a6e3a1",
    warning: "#f9e2af",
    error: "#f38ba8",
    muted: "gray",
    modes: { ask: "#89dceb", plan: "#f9e2af", build: "#a6e3a1" },
  },
  tokyonight: {
    name: "tokyonight",
    label: "Tokyo Night",
    accent: "blue",
    primary: "#7aa2f7",
    secondary: "#bb9af7",
    success: "#9ece6a",
    warning: "#e0af68",
    error: "#f7768e",
    muted: "gray",
    modes: { ask: "#7dcfff", plan: "#e0af68", build: "#9ece6a" },
  },
};

export const defaultTheme: ThemeName = "tokyonight";
