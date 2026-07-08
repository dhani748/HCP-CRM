// frontend/src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import interactionReducer from './slices/interactionSlice';
import chatReducer from './slices/chatSlice';
import hcpReducer from './slices/hcpSlice';
import uiReducer from './slices/uiSlice';
import type { RootState, AppDispatch } from './types';

export const store = configureStore({
  reducer: {
    interaction: interactionReducer,
    chat: chatReducer,
    hcp: hcpReducer,
    ui: uiReducer,
  },
});

export type { RootState, AppDispatch };
