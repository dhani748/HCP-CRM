// frontend/src/redux/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
  };
}

const initialState: UIState = {
  sidebarOpen: false,
  theme: 'light',
  toast: {
    message: '',
    type: 'success',
    visible: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    showToast: (state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' | 'warning' }>) => {
      state.toast = {
        message: action.payload.message,
        type: action.payload.type,
        visible: true,
      };
    },
    hideToast: (state) => {
      state.toast.visible = false;
    },
  },
});

export const {
  toggleSidebar,
  setTheme,
  showToast,
  hideToast,
} = uiSlice.actions;

export default uiSlice.reducer;
