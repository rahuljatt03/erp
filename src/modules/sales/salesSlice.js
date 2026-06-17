import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { inquiryService } from '../inquiry/inquiry.service';

/**
 * Sales-order Redux slice — talks to the .NET ERP API directly.
 *
 * Component → dispatch → slice (request) → state. Creating an order from an
 * inquiry marks that inquiry "converted" — the one cross-module side effect,
 * done here via the shared inquiry client. Registered under the `sales` key.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';
const ENDPOINT = `${API_BASE}/api/sales-orders`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** Parse JSON if present; throw a helpful error on non-2xx responses. */
async function handle(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.title || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

const errMessage = (err, fallback) =>
  err instanceof Error ? err.message : fallback;

// --- Thunks ------------------------------------------------------------------

export const fetchSalesOrders = createAsyncThunk(
  'sales/fetchSalesOrders',
  async (_arg, { rejectWithValue }) => {
    try {
      return await handle(await fetch(ENDPOINT));
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to load'));
    }
  },
);

export const fetchSalesOrder = createAsyncThunk(
  'sales/fetchSalesOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${ENDPOINT}/${id}`);
      if (response.status === 404) return null;
      return await handle(response);
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to load'));
    }
  },
);

export const createSalesOrder = createAsyncThunk(
  'sales/createSalesOrder',
  async (draft, { rejectWithValue }) => {
    try {
      const inserted = await handle(
        await fetch(ENDPOINT, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify(draft),
        }),
      );

      // Converting an inquiry marks it as "converted" (non-fatal if it fails).
      if (inserted?.sourceInquiryId) {
        try {
          await inquiryService.setStatus(inserted.sourceInquiryId, 'converted');
        } catch {
          // The sales order is still created even if the inquiry update fails.
        }
      }
      return inserted;
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to save'));
    }
  },
);

export const updateSalesOrder = createAsyncThunk(
  'sales/updateSalesOrder',
  async ({ id, draft }, { rejectWithValue }) => {
    try {
      return await handle(
        await fetch(`${ENDPOINT}/${id}`, {
          method: 'PUT',
          headers: JSON_HEADERS,
          body: JSON.stringify(draft),
        }),
      );
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to save'));
    }
  },
);

export const removeSalesOrder = createAsyncThunk(
  'sales/removeSalesOrder',
  async (id, { rejectWithValue }) => {
    try {
      await handle(await fetch(`${ENDPOINT}/${id}`, { method: 'DELETE' }));
      return id;
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to delete'));
    }
  },
);

// --- Slice -------------------------------------------------------------------

const initialState = {
  items: [],
  listStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  listError: null,
  current: null,
  currentStatus: 'idle',
  currentError: null,
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesOrders.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchSalesOrders.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.items = action.payload ?? [];
      })
      .addCase(fetchSalesOrders.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload ?? action.error?.message ?? 'Failed to load';
      })
      .addCase(fetchSalesOrder.pending, (state) => {
        state.currentStatus = 'loading';
        state.currentError = null;
        state.current = null;
      })
      .addCase(fetchSalesOrder.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload ?? null;
      })
      .addCase(fetchSalesOrder.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.currentError = action.payload ?? action.error?.message ?? 'Failed to load';
      });
  },
});

// --- Selectors ---------------------------------------------------------------

const root = (state) => state.sales;
const isLoadingStatus = (status) => status === 'idle' || status === 'loading';

export const selectSalesOrders = (state) => root(state).items;
export const selectSalesOrdersLoading = (state) => isLoadingStatus(root(state).listStatus);
export const selectSalesOrdersError = (state) => root(state).listError;
export const selectSalesOrder = (state) => root(state).current;
export const selectSalesOrderLoading = (state) => isLoadingStatus(root(state).currentStatus);
export const selectSalesOrderError = (state) => root(state).currentError;

export default salesSlice.reducer;
