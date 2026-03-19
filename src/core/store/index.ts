import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./auth-slice";
import { adminAuthReducer } from "./admin-auth-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminAuth: adminAuthReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthInitialized = (state: RootState) =>
  state.auth.initialized;
export const selectIsAuthenticated = (state: RootState) =>
  Boolean(state.auth.token);
export const selectAdminToken = (state: RootState) => state.adminAuth.token;
export const selectAdmin = (state: RootState) => state.adminAuth.admin;
export const selectAdminAuthInitialized = (state: RootState) =>
  state.adminAuth.initialized;
export const selectIsAdminAuthenticated = (state: RootState) =>
  Boolean(state.adminAuth.token);
