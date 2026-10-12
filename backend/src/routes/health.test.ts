import { afterAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createApp } from "../app.js";

let server: Server;

describe("GET /api/health", () => {
  it("responde 200 con status ok", async () => {
    const app = createApp();

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });

    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("No se pudo obtener el puerto del servidor de prueba");
    }

    const res = await fetch(`http://localhost:${address.port}/api/health`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  afterAll(() => {
    server?.close();
  });
});
