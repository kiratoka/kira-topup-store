import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    env: {
      MIDTRANS_SERVER_KEY: "test-server-key",
      MIDTRANS_IS_PRODUCTION: "false",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      REDIS_URL: "redis://localhost:6379",
      NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: "test-client-key",
      NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
      NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION: "false",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
