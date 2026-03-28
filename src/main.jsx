import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/theme.css";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
    <BrowserRouter>
    <App />
    </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>
);
