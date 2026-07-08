// frontend/src/redux/types.ts
import { configureStore } from '@reduxjs/toolkit';
import interactionReducer from './slices/interactionSlice';
import chatReducer from './slices/chatSlice';
import hcpReducer from './slices/hcpSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    interaction: interactionReducer,
    chat: chatReducer,
    hcp: hcpReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _store = store;