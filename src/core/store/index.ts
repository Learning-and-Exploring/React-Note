import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./auth-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthInitialized = (state: RootState) =>
  state.auth.initialized;
export const selectIsAuthenticated = (state: RootState) =>
  Boolean(state.auth.token);
