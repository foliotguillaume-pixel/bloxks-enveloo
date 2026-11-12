// Coque d'écran du kit Clean : fond gris système (ou noir, ou couleur pleine) qui
// passe SOUS la barre d'état (transparente, comme une app native), avec défilement vertical
// disponible dès que nécessaire. La barre du haut (`header`) et le(s) bouton(s) du bas (`footer`)
// restent FIXES pendant le défilement ; le contenu glisse dessous en fondu, jamais rogné.
// Le « ton » de l'écran (couleurs résolues) est transmis aux composants du kit.
import { createContext, useContext, useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, type IconProps } from '../zzz/Icon'
import { isLight, makeTone, type Tone, kitPad } from '../theme'

type IconName = Pick<IconProps, 'name' | 'android'>

const ToneContext = createContext<Tone>(makeTone('base'))
/** Couleurs de l'écran courant (fond gris, noir ou saturé). */
export function useTone(): Tone {
  return useContext(ToneContext)
}

/** Hauteur de la barre d'onglets au-dessus de la zone de sécurité. */
export const TAB_BAR_HEIGHT = 50

/**
 * Le défilement reste activé : la mesure du contenu peut arriver trop tard ou
 * sous-estimer un dépassement court, ce qui coupe alors le bas de l'écran.
 * Sans débordement, `alwaysBounceVertical={false}` garde le rendu immobile.
 */
function useFitScroll() {
  return {
    scrollEnabled: true,
    bounces: true,
    alwaysBounceVertical: false,
    overScrollMode: 'auto' as const,
  }
}

/** `#RRGGBB` → même couleur avec une opacité (fondus sous l'heure et au-dessus des boutons). */
function alpha(hex: string, a: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex
  return `${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}`
}

export type TabsConfig = {
  icons: IconName[]
  /** libellés d'accessibilité, dans l'ordre des icônes */
  labels: string[]
  active: number
  onPress: (index: number) => void
}

/** Barre d'onglets du kit : icônes seules, 26 pt, active foncée, inactives grises. */
export function TabBar({ icons, labels, active, onPress }: TabsConfig) {
  const t = useTone()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.tabBar, { backgroundColor: t.tabBg, borderTopColor: t.tabLine, height: TAB_BAR_HEIGHT + insets.bottom, overflow: 'hidden' }]}>
      {/* Barre translucide façon iOS : le contenu qui défile dessous est flouté, jamais lisible à travers. */}
      <BlurView intensity={40} tint={isLight(t.bg) ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
      {icons.map((icon, i) => (
        <Pressable key={i} onPress={() => onPress(i)} hitSlop={10} accessibilityRole="tab" accessibilityLabel={labels[i]}
          accessibilityState={{ selected: i === active }} style={styles.tab}>
          <Icon {...icon} size={26} color={i === active ? t.tabActive : t.tabIdle} />
        </Pressable>
      ))}
    </View>
  )
}

export function Screen({ tone = 'base', bg, gradient, gradientAngle = 'down', ink, children, header, footer, tabs, scroll = true, keyboardAware = false, contentStyle, overlay }: {
  /** `base` : gris du kit · `dark` : écran noir · `color` : fond saturé (texte `ink`, blanc par défaut) */
  tone?: Tone['kind']
  /** couleur de fond (sinon celle du ton) */
  bg?: string
  /** fond dégradé plein écran (2 couleurs ou plus) */
  gradient?: string[]
  gradientAngle?: 'down' | 'diagonal'
  ink?: string
  children: ReactNode
  /** Barre du haut FIXE (TopBar : fermer, retour, action) : reste en place, floutée dès qu'on défile. */
  header?: ReactNode
  /** Bouton(s) FIXES en bas (action principale d'un formulaire, d'une fiche…). */
  footer?: ReactNode
  /** Barre d'onglets en bas de l'écran. */
  tabs?: TabsConfig
  scroll?: boolean
  /** Formulaires : le contenu et le pied suivent le clavier, sans double inset iOS. */
  keyboardAware?: boolean
  contentStyle?: StyleProp<ViewStyle>
  /** Calque au-dessus du contenu (bouton flottant…). */
  overlay?: ReactNode
}) {
  const insets = useSafeAreaInsets()
  const fit = useFitScroll()
  const t = makeTone(tone, { bg: bg ?? gradient?.[0], ink })
  const [headerH, setHeaderH] = useState(header ? 48 : 0)
  const [footerH, setFooterH] = useState(footer ? 92 : 0)
  const [scrolled, setScrolled] = useState(false)
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y > 2
    if (y !== scrolled) setScrolled(y)
  }
  // Le haut du contenu : sous l'heure, et sous la barre fixe quand il y en a une.
  const top = insets.top + (header ? headerH : 0)
  // Avec des onglets, les boutons fixes se posent JUSTE AU-DESSUS de la barre (sinon elle les cache).
  const tabSpace = tabs ? TAB_BAR_HEIGHT + insets.bottom : 0
  const footerSpace = footer ? footerH + tabSpace : tabs ? tabSpace : insets.bottom
  const bottom = footerSpace + (tabs ? 16 : 24)
  // Couleur des fondus : le fond de l'écran (haut du dégradé en haut, bas du dégradé en bas).
  const topBg = gradient?.[0] ?? t.bg
  const bottomBg = gradient?.[gradient.length - 1] ?? t.bg
  const blurTint = isLight(topBg) ? 'light' : 'dark'
  const contentNode = scroll ? (
    <ScrollView
      {...fit}
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: top + 7, paddingBottom: bottom }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={!keyboardAware}
      onScroll={onScroll}
      scrollEventThrottle={32}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.root, styles.content, { paddingTop: top + 7, paddingBottom: footerSpace }, contentStyle]}>{children}</View>
  )
  const footerNode = footer ? (
    <View style={[styles.footer, { bottom: keyboardAware ? 0 : tabSpace, paddingBottom: keyboardAware ? 16 : tabs ? 12 : Math.max(insets.bottom, 16) + 4, backgroundColor: bottomBg }]} onLayout={(e) => setFooterH(e.nativeEvent.layout.height)}>
      <LinearGradient pointerEvents="none" colors={[alpha(bottomBg, 0), bottomBg]} style={styles.footerFade} />
      {footer}
    </View>
  ) : null
  return (
    <ToneContext.Provider value={t}>
      <View style={[styles.root, { backgroundColor: t.bg }]}>
        {gradient ? (
          <LinearGradient colors={gradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill}
            start={gradientAngle === 'diagonal' ? { x: 0.1, y: 0 } : { x: 0.5, y: 0 }} end={gradientAngle === 'diagonal' ? { x: 0.9, y: 1 } : { x: 0.5, y: 1 }} />
        ) : null}
        <StatusBar translucent backgroundColor="transparent" barStyle={t.dark || !isLight(t.bg) ? 'light-content' : 'dark-content'} />
        {keyboardAware ? (
          <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {contentNode}
            {footerNode}
          </KeyboardAvoidingView>
        ) : contentNode}
        {/* Barre d'état transparente : un léger fondu du fond garde l'heure lisible quand le contenu passe dessous. */}
        {!header ? (
          <LinearGradient pointerEvents="none" colors={[alpha(topBg, 0.94), alpha(topBg, 0)]}
            style={[styles.topFade, { height: insets.top + 14, opacity: scrolled ? 1 : 0 }]} />
        ) : (
          <View style={[styles.header, { paddingTop: insets.top }]} onLayout={(e) => setHeaderH(e.nativeEvent.layout.height - insets.top)}>
            {scrolled ? (
              <>
                <BlurView intensity={40} tint={blurTint} style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha(topBg, 0.72) }]} />
              </>
            ) : null}
            {header}
          </View>
        )}
        {!keyboardAware ? footerNode : null}
        {overlay}
        {tabs ? <TabBar {...tabs} /> : null}
      </View>
    </ToneContext.Provider>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingTop: kitPad(7) },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: kitPad(20), paddingTop: kitPad(12), gap: 12 },
  header: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
  footerFade: { position: 'absolute', left: 0, right: 0, top: -28, height: 28 },
  topFade: { position: 'absolute', left: 0, right: 0, top: 0 },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: kitPad(14), borderTopWidth: 1 },
  tab: { width: 56, alignItems: 'center' },
})
