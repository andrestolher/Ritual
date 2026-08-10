import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js?v=2", { updateViaCache: "none" });
}

createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
