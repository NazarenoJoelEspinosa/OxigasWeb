import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { restoredPath } from "./lib/redirect";

// El fallback de Pages transporta la ruta en la URL, sin depender de sessionStorage.
const params = new URLSearchParams(window.location.search);
const redirect = restoredPath(import.meta.env.BASE_URL, params.get('__route'));
if (redirect) window.history.replaceState(null, '', redirect);

createRoot(document.getElementById("root")!).render(
  <App />
);