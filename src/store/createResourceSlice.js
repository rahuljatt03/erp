import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

/**
 * Most ERP modules expose the same REST-ish service shape (list/get/create/
 * update/remove) and need the same Redux wiring: a list with loading/error, a
 * "current" record for detail pages, and async thunks for every call. Rather
 * than hand-writing six near-identical slices, this factory builds one from a
 * service object.
 *
 * Usage:
 *   const slice = createResourceSlice({ name: 'sales', service: salesService });
 *   export const { fetchAll: fetchSalesOrders, ... } = slice.thunks;
 *   export const { selectAll: selectSalesOrders, ... } = slice.selectors;
 *   export default slice.reducer;
 *
 * `extraThunks` adds module-specific calls (e.g. receive/produce/setStatus):
 *   extraThunks: { produce: (service, { id, qty }) => service.produce(id, qty) }
 *
 * The slice key in the store MUST equal `name` — the selectors read state[name].
 */

const errMessage = (err, fallback) =>
  err instanceof Error ? err.message : fallback;

export function createResourceSlice({ name, service, extraThunks = {} }) {
  const fetchAll = createAsyncThunk(`${name}/fetchAll`, async (_arg, { rejectWithValue }) => {
    try {
      return await service.list();
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to load'));
    }
  });

  const fetchOne = createAsyncThunk(`${name}/fetchOne`, async (id, { rejectWithValue }) => {
    try {
      return await service.get(id);
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to load'));
    }
  });

  const createOne = createAsyncThunk(`${name}/createOne`, async (draft, { rejectWithValue }) => {
    try {
      return await service.create(draft);
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to save'));
    }
  });

  const updateOne = createAsyncThunk(`${name}/updateOne`, async ({ id, draft }, { rejectWithValue }) => {
    try {
      return await service.update(id, draft);
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to save'));
    }
  });

  const removeOne = createAsyncThunk(`${name}/removeOne`, async (id, { rejectWithValue }) => {
    try {
      await service.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Failed to delete'));
    }
  });

  // Build any module-specific thunks from the provided map.
  const extras = {};
  for (const [key, fn] of Object.entries(extraThunks)) {
    extras[key] = createAsyncThunk(`${name}/${key}`, async (arg, { rejectWithValue }) => {
      try {
        return await fn(service, arg);
      } catch (err) {
        return rejectWithValue(errMessage(err, 'Request failed'));
      }
    });
  }

  const initialState = {
    items: [],
    listStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    listError: null,
    current: null,
    currentStatus: 'idle',
    currentError: null,
  };

  const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(fetchAll.pending, (state) => {
          state.listStatus = 'loading';
          state.listError = null;
        })
        .addCase(fetchAll.fulfilled, (state, action) => {
          state.listStatus = 'succeeded';
          state.items = action.payload ?? [];
        })
        .addCase(fetchAll.rejected, (state, action) => {
          state.listStatus = 'failed';
          state.listError = action.payload ?? action.error?.message ?? 'Failed to load';
        })
        .addCase(fetchOne.pending, (state) => {
          state.currentStatus = 'loading';
          state.currentError = null;
          state.current = null;
        })
        .addCase(fetchOne.fulfilled, (state, action) => {
          state.currentStatus = 'succeeded';
          state.current = action.payload ?? null;
        })
        .addCase(fetchOne.rejected, (state, action) => {
          state.currentStatus = 'failed';
          state.currentError = action.payload ?? action.error?.message ?? 'Failed to load';
        });
    },
  });

  const root = (state) => state[name];
  const isLoadingStatus = (status) => status === 'idle' || status === 'loading';

  const selectors = {
    selectAll: (state) => root(state).items,
    selectListLoading: (state) => isLoadingStatus(root(state).listStatus),
    selectListError: (state) => root(state).listError,
    selectCurrent: (state) => root(state).current,
    selectCurrentLoading: (state) => isLoadingStatus(root(state).currentStatus),
    selectCurrentError: (state) => root(state).currentError,
  };

  return {
    reducer: slice.reducer,
    thunks: { fetchAll, fetchOne, createOne, updateOne, removeOne, ...extras },
    selectors,
  };
}
