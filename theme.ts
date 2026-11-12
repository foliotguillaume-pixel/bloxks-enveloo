// bloxks-template: budget-enveloppes@1
// Kit de style « Clean » — tokens de l'app.
// Règles du kit : fond gris système, cartes blanches (rayon 20, ombre très douce),
// un gros chiffre héros par écran, une seule couleur d'accent (CTA, bouton flottant,
// jour actif, anneaux), les données gardent leurs couleurs à elles, jamais de bouton vert.
// Pour changer l'ambiance : modifie PALETTE (ou choisis une entrée de PALETTES).
// Tout le reste (tons, textes, pistes) en est dérivé.
import type { TextStyle } from 'react-native'
import { FONTS } from './zzz/fonts'
import { VARIANT_PALETTES } from './lib/palettes'

// Réglages du kit (arrondis, densité, relief) : UNE ligne, remplacée par le builder (designSystem.tuning).
export type Tuning = { radius: number; space: number; shadow: number }
export const TUNING: Tuning = { radius: 1.4, space: 1, shadow: 1 }
/** Valeurs multipliées par `k` (pilule ≥ 99 et 0 gardés), objets imbriqués compris. */
function tuned<T>(base: T, k: number): T {
  if (typeof base === 'number') return (base >= 99 || base === 0 ? base : Math.round(base * k)) as T
  if (base && typeof base === 'object') return Object.fromEntries(Object.entries(base).map(([key, v]) => [key, tuned(v, k)])) as T
  return base
}
/** Ombre plus ou moins marquée : opacité, flou, décalage et élévation suivent `k` (0 = à plat). */
/** Arrondi ou marge écrits en chiffres dans un composant : suivent aussi les réglages. */
export const kitRad = (n: number) => tuned(n, TUNING.radius)
export const kitPad = (n: number) => tuned(n, TUNING.space)
function tunedShadow<T>(s: T, k: number): T {
  if (!s || typeof s !== 'object') return s
  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(s as Record<string, unknown>)) {
    if (typeof v === 'number' && key === 'shadowOpacity') out[key] = Math.min(1, v * k)
    else if (typeof v === 'number' && (key === 'shadowRadius' || key === 'elevation')) out[key] = Math.round(v * k)
    else if (key === 'shadowOffset' && v && typeof v === 'object') out[key] = { ...(v as object), height: Math.round(((v as { height?: number }).height ?? 0) * k) }
    else out[key] = typeof v === 'object' ? tunedShadow(v, k) : v
  }
  return out as T
}

export type Palette = {
  /** fond des écrans (gris système) */
  bg: string
  /** cartes et feuilles */
  card: string
  /** CTA, bouton flottant, jour actif, anneaux, onglet actif */
  accent: string
  /** surlignage : surtitres, jours faits, icônes des chiffres, jauges */
  hl: string
  /** texte principal */
  ink: string
  /** légendes grises */
  muted: string
}

const KIT_PALETTES: Record<string, Palette> = {
  noir: { bg: '#F2F2F7', card: '#FFFFFF', accent: '#111111', hl: '#111111', ink: '#111111', muted: '#8E8E93' },
  bleuSysteme: { bg: '#F2F2F7', card: '#FFFFFF', accent: '#0A84FF', hl: '#0A84FF', ink: '#111111', muted: '#8E8E93' },
  corail: { bg: '#F2F2F7', card: '#FFFFFF', accent: '#FF6B4A', hl: '#FF6B4A', ink: '#111111', muted: '#8E8E93' },
  indigo: { bg: '#F2F2F7', card: '#FFFFFF', accent: '#5856D6', hl: '#5856D6', ink: '#111111', muted: '#8E8E93' },
}

export const PALETTES: Record<string, Palette> = { ...KIT_PALETTES, ...VARIANT_PALETTES }

export const PALETTE: Palette = { bg: '#F2F4F8', card: '#FFFFFF', accent: '#2357D8', hl: '#153471', ink: '#111111', muted: '#8E9093' }

// ─── Outils couleur ─────────────────────────────────────────────────────────
function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}
/** Assombrit vers le noir. */
export function darken(hex: string, amount = 0.15): string {
  const [r, g, b] = toRgb(hex)
  return toHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}
/** Éclaircit vers le blanc (fonds doux des pastilles). */
export function tint(hex: string, amount = 0.88): string {
  const [r, g, b] = toRgb(hex)
  return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount)
}
/** Mélange deux couleurs (0 → a, 1 → b). */
export function mix(a: string, b: string, k: number): string {
  const [r1, g1, b1] = toRgb(a)
  const [r2, g2, b2] = toRgb(b)
  return toHex(r1 + (r2 - r1) * k, g1 + (g2 - g1) * k, b1 + (b2 - b1) * k)
}
export function alpha(hex: string, a: number): string {
  const [r, g, b] = toRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
function lum(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
/** Couleur claire (texte foncé dessus) ? */
export function isLight(hex: string): boolean {
  return lum(hex) > 0.45
}
export function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
/** Texte posé sur `bg` : blanc tant qu'il se lit (le style du kit), sinon la teinte très assombrie. */
export function onColor(bg: string, min = 2.2): string {
  if (!bg.startsWith('#')) return '#FFFFFF'
  return contrast('#FFFFFF', bg) >= min ? '#FFFFFF' : darken(bg, 0.86)
}
/** `fg` tel quel s'il se lit sur `bg`, sinon assombri juste assez : toute palette reste lisible. */
export function readable(fg: string, bg = '#FFFFFF', min = 3): string {
  for (let k = 0; k <= 0.9; k += 0.05) {
    const c = darken(fg, k)
    if (contrast(c, bg) >= min) return c
  }
  return darken(fg, 0.86)
}

// ─── Tokens ────────────────────────────────────────────────────────────────
const p = PALETTE

export const COLORS = {
  ...p,
  /** couleur des boutons principaux (alias attendu par l'IA) */
  accent: p.accent,
  onAccent: onColor(p.accent),
  onHl: onColor(p.hl),
  /** surtitre dans la teinte de surlignage, lisible sur le fond gris */
  hlInk: readable(p.hl, p.bg, 2.3),
  /** accent posé sur une carte blanche (liens, valeurs) */
  accentInk: readable(p.accent, p.card),
  /** fond doux de l'accent (pastilles, badges) */
  accentSoft: tint(p.accent, 0.88),
  hlSoft: tint(p.hl, 0.86),
  onBg: p.ink,
  onCard: p.ink,
  white: '#FFFFFF',
  /** pistes des jauges, contours, séparateurs */
  track: mix(p.bg, p.ink, 0.012),
  /** icônes inactives de la barre d'onglets */
  tabIdle: '#A9A39A',
  /** montants positifs, tendances (données seulement, jamais un bouton) */
  positive: '#138A4E',
  positiveSoft: '#E3F5EA',
  /** dépassement de budget */
  over: '#B45300',
  overBar: '#FF9500',
  danger: '#FF3B30',
  // Écrans sombres du kit (caméra, course en direct, widgets).
  night: '#111111',
  nightSurface: '#1C1C1E',
  nightTrack: '#2C2C2E',
}

/** Données (macros, catégories) : couleurs propres, indépendantes de la palette. */
// L'orange est à peine plus soutenu que #FF9500 : le texte blanc posé dessus reste lisible.
export const DATA = { red: '#FF3B30', orange: '#F79000', blue: '#0A84FF', indigo: '#5856D6', pink: '#FF2D55', teal: '#30B0C7' }

export const RADIUS = tuned({ card: 20, chip: 16, tile: 12, sm: 10, pill: 999 }, TUNING.radius)
export const SPACE = tuned({ xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24 }, TUNING.space)
/** Ombre des cartes : 0 4 12 à 6 %. */
export const SHADOW = tunedShadow({ shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, TUNING.shadow)

// Graisses : SF Pro sur iOS, Inter sur Android (pack « system »). Le héros est en 800
// quand le pack le sert (créneau optionnel), sinon en gras.
const display: Record<string, TextStyle | undefined> = FONTS.display
const text: Record<string, TextStyle | undefined> = FONTS.text
export const W = {
  regular: FONTS.text.regular,
  medium: text.medium ?? FONTS.text.regular,
  semibold: FONTS.text.semibold,
  bold: FONTS.text.bold,
  title: FONTS.display.bold,
  heavy: display.extrabold ?? FONTS.display.bold,
}

export const TYPE = {
  hero: { fontSize: 52, letterSpacing: -1.5, ...W.heavy, fontVariant: ['tabular-nums'] } as TextStyle,
  largeTitle: { fontSize: 34, lineHeight: 37, letterSpacing: -0.6, ...W.title } as TextStyle,
  title: { fontSize: 28, lineHeight: 30, letterSpacing: -0.6, ...W.title } as TextStyle,
  headline: { fontSize: 18, lineHeight: 21, ...W.title } as TextStyle,
  cardTitle: { fontSize: 15, lineHeight: 18, ...W.bold } as TextStyle,
  body: { fontSize: 15, lineHeight: 22, ...W.regular } as TextStyle,
  caption: { fontSize: 13, lineHeight: 17, ...W.regular } as TextStyle,
  eyebrow: { fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', ...W.bold } as TextStyle,
  button: { fontSize: 17, ...W.semibold } as TextStyle,
}

// ─── Tons d'écran ───────────────────────────────────────────────────────────
/**
 * Couleurs résolues pour un écran. `base` : fond gris du kit ; `dark` : écran noir
 * (caméra, course en direct) ; `color` : fond saturé plein écran (célébration).
 */
export type Tone = {
  kind: 'base' | 'dark' | 'color'
  dark: boolean
  bg: string
  surface: string
  ink: string
  muted: string
  onBg: string
  mutedOnBg: string
  eyebrow: string
  accent: string
  onAccent: string
  hl: string
  onHl: string
  track: string
  line: string
  chip: string
  chipInk: string
  shadow: boolean
  roundBg: string
  tabBg: string
  tabLine: string
  tabActive: string
  tabIdle: string
  positive: string
  over: string
}

export function makeTone(kind: Tone['kind'] = 'base', opts: { bg?: string; ink?: string } = {}): Tone {
  const base: Tone = {
    kind, dark: false, bg: opts.bg ?? p.bg, surface: p.card, ink: p.ink, muted: p.muted, onBg: p.ink, mutedOnBg: p.muted,
    eyebrow: COLORS.hlInk, accent: p.accent, onAccent: COLORS.onAccent, hl: p.hl, onHl: COLORS.onHl,
    track: COLORS.track, line: COLORS.track, chip: p.card, chipInk: p.ink, shadow: true,
    roundBg: 'rgba(255,255,255,0.7)', tabBg: p.bg, tabLine: COLORS.track, tabActive: p.ink, tabIdle: COLORS.tabIdle,
    positive: COLORS.positive, over: COLORS.over,
  }
  if (kind === 'dark') {
    // Accent noir illisible sur fond noir : il passe au blanc.
    const accent = contrast(p.accent, COLORS.night) < 2 ? '#FFFFFF' : p.accent
    const hl = contrast(p.hl, COLORS.night) < 2 ? '#FFFFFF' : p.hl
    return {
      ...base, dark: true, bg: opts.bg ?? COLORS.night, surface: COLORS.nightSurface, ink: '#FFFFFF', muted: 'rgba(255,255,255,0.62)',
      onBg: opts.ink ?? '#FFFFFF', mutedOnBg: 'rgba(255,255,255,0.62)', eyebrow: contrast(p.hl, COLORS.night) >= 3 ? p.hl : 'rgba(255,255,255,0.62)',
      accent, onAccent: onColor(accent), hl, onHl: onColor(hl), track: COLORS.nightTrack, line: 'rgba(255,255,255,0.07)', chip: COLORS.nightTrack, chipInk: '#FFFFFF',
      shadow: false, roundBg: COLORS.nightSurface, tabBg: 'rgba(17,17,17,0.92)', tabLine: 'rgba(255,255,255,0.08)', tabActive: '#FFFFFF',
      tabIdle: 'rgba(255,255,255,0.4)', positive: '#5EE6A8', over: '#FFB547',
    }
  }
  if (kind === 'color') {
    const ink = opts.ink ?? '#FFFFFF'
    return {
      ...base, onBg: ink, mutedOnBg: alpha(ink, 0.88), eyebrow: alpha(ink, 0.88), surface: 'rgba(255,255,255,0.92)',
      shadow: false, track: 'rgba(0,0,0,0.12)', roundBg: 'rgba(255,255,255,0.7)',
    }
  }
  return base
}
