// frontend/src/redux/slices/interactionSlice.ts
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

export interface InteractionState {
  interactions: Interaction[];
  currentInteraction: Partial<Interaction> | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  selectedDate: string;
}

const initialState: InteractionState = {
  interactions: [],
  currentInteraction: null,
  loading: false,
  error: null,
  saving: false,
  selectedDate: new Date().toISOString().split('T')[0],
};

export const fetchInteractions = createAsyncThunk(
  'interaction/fetchInteractions',
  async (params?: { hcpId?: string; startDate?: string; endDate?: string }) => {
    const queryParams = params?.hcpId
      ? { ...params, healthcare_professional_id: Number(params.hcpId) }
      : params;
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
      state.currentInteraction = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    resetForm: (state) => {
      state.currentInteraction = null;
      state.error = null;
    },
    setFormField: (
      state,
      action: PayloadAction<{ field: keyof Interaction; value: unknown }>
    ) => {
      if (state.currentInteraction) {
        (state.currentInteraction as Record<string, unknown>)[action.payload.field] = action.payload.value;
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
        state.currentInteraction = null;
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
      });
  },
});

export const {
  setCurrentInteraction,
  setSelectedDate,
  resetForm,
  setFormField,
} = interactionSlice.actions;

export const selectAllInteractions = (state: RootState) => state.interaction.interactions;
export const selectCurrentInteraction = (state: RootState) => state.interaction.currentInteraction;
export const selectSelectedDate = (state: RootState) => state.interaction.selectedDate;
export const selectInteractionLoading = (state: RootState) => state.interaction.loading;
export const selectInteractionError = (state: RootState) => state.interaction.error;
export const selectInteractionSaving = (state: RootState) => state.interaction.saving;

export default interactionSlice.reducer;
