import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { inquiryService } from '../inquiry/inquiry.service';

/**
 * Quotation Redux slice — talks to the .NET ERP API directly.
 *
 * Component → dispatch → slice (request) → state. Creating a quotation from an
 * inquiry marks that inquiry "quoted" — the one cross-module side effect, done
 * here via the shared inquiry client. `setQuotationStatus` is the module-specific
 * call (e.g. when a quotation is converted to a sales order). Registered under
 * the `quotation` key.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';
const ENDPOINT = `${API_BASE}/api/quotations`;
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

export const fetchQuotations = createAsyncThunk(
  'quotation/fetchQuotations',
  async (_arg, { rejectWithValue }) => {
    try {
      return await handle(await fetch(ENDPOINT));
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to load'));
    }
  },
);

export const fetchQuotation = createAsyncThunk(
  'quotation/fetchQuotation',
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

export const createQuotation = createAsyncThunk(
  'quotation/createQuotation',
  async (draft, { rejectWithValue }) => {
    try {
      const inserted = await handle(
        await fetch(ENDPOINT, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify(draft),
        }),
      );

      // Quoting an inquiry marks it as "quoted" (non-fatal if it fails).
      if (inserted?.sourceInquiryId) {
        try {
          await inquiryService.setStatus(inserted.sourceInquiryId, 'quoted');
        } catch {
          // The quotation is still created even if the inquiry update fails.
        }
      }
      return inserted;
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to save'));
    }
  },
);

export const updateQuotation = createAsyncThunk(
  'quotation/updateQuotation',
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

export const removeQuotation = createAsyncThunk(
  'quotation/removeQuotation',
  async (id, { rejectWithValue }) => {
    try {
      await handle(await fetch(`${ENDPOINT}/${id}`, { method: 'DELETE' }));
      return id;
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to delete'));
    }
  },
);

export const setQuotationStatus = createAsyncThunk(
  'quotation/setQuotationStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await handle(
        await fetch(`${ENDPOINT}/${id}/status`, {
          method: 'PATCH',
          headers: JSON_HEADERS,
          body: JSON.stringify({ status }),
        }),
      );
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Request failed'));
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

const quotationSlice = createSlice({
  name: 'quotation',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotations.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.items = action.payload ?? [];
      })
      .addCase(fetchQuotations.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload ?? action.error?.message ?? 'Failed to load';
      })
      .addCase(fetchQuotation.pending, (state) => {
        state.currentStatus = 'loading';
        state.currentError = null;
        state.current = null;
      })
      .addCase(fetchQuotation.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload ?? null;
      })
      .addCase(fetchQuotation.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.currentError = action.payload ?? action.error?.message ?? 'Failed to load';
      });
  },
});

// --- Selectors ---------------------------------------------------------------

const root = (state) => state.quotation;
const isLoadingStatus = (status) => status === 'idle' || status === 'loading';

export const selectQuotations = (state) => root(state).items;
export const selectQuotationsLoading = (state) => isLoadingStatus(root(state).listStatus);
export const selectQuotationsError = (state) => root(state).listError;
export const selectQuotation = (state) => root(state).current;
export const selectQuotationLoading = (state) => isLoadingStatus(root(state).currentStatus);
export const selectQuotationError = (state) => root(state).currentError;

export default quotationSlice.reducer;
