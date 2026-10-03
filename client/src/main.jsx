import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./navrang.css";
import "./reference-motion.css";
import "./booking.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
