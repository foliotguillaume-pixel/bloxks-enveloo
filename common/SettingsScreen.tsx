// Écran Réglages OBLIGATOIRE (kit Clean) : préférences enregistrées, aide, confidentialité,
// conditions, version, effacement des données. La logique vient de lib/settings.ts (commun) ;
// ce fichier ne fait que la dessiner avec les composants du kit.
import { Screen } from '../components/Screen'
import { List, Title, TopBar } from '../components/ui'
import { COLORS } from '../theme'
import { useSettingsSections, type SettingsOptions } from '../lib/settings'
import { tabsFor, type Nav } from '../lib/nav'

export default function SettingsScreen({ navigation, route }: { navigation: Nav; route?: { params?: SettingsOptions; name?: string } }) {
  const sections = useSettingsSections(route?.params)
  const fromCompatibilityRoute = route?.name === 'Profile'
  return (
    <Screen tabs={tabsFor(navigation, 2)} header={fromCompatibilityRoute ? <TopBar onLeft={() => navigation.goBack()} leftLabel="Retour" /> : undefined}>
      <Title title="Réglages" />
      {sections.map((s) => (
        <List key={s.key} title={s.title} rows={s.rows.map((r) => (
          r.kind === 'toggle' ? { icon: r.icon, title: r.label, toggle: r.value, onToggle: r.onToggle }
            : r.kind === 'value' ? { icon: r.icon, title: r.label, right: r.value }
              : { icon: r.icon, title: r.label, onPress: r.onPress, ...(r.kind === 'action' && r.destructive ? { iconBg: COLORS.danger } : {}) }
        ))} />
      ))}
    </Screen>
  )
}
