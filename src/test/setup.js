import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

// Never hit the network during tests (e.g. the Formspree notify call).
global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
