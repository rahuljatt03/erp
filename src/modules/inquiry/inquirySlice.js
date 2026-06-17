import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

/**
 * Inquiry Redux slice — talks to the .NET ERP API directly.
 *
 * Each thunk makes its own `fetch` request and returns the response to the
 * component (via `dispatch(...).unwrap()`). There's no service or factory layer:
 * component → dispatch → slice (request) → state. Registered under the `inquiry`
 * key in the store.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5080";
const ENDPOINT = `${API_BASE}/api/inquiries`;
const JSON_HEADERS = { "Content-Type": "application/json" };

/** Parse JSON if present; throw a helpful error on non-2xx responses. */
async function handle(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message =
      data?.title || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

const errMessage = (err, fallback) =>
  err instanceof Error ? err.message : fallback;

// --- Thunks: dispatched from components, each issues one API request ---------

export const fetchInquiries = createAsyncThunk(
  "inquiry/fetchInquiries",
  async (_arg, { rejectWithValue }) => {
    try {
      return await handle(await fetch(ENDPOINT));
    } catch (err) {
      return rejectWithValue(errMessage(err, "Failed to load"));
    }
  },
);

export const fetchInquiry = createAsyncThunk(
  "inquiry/fetchInquiry",
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${ENDPOINT}/${id}`);
      if (response.status === 404) return null;
      return await handle(response);
    } catch (err) {
      return rejectWithValue(errMessage(err, "Failed to load"));
    }
  },
);

export const createInquiry = createAsyncThunk(
  "inquiry/createInquiry",
  async (draft, { rejectWithValue }) => {
    try {
      return await handle(
        await fetch(ENDPOINT, {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify(draft),
        }),
      );
    } catch (err) {
      return rejectWithValue(errMessage(err, "Failed to save"));
    }
  },
);

export const updateInquiry = createAsyncThunk(
  "inquiry/updateInquiry",
  async ({ id, draft }, { rejectWithValue }) => {
    try {
      return await handle(
        await fetch(`${ENDPOINT}/${id}`, {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify(draft),
        }),
      );
    } catch (err) {
      return rejectWithValue(errMessage(err, "Failed to save"));
    }
  },
);

export const removeInquiry = createAsyncThunk(
  "inquiry/removeInquiry",
  async (id, { rejectWithValue }) => {
    try {
      await handle(await fetch(`${ENDPOINT}/${id}`, { method: "DELETE" }));
      return id;
    } catch (err) {
      return rejectWithValue(errMessage(err, "Failed to delete"));
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
