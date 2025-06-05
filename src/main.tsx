import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Debug code to verify React instance (keeping for now)
window.React1 = React;
console.log('React1 from main.tsx:', window.React1);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(<App />);
