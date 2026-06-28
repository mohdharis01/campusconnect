import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/utils/api';
import { User } from '@/utils/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  loading: false,
  error: null,
};

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
  }
});

export const login = createAsyncThunk('auth/login', async (credentials: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (payload: { name: string; username: string; email: string; password: string; role?: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  } catch (err: any) {
    localStorage.removeItem('accessToken');
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload: Partial<User>, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/users/profile', payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
    clearError: (state) => { state.error = null; },
    updateUserField: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // fetchMe
    builder.addCase(fetchMe.pending, (state) => { state.loading = true; });
    builder.addCase(fetchMe.fulfilled, (state, action) => { state.user = action.payload; state.loading = false; });
    builder.addCase(fetchMe.rejected, (state) => { state.user = null; state.accessToken = null; state.loading = false; localStorage.removeItem('accessToken'); });

    // login
    builder.addCase(login.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(login.fulfilled, (state, action) => { state.user = action.payload.user; state.accessToken = action.payload.accessToken; state.loading = false; });
    builder.addCase(login.rejected, (state, action) => { state.error = action.payload as string; state.loading = false; });

    // register
    builder.addCase(register.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(register.fulfilled, (state, action) => { state.user = action.payload.user; state.accessToken = action.payload.accessToken; state.loading = false; });
    builder.addCase(register.rejected, (state, action) => { state.error = action.payload as string; state.loading = false; });

    // logout
    builder.addCase(logout.fulfilled, (state) => { state.user = null; state.accessToken = null; });

    // updateProfile
    builder.addCase(updateProfile.fulfilled, (state, action) => { state.user = action.payload; });
  },
});

export const { setToken, clearError, updateUserField } = authSlice.actions;
export default authSlice.reducer;
