import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import "./pwa/install";
import App from "./app/App";
import { loadLang } from "./i18n/dicts";
import { useSettings } from "./store/settings";

// Load the saved language's strings before first render so there is no flash of English.
loadLang(useSettings.getState().lang).finally(() => {
  const root = document.getElementById("root")!;
  const app = (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  // The landing page is prerendered at build time; hydrate it so the painted hero is reused, not repainted.
  if (root.hasChildNodes()) hydrateRoot(root, app);
  else createRoot(root).render(app);
});
