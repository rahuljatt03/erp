import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { finishedGoodsService, rawMaterialsService } from './inventory.service';

/**
 * Inventory Redux slice — holds two stock lists (finished goods + raw materials)
 * under one `inventory` key. Each has its own loading/error status. Mutations
 * (create / set on-hand) are thunks; the page refetches the affected list after.
 *
 * produce/receive/consume live on the services and are driven by the production
 * and procurement modules, so they aren't exposed here as thunks.
 */

const errMessage = (err) => (err instanceof Error ? err.message : 'Inventory request failed');

export const fetchFinishedGoods = createAsyncThunk(
  'inventory/fetchFinishedGoods',
  async (_arg, { rejectWithValue }) => {
    try {
      return await finishedGoodsService.list();
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

export const fetchRawMaterials = createAsyncThunk(
  'inventory/fetchRawMaterials',
  async (_arg, { rejectWithValue }) => {
    try {
      return await rawMaterialsService.list();
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

export const createFinishedGood = createAsyncThunk(
  'inventory/createFinishedGood',
  (draft) => finishedGoodsService.create(draft),
);

export const removeFinishedGood = createAsyncThunk(
  'inventory/removeFinishedGood',
  (id) => finishedGoodsService.remove(id),
);

export const setFinishedGoodOnHand = createAsyncThunk(
  'inventory/setFinishedGoodOnHand',
  ({ id, onHand }) => finishedGoodsService.setOnHand(id, onHand),
);

export const createRawMaterial = createAsyncThunk(
  'inventory/createRawMaterial',
  (draft) => rawMaterialsService.create(draft),
);

export const removeRawMaterial = createAsyncThunk(
  'inventory/removeRawMaterial',
  (id) => rawMaterialsService.remove(id),
);

export const setRawMaterialOnHand = createAsyncThunk(
  'inventory/setRawMaterialOnHand',
  ({ id, onHand }) => rawMaterialsService.setOnHand(id, onHand),
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
