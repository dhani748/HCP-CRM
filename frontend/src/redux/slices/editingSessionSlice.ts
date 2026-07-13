import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../types';

export type EditingMode = 'idle' | 'create' | 'edit';

export interface EditingSessionState {
  mode: EditingMode;
  interactionId: number | null;
}

const initialState: EditingSessionState = {
  mode: 'idle',
  interactionId: null,
};

const editingSessionSlice = createSlice({
  name: 'editingSession',
  initialState,
  reducers: {
    startCreateSession: (state) => {
      state.mode = 'create';
      state.interactionId = null;
    },
    startEditSession: (state, action: PayloadAction<number>) => {
      state.mode = 'edit';
      state.interactionId = action.payload;
    },
    clearSession: (state) => {
      state.mode = 'idle';
      state.interactionId = null;
    },
  },
});

export const { startCreateSession, startEditSession, clearSession } = editingSessionSlice.actions;
export const selectEditingSession = (state: RootState) => state.editingSession;

export default editingSessionSlice.reducer;
