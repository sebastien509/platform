/**
 * Deterministic hue from a string seed.
 *
 * Same seed → same hue.
 * No database field or persisted visual identity required.
 *
 * Uses a curated cool palette to keep idea and venture
 * identity colors visually cohesive across the platform.
 *
 * Palette: cyan → sky → blue → indigo → violet.
 *
 * Agent identity remains independent from expression tone:
 * - Identity hue: who or what the visual belongs to.
 * - Expression tone: what kind of content is being shown.
 *
 * @see Brand guide §10 — Identity Placeholder System
 */

/**
 * Curated cool, brand-adjacent hues.
 *
 * Values are OKLCH hue angles in degrees.
 * The palette is intentionally discrete and predictable.
 */
const BRAND_HUES = [
  200, // Cyan
  212, // Sky
  224, // Cool blue
  236, // Blue
  248, // Indigo-blue
  260, // Brand-adjacent blue
  274, // Indigo
  288, // Blue-violet
] as const;

/**
 * Stable unsigned hash.
 *
 * Preserves the existing hash algorithm so the same seed
 * always produces the same hash.
 */
function hashSeed(seed: string): number {
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return hash;
}

/**
 * Returns a curated hue for an idea or venture identity.
 */
export function placeholderHue(seed: string): number {
  const index = hashSeed(seed) % BRAND_HUES.length;
  return BRAND_HUES[index];
}

/**
 * Ventures inherit their originating idea's identity hue.
 *
 * This preserves visual continuity between an idea and
 * the venture created from it.
 */
export function ventureHue(venture: {
  id: string;
  ideaId?: string;
}): number {
  return placeholderHue(venture.ideaId ?? venture.id);
}