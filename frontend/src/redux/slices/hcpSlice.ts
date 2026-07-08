// frontend/src/redux/slices/hcpSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { HCP } from '../../types';
import type { RootState } from '../types';
import { apiService } from '../../services/apiService';

export interface HCPState {
  hcps: HCP[];
  selectedHCP: HCP | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
}

const initialState: HCPState = {
  hcps: [],
  selectedHCP: null,
  loading: false,
  error: null,
  saving: false,
};

export const fetchHCPs = createAsyncThunk(
  'hcp/fetchHCPs',
  async (params?: Record<string, string | undefined>) => {
    const response = await apiService.get<HCP[]>('/healthcare-professionals', { params });
    return response.data;
  }
);

export const fetchHCPById = createAsyncThunk(
  'hcp/fetchHCPById',
  async (hcpId: string) => {
    const response = await apiService.get<HCP>(`/healthcare-professionals/${hcpId}`);
    return response.data;
  }
);

export const createHCP = createAsyncThunk(
  'hcp/createHCP',
  async (data: Partial<HCP>) => {
    const { active, updatedAt, ...clean } = data;
    const response = await apiService.post<HCP>('/healthcare-professionals', clean);
    return response.data;
  }
);

export const updateHCP = createAsyncThunk(
  'hcp/updateHCP',
  async ({ id, data }: { id: string; data: Partial<HCP> }) => {
    const { active, updatedAt, ...clean } = data;
    const response = await apiService.put<HCP>(`/healthcare-professionals/${id}`, clean);
    return response.data;
  }
);

export const deleteHCP = createAsyncThunk(
  'hcp/deleteHCP',
  async (id: string) => {
    await apiService.delete(`/healthcare-professionals/${id}`);
    return id;
  }
);

const hcpSlice = createSlice({
  name: 'hcp',
  initialState,
  reducers: {
    setSelectedHCP: (state, action: PayloadAction<HCP | null>) => {
      state.selectedHCP = action.payload;
      state.error = null;
    },
    clearHCPError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHCPs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHCPs.fulfilled, (state, action) => {
        state.loading = false;
        state.hcps = action.payload;
      })
      .addCase(fetchHCPs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch HCPs';
      })
      .addCase(fetchHCPById.fulfilled, (state, action) => {
        state.selectedHCP = action.payload;
      })
      .addCase(createHCP.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createHCP.fulfilled, (state, action) => {
        state.saving = false;
        state.hcps.unshift(action.payload);
      })
      .addCase(createHCP.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to create HCP';
      })
      .addCase(updateHCP.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateHCP.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.hcps.findIndex((h) => h.id === action.payload.id);
        if (index !== -1) {
          state.hcps[index] = action.payload;
        }
        if (state.selectedHCP?.id === action.payload.id) {
          state.selectedHCP = action.payload;
        }
      })
      .addCase(updateHCP.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to update HCP';
      })
      .addCase(deleteHCP.pending, (state) => {
        state.saving = true;
      })
      .addCase(deleteHCP.fulfilled, (state, action) => {
        state.saving = false;
        state.hcps = state.hcps.filter((h) => h.id !== action.payload);
        if (state.selectedHCP?.id === action.payload) {
          state.selectedHCP = null;
        }
      })
      .addCase(deleteHCP.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to delete HCP';
      });
  },
});

export const { setSelectedHCP, clearHCPError } = hcpSlice.actions;

export const selectAllHCPs = (state: RootState) => state.hcp.hcps;
export const selectSelectedHCP = (state: RootState) => state.hcp.selectedHCP;
export const selectHCPLoading = (state: RootState) => state.hcp.loading;
export const selectHCPError = (state: RootState) => state.hcp.error;
export const selectHCPSaving = (state: RootState) => state.hcp.saving;

export default hcpSlice.reducer;
