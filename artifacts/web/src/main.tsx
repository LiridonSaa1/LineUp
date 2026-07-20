import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// Configure API base URL for native mobile app wrapper (Capacitor)
if (typeof window !== "undefined" && (window as any).Capacitor) {
  const isAndroid = (window as any).Capacitor?.getPlatform() === "android";
  // On Android emulator, 10.0.2.2 routes directly to host PC's localhost:8080
  const defaultApiHost = isAndroid ? "http://10.0.2.2:8080" : "http://localhost:8080";
  setBaseUrl(import.meta.env.VITE_API_URL || defaultApiHost);
}

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    } else {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()))
        .catch(() => {});
    }
  });
}
