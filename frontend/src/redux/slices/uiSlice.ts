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
  aiWidgetOpen: boolean;
  aiUnreadCount: number;
}

const initialState: UIState = {
  sidebarOpen: false,
  theme: 'dark',
  toast: {
    message: '',
    type: 'success',
    visible: false,
  },
  aiWidgetOpen: false,
  aiUnreadCount: 0,
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
    toggleAIWidget: (state) => {
      state.aiWidgetOpen = !state.aiWidgetOpen;
      if (state.aiWidgetOpen) {
        state.aiUnreadCount = 0;
      }
    },
    openAIWidget: (state) => {
      state.aiWidgetOpen = true;
      state.aiUnreadCount = 0;
    },
    closeAIWidget: (state) => {
      state.aiWidgetOpen = false;
    },
    incrementAIUnread: (state) => {
      state.aiUnreadCount += 1;
    },
    resetAIUnread: (state) => {
      state.aiUnreadCount = 0;
    },
  },
});

export const {
  toggleSidebar,
  setTheme,
  showToast,
  hideToast,
  toggleAIWidget,
  openAIWidget,
  closeAIWidget,
  incrementAIUnread,
  resetAIUnread,
} = uiSlice.actions;

export default uiSlice.reducer;
