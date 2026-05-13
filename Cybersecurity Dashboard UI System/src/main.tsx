/**
 * Application Entry Point
 * =======================
 * Bootstraps the React application by mounting the root component into
 * the DOM element with id="root". Also initializes:
 * - Global CSS styles (Tailwind + VigiCore theme)
 * - i18next internationalization configuration
 */

import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./i18n"; // Import i18n config

createRoot(document.getElementById("root")!).render(<App />);
