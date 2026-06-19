import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createApiClient, runRequest } from '../../shared/api/client';

/**
 * Inventory Redux slice — holds two stock lists (finished goods + raw materials)
 * under one `inventory` key. Each has its own loading/error status. Mutations
 * (create / remove / set on-hand) are thunks; the page refetches the affected
 * list after. Talks to the .NET ERP API directly via the shared axios client —
 * there's no separate service layer.
 *
 * Stock side effects from production (produce/consume) and procurement (receive)
 * are owned by the backend now, so they aren't exposed here.
 */

const fgApi = createApiClient('/api/inventory/finished-goods');
const rmApi = createApiClient('/api/inventory/raw-materials');

const errMessage = (err) => (err instanceof Error ? err.message : 'Inventory request failed');

export const fetchFinishedGoods = createAsyncThunk(
  'inventory/fetchFinishedGoods',
  async (_arg, { rejectWithValue }) => {
    try {
      return await runRequest(fgApi.get(''));
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

export const fetchRawMaterials = createAsyncThunk(
  'inventory/fetchRawMaterials',
  async (_arg, { rejectWithValue }) => {
    try {
      return await runRequest(rmApi.get(''));
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

export const createFinishedGood = createAsyncThunk(
  'inventory/createFinishedGood',
  ({ sku, name, unit, onHand }) =>
    runRequest(fgApi.post('', { sku, name, unit, onHand: Number(onHand) || 0 })),
);

export const removeFinishedGood = createAsyncThunk(
  'inventory/removeFinishedGood',
  (id) => runRequest(fgApi.delete(`/${id}`)),
);

export const setFinishedGoodOnHand = createAsyncThunk(
  'inventory/setFinishedGoodOnHand',
  ({ id, onHand }) =>
    runRequest(fgApi.patch(`/${id}/on-hand`, { onHand: Number(onHand) || 0 })),
);

export const createRawMaterial = createAsyncThunk(
  'inventory/createRawMaterial',
  ({ code, name, unit, onHand }) =>
    runRequest(rmApi.post('', { code, name, unit, onHand: Number(onHand) || 0 })),
);

export const removeRawMaterial = createAsyncThunk(
  'inventory/removeRawMaterial',
  (id) => runRequest(rmApi.delete(`/${id}`)),
);

export const setRawMaterialOnHand = createAsyncThunk(
  'inventory/setRawMaterialOnHand',
  ({ id, onHand }) =>
    runRequest(rmApi.patch(`/${id}/on-hand`, { onHand: Number(onHand) || 0 })),
);

const blankStock = () => ({ items: [], status: 'idle', error: null });

const initialState = {
  finishedGoods: blankStock(),
  rawMaterials: blankStock(),
};

/** Wire pending/fulfilled/rejected for one stock list onto `state[key]`. */
function addStockCases(builder, key, fetchThunk) {
  builder
    .addCase(fetchThunk.pending, (state) => {
      state[key].status = 'loading';
      state[key].error = null;
    })
    .addCase(fetchThunk.fulfilled, (state, action) => {
      state[key].status = 'succeeded';
      state[key].items = action.payload ?? [];
    })
    .addCase(fetchThunk.rejected, (state, action) => {
      state[key].status = 'failed';
      state[key].error = action.payload ?? action.error?.message ?? 'Failed to load stock';
    });
}

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    addStockCases(builder, 'finishedGoods', fetchFinishedGoods);
    addStockCases(builder, 'rawMaterials', fetchRawMaterials);
  },
});

const isLoading = (status) => status === 'idle' || status === 'loading';

export const selectFinishedGoods = (state) => state.inventory.finishedGoods.items;
export const selectFinishedGoodsLoading = (state) => isLoading(state.inventory.finishedGoods.status);
export const selectFinishedGoodsError = (state) => state.inventory.finishedGoods.error;

export const selectRawMaterials = (state) => state.inventory.rawMaterials.items;
export const selectRawMaterialsLoading = (state) => isLoading(state.inventory.rawMaterials.status);
export const selectRawMaterialsError = (state) => state.inventory.rawMaterials.error;

export default inventorySlice.reducer;
