import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  token: string;
  initialized: boolean;
};

const initialState: AuthState = {
  token: "",
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      state.initialized = true;
    },
    clearToken(state) {
      state.token = "";
      state.initialized = true;
    },
    setAuthInitialized(state, action: PayloadAction<boolean>) {
      state.initialized = action.payload;
    },
  },
});

export const { setToken, clearToken, setAuthInitialized } = authSlice.actions;
export const authReducer = authSlice.reducer;

export type AuthStateSlice = ReturnType<typeof authReducer>;
