const { createSlice } = require("@reduxjs/toolkit");

const generatePostSlice = createSlice({
  name: "generatePost",
  initialState: {
    post: null,
  },
  reducers: {
    setPost: (state, action) => {
      state.post = action.payload;
    },
  },
});

export const generatePostAction = generatePostSlice.actions;
export default generatePostSlice;
