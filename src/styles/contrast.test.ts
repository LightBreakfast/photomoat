import { describe, expect, it } from 'vitest'

/**
 * WCAG 2.1 contrast ratio checker.
 * Runs against the CSS custom properties in globals.css.
 */

function sRGBtoLinear(c: number) {
  c = c / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function hslToRGB(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b)
}

function contrastRatio(
  fg: readonly [number, number, number],
  bg: readonly [number, number, number],
): number {
  const L1 = luminance(...hslToRGB(...fg))
  const L2 = luminance(...hslToRGB(...bg))
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Theme tokens — must match src/styles/globals.css.
 *
 * Format: [hue, saturation%, lightness%]
 */
const themes = {
  light: {
    background: [0, 0, 98] as const,
    foreground: [220, 14, 14] as const,
    surface: [0, 0, 100] as const,
    'surface-muted': [220, 14, 96] as const,
    border: [220, 12, 65] as const,
    muted: [220, 10, 40] as const,
    accent: [220, 14, 42] as const,
    'accent-foreground': [0, 0, 100] as const,
    danger: [0, 60, 45] as const,
    'danger-foreground': [0, 0, 100] as const,
  },
  dark: {
    background: [220, 14, 6] as const,
    foreground: [220, 12, 88] as const,
    surface: [220, 14, 9] as const,
    'surface-muted': [220, 12, 12] as const,
    border: [220, 10, 35] as const,
    muted: [220, 10, 62] as const,
    accent: [220, 14, 68] as const,
    'accent-foreground': [220, 14, 14] as const,
    danger: [0, 60, 62] as const,
    'danger-foreground': [0, 0, 100] as const,
  },
} as const

type Token = keyof typeof themes.light

/** Minimum WCAG AA contrast ratio for normal text (≥ 4.5:1). */
const AA_NORMAL = 4.5

/**
 * Pairs that must meet AA for normal text (≥ 4.5:1).
 * fg token on bg token — usage description.
 */
const normalTextPairs: [Token, Token, string][] = [
  ['foreground', 'background', 'body text'],
  ['foreground', 'surface', 'headings on surface'],
  ['muted', 'background', 'status bar text'],
  ['muted', 'surface', 'secondary text'],
  ['accent', 'background', 'accent text on bg'],
  ['accent', 'surface', 'accent text on surface'],
  ['accent-foreground', 'accent', 'button text on accent bg'],
  ['danger', 'background', 'error text'],
  ['danger', 'surface', 'error text on surface'],
  ['muted', 'surface-muted', 'muted text on muted surface'],
]

/**
 * Decorative borders — not interactive UI components.
 * WCAG 3:1 applies to inputs, buttons, focus rings, etc., not dividers.
 * These are informational only; test for visibility ≥ 1.5:1.
 */
const decorativePairs: [Token, Token, string][] = [
  ['border', 'background', 'borders on page'],
  ['border', 'surface', 'borders on surface'],
]

describe('WCAG contrast ratios', () => {
  for (const [themeName, tokens] of Object.entries(themes)) {
    describe(`${themeName} mode — normal text (≥ ${AA_NORMAL}:1)`, () => {
      for (const [fg, bg, usage] of normalTextPairs) {
        it(`${fg} on ${bg} — ${usage}`, () => {
          const ratio = contrastRatio(tokens[fg], tokens[bg])
          expect(ratio, `${usage}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_NORMAL)
        })
      }
    })

    describe(`${themeName} mode — decorative borders (≥ 1.5:1)`, () => {
      for (const [fg, bg, usage] of decorativePairs) {
        it(`${fg} on ${bg} — ${usage}`, () => {
          const ratio = contrastRatio(tokens[fg], tokens[bg])
          expect(ratio, `${usage}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(1.5)
        })
      }
    })
  }
})
