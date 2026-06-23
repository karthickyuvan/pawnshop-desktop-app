import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/theme.css";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { Toaster } from "react-hot-toast";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
    <BrowserRouter>
    <Toaster 
          position="top-right" 
          reverseOrder={false} 
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
    <App />
    </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>
);
