import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import store from "./store/store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import { NotificationsProvider } from "reapop";
import StripeScriptLoader from "react-stripe-script-loader";
const root = ReactDOM.createRoot(document.getElementById("root"));
let persistor = persistStore(store);

root.render(
  // <StripeScriptLoader
  //   uniqueId="myUniqueId"
  //   script="https://js.stripe.com/v3/"
  //   loader="Loading..."
  // >
  <PersistGate persistor={persistor}>
    <Provider store={store}>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </Provider>
  </PersistGate>
  // </StripeScriptLoader>
);

reportWebVitals();
