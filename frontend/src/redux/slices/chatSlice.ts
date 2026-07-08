// frontend/src/redux/slices/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';

export interface ChatState {
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  currentChat: { hcpId?: string; hcpName?: string } | null;
  isTyping: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  currentChat: null,
  isTyping: false,
  loading: false,
  error: null,
};

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (message: string) => {
    const response = await apiService.post<{ reply: string }>('/chat', { message });
    return response.data;
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentChat: (state, action: PayloadAction<{ hcpId?: string; hcpName?: string } | null>) => {
      state.currentChat = action.payload;
      state.messages = [];
      state.error = null;
    },
    addMessage: (state, action: PayloadAction<{ role: 'user' | 'assistant'; content: string }>) => {
      state.messages.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    clearChat: (state) => {
      state.messages = [];
      state.currentChat = null;
      state.isTyping = false;
      state.error = null;
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.isTyping = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.isTyping = false;
        state.messages.push({
          role: 'assistant',
          content: action.payload.reply,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.isTyping = false;
        state.error = action.error.message || 'Failed to send message';
      });
  },
});

export const {
  setCurrentChat,
  addMessage,
  clearChat,
  setTyping,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
