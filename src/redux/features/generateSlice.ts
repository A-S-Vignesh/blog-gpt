import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PostData{
    title: string;
    content: string;
    slug: string;
    image: string | ArrayBuffer | null;
    tags: string[];
}

interface GenerateState{
    post: PostData | null;
    loading: boolean;
    error: string | null;
}

const initialState: GenerateState = {
    post: null,
    loading: false,
    error: null,
}

const generateSlice = createSlice({
  name: "generate",
  initialState,
  reducers: {
    setPost: (state, action: PayloadAction<PostData>) => {
      state.post = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearPost: () => initialState,
  },
});

export const { setPost, clearPost } = generateSlice.actions;
export default generateSlice.reducer;