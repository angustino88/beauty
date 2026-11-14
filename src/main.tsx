import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { store, persistor } from "./app/store";
import { msalInstance } from "./features/auth/msalConfig";
import { FullscreenLoading } from "@/components/layout/FullscreenLoading";
import App from "./App.tsx";
import "./index.css";

try {
  const initialTheme = window.localStorage.getItem("labmango:theme") === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = initialTheme;
  document.documentElement.style.colorScheme = initialTheme;
} catch {
  // Use the light theme when browser storage is unavailable.
}

const CHUNK_RELOAD_KEY = "labmango:chunk-reload-attempted";

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") return;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
});

window.addEventListener("error", (event) => {
  if (
    event.message?.includes("Loading chunk") ||
    event.message?.includes("ChunkLoadError")
  ) {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    window.location.reload();
  }
});

window.addEventListener("load", () => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <Provider store={store}>
        <PersistGate loading={<FullscreenLoading />} persistor={persistor}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PersistGate>
      </Provider>
    </MsalProvider>
  </StrictMode>,
);
