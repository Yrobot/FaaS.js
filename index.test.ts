import { expect, test } from "bun:test";

test("GET /", async () => {
  const text = await fetch(`http://localhost:3000`).then((res) => res.text());
  expect(text.length).toBeGreaterThan(0);
});

test("GET /api/health", async () => {
  const status = await fetch(`http://localhost:3000/api/health`)
    .then((res) => res.json())
    .then((res) => res.status as string);
  expect(status).toBe("healthy");
});
