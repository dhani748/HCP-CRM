import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '../../types';
import type { RootState } from '../types';
import { agentChatService } from '../../services/aiService';
import type { AgentChatResponse } from '../../services/aiService';

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  loading: boolean;
  error: string | null;
  unreadCount: number;
  currentTool: string;
  toolExecutionStatus: string;
  toolOutput: Record<string, unknown> | null;
  updatedFields: string[];
}

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  loading: false,
  error: null,
  unreadCount: 0,
  currentTool: '',
  toolExecutionStatus: '',
  toolOutput: null,
  updatedFields: [],
};

export const sendAgentMessage = createAsyncThunk<
  AgentChatResponse,
  string,
  { rejectValue: string }
>('chat/sendAgentMessage', async (message: string, { rejectWithValue }) => {
  try {
    const response = await agentChatService(message);
    return response;
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : 'Failed to send message');
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
      state.currentTool = '';
      state.toolExecutionStatus = '';
      state.toolOutput = null;
      state.updatedFields = [];
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    resetUnread: (state) => {
      state.unreadCount = 0;
    },
    resetToolState: (state) => {
      state.currentTool = '';
      state.toolExecutionStatus = '';
      state.toolOutput = null;
      state.updatedFields = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendAgentMessage.pending, (state) => {
        state.loading = true;
        state.isTyping = true;
        state.error = null;
        state.currentTool = '';
        state.toolExecutionStatus = 'thinking';
        state.toolOutput = null;
        state.updatedFields = [];
      })
      .addCase(sendAgentMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.isTyping = false;
        state.messages.push({
          role: 'assistant',
          content: action.payload.reply,
          timestamp: new Date().toISOString(),
        });
        state.currentTool = action.payload.tool_executed;
        state.toolExecutionStatus = action.payload.execution_status;
        state.toolOutput = action.payload.tool_output as Record<string, unknown> | null;
        state.updatedFields = action.payload.updated_fields || [];
        state.unreadCount += 1;
      })
      .addCase(sendAgentMessage.rejected, (state, action) => {
        state.loading = false;
        state.isTyping = false;
        state.error = action.payload || 'Failed to send message';
        state.toolExecutionStatus = 'error';
      });
  },
});

export const { addMessage, clearChat, setTyping, resetUnread, resetToolState } = chatSlice.actions;

export const selectChatMessages = (state: RootState) => state.chat.messages;
export const selectChatLoading = (state: RootState) => state.chat.loading;
export const selectChatTyping = (state: RootState) => state.chat.isTyping;
export const selectChatError = (state: RootState) => state.chat.error;
export const selectChatUnread = (state: RootState) => state.chat.unreadCount;
export const selectCurrentTool = (state: RootState) => state.chat.currentTool;
export const selectToolExecutionStatus = (state: RootState) => state.chat.toolExecutionStatus;
export const selectToolOutput = (state: RootState) => state.chat.toolOutput;
export const selectUpdatedFields = (state: RootState) => state.chat.updatedFields;

export default chatSlice.reducer;
