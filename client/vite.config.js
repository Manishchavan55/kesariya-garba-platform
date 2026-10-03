import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const adminLayoutFix = {
  name: "kesariya-admin-layout-fix",
  transformIndexHtml(html) {
    return {
      html,
      tags: [
        {
          tag: "style",
          attrs: { id: "kesariya-admin-layout-fix" },
          injectTo: "head",
          children: `
            /* Keep the admin overview content aligned with the stats row. */
            .admin-panel-wide.admin-panel-wide .admin-list {
              margin-top: 0 !important;
            }
            .admin-panel-wide.admin-panel-wide .admin-list > * {
              min-width: 0;
            }
            @media (max-width: 760px) {
              .admin-panel-wide.admin-panel-wide .admin-list {
                margin-top: 0 !important;
              }
            }
          `
        }
      ]
    };
  }
};

export default defineConfig({
  plugins: [react(), adminLayoutFix],
  server: {
    port: 5173
  }
});
