// Réglages et profil : la LOGIQUE commune à tous les modèles Bloxks (le kit fournit le style).
// Écrans obligatoires de toute app Bloxks : Profil + Réglages, avec Confidentialité,
// Conditions et Support branchés sur les pages légales hébergées par Bloxks (ZZZ_LEGAL).
// Chaque ligne fait réellement quelque chose : préférence enregistrée, lien ouvert,
// données effacées après confirmation.
import { Alert, Linking, Platform } from 'react-native'
import type { IconProps } from '../zzz/Icon'
import { ZZZ_LEGAL } from '../zzz/legalLinks'
import { resetAllData, usePersistentState } from './store'

export type SettingsIcon = Pick<IconProps, 'name' | 'android'>

export type SettingsRow =
  | { kind: 'toggle'; key: string; label: string; icon: SettingsIcon; value: boolean; onToggle: (on: boolean) => void }
  | { kind: 'link'; key: string; label: string; icon: SettingsIcon; onPress: () => void }
  | { kind: 'action'; key: string; label: string; icon: SettingsIcon; onPress: () => void; destructive?: boolean }
  | { kind: 'value'; key: string; label: string; icon: SettingsIcon; value: string }

export type SettingsSection = { key: string; title: string; rows: SettingsRow[] }

export type Preferences = { notifications: boolean; sounds: boolean; haptics: boolean }
const DEFAULT_PREFS: Preferences = { notifications: true, sounds: true, haptics: true }

/** Préférences de l'app (enregistrées) — à lire partout où elles comptent (sons, vibrations…). */
export function usePreferences() {
  const [prefs, setPrefs] = usePersistentState<Preferences>('preferences', DEFAULT_PREFS)
  return { prefs, setPref: (k: keyof Preferences, v: boolean) => setPrefs((p) => ({ ...p, [k]: v })) }
}

export type Profile = { name: string; email: string; bio: string }

/** Profil de l'utilisateur (enregistré). `initial` = profil de démo du modèle. */
export function useProfile(initial: Profile) {
  const [profile, setProfile, ready] = usePersistentState<Profile>('profile', initial)
  return { profile, ready, updateProfile: (patch: Partial<Profile>) => setProfile((p) => ({ ...p, ...patch })) }
}

/** Initiales pour un avatar sans photo. */
export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

const open = (url: string) => Linking.openURL(url).catch((e) => console.warn('lien impossible', url, e))

function confirmReset(onDone?: () => void) {
  const run = () => resetAllData().then(() => onDone?.())
  const title = 'Effacer mes données ?'
  const message = 'Tout ce que tu as enregistré dans l’app sera supprimé de ce téléphone.'
  if (Platform.OS === 'web') {
    // L'aperçu web n'a pas de boîte de dialogue native.
    if (typeof window === 'undefined' || window.confirm(`${title}\n${message}`)) run()
    return
  }
  Alert.alert(title, message, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Effacer', style: 'destructive', onPress: run },
  ])
}

export type SettingsOptions = {
  /** Version affichée (par défaut 1.0.0). */
  version?: string
  /** Lignes propres à l'app, ajoutées en tête (ex. unités, objectif quotidien). */
  extra?: SettingsSection[]
  /** Appelé après l'effacement des données (ex. revenir à l'accueil). */
  onReset?: () => void
}

/** Sections de l'écran Réglages, prêtes à afficher avec les composants du kit. */
export function useSettingsSections(opts: SettingsOptions = {}): SettingsSection[] {
  const { prefs, setPref } = usePreferences()
  return [
    ...(opts.extra ?? []),
    {
      key: 'prefs',
      title: 'Préférences',
      rows: [
        { kind: 'toggle', key: 'notifications', label: 'Notifications', icon: { name: 'bell.fill', android: 'notifications' }, value: prefs.notifications, onToggle: (v) => setPref('notifications', v) },
        { kind: 'toggle', key: 'sounds', label: 'Sons', icon: { name: 'speaker.wave.2.fill', android: 'volume-high' }, value: prefs.sounds, onToggle: (v) => setPref('sounds', v) },
        { kind: 'toggle', key: 'haptics', label: 'Vibrations', icon: { name: 'iphone.radiowaves.left.and.right', android: 'phone-portrait' }, value: prefs.haptics, onToggle: (v) => setPref('haptics', v) },
      ],
    },
    {
      key: 'about',
      title: 'Aide et informations',
      rows: [
        { kind: 'link', key: 'support', label: 'Aide et contact', icon: { name: 'questionmark.circle.fill', android: 'help-circle' }, onPress: () => open(ZZZ_LEGAL.supportUrl) },
        { kind: 'link', key: 'privacy', label: 'Politique de confidentialité', icon: { name: 'lock.fill', android: 'lock-closed' }, onPress: () => open(ZZZ_LEGAL.privacyUrl) },
        { kind: 'link', key: 'terms', label: 'Conditions d’utilisation', icon: { name: 'doc.text.fill', android: 'document-text' }, onPress: () => open(ZZZ_LEGAL.termsUrl) },
        { kind: 'value', key: 'version', label: 'Version', icon: { name: 'info.circle.fill', android: 'information-circle' }, value: opts.version ?? '1.0.0' },
      ],
    },
    {
      key: 'data',
      title: 'Données',
      rows: [
        { kind: 'action', key: 'reset', label: 'Effacer mes données', icon: { name: 'trash.fill', android: 'trash' }, destructive: true, onPress: () => confirmReset(opts.onReset) },
      ],
    },
  ]
}
