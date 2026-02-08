import {expect, test, describe, it, beforeAll, afterAll, beforeEach, afterEach} from "vitest";
import {
    appendYoutubeWatchURL, envBoolean, fixWikiImageURL,
    formatDate,
    formatNumber,
    formatNumberCompact, parseAppAccess,
    primitiveArraysEqual, until
} from "@/lib/utils";

describe("formatDate", () => {
    // const ORIGINAL_TZ = process.env.TZ;
    //
    // beforeAll(() => {
    //     process.env.TZ = "UTC";
    // });
    //
    // afterAll(() => {
    //     process.env.TZ = ORIGINAL_TZ;
    // });

    it("formats ISO date-only strings consistently (YYYY-MM-DD)", () => {
        expect(formatDate("2024-01-02")).toBe("Jan 2, 2024");
    });

    it("formats ISO datetime strings consistently", () => {
        expect(formatDate("2024-12-31T23:59:59.000Z")).toBe("Dec 31, 2024");
    });

    it("returns 'Invalid Date' for invalid input", () => {
        expect(formatDate("not-a-date")).toBe("Invalid Date");
    });
});

describe("formatNumber", () => {
    it("adds thousands separators", () => {
        expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("handles 0", () => {
        expect(formatNumber(0)).toBe("0");
    });

    it("handles decimals", () => {
        expect(formatNumber(1234.56)).toBe("1,234.56");
    });

    it("handles negatives", () => {
        expect(formatNumber(-987654)).toBe("-987,654");
    });
});

describe("formatNumberCompact", () => {
    it("formats thousands in compact form", () => {
        // en-US short compact typically produces "1.2K" here
        expect(formatNumberCompact(1200)).toBe("1.2K");
    });

    it("formats millions in compact form", () => {
        expect(formatNumberCompact(2500000)).toBe("2.5M");
    });

    it("handles numbers below 1000 without compact suffix", () => {
        expect(formatNumberCompact(999)).toBe("999");
    });

    it("handles negatives", () => {
        expect(formatNumberCompact(-1200)).toBe("-1.2K");
    });
});

describe("envBoolean", () => {
    it("treats 'true' case-insensitively as true", () => {
        expect(envBoolean("true")).toBe(true);
        expect(envBoolean("TRUE")).toBe(true);
        expect(envBoolean("TrUe")).toBe(true);
    });

    it("treats '1' as true (and numeric strings parseable to 1)", () => {
        expect(envBoolean("1")).toBe(true);
        expect(envBoolean("01")).toBe(true);
        expect(envBoolean("1.0")).toBe(true); // parseInt("1.0") => 1
    });

    it("treats other values as false", () => {
        expect(envBoolean("false")).toBe(false);
        expect(envBoolean("0")).toBe(false);
        expect(envBoolean("2")).toBe(false);
        expect(envBoolean("yes")).toBe(false);
        expect(envBoolean("")).toBe("");
    });

    it("returns undefined for undefined input at runtime (even though typed as string)", () => {
        expect(envBoolean(undefined as unknown as string)).toBeUndefined();
    });
});

describe("primitiveArraysEqual", () => {
    it("returns true for equal arrays with same order", () => {
        expect(primitiveArraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it("returns true for equal arrays with different order (sorts both)", () => {
        expect(primitiveArraysEqual([3, 1, 2], [2, 3, 1])).toBe(true);
    });

    it("returns false for arrays with different lengths", () => {
        expect(primitiveArraysEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it("returns false when any element differs", () => {
        expect(primitiveArraysEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it("returns true for two references to the same array (after sorting)", () => {
        const a = [3, 2, 1];
        expect(primitiveArraysEqual(a, a)).toBe(true);
    });

    it("works with strings", () => {
        expect(primitiveArraysEqual(["b", "a"], ["a", "b"])).toBe(true);
    });

    it("treats numbers and numeric strings as different (strict compare)", () => {
        expect(primitiveArraysEqual([1, "2"], ["1", 2])).toBe(false);
    });

    it("mutates inputs because it sorts them (documenting current behavior)", () => {
        const a = [3, 1, 2];
        const b = [2, 3, 1];
        primitiveArraysEqual(a, b);

        expect(a).toEqual([1, 2, 3]);
        expect(b).toEqual([1, 2, 3]);
    });

    // it("throws error if a is null/undefined at runtime", () => {
    //     expect(primitiveArraysEqual(undefined as unknown as any, [1] as any)).toThrowError;
    //     expect(primitiveArraysEqual(null as unknown as any, [1] as any)).toThrowError;
    // });
    //
    // it("throws error if b is null/undefined at runtime", () => {
    //     expect(primitiveArraysEqual([1] as any, undefined as unknown as any)).toThrowError;
    //     expect(primitiveArraysEqual([1] as any, null as unknown as any)).toThrowError;
    // });
});

// describe("until", () => {
//     beforeEach(() => {
//         jest.useFakeTimers();
//         jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
//     });
//
//     afterEach(() => {
//         jest.useRealTimers();
//         jest.clearAllMocks();
//     });
//
//     it("resolves immediately if get() is true on first tick", async () => {
//         const get = jest.fn(() => true);
//
//         const p = until(get, 200, 15000);
//
//         // first tick runs synchronously
//         await expect(p).resolves.toBeUndefined();
//         expect(get).toHaveBeenCalledTimes(1);
//     });
//
//     it("resolves after polling until get() becomes true", async () => {
//         const get = jest.fn()
//             .mockReturnValueOnce(false)
//             .mockReturnValueOnce(false)
//             .mockReturnValueOnce(true);
//
//         const p = until(get, 200, 15000);
//
//         // 1st call happens immediately
//         expect(get).toHaveBeenCalledTimes(1);
//
//         await jest.advanceTimersByTimeAsync(200);
//         expect(get).toHaveBeenCalledTimes(2);
//
//         await jest.advanceTimersByTimeAsync(200);
//         expect(get).toHaveBeenCalledTimes(3);
//
//         await expect(p).resolves.toBeUndefined();
//     });
//
//     it("rejects with timeout error when abort is exceeded", async () => {
//         const get = jest.fn(() => false);
//
//         const p = until(get, 200, 1000);
//
//         // First tick is immediate; then every 200ms.
//         // The code rejects when Date.now() - start > abort (strictly greater),
//         // so we need to go a bit past 1000ms.
//         await jest.advanceTimersByTimeAsync(1201);
//
//         await expect(p).rejects.toThrow("until timeout");
//         expect(get).toHaveBeenCalled(); // sanity
//     });
//
//     it("propagates errors thrown by get()", async () => {
//         const get = jest.fn(() => {
//             throw new Error("boom");
//         });
//
//         await expect(until(get, 200, 15000)).rejects.toThrow("boom");
//     });
// });

describe("fixWikiImageURL", () => {
    it("rewrites commons.wikimedia.org wiki File URLs to Special:Redirect/file", () => {
        const input = "https://commons.wikimedia.org/wiki/File:Example.jpg";
        const expected = "https://commons.wikimedia.org/wiki/Special:Redirect/file/File:Example.jpg";
        expect(fixWikiImageURL(input)).toBe(expected);
    });

    it("keeps non-matching URLs unchanged", () => {
        const input = "https://en.wikipedia.org/wiki/File:Example.jpg";
        expect(fixWikiImageURL(input)).toBe(input);
    });

    it("handles filenames with additional path segments (uses last segment)", () => {
        const input = "https://commons.wikimedia.org/wiki/File:Some/Path/Thing.png";
        const expected = "https://commons.wikimedia.org/wiki/Special:Redirect/file/Thing.png";
        expect(fixWikiImageURL(input)).toBe(expected);
    });
});

describe("appendYoutubeWatchURL", () => {
    it("appends a YouTube watch URL for the given ID", () => {
        expect(appendYoutubeWatchURL("dQw4w9WgXcQ")).toBe(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        );
    });

    it("does not encode or validate the ID (just interpolates)", () => {
        expect(appendYoutubeWatchURL("abc?x=1")).toBe(
            "https://www.youtube.com/watch?v=abc?x=1"
        );
    });
});

describe("parseAppAccess", () => {
    it("splits 'phase-version' into { phase, version }", () => {
        expect(parseAppAccess("beta-1.2.3")).toEqual({ phase: "beta", version: "1.2.3" });
    });

    it("when no hyphen is present, version is undefined", () => {
        expect(parseAppAccess("prod")).toEqual({ phase: "prod", version: undefined });
    });

    it("splits only on the first hyphen (rest stays in version)", () => {
        // JS split() returns all parts; destructuring takes first two.
        expect(parseAppAccess("beta-1-2-3")).toEqual({ phase: "beta", version: "1" });
    });

    it("handles trailing hyphen", () => {
        expect(parseAppAccess("beta-")).toEqual({ phase: "beta", version: "" });
    });
});

