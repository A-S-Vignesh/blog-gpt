import generatePostSlice from "./slice/generatePost";
import postSlice from "./slice/post";

const { configureStore } = require("@reduxjs/toolkit");
const { default: darkModeSlice } = require("./slice/DarkMode");

const store = configureStore({
  reducer: {
    darkMode: darkModeSlice.reducer,
    posts: postSlice.reducer,
    generatePost: generatePostSlice.reducer,
  },
});

export default store;
