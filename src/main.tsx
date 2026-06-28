import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import { Databuddy } from "@databuddy/sdk/react";

import "./styles/index.css";
import App from "./App";
import { mdxComponents } from "./lib/markdown/components";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <MDXProvider components={mdxComponents}>
        <App />
        <Databuddy
          clientId={import.meta.env.VITE_DATABUDDY_CLIENT_ID}
          trackWebVitals
          trackErrors
          trackOutgoingLinks
        />
      </MDXProvider>
    </BrowserRouter>
  </StrictMode>,
);
