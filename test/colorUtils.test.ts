import {describe, expect, it} from "vitest";
import {contrastRatio, darken, hexToRgb, isValidHexColor, mixColors, relLuminance, rgbToHex} from "@/lib/colors";

describe("mixColors", () => {
    it("returns #000000 for empty array", () => {
        expect(mixColors([])).toBe("#000000");
    });

    it("returns the only color when array length is 1", () => {
        expect(mixColors(["#ff00aa"])).toBe("#ff00aa");
    });

    it("mixes two colors using the current average logic", () => {
        // Per mixTwoColorsAverage:
        // r = round(rgb1.r + rgb2.r / 2), etc.
        // #000000 + #ffffff => (0 + 255/2)=127.5 => 128 => 0x80
        expect(mixColors(["#000000", "#ffffff"])).toBe("#808080");
    });

    it("returns expected color if 2 identical colors provided", () => {
        expect(mixColors(["#000000", "#000000"])).toBe("#000000");
        expect(mixColors(["#ffffff", "#ffffff"])).toBe("#ffffff");
    });

    it("mixes three colors iteratively", () => {
        expect(mixColors(["#000000", "#ffffff", "#ff0000"])).toBe("#c04040");
    });

    it("returns #000000 if any mix step encounters an invalid hex", () => {
        // mixTwoColorsAverage returns #000000 if parsing fails
        expect(mixColors(["#ffffff", "not-a-color"])).toBe("#000000");
    });

    it("supports 3-digit hex colors", () => {
        // #fff => white, #000 => black => same as above => #808080
        expect(mixColors(["#fff", "#000"])).toBe("#808080");
    });

    it("ignores alpha in 8-digit hex colors", () => {
        // #ff000080 should be treated as #ff0000
        expect(mixColors(["#ff000080", "#000000ff"])).toBe("#800000");
    });

    it("ignores alpha in 4-digit hex colors", () => {
        expect(mixColors(["#f008", "#000f"])).toBe("#800000");
    });
});

describe("hexToRgb", () => {
    it("parses 6-digit hex with leading #", () => {
        expect(hexToRgb("#ff00aa")).toEqual({ r: 255, g: 0, b: 170 });
    });

    it("parses 6-digit hex without #", () => {
        expect(hexToRgb("00ff10")).toEqual({ r: 0, g: 255, b: 16 });
    });

    it("parses 3-digit shorthand hex", () => {
        expect(hexToRgb("#0f8")).toEqual({ r: 0, g: 255, b: 136 });
        expect(hexToRgb("abc")).toEqual({ r: 170, g: 187, b: 204 });
    });

    it("ignores alpha when 8-digit hex is provided", () => {
        expect(hexToRgb("#11223344")).toEqual({ r: 17, g: 34, b: 51 });
        expect(hexToRgb("aabbccdd")).toEqual({ r: 170, g: 187, b: 204 });
    });

    it("ignores alpha when 4-digit hex is provided", () => {
        expect(hexToRgb("#1234")).toEqual({ r: 17, g: 34, b: 51 });
        expect(hexToRgb("abcd")).toEqual({ r: 170, g: 187, b: 204 });
    });

    it("trims whitespace", () => {
        expect(hexToRgb("  #010203  ")).toEqual({ r: 1, g: 2, b: 3 });
    });

    it("returns null for invalid length", () => {
        expect(hexToRgb("#12")).toBeNull();
        expect(hexToRgb("#12345")).toBeNull();
        expect(hexToRgb("#1234567")).toBeNull();
    });

    it("returns null for invalid hex characters", () => {
        expect(hexToRgb("#zzzzzz")).toBeNull();
    });
});

describe("rgbToHex", () => {
    it("converts rgb to 6-digit lowercase hex with leading #", () => {
        expect(rgbToHex(255, 0, 170)).toBe("#ff00aa");
    });

    it("rounds channel values", () => {
        expect(rgbToHex(12.4, 12.5, 12.6)).toBe("#0c0d0d"); // 12, 13, 13
    });

    it("clamps channel values to [0,255]", () => {
        expect(rgbToHex(-10, 0, 300)).toBe("#0000ff");
    });

    it("pads single-digit hex values", () => {
        expect(rgbToHex(1, 2, 3)).toBe("#010203");
    });
});

describe("relLuminance", () => {
    it("returns ~0 for black", () => {
        expect(relLuminance("#000000")).toBeCloseTo(0, 8);
    });

    it("returns ~1 for white", () => {
        expect(relLuminance("#ffffff")).toBeCloseTo(1, 8);
    });

    it("computes known luminance for primary colors (sRGB)", () => {
        // For pure red/green/blue in sRGB:
        // L(red)=0.2126, L(green)=0.7152, L(blue)=0.0722
        expect(relLuminance("#ff0000")).toBeCloseTo(0.2126, 4);
        expect(relLuminance("#00ff00")).toBeCloseTo(0.7152, 4);
        expect(relLuminance("#0000ff")).toBeCloseTo(0.0722, 4);
    });

    it("returns 0 when hex is invalid (because hexToRgb returns null)", () => {
        expect(relLuminance("#12")).toBe(0);
    });
});

describe("contrastRatio", () => {
    it("is ~21 for black vs white", () => {
        expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 6);
    });

    it("is symmetric", () => {
        const a = contrastRatio("#123456", "#abcdef");
        const b = contrastRatio("#abcdef", "#123456");
        expect(a).toBeCloseTo(b, 12);
    });

    it("is 1 when colors are identical", () => {
        expect(contrastRatio("#334455", "#334455")).toBeCloseTo(1, 12);
    });

    it("returns 1 when both are invalid (both luminances => 0)", () => {
        expect(contrastRatio("#1hjf88", "also-bad")).toBeCloseTo(1, 12);
    });
});

describe("darken", () => {
    it("returns same color for factor 0", () => {
        expect(darken("#112233", 0)).toBe("#112233");
    });

    it("returns black for factor 1", () => {
        expect(darken("#112233", 1)).toBe("#000000");
    });

    it("darkens by scaling channels by (1 - factor)", () => {
        // r=16,g=32,b=48; factor=0.5 => 8,16,24 => #081018
        expect(darken("#102030", 0.5)).toBe("#081018");
    });

    it("handles 3-digit hex", () => {
        // #abc => 170,187,204; factor=0.5 => 85,93.5,102 => rounds in rgbToHex => 85,94,102 => #555e66
        expect(darken("#abc", 0.5)).toBe("#555e66");
    });

    it("returns original input when hex is invalid", () => {
        expect(darken("not-a-color", 0.5)).toBe("not-a-color");
    });
});

describe("isValidHexColor", () => {
    it("returns true with valid 6-digit hex", () => {
        expect(isValidHexColor('#fffFff')).toBe(true);
        expect(isValidHexColor('#666666')).toBe(true);
        expect(isValidHexColor('ffffff')).toBe(true);
    });
    it("returns true with valid 3-digit hex", () => {
        expect(isValidHexColor('#fFf')).toBe(true);
        expect(isValidHexColor('#666')).toBe(true);
        expect(isValidHexColor('fff')).toBe(true);
    });
    it("returns false with incorrect length hex", () => {
        expect(isValidHexColor('#fffff')).toBe(false);
        expect(isValidHexColor('#66')).toBe(false);
        expect(isValidHexColor('f')).toBe(false);
    });
    it("returns false with alpha hexes", () => {
        expect(isValidHexColor('#ffffff00')).toBe(false);
        expect(isValidHexColor('#6660')).toBe(false);
    });
    it("returns false with non-hexadecimal characters", () => {
        expect(isValidHexColor('#zzzzzz')).toBe(false);
        expect(isValidHexColor('#12%hu.')).toBe(false);
        expect(isValidHexColor('#9847hf98p')).toBe(false);
        expect(isValidHexColor('#')).toBe(false);
        expect(isValidHexColor('')).toBe(false);
    });
});