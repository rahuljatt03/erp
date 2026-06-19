import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createApiClient, runRequest, toApiError } from "../../shared/api/client";

/**
 * Inquiry Redux slice — talks to the .NET ERP API directly via the shared axios
 * client. Each thunk issues one request and returns the response to the
 * component (via `dispatch(...).unwrap()`). There's no separate service layer:
 * component → dispatch → slice (axios) → state. Registered under the `inquiry`
 * key in the store. Other modules (sales/quotation) reuse `setInquiryStatus`
 * here to flip an inquiry's status when converting it.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const api = createApiClient("/api/inquiries");

const errMessage = (err, fallback) =>
  err instanceof Error ? err.message : fallback;

// --- Thunks: dispatched from components, each issues one API request ---------

export const fetchInquiries = createAsyncThunk(
  "inquiry/fetchInquiries",
  async (_arg, { rejectWithValue }) => {
    try {
      return await runRequest(api.get(""));
    } catch (err) {
      return rejectWithValue(errMessage(err, "Failed to load"));
    }
  },
);

export const fetchInquiry = createAsyncThunk(
  "inquiry/fetchInquiry",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/${id}`);
      return data === "" || data === undefined ? null : data;
    } catch (err) {
      if (err.response?.status === 404) return null;
      return rejectWithValue(errMessage(toApiError(err), "Failed to load"));
    }
  },
);

export const createInquiry = createAsyncThunk(
  "inquiry/createInquiry",
  async (draft, { rejectWithValue }) => {
    try {
      return await runRequest(api.post("", draft));
    } catch (err) {
      return rejectWithValue(errMessage(err, "Failed to save"));
    }
  },
);

export const updateInquiry = createAsyncThunk(
  "inquiry/updateInquiry",
  async ({ id, draft }, { rejectWithValue }) => {
    try {
      return await runRequest(api.put(`/${id}`, draft));
    } catch (err) {
      return rejectWithValue(errMessage(err, "Failed to save"));
    }
  },
);

export const removeInquiry = createAsyncThunk(
  "inquiry/removeInquiry",
  async (id, { rejectWithValue }) => {
    try {
      await runRequest(api.delete(`/${id}`));
      return id;
    } catch (err) {
      return rejectWithValue(errMessage(err, "Failed to delete"));
    }
  },
);

/**
 * Lightweight status update — used cross-module (sales/quotation dispatch this
 * to mark a source inquiry "converted"/"quoted" when converting it).
 */
export const setInquiryStatus = createAsyncThunk(
  "inquiry/setInquiryStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await runRequest(api.patch(`/${id}/status`, { status }));
    } catch (err) {
      return rejectWithValue(errMessage(err, "Failed to update status"));
    }
  },
);

// --- Slice -------------------------------------------------------------------

const initialState = {
  items: [],
  listStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  listError: null,
  current: null,
  currentStatus: "idle",
  currentError: null,
};

const inquirySlice = createSlice({
  name: "inquiry",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInquiries.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchInquiries.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.items = action.payload ?? [];
      })
      .addCase(fetchInquiries.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError =
          action.payload ?? action.error?.message ?? "Failed to load";
      })
      .addCase(fetchInquiry.pending, (state) => {
        state.currentStatus = "loading";
        state.currentError = null;
        state.current = null;
      })
      .addCase(fetchInquiry.fulfilled, (state, action) => {
        state.currentStatus = "succeeded";
        state.current = action.payload ?? null;
      })
      .addCase(fetchInquiry.rejected, (state, action) => {
        state.currentStatus = "failed";
        state.currentError =
          action.payload ?? action.error?.message ?? "Failed to load";
      });
  },
});

// --- Selectors ---------------------------------------------------------------

const root = (state) => state.inquiry;
const isLoadingStatus = (status) => status === "idle" || status === "loading";

export const selectInquiries = (state) => root(state).items;
export const selectInquiriesLoading = (state) =>
  isLoadingStatus(root(state).listStatus);
export const selectInquiriesError = (state) => root(state).listError;
export const selectInquiry = (state) => root(state).current;
export const selectInquiryLoading = (state) =>
  isLoadingStatus(root(state).currentStatus);
export const selectInquiryError = (state) => root(state).currentError;

export default inquirySlice.reducer;
