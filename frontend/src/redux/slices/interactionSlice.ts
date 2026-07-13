import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Interaction } from '../../types';
import type { RootState } from '../types';
import { apiService } from '../../services/apiService';

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camel] = obj[key];
  }
  if (result.hcpId === undefined && obj.healthcare_professional_id !== undefined) {
    result.hcpId = String(obj.healthcare_professional_id);
  }
  return result;
}

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (key === 'hcpId') {
      result.healthcare_professional_id = Number(obj[key]);
      continue;
    }
    const snake = key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
    result[snake] = obj[key];
  }
  return result;
}

export const EMPTY_INTERACTION: Partial<Interaction> = {
  hcpName: '',
  interactionType: 'visit',
  interactionDate: '',
  interactionTime: '',
  attendees: '',
  hospital: '',
  specialization: '',
  topicsDiscussed: '',
  discussionNotes: '',
  materialsShared: [],
  samplesDistributed: [],
  sentiment: 'neutral',
  outcomes: '',
  followUpActions: '',
  followUpRequired: false,
  followUpDate: '',
  reminderDate: '',
  priority: 'medium',
  tags: [],
  aiSuggestedFollowUp: '',
  aiGeneratedSummary: '',
  interactionStatus: 'draft',
  toolUsed: '',
  lastUpdated: '',
  aiConfidenceScore: 0,
};

export interface InteractionState {
  interactions: Interaction[];
  currentInteraction: Partial<Interaction>;
  loading: boolean;
  error: string | null;
  saving: boolean;
  selectedDate: string;
}

const initialState: InteractionState = {
  interactions: [],
  currentInteraction: { ...EMPTY_INTERACTION },
  loading: false,
  error: null,
  saving: false,
  selectedDate: new Date().toISOString().split('T')[0],
};

export const saveCurrentInteraction = createAsyncThunk<
  Interaction,
  void,
  { state: RootState; rejectValue: string }
>('interaction/saveCurrentInteraction', async (_, { getState, rejectWithValue }) => {
  const state = getState();
  const interaction = state.interaction.currentInteraction;
  const session = state.editingSession;

  const payload = toSnakeCase({ ...interaction } as Record<string, unknown>);

  try {
    if (session.mode === 'edit' && session.interactionId) {
      const response = await apiService.put<Record<string, unknown>>(
        `/interactions/${session.interactionId}`,
        payload
      );
      return toCamelCase(response.data) as unknown as Interaction;
    } else {
      const response = await apiService.post<Record<string, unknown>>('/interactions', payload);
      return toCamelCase(response.data) as unknown as Interaction;
    }
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : 'Failed to save interaction');
  }
});

export const fetchInteractions = createAsyncThunk(
  'interaction/fetchInteractions',
  async (params?: { hcpId?: string; startDate?: string; endDate?: string; status?: string; interactionType?: string }) => {
    const queryParams: Record<string, unknown> = { ...params };
    if (params?.hcpId) {
      queryParams.healthcare_professional_id = Number(params.hcpId);
      delete queryParams.hcpId;
    }
    const response = await apiService.get<Record<string, unknown>[]>('/interactions', { params: queryParams });
    return response.data.map(item => toCamelCase(item) as unknown as Interaction);
  }
);

export const createInteraction = createAsyncThunk(
  'interaction/createInteraction',
  async (interaction: Partial<Interaction>) => {
    const payload = toSnakeCase(interaction as Record<string, unknown>);
    const response = await apiService.post<Record<string, unknown>>('/interactions', payload);
    return toCamelCase(response.data) as unknown as Interaction;
  }
);

export const updateInteraction = createAsyncThunk(
  'interaction/updateInteraction',
  async ({ id, data }: { id: string; data: Partial<Interaction> }) => {
    const payload = toSnakeCase(data as Record<string, unknown>);
    const response = await apiService.put<Record<string, unknown>>(`/interactions/${id}`, payload);
    return toCamelCase(response.data) as unknown as Interaction;
  }
);

export const deleteInteraction = createAsyncThunk(
  'interaction/deleteInteraction',
  async (id: string) => {
    await apiService.delete(`/interactions/${id}`);
    return id;
  }
);

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    setCurrentInteraction: (state, action: PayloadAction<Partial<Interaction> | null>) => {
      state.currentInteraction = action.payload ?? { ...EMPTY_INTERACTION };
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    resetForm: (state) => {
      state.currentInteraction = { ...EMPTY_INTERACTION };
      state.error = null;
    },
    updateInteractionFromTool: (state, action: PayloadAction<Record<string, unknown>>) => {
      const data = action.payload;
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined && key in state.currentInteraction) {
          (state.currentInteraction as Record<string, unknown>)[key] = value;
        }
      }
      state.currentInteraction.lastUpdated = new Date().toISOString();
    },
    setFormField: (state, action: PayloadAction<{ field: string; value: unknown }>) => {
      const { field, value } = action.payload;
      if (field in state.currentInteraction) {
        (state.currentInteraction as Record<string, unknown>)[field] = value;
        state.currentInteraction.lastUpdated = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.interactions = action.payload;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch interactions';
      })
      .addCase(createInteraction.pending, (state) => {
        state.saving = true;
      })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.saving = false;
        state.interactions.unshift(action.payload);
        state.currentInteraction = action.payload;
      })
      .addCase(createInteraction.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to create interaction';
      })
      .addCase(updateInteraction.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateInteraction.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.interactions.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.interactions[index] = action.payload;
        }
      })
      .addCase(updateInteraction.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to update interaction';
      })
      .addCase(deleteInteraction.pending, (state) => {
        state.saving = true;
      })
      .addCase(deleteInteraction.fulfilled, (state, action) => {
        state.saving = false;
        state.interactions = state.interactions.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteInteraction.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to delete interaction';
      })
      .addCase(saveCurrentInteraction.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveCurrentInteraction.fulfilled, (state, action) => {
        state.saving = false;
        state.currentInteraction = action.payload;
        const idx = state.interactions.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) {
          state.interactions[idx] = action.payload;
        } else {
          state.interactions.unshift(action.payload);
        }
      })
      .addCase(saveCurrentInteraction.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string || 'Failed to save interaction';
      });
  },
});

export const {
  setCurrentInteraction,
  setSelectedDate,
  resetForm,
  updateInteractionFromTool,
  setFormField,
} = interactionSlice.actions;

export const selectAllInteractions = (state: RootState) => state.interaction.interactions;
export const selectCurrentInteraction = (state: RootState) => state.interaction.currentInteraction;
export const selectSelectedDate = (state: RootState) => state.interaction.selectedDate;
export const selectInteractionLoading = (state: RootState) => state.interaction.loading;
export const selectInteractionError = (state: RootState) => state.interaction.error;
export const selectInteractionSaving = (state: RootState) => state.interaction.saving;

export default interactionSlice.reducer;
