import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AdminProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AdminAuthState = {
  token: string;
  admin: AdminProfile | null;
  initialized: boolean;
};

const initialState: AdminAuthState = {
  token: "",
  admin: null,
  initialized: false,
};

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    setAdminCredentials(
      state,
      action: PayloadAction<{ token: string; admin: AdminProfile | null }>,
    ) {
      state.token = action.payload.token;
      state.admin = action.payload.admin;
      state.initialized = true;
    },
    clearAdminCredentials(state) {
      state.token = "";
      state.admin = null;
      state.initialized = true;
    },
    setAdminAuthInitialized(state, action: PayloadAction<boolean>) {
      state.initialized = action.payload;
    },
  },
});

export const {
  setAdminCredentials,
  clearAdminCredentials,
  setAdminAuthInitialized,
} = adminAuthSlice.actions;

export const adminAuthReducer = adminAuthSlice.reducer;
