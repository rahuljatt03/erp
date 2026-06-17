import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

/**
 * Work-order Redux slice — talks to the .NET ERP API directly.
 *
 * Component → dispatch → slice (request) → state. `produceProductionOrder` is the
 * loop-closer: the backend advances the work order's producedQty / consumedQty /
 * status AND posts the matching inventory movements (finished goods up, raw
 * materials down) in one transaction, counted once via its PostedQty ledgers — so
 * the frontend just reports the quantity and re-reads. Registered under the
 * `production` key.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';
const ENDPOINT = `${API_BASE}/api/production-orders`;
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

/** Fetch one work order (or null on 404) — shared by the thunk and produce(). */
async function getOne(id) {
  const response = await fetch(`${ENDPOINT}/${id}`);
  if (response.status === 404) return null;
  return handle(response);
}

/**
 * Shape a form draft for the API. Existing material rows keep their numeric
 * server id so the backend reconciles them in place (preserving the
 * consumed/posted ledger); new rows carry a client-only string id, which we drop
 * so the backend inserts them. consumedQty is server-owned, so it's never sent.
 */
function toApiDraft(draft) {
  return {
    ...draft,
    materials: (draft.materials ?? []).map((material) => {
      const row = {
        materialName: material.materialName,
        materialCode: material.materialCode,
        rawMaterialId: material.rawMaterialId ?? null,
        quantity: material.quantity,
        unit: material.unit,
      };
      if (typeof material.id === 'number') row.id = material.id;
      return row;
    }),
  };
}

// --- Thunks ------------------------------------------------------------------

export const fetchProductionOrders = createAsyncThunk(
  'production/fetchProductionOrders',
  async (_arg, { rejectWithValue }) => {
    try {
      return await handle(await fetch(ENDPOINT));
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to load'));
    }
  },
);

export const fetchProductionOrder = createAsyncThunk(
  'production/fetchProductionOrder',
  async (id, { rejectWithValue }) => {
    try {
      return await getOne(id);
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to load'));
    }
  },
);

export const createProductionOrder = createAsyncThunk(
  'production/createProductionOrder',
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

export const updateProductionOrder = createAsyncThunk(
  'production/updateProductionOrder',
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

export const removeProductionOrder = createAsyncThunk(
  'production/removeProductionOrder',
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
 * Report production of `qty` units. The backend caps it at the outstanding
 * amount, advances producedQty / each material's consumedQty / status, and posts
 * the inventory in one transaction — finished-goods stock up, raw-material stock
 * down, each counted exactly once via its PostedQty ledger.
 */
export const produceProductionOrder = createAsyncThunk(
  'production/produceProductionOrder',
  async ({ id, qty }, { rejectWithValue }) => {
    try {
      return await handle(
        await fetch(`${ENDPOINT}/${id}/produce`, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({ qty: Number(qty) || 0 }),
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

const productionSlice = createSlice({
  name: 'production',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductionOrders.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchProductionOrders.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.items = action.payload ?? [];
      })
      .addCase(fetchProductionOrders.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload ?? action.error?.message ?? 'Failed to load';
      })
      .addCase(fetchProductionOrder.pending, (state) => {
        state.currentStatus = 'loading';
        state.currentError = null;
        state.current = null;
      })
      .addCase(fetchProductionOrder.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload ?? null;
      })
      .addCase(fetchProductionOrder.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.currentError = action.payload ?? action.error?.message ?? 'Failed to load';
      });
  },
});

// --- Selectors ---------------------------------------------------------------

const root = (state) => state.production;
const isLoadingStatus = (status) => status === 'idle' || status === 'loading';

export const selectProductionOrders = (state) => root(state).items;
export const selectProductionOrdersLoading = (state) => isLoadingStatus(root(state).listStatus);
export const selectProductionOrdersError = (state) => root(state).listError;
export const selectProductionOrder = (state) => root(state).current;
export const selectProductionOrderLoading = (state) => isLoadingStatus(root(state).currentStatus);
export const selectProductionOrderError = (state) => root(state).currentError;

export default productionSlice.reducer;
