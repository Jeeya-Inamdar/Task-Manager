import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import store from "./redux/store";
import { StageProvider } from "./utils/StagesContext.jsx"

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <StageProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StageProvider>
    </Provider>
  </React.StrictMode>
);
