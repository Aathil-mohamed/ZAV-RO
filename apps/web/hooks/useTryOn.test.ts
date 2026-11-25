import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.fn();
vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

// Lightweight React hook harness for Node Vitest environment
const states: unknown[] = [];
const refs: Array<{ current: unknown }> = [];
let stateIdx = 0;
let refIdx = 0;

vi.mock("react", () => ({
  useState: (init: unknown) => {
    const idx = stateIdx++;
    if (!(idx in states)) states[idx] = init;
    return [states[idx], (v: unknown) => { states[idx] = v; }];
  },
  useRef: (init: unknown) => {
    const idx = refIdx++;
    if (!(idx in refs)) refs[idx] = { current: init };
    return refs[idx];
  },
}));

import { useTryOn } from "./useTryOn";

function readHook() {
  stateIdx = 0;
  refIdx = 0;
  return useTryOn();
}

describe("useTryOn hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apiMock.mockReset();
    states.length = 0;
    refs.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reaches done when polling returns status done", async () => {
    apiMock
      .mockResolvedValueOnce({ id: 42 }) // POST /api/tryon
      .mockResolvedValueOnce({ status: "processing", resultUrl: null, error: null })
      .mockResolvedValueOnce({ status: "done", resultUrl: "https://signed/out.png", error: null });

    const hook = readHook();
    const fakeFile = new File(["bytes"], "me.jpg", { type: "image/jpeg" });
    await hook.start(fakeFile, "http://localhost:9000/public-assets/shirt.png", "upper");

    expect(readHook().status).toBe("processing");

    await vi.advanceTimersByTimeAsync(1500);
    const doneState = readHook();
    expect(doneState.status).toBe("done");
    expect(doneState.resultUrl).toBe("https://signed/out.png");
  });

  it("reaches failed when polling returns status failed", async () => {
    apiMock
      .mockResolvedValueOnce({ id: 99 })
      .mockResolvedValueOnce({ status: "failed", resultUrl: null, error: "Bad photo" });

    const hook = readHook();
    const fakeFile = new File(["bytes"], "me.jpg", { type: "image/jpeg" });
    await hook.start(fakeFile, "http://localhost:9000/public-assets/shirt.png", "upper");

    const failedState = readHook();
    expect(failedState.status).toBe("failed");
    expect(failedState.error).toBe("Bad photo");
  });
});
