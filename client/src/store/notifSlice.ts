import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/utils/api';
import { Notification } from '@/utils/types';

interface NotifState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

const initialState: NotifState = { notifications: [], unreadCount: 0, loading: false };

export const fetchNotifications = createAsyncThunk('notif/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/notifications?limit=30');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const markAllRead = createAsyncThunk('notif/markRead', async () => {
  await api.put('/notifications/read', { ids: [] });
});

const notifSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    decrementUnread: (state) => {
      if (state.unreadCount > 0) state.unreadCount -= 1;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.pending, (state) => { state.loading = true; });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
      state.loading = false;
    });
    builder.addCase(markAllRead.fulfilled, (state) => {
      state.unreadCount = 0;
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
    });
  },
});

export const { addNotification, decrementUnread } = notifSlice.actions;
export default notifSlice.reducer;
