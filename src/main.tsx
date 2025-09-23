import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { MiniTimerChannelProvider } from "./hooks/useMiniTimerChannel";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(
  <MiniTimerChannelProvider>
    <App />
  </MiniTimerChannelProvider>
);
