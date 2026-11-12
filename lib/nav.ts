// Types de navigation partagés par les écrans (pile @react-navigation/stack)
// et résolution des couleurs de catégorie.
import { COLORS } from '../theme'
import { SWATCHES, TABS, type Swatch, type SwatchRef } from './content'

export type Nav = {
  navigate: (route: string, params?: Record<string, unknown>) => void
  replace: (route: string, params?: Record<string, unknown>) => void
  goBack: () => void
}

/** Barre d'onglets : onglet actif par position. */
export function tabsFor(navigation: Nav, active: number) {
  return { icons: TABS.map((t) => t.icon), labels: TABS.map((t) => t.label), active, onPress: (i: number) => {
    if (i === active) return
    if (TABS[i].root) navigation.replace(TABS[i].route)
    else navigation.navigate(TABS[i].route)
  } }
}

/** Couleur de catégorie : fixe (données) ou celle de la palette (`accent`). */
export function swatch(ref: SwatchRef): Swatch {
  return ref === 'accent' ? { bg: COLORS.hlSoft, fg: COLORS.hl, bar: COLORS.hl } : SWATCHES[ref]
}
