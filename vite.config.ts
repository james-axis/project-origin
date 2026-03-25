import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            // Proxy API requests to backend server
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            // Proxy webhook endpoints
            '/webhooks': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
});
