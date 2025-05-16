import { configureStore } from '@reduxjs/toolkit';
import courseReducer from './courseSlice';
import userReducer from './authSlice'

export const store = configureStore({
  reducer: {
    course: courseReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;