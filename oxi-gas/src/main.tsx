import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Restaurar rutas en GitHub Pages
const redirect = sessionStorage.getItem("redirect");

if (redirect) {
  sessionStorage.removeItem("redirect");

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  window.history.replaceState(
    null,
    "",
    `${base}${redirect}`
  );
}

createRoot(document.getElementById("root")!).render(
  <App />
);