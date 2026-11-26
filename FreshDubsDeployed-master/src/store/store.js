import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./features/userSlice";
import storage from "redux-persist/lib/storage";
import { persistReducer } from "redux-persist";
import { combineReducers } from "@reduxjs/toolkit";
import appSlice from "./features/appSlice";
import { reducer as notificationsReducer } from "reapop";
// import AsyncStorage from "redux-persist/lib/AsyncStorage";

const appPersistConfig = {
  key: "app",
  // version: 1,
  keyPrefix: "",
  storage,
  blacklist: [
    "vidSource",
    "srt1",
    "srt2",
    "srt3",
    // timings must not outlive the (unpersisted) subtitle text they belong to
    "time1",
    "time2",
    "time3",
    "trackNames",
    "projects",
    "statusArray",
    "recordingData",
    // "currentProject",
  ],
};
const persistConfig = {
  key: "root",
  // version: 1,
  storage,

  blacklist: ["app"],
};
// vidSource", "srt1", "srt2", "srt3

const reducer = combineReducers({
  user: userSlice.reducer,
  notifications: notificationsReducer(),
  app: persistReducer(appPersistConfig, appSlice.reducer),
});
const persistedReducer = persistReducer(persistConfig, reducer);
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
