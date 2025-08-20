import { configureStore } from "@reduxjs/toolkit";
// import your other reducers here
import generateReducer from "@/redux/features/generateSlice";

const store = configureStore({
  reducer: {
    generate: generateReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
