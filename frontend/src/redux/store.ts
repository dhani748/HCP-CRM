import { configureStore } from '@reduxjs/toolkit';
import interactionReducer from './slices/interactionSlice';
import chatReducer from './slices/chatSlice';
import hcpReducer from './slices/hcpSlice';
import uiReducer from './slices/uiSlice';
import aiExtractReducer from './slices/aiExtractSlice';
import editingSessionReducer from './slices/editingSessionSlice';
import type { RootState, AppDispatch } from './types';

export const store = configureStore({
  reducer: {
    interaction: interactionReducer,
    chat: chatReducer,
    hcp: hcpReducer,
    ui: uiReducer,
    aiExtract: aiExtractReducer,
    editingSession: editingSessionReducer,
  },
});

export type { RootState, AppDispatch };
