import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

/**
 * Purchase-order Redux slice — talks to the .NET ERP API directly.
 *
 * Component → dispatch → slice (request) → state. Inventory side effects are
 * owned by the backend: creating/updating a PO or recording a receipt reconciles
 * raw-material stock there, so this slice just sends the order or the receipt.
 * `receivePurchaseOrder` posts received quantities. Registered under the
 * `procurement` key.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';
const ENDPOINT = `${API_BASE}/api/purchase-orders`;
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

/**
 * Normalise line items for the API: send a numeric `id` only for existing lines
 * (so the server matches them and preserves their received/posted ledger) and
 * omit it for new lines, whose client-side ids are non-numeric strings.
 */
function toApiItems(items) {
  return (items ?? []).map((item) => {
    const numericId = Number(item.id);
    const { id, ...rest } = item;
    return Number.isInteger(numericId) && numericId > 0
      ? { id: numericId, ...rest }
      : rest;
  });
}

/** Shape a draft for the API (item ids normalised). */
function toApiDraft(draft) {
  return { ...draft, items: toApiItems(draft.items) };
}

// --- Thunks ------------------------------------------------------------------

export const fetchPurchaseOrders = createAsyncThunk(
  'procurement/fetchPurchaseOrders',
  async (_arg, { rejectWithValue }) => {
    try {
      return await handle(await fetch(ENDPOINT));
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to load'));
    }
  },
);

export const fetchPurchaseOrder = createAsyncThunk(
  'procurement/fetchPurchaseOrder',
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

export const createPurchaseOrder = createAsyncThunk(
  'procurement/createPurchaseOrder',
  async (draft, { rejectWithValue }) => {
    try {
      return await handle(
        await fetch(ENDPOINT, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify(toApiDraft(draft)),
        }),
      );
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to save'));
    }
  },
);

export const updatePurchaseOrder = createAsyncThunk(
  'procurement/updatePurchaseOrder',
  async ({ id, draft }, { rejectWithValue }) => {
    try {
      return await handle(
        await fetch(`${ENDPOINT}/${id}`, {
          method: 'PUT',
          headers: JSON_HEADERS,
          body: JSON.stringify(toApiDraft(draft)),
        }),
      );
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to save'));
    }
  },
);

export const removePurchaseOrder = createAsyncThunk(
  'procurement/removePurchaseOrder',
  async (id, { rejectWithValue }) => {
    try {
      await handle(await fetch(`${ENDPOINT}/${id}`, { method: 'DELETE' }));
      return id;
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to delete'));
    }
  },
);

/**
 * Record a goods receipt. `receipts` is `[{ itemId, qty }]`. The backend
 * increments each line's receivedQty, recomputes status, and posts the received
 * quantity into raw-material inventory (once) — so there is no separate stock
 * write here.
 */
export const receivePurchaseOrder = createAsyncThunk(
  'procurement/receivePurchaseOrder',
  async ({ id, receipts }, { rejectWithValue }) => {
    try {
      const validReceipts = (receipts ?? [])
        .filter((r) => Number(r.qty) > 0)
        .map((r) => ({ itemId: r.itemId, qty: Number(r.qty) }));

      return await handle(
        await fetch(`${ENDPOINT}/${id}/receive`, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify(validReceipts),
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

const procurementSlice = createSlice({
  name: 'procurement',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.items = action.payload ?? [];
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload ?? action.error?.message ?? 'Failed to load';
      })
      .addCase(fetchPurchaseOrder.pending, (state) => {
        state.currentStatus = 'loading';
        state.currentError = null;
        state.current = null;
      })
      .addCase(fetchPurchaseOrder.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload ?? null;
      })
      .addCase(fetchPurchaseOrder.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.currentError = action.payload ?? action.error?.message ?? 'Failed to load';
      });
  },
});

// --- Selectors ---------------------------------------------------------------

const root = (state) => state.procurement;
const isLoadingStatus = (status) => status === 'idle' || status === 'loading';

export const selectPurchaseOrders = (state) => root(state).items;
export const selectPurchaseOrdersLoading = (state) => isLoadingStatus(root(state).listStatus);
export const selectPurchaseOrdersError = (state) => root(state).listError;
export const selectPurchaseOrder = (state) => root(state).current;
export const selectPurchaseOrderLoading = (state) => isLoadingStatus(root(state).currentStatus);
export const selectPurchaseOrderError = (state) => root(state).currentError;

export default procurementSlice.reducer;
