import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerServiceWorker } from './utils/serviceWorkerRegistration';
import { indexedDB } from './utils/indexedDB';
import "./styles/tailwind.css";
import "./styles/index.css";

// Initialize IndexedDB
indexedDB?.init()?.catch(error => {
  console.error('Failed to initialize IndexedDB:', error);
});

// Register service worker for PWA functionality
registerServiceWorker();

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);
