// Palettes de la variante « Enveloppes » (kit Clean). La première est la palette par défaut :
// indigo pour l'accent (bouton flottant, CTA, anneau) et le surlignage (surtitres, jauges).
import type { Palette } from '../theme'

export const VARIANT_PALETTES: Record<string, Palette> = {
  enveloppesIndigo: { bg: '#F2F2F7', card: '#FFFFFF', accent: '#4F46E5', hl: '#4F46E5', ink: '#111111', muted: '#8E8E93' },
  enveloppesNoir: { bg: '#F2F2F7', card: '#FFFFFF', accent: '#111111', hl: '#111111', ink: '#111111', muted: '#8E8E93' },
  enveloppesCorail: { bg: '#F2F2F7', card: '#FFFFFF', accent: '#E5533D', hl: '#E5533D', ink: '#111111', muted: '#8E8E93' },
}
