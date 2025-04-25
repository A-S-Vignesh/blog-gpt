const { createSlice, current } = require("@reduxjs/toolkit");

const postSlice = createSlice({
  name: "posts",
  initialState: {
    posts: [],
    searchCache: null,
    searchResult: null,
    displaySearchResult: false,
  },
  reducers: {
    addPosts: (state, action) => {
      const allPosts = [...current(state.posts), ...action.payload];
      // filter the unique id post and map into that object and store it in the var.
      const uniquePosts = [...new Set(allPosts.map((obj) => obj._id))].map(
        (id) => allPosts.find((obj) => obj._id === id)
      );
      state.posts = uniquePosts;
    },
    addSearchCache: (state, action) => {
      state.searchCache = [...action.payload];
    },
    addSearchResult: (state, action) => {
      state.searchResult = action.payload;
      state.displaySearchResult = true;
    },
    clearSearchResult: (state) => {
      state.displaySearchResult = false;
    },
  },
});
export const postActions = postSlice.actions;
export default postSlice;
