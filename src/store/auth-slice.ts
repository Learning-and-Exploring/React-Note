import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const TOKEN_STORAGE_KEY = "note_app_token";

type AuthState = {
  token: string;
};

function getInitialToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
}

const initialState: AuthState = {
  token: getInitialToken(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(TOKEN_STORAGE_KEY, action.payload);
      }
    },
    clearToken(state) {
      state.token = "";
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    },
  },
});

export const { setToken, clearToken } = authSlice.actions;
export const authReducer = authSlice.reducer;

export type AuthStateSlice = ReturnType<typeof authReducer>;
