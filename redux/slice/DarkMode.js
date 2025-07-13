// redux/slice/DarkMode.js
import { createSlice } from "@reduxjs/toolkit";

// Dynamically detect theme during slice init (only runs on client)
const getInitialDarkMode = () => {
  if (typeof window !== "undefined") {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark;
  }
  return false; // fallback for SSR
};

const darkModeSlice = createSlice({
  name: "darkMode",
  initialState: {
    isDarkMode: getInitialDarkMode(),
  },
  reducers: {
    setDarkMode: (state, action) => {
      state.isDarkMode = action.payload;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
  },
});

export const darkModeActions = darkModeSlice.actions;
export default darkModeSlice.reducer;
