import {Genre} from "@/types";
import {SINGLETON_PARENT_GENRE} from "@/constants";

export const DEFAULT_DARK_NODE_COLOR = '#8a80ff';
export const DEFAULT_LIGHT_NODE_COLOR = '#4a4a4a';
export const SINGLETON_PARENT_COLOR = "#c4b5fd"; // violet-300 (arbitrary)
// Curated Tailwind colors
// 300 shades for dark mode (lighter, more visible on dark backgrounds)
export const CLUSTER_COLORS_DARK = [
    "#fca5a5", // red-300
    "#fdba74", // orange-300
    "#fcd34d", // amber-300
    "#fde047", // yellow-300
    "#bef264", // lime-300
    "#86efac", // green-300
    "#6ee7b7", // emerald-300
    "#5eead4", // teal-300
    "#67e8f9", // cyan-300
    "#7dd3fc", // sky-300
    "#93c5fd", // blue-300
    "#a5b4fc", // indigo-300
    "#c4b5fd", // violet-300
    "#d8b4fe", // purple-300
    "#f0abfc", // fuchsia-300
    "#f9a8d4", // pink-300
    "#fda4af", // rose-300
];

// 400 shades for light mode (slightly stronger, better contrast on light backgrounds)
export const CLUSTER_COLORS_LIGHT = [
    "#f87171", // red-400
    "#fb923c", // orange-400
    "#fbbf24", // amber-400
    "#facc15", // yellow-400
    "#a3e635", // lime-400
    "#4ade80", // green-400
    "#34d399", // emerald-400
    "#2dd4bf", // teal-400
    "#22d3ee", // cyan-400
    "#38bdf8", // sky-400
    "#60a5fa", // blue-400
    "#818cf8", // indigo-400
    "#a78bfa", // violet-400
    "#c084fc", // purple-400
    "#e879f9", // fuchsia-400
    "#f472b6", // pink-400
    "#fb7185", // rose-400
];

// Returns cluster color from curated palette based on theme.
// When index exceeds palette size (17), generates variations using golden angle hue rotation.
export const getClusterColor = (index: number, isDark = true): string => {
    const palette = isDark ? CLUSTER_COLORS_DARK : CLUSTER_COLORS_LIGHT;

    if (index < palette.length) {
        return palette[index];
    }

    // Beyond curated palette: generate using golden angle for max hue separation
    const extraIndex = index - palette.length;
    return generateColor(extraIndex, isDark);
};

// Generates colors using golden angle (137.5°) for maximum hue separation
const generateColor = (index: number, isDark: boolean): string => {
    const hue = (index * 137.5) % 360;
    const saturation = 75;
    const lightness = isDark ? 70 : 55; // Lighter for dark mode, darker for light mode
    return hslToHex(hue, saturation, lightness);
};

const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

export const assignRootGenreColors = (
    rootIDs: string[],
    isDark = true,
    rootArtistCounts?: Map<string, number>
) => {
    const colorMap = new Map<string, string>();
    colorMap.set(SINGLETON_PARENT_GENRE.id, SINGLETON_PARENT_COLOR);
    if (!rootIDs.length) return colorMap;

    // Sort by artist count (descending) if provided, otherwise alphabetically
    const sortedRoots = [...rootIDs].sort((a, b) => {
        if (rootArtistCounts) {
            const countA = rootArtistCounts.get(a) ?? 0;
            const countB = rootArtistCounts.get(b) ?? 0;
            if (countA !== countB) return countB - countA; // descending
        }
        return a.localeCompare(b); // fallback to alphabetical for ties
    });

    sortedRoots.forEach((n, i) => {
        colorMap.set(n, getClusterColor(i, isDark));
    });
    return colorMap;
}

export const buildGenreColorMap = (genres: Genre[], rootIDs: string[], isDark = true) => {
    // Calculate total artist count per root genre
    const rootArtistCounts = new Map<string, number>();
    genres.forEach(genre => {
        if (genre.rootGenres?.length) {
            genre.rootGenres.forEach(rootId => {
                rootArtistCounts.set(rootId, (rootArtistCounts.get(rootId) ?? 0) + genre.artistCount);
            });
        }
        // Root genres themselves contribute their own artist count
        if (rootIDs.includes(genre.id)) {
            rootArtistCounts.set(genre.id, (rootArtistCounts.get(genre.id) ?? 0) + genre.artistCount);
        }
    });

    const rootColorMap = assignRootGenreColors(rootIDs, isDark, rootArtistCounts);
    const colorMap = new Map<string, string>();
    genres.forEach(genre => {
        switch (genre.rootGenres.length) {
            case 0:
                colorMap.set(genre.id, SINGLETON_PARENT_COLOR);
                break;
            case 1:
                const color = rootColorMap.get(genre.rootGenres[0]);
                if (color) colorMap.set(genre.id, color);
                else colorMap.set(genre.id, SINGLETON_PARENT_COLOR);
                break;
            default:
                if (!genre.rootGenres || genre.rootGenres.length < 2) {
                    colorMap.set(genre.id, SINGLETON_PARENT_COLOR);
                } else {
                    const colors: string[] = [];
                    genre.rootGenres.forEach((g) => {
                        const curRoot = rootColorMap.get(g);
                        if (curRoot) colors.push(curRoot);
                    });
                    colorMap.set(genre.id, mixColors(colors));
                }
        }
    });
    return colorMap;
}

// --- Color utilities ---
export const isValidHexColor = (hexColor: string) => {
    let regex = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i
    return regex.test(hexColor);
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    let h = hex.trim();
    if (h.startsWith('#')) h = h.slice(1);
    if (h.length === 8) h = h.slice(0, 6); // ignore alpha (#RRGGBBAA)
    if (h.length === 4) h = h.slice(0, 3); // ignore alpha (#RGBA)
    if (!isValidHexColor(h)) return null;
    if (h.length === 3) {
        const r = parseInt(h[0] + h[0], 16);
        const g = parseInt(h[1] + h[1], 16);
        const b = parseInt(h[2] + h[2], 16);
        return {r, g, b};
    }
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return {r, g, b};
};

export const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const cr = clamp(r), cg = clamp(g), cb = clamp(b);
    return `#${toHex(cr)}${toHex(cg)}${toHex(cb)}`;
};

export const relLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const srgb = [rgb.r, rgb.g, rgb.b].map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

export const contrastRatio = (hex1: string, hex2: string): number => {
    const L1 = relLuminance(hex1);
    const L2 = relLuminance(hex2);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
};

// Darken a color by blending with black by a factor in [0,1]
export const darken = (hex: string, factor: number): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(rgb.r * (1 - factor), rgb.g * (1 - factor), rgb.b * (1 - factor));
};

// Ensure color has at least minRatio contrast on a light background by darkening as needed
export const ensureContrastOnLight = (hex: string, lightBgHex = '#ffffff', minRatio = 4.5): string => {
    if (!hex) return hex;
    let c = hex;
    if (contrastRatio(c, lightBgHex) >= minRatio) return c;
    // Try progressively darkening up to 90%
    for (let f = 0.1; f <= 0.9; f += 0.05) {
        const candidate = darken(hex, f);
        if (contrastRatio(candidate, lightBgHex) >= minRatio) return candidate;
    }
    return '#111111'; // ultimate fallback to satisfy contrast on white
};

export const mixColors = (colors: string[]) => {
    if (!colors.length) return '#000000';
    if (colors.length === 1) return colors[0];
    let color = mixTwoColorsAverage(colors[0], colors[1]);
    if (colors.length === 2) return color;
    for (let i = 2; i < colors.length; i += 1) {
        color = mixTwoColorsAverage(color, colors[i]);
    }
    return color;
}

const mixTwoColorsAverage = (color1: string, color2: string) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (rgb1 && rgb2) {
        const mixRGB = {
            r: Math.round((rgb1.r + rgb2.r) / 2),
            g: Math.round((rgb1.g + rgb2.g) / 2),
            b: Math.round((rgb1.b + rgb2.b) / 2),
        }
        return rgbToHex(mixRGB.r, mixRGB.g, mixRGB.b);
    }
    return '#000000';
}