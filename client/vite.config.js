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
            /* Admin overview: keep the tabs, stats and booking list in normal document flow. */
            .admin-panel-wide .admin-tabs {
              display: flex !important;
              position: relative !important;
              z-index: 5 !important;
              visibility: visible !important;
              opacity: 1 !important;
              margin: 0 0 20px !important;
            }
            .admin-panel-wide .admin-stats {
              position: relative !important;
              z-index: 2 !important;
              margin: 0 0 18px !important;
            }
            .admin-panel-wide .admin-list {
              position: relative !important;
              z-index: 1 !important;
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
              min-height: 0 !important;
              height: auto !important;
              max-height: 300px !important;
              overflow-y: auto !important;
              box-sizing: border-box !important;
            }
            .admin-panel-wide .admin-list > div {
              position: relative !important;
              display: grid !important;
              min-height: 0 !important;
              height: auto !important;
              margin: 0 !important;
              padding: 17px 20px !important;
              box-sizing: border-box !important;
            }
            .admin-panel-wide .admin-list > p {
              margin: 0 !important;
              padding: 22px 20px !important;
              color: #bba7c1 !important;
            }
            @media (max-width: 900px) {
              .admin-panel-wide .admin-list > div {
                min-height: 0 !important;
              }
            }
            @media (max-width: 760px) {
              .admin-panel-wide .admin-tabs {
                display: flex !important;
                overflow-x: auto !important;
                flex-wrap: nowrap !important;
              }
              .admin-panel-wide .admin-list {
                max-height: 260px !important;
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
