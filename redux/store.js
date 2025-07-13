import { configureStore } from "@reduxjs/toolkit";
import darkModeSlice from "./slice/DarkMode"; // ✅ This already exports just the reducer
import postSlice from "./slice/post";
import generatePostSlice from "./slice/generatePost";

const store = configureStore({
  reducer: {
    darkMode: darkModeSlice, // ✅ FIXED: removed `.reducer`
    posts: postSlice.reducer,
    generatePost: generatePostSlice.reducer,
  },
});

export default store;
