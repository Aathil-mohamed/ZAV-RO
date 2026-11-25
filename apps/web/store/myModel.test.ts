import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.fn();
vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

import { useMyModel } from "./myModel";

describe("useMyModel store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apiMock.mockReset();
    useMyModel.setState({
      on: false,
      hasPhoto: false,
      expiresAt: null,
      remaining: null,
      results: {},
      pending: new Set(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("want() caps requests to at most 3 variants and stops polling when nothing is pending", async () => {
    apiMock
      .mockResolvedValueOnce({
        remaining: 17,
        results: [
          { variantId: 1, status: "queued", url: null },
          { variantId: 2, status: "processing", url: null },
          { variantId: 3, status: "done", url: "https://signed/3.png" },
        ],
      })
      .mockResolvedValueOnce([
        { variantId: 1, status: "done", url: "https://signed/1.png" },
        { variantId: 2, status: "done", url: "https://signed/2.png" },
      ]);

    await useMyModel.getState().want([1, 2, 3, 4, 5]);

    expect(apiMock).toHaveBeenCalledTimes(1);
    const [, postInit] = apiMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(postInit.body as string)).toEqual({ variant_ids: [1, 2, 3] });

    // Advance 1500ms -> first poll resolves 1 & 2 to done
    await vi.advanceTimersByTimeAsync(1500);
    expect(apiMock).toHaveBeenCalledTimes(2);
    expect(useMyModel.getState().results[1]?.status).toBe("done");
    expect(useMyModel.getState().results[2]?.status).toBe("done");

    // Advance another 5000ms -> no open items, polling stopped
    await vi.advanceTimersByTimeAsync(5000);
    expect(apiMock).toHaveBeenCalledTimes(2);
    expect(useMyModel.getState().pending.size).toBe(0);
  });
});
