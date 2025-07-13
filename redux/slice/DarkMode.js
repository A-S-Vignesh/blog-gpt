const { createSlice } = require("@reduxjs/toolkit");

const darkModeSlice = createSlice({
  name: "darkMode",
  initialState: {
    isDarkMode: false,
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
