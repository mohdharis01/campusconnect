import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import notifReducer from './notifSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notifReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
