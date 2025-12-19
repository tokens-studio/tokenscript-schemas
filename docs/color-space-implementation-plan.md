# TokenScript Color Space Implementation Plan

## Executive Summary

This plan outlines the complete implementation of ColorJS's color space conversion graph in the TokenScript schema registry. The goal is to create type schemas and conversion algorithms for all major color spaces, enabling the TokenScript interpreter to perform accurate, standards-compliant color transformations.

**Key Principle:** Each conversion is defined **once** in the **target** schema as a `from-{source}` conversion. The system will find the path automatically.

---

## 1. Conversion Graph Architecture

ColorJS uses a **hub-and-spoke architecture** with XYZ-D65 as the primary connection hub:

```
                                    ┌─────────┐
                                    │   Hex   │
                                    │  (RGB)  │
                                    └────┬────┘
                                         │
    ┌─────┐    ┌─────┐    ┌──────────────▼──────────────┐    ┌─────┐    ┌─────┐
    │ HSL │◄───│     │◄───│          sRGB               │───►│     │───►│ HWB │
    └─────┘    │ HSV │    │       (0-1 range)           │    │ HSV │    └─────┘
               └─────┘    └──────────────┬──────────────┘    └─────┘
                                         │ gamma
                              ┌──────────▼──────────┐
                              │    Linear sRGB      │
                              └──────────┬──────────┘
                                         │ matrix
    ┌────────────────────────────────────┼────────────────────────────────────┐
    │                                    │                                    │
    ▼                                    ▼                                    ▼
┌──────────┐                      ┌─────────────┐                      ┌────────────┐
│  Linear  │                      │   XYZ-D65   │                      │  Linear    │
│    P3    │                      │    (HUB)    │                      │  Rec.2020  │
└────┬─────┘                      └──────┬──────┘                      └─────┬──────┘
     │ gamma                             │                                   │ gamma
┌────▼─────┐       ┌─────────────────────┼─────────────────────┐      ┌─────▼──────┐
│ Display  │       │                     │                     │      │  Rec.2020  │
│    P3    │       ▼                     ▼                     ▼      └────────────┘
└──────────┘  ┌──────────┐         ┌──────────┐          ┌──────────┐
              │ XYZ-D50  │         │  OKLab   │          │ JzAzBz   │
              │(Bradford)│         └────┬─────┘          └────┬─────┘
              └────┬─────┘              │                     │
                   │                    ▼                     ▼
                   ▼               ┌──────────┐          ┌──────────┐
              ┌──────────┐         │  OKLCH   │          │  JzCzHz  │
              │   Lab    │         │  (polar) │          │  (polar) │
              └────┬─────┘         └──────────┘          └──────────┘
                   │
                   ▼
              ┌──────────┐
              │   LCH    │
              │  (polar) │
              └──────────┘
```

---

## 2. Color Types to Implement

### Tier 1: Core Types (Essential - Implement First)
| Type | Properties | Range | Slug |
|------|-----------|-------|------|
| **Hex** ✅ | `value: string` | #000-#fff | `hex-color` |
| **RGB** ✅ | `r, g, b: number` | 0-255 | `rgb-color` |
| **sRGB** | `r, g, b: number` | 0-1 | `srgb-color` |
| **Linear-sRGB** | `r, g, b: number` | 0-1 | `srgb-linear-color` |
| **XYZ-D65** | `x, y, z: number` | unbounded | `xyz-d65-color` |

### Tier 2: Perceptual Spaces (High Priority)
| Type | Properties | Range | Slug |
|------|-----------|-------|------|
| **OKLab** | `l, a, b: number` | L:0-1, a/b:±0.5 | `oklab-color` |
| **OKLCH** | `l, c, h: number` | L:0-1, C:0-0.4, H:0-360 | `oklch-color` |
| **Lab** | `l, a, b: number` | L:0-100, a/b:±125 | `lab-color` |
| **LCH** | `l, c, h: number` | L:0-100, C:0-150, H:0-360 | `lch-color` |

### Tier 3: Display Spaces (Wide Gamut)
| Type | Properties | Range | Slug |
|------|-----------|-------|------|
| **Display-P3** | `r, g, b: number` | 0-1 | `display-p3-color` |
| **Linear-P3** | `r, g, b: number` | 0-1 | `linear-p3-color` |
| **Rec.2020** | `r, g, b: number` | 0-1 | `rec2020-color` |
| **Linear-Rec.2020** | `r, g, b: number` | 0-1 | `linear-rec2020-color` |

### Tier 4: Legacy/Specialized Spaces
| Type | Properties | Range | Slug |
|------|-----------|-------|------|
| **HSL** | `h, s, l: number` | H:0-360, S/L:0-1 | `hsl-color` |
| **HSV** | `h, s, v: number` | H:0-360, S/V:0-1 | `hsv-color` |
| **HWB** | `h, w, b: number` | H:0-360, W/B:0-1 | `hwb-color` |
| **XYZ-D50** | `x, y, z: number` | unbounded | `xyz-d50-color` |
| **JzAzBz** | `jz, az, bz: number` | unbounded | `jzazbz-color` |
| **JzCzHz** | `jz, cz, hz: number` | unbounded | `jzczhz-color` |

---

## 3. Conversion Scripts (One-Way Only)

**Important:** Each conversion is defined ONCE in the TARGET schema as `from-{source}.tokenscript`. The graph pathfinder will find the reverse path automatically.

### Phase 1: Core Pipeline

| Target Schema | Conversion Script | Algorithm |
|---------------|-------------------|-----------|
| `rgb-color` | `from-hex.tokenscript` ✅ | Parse hex string |
| `srgb-color` | `from-rgb.tokenscript` | Normalize 255 → 0-1 |
| `srgb-linear-color` | `from-srgb.tokenscript` | Inverse gamma (IEC 61966) |
| `xyz-d65-color` | `from-linear-srgb.tokenscript` | 3×3 matrix multiply |

### Phase 2: Perceptual Spaces

| Target Schema | Conversion Script | Algorithm |
|---------------|-------------------|-----------|
| `oklab-color` | `from-xyz-d65.tokenscript` | Ottosson M1+M2 matrices |
| `oklch-color` | `from-oklab.tokenscript` | Cartesian → Polar |
| `xyz-d50-color` | `from-xyz-d65.tokenscript` | Bradford adaptation |
| `lab-color` | `from-xyz-d50.tokenscript` | CIE Lab formula |
| `lch-color` | `from-lab.tokenscript` | Cartesian → Polar |

### Phase 3: Legacy Spaces

| Target Schema | Conversion Script | Algorithm |
|---------------|-------------------|-----------|
| `hsl-color` | `from-srgb.tokenscript` | Standard RGB→HSL |
| `hsv-color` | `from-srgb.tokenscript` | Standard RGB→HSV |
| `hwb-color` | `from-srgb.tokenscript` | Via HSV |

### Phase 4: Wide Gamut

| Target Schema | Conversion Script | Algorithm |
|---------------|-------------------|-----------|
| `linear-p3-color` | `from-xyz-d65.tokenscript` | 3×3 matrix |
| `display-p3-color` | `from-linear-p3.tokenscript` | Apply gamma |
| `linear-rec2020-color` | `from-xyz-d65.tokenscript` | 3×3 matrix |
| `rec2020-color` | `from-linear-rec2020.tokenscript` | Apply gamma |

### Phase 5: HDR Spaces

| Target Schema | Conversion Script | Algorithm |
|---------------|-------------------|-----------|
| `jzazbz-color` | `from-xyz-d65.tokenscript` | Safdar et al. |
| `jzczhz-color` | `from-jzazbz.tokenscript` | Cartesian → Polar |

---

## 4. File Structure

Each color type has ONE directory with:
- `schema.json` - Type definition
- `initializer.tokenscript` - How to create the color
- `from-{source}.tokenscript` - Conversion from source (ONE per direct connection)
- `unit.test.ts` - Tests

```
src/schemas/types/
├── hex-color/              ✅ EXISTS
│   ├── schema.json
│   ├── initializer.tokenscript
│   └── unit.test.ts
├── rgb-color/              ✅ EXISTS (needs cleanup)
│   ├── schema.json
│   ├── initializer.tokenscript
│   ├── from-hex.tokenscript     ✅
│   └── unit.test.ts
├── srgb-color/             🆕 NEW
│   ├── schema.json
│   ├── initializer.tokenscript
│   ├── from-rgb.tokenscript     (normalize)
│   ├── from-hsl.tokenscript     (reverse conversion)
│   ├── from-hsv.tokenscript
│   ├── from-hwb.tokenscript
│   ├── from-linear-srgb.tokenscript  (apply gamma)
│   └── unit.test.ts
├── srgb-linear-color/      🆕 NEW
│   ├── schema.json
│   ├── initializer.tokenscript
│   ├── from-srgb.tokenscript    (remove gamma)
│   ├── from-xyz-d65.tokenscript (inverse matrix)
│   └── unit.test.ts
├── xyz-d65-color/          🆕 NEW (THE HUB)
│   ├── schema.json
│   ├── initializer.tokenscript
│   ├── from-linear-srgb.tokenscript
│   ├── from-xyz-d50.tokenscript     (Bradford)
│   ├── from-oklab.tokenscript       (inverse M1+M2)
│   ├── from-linear-p3.tokenscript   (inverse matrix)
│   ├── from-linear-rec2020.tokenscript
│   ├── from-jzazbz.tokenscript
│   └── unit.test.ts
...
```

---

## 5. Quality Assurance

### ColorJS Parity Testing

We have a comprehensive parity testing framework:

```bash
# Show the conversion graph
npx tsx scripts/compare-colorjs.ts graph

# Generate ColorJS reference values for any color
npx tsx scripts/compare-colorjs.ts reference '#ff5733'
npx tsx scripts/compare-colorjs.ts reference 'oklch(70% 0.15 30)'

# Test round-trip precision
npx tsx scripts/compare-colorjs.ts roundtrip '#ff5733'

# Run parity tests
npm test -- tests/parity/colorjs-parity.test.ts
```

### Test Categories per Color Type

1. **Schema validation** - JSON structure correct
2. **Initialization** - Color creation works
3. **Conversion accuracy** - Matches ColorJS within tolerance
4. **Round-trip precision** - A → B → ... → A preserves values
5. **Edge cases** - Black, white, primaries, grays, near-gamut

### Tolerance Thresholds

```typescript
// Default tolerance
const DEFAULT_TOLERANCE = 1e-5;

// Space-specific tolerances
const SPACE_TOLERANCES = {
  hsl: 1e-3,    // Hue angles near 0/360
  hsv: 1e-3,
  oklch: 1e-3,
  lch: 1e-3,
  "xyz-d50": 1e-4,  // Bradford adaptation
  jzazbz: 1e-4,    // Complex calculations
};
```

---

## 6. Implementation Order

### Week 1-2: Core Pipeline
1. ✅ `hex-color` (exists)
2. ✅ `rgb-color` (exists, clean up to remove `to-hex`)
3. 🆕 `srgb-color`
4. 🆕 `srgb-linear-color`
5. 🆕 `xyz-d65-color`

### Week 3-4: Perceptual Spaces
6. 🆕 `oklab-color`
7. 🆕 `oklch-color`
8. 🆕 `xyz-d50-color`
9. 🆕 `lab-color`
10. 🆕 `lch-color`

### Week 5: Legacy Spaces
11. 🆕 `hsl-color`
12. 🆕 `hsv-color`
13. 🆕 `hwb-color`

### Week 6: Wide Gamut
14. 🆕 `linear-p3-color`
15. 🆕 `display-p3-color`
16. 🆕 `linear-rec2020-color`
17. 🆕 `rec2020-color`

### Week 7: HDR Spaces
18. 🆕 `jzazbz-color`
19. 🆕 `jzczhz-color`

---

## 7. Technical Notes

### Required TokenScript Built-ins

| Function | Usage | Status |
|----------|-------|--------|
| `pow(base, exp)` | Gamma calculations | ✅ |
| `sqrt(x)` | Chroma calculation | ✅ |
| `abs(x)` | Absolute value | ❓ Verify |
| `sin(x)`, `cos(x)` | Polar conversions | ❓ Verify |
| `atan2(y, x)` | Hue angle | ❓ Verify |
| `min(a, b)`, `max(a, b)` | Clamping | ✅ |
| `mod(a, b)` | Hue normalization | ❓ Verify |

### Key Matrix Values

**Linear sRGB ↔ XYZ-D65:**
```
M = [0.4123908  0.3575843  0.1804808]
    [0.2126390  0.7151687  0.0721923]
    [0.0193308  0.1191948  0.9505322]
```

**Bradford D65 → D50:**
```
M = [ 1.0479298  0.0229468 -0.0501922]
    [ 0.0296278  0.9904344 -0.0170738]
    [-0.0092430  0.0150551  0.7518742]
```

---

## 8. Running the Comparison Tool

```bash
# Install ColorJS (already done)
npm install colorjs.io --save-dev

# Show conversion graph
npx tsx scripts/compare-colorjs.ts graph

# Get reference values for any color
npx tsx scripts/compare-colorjs.ts reference '#ff5733'

# Test round-trip precision
npx tsx scripts/compare-colorjs.ts roundtrip 'oklch(70% 0.15 30)'

# Run all parity tests
npm test -- tests/parity/
```

---

## 9. Next Steps

1. **Verify TokenScript built-ins** - Test `abs`, `sin`, `cos`, `atan2`, `mod`
2. **Clean up rgb-color** - Remove `to-hex.tokenscript` (redundant)
3. **Implement srgb-color** - First new schema
4. **Implement srgb-linear-color** - Gamma conversion
5. **Implement xyz-d65-color** - The hub
6. **Add parity tests** - As each schema is implemented

---

## References

- [ColorJS Documentation](https://colorjs.io/docs/)
- [ColorJS Source Code](https://github.com/leaverou/color.js)
- [CSS Color 4 Specification](https://www.w3.org/TR/css-color-4/)
- [OKLab Color Space](https://bottosson.github.io/posts/oklab/)
- [Bradford Chromatic Adaptation](https://en.wikipedia.org/wiki/Bradford_chromatic_adaptation)

