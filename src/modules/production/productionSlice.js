import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createApiClient, runRequest, toApiError } from '../../shared/api/client';

/**
 * Work-order Redux slice — talks to the .NET ERP API directly via the shared axios client.
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

const api = createApiClient('/api/production-orders');

const errMessage = (err, fallback) =>
  err instanceof Error ? err.message : fallback;

/** Fetch one work order (or null on 404). */
async function getOne(id) {
  try {
    const { data } = await api.get(`/${id}`);
    return data === '' || data === undefined ? null : data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw toApiError(err);
  }
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
      return await runRequest(api.get(''));
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
      return await runRequest(api.post('', toApiDraft(draft)));
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to save'));
    }
  },
);

export const updateProductionOrder = createAsyncThunk(
  'production/updateProductionOrder',
  async ({ id, draft }, { rejectWithValue }) => {
    try {
      return await runRequest(api.put(`/${id}`, toApiDraft(draft)));
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to save'));
    }
  },
);

export const removeProductionOrder = createAsyncThunk(
  'production/removeProductionOrder',
  async (id, { rejectWithValue }) => {
    try {
      await runRequest(api.delete(`/${id}`));
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
      return await runRequest(api.post(`/${id}/produce`, { qty: Number(qty) || 0 }));
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
