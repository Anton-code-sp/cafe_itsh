import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // bcrypt real (seedUsers/userService) se acerca al default de 5s en
    // máquinas lentas; 15s deja margen sin ocultar cuelgues reales.
    testTimeout: 15000,
  },
});
