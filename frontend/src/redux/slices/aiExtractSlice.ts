import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ExtractedInteraction {
  hcpName: string;
  interactionType: string;
  date: string;
  time: string;
  discussion: string[];
  summary: string;
  sentiment: string;
  materialsShared: string[];
  followUp: string;
  outcomes: string[];
  notes: string;
}

export interface ExtractedHCP {
  name: string;
  specialty: string;
  hospital: string;
  city: string;
  email: string;
  phone: string;
}

export interface AIExtractState {
  extractedInteraction: ExtractedInteraction | null;
  extractedHCP: ExtractedHCP | null;
}

const initialState: AIExtractState = {
  extractedInteraction: null,
  extractedHCP: null,
};

const aiExtractSlice = createSlice({
  name: 'aiExtract',
  initialState,
  reducers: {
    setExtractedInteraction: (state, action: PayloadAction<ExtractedInteraction | null>) => {
      state.extractedInteraction = action.payload;
    },
    setExtractedHCP: (state, action: PayloadAction<ExtractedHCP | null>) => {
      state.extractedHCP = action.payload;
    },
    clearExtraction: (state) => {
      state.extractedInteraction = null;
      state.extractedHCP = null;
    },
  },
});

export const { setExtractedInteraction, setExtractedHCP, clearExtraction } = aiExtractSlice.actions;
export default aiExtractSlice.reducer;
