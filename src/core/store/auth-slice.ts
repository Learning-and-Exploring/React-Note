import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@features/auth/auth-service";

type AuthState = {
  token: string;
  user: AuthUser | null;
  initialized: boolean;
};

const initialState: AuthState = {
  token: "",
  user: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(
      state,
      action: PayloadAction<{ token: string; user: AuthUser | null }>,
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.initialized = true;
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      state.initialized = true;
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.initialized = true;
    },
    clearToken(state) {
      state.token = "";
      state.user = null;
      state.initialized = true;
    },
    setAuthInitialized(state, action: PayloadAction<boolean>) {
      state.initialized = action.payload;
    },
  },
});

export const { setSession, setToken, setUser, clearToken, setAuthInitialized } =
  authSlice.actions;
export const authReducer = authSlice.reducer;

export type AuthStateSlice = ReturnType<typeof authReducer>;
