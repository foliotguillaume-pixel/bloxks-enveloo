// Composants du kit Clean (vocabulaire des maquettes, un composant par bloc récurrent).
// Chaque composant lit le ton de l'écran (useTone) : le même bloc s'affiche juste
// sur fond gris, sur un écran noir ou sur une couleur pleine. Aucun texte en dur :
// tout arrive par les props (lib/content.ts de la variante).
import { useState, type ReactNode } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type ImageSourcePropType, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, Defs, Line, Path, Polyline as SvgPolyline, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, type IconProps } from '../zzz/Icon'
import { Image, ImageBackground } from '../zzz/RemoteImage'
import { RADIUS, SHADOW, TYPE, W, alpha, contrast, onColor, kitRad, kitPad } from '../theme'
import { TAB_BAR_HEIGHT, useTone } from './Screen'
import { usePressScale, useTween } from './motion'

export type IconName = Pick<IconProps, 'name' | 'android'>
type Src = ImageSourcePropType

const num = (size: number, color: string): TextStyle => ({ fontSize: size, lineHeight: Math.round(size * 1.08), letterSpacing: size > 40 ? -1.5 : -0.8, color, fontVariant: ['tabular-nums'], ...W.heavy })


/**
 * Gros chiffre sur UNE ligne : la taille baisse juste assez pour tenir dans la largeur
 * disponible (montants longs, écrans étroits). `adjustsFontSizeToFit` n'existe pas sur le web.
 */
export function FitNum({ value, size, color, style }: { value: string; size: number; color: string; style?: StyleProp<TextStyle> }) {
  const [width, setWidth] = useState(0)
  const fit = width > 0 ? Math.min(size, Math.floor(width / Math.max(1, value.length * 0.62))) : size
  return (
    <View style={{ alignSelf: 'stretch', flexShrink: 1 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Text numberOfLines={1} style={[num(fit, color), style]}>{value}</Text>
    </View>
  )
}

/** Dégradé posé sur une couleur pleine (la couleur sert de repli et de fond lisible). */
function Grad({ colors, angle = 135, style, children }: { colors: string[]; angle?: number; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const rad = ((angle - 90) * Math.PI) / 180
  const dx = Math.cos(rad) / 2
  const dy = Math.sin(rad) / 2
  const list = (colors.length > 1 ? colors : [colors[0], colors[0]]) as [string, string, ...string[]]
  return (
    <View style={[{ backgroundColor: colors[0], overflow: 'hidden' }, style]}>
      <LinearGradient colors={list} start={{ x: 0.5 - dx, y: 0.5 - dy }} end={{ x: 0.5 + dx, y: 0.5 + dy }} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  )
}

/** Halo clair en haut à droite des cartes dégradées. */
function Orb({ size = 200, right = -40, top = -40, opacity = 0.45 }: { size?: number; right?: number; top?: number; opacity?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', right, top, width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="orb" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={opacity} />
            <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill="url(#orb)" />
      </Svg>
    </View>
  )
}

// ─── Surfaces et textes ─────────────────────────────────────────────────────

/** Carte du kit : surface, rayon 20, ombre douce sur fond clair. */
export function Card({ children, style, padding, onPress, bg }: { children: ReactNode; style?: StyleProp<ViewStyle>; padding?: number; onPress?: () => void; bg?: string }) {
  const t = useTone()
  const s = [styles.card, { backgroundColor: bg ?? t.surface }, t.shadow && !bg ? SHADOW : null, padding != null ? { padding } : null, style]
  if (onPress) return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s, pressed && { opacity: 0.85 }]}>{children}</Pressable>
  return <View style={s}>{children}</View>
}

/** Surtitre en capitales (12 pt, +1,5). */
export function Eyebrow({ children, color, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  const t = useTone()
  return <Text style={[TYPE.eyebrow, { color: color ?? t.eyebrow }, style]}>{children}</Text>
}

/** Interrupteur iOS (52 × 32). */
export function Toggle({ on, onChange, color, label }: { on: boolean; onChange?: (v: boolean) => void; color?: string; label: string }) {
  const t = useTone()
  const c = color ?? (t.accent === t.onBg && !t.dark ? t.accent : t.hl)
  return (
    <Pressable onPress={() => onChange?.(!on)} disabled={!onChange} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label}
      style={[styles.toggle, { backgroundColor: on ? c : t.track, justifyContent: on ? 'flex-end' : 'flex-start' }]}>
      <View style={styles.knob} />
    </Pressable>
  )
}

/** Pastille ronde : lettre, icône ou photo (opérations, catégories). */
export type Mono = { letter?: string; icon?: IconName; image?: Src; bg: string; fg?: string }
export function MonoBadge({ mono, size = 40 }: { mono: Mono; size?: number }) {
  const box = { width: size, height: size, borderRadius: size / 2 }
  if (mono.image) return <Image source={mono.image} style={[box, { backgroundColor: '#CCCCCC' }]} />
  return (
    <View style={[box, styles.center, { backgroundColor: mono.bg }]}>
      {mono.icon ? <Icon {...mono.icon} size={Math.round(size * 0.52)} color={mono.fg ?? '#FFFFFF'} />
        : <Text style={[{ fontSize: Math.round(size * 0.4), color: mono.fg ?? '#FFFFFF' }, W.heavy]}>{mono.letter}</Text>}
    </View>
  )
}

// ─── Boutons ────────────────────────────────────────────────────────────────

/** Bouton pilule (58 pt). `secondary` : contour fin sur fond clair, voile blanc sur fond sombre. */
export function Button({ label, onPress, secondary, icon, style, color, textColor, disabled }: {
  label: string; onPress?: () => void; secondary?: boolean; icon?: IconName; style?: StyleProp<ViewStyle>; color?: string; textColor?: string; disabled?: boolean
}) {
  const t = useTone()
  const bg = secondary ? (t.dark ? 'rgba(255,255,255,0.1)' : 'transparent') : color ?? t.accent
  const fg = textColor ?? (secondary ? t.onBg : color ? onColor(color) : t.onAccent)
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        secondary && !t.dark ? { borderWidth: 1.5, borderColor: alpha(t.onBg.startsWith('#') ? t.onBg : '#111111', 0.2) } : null, style]}>
      {icon ? <Icon {...icon} size={20} color={fg} /> : null}
      <Text numberOfLines={1} style={[TYPE.button, { color: fg }]}>{label}</Text>
    </Pressable>
  )
}

/** Barre d'action du bas : bouton principal, secondaire à gauche (optionnel), lien dessous. */
export function CtaBar({ label, onPress, secondary, onSecondary, link, onLink }: {
  label: string; onPress?: () => void; secondary?: string; onSecondary?: () => void; link?: string; onLink?: () => void
}) {
  const t = useTone()
  return (
    <View style={{ gap: 12, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
        {secondary ? <Button label={secondary} onPress={onSecondary} secondary style={{ flex: 1 }} /> : null}
        <Button label={label} onPress={onPress} style={{ flex: secondary ? 1.5 : 1 }} />
      </View>
      {link ? (
        <Pressable onPress={onLink} accessibilityRole="button" hitSlop={8}>
          <Text style={[{ fontSize: 14, color: t.mutedOnBg }, W.semibold]}>{link}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

/** Bouton rond de la barre du haut (42 pt). */
export function RoundButton({ icon, onPress, label, bg, color, dot, dotColor, size = 42 }: {
  icon: IconName; onPress?: () => void; label: string; bg?: string; color?: string; dot?: boolean; dotColor?: string; size?: number
}) {
  const t = useTone()
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => [styles.center, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? t.roundBg, opacity: pressed ? 0.7 : 1 }]}>
      <Icon {...icon} size={22} color={color ?? t.onBg} />
      {dot ? <View style={[styles.dot, { backgroundColor: dotColor ?? t.hl }]} /> : null}
    </Pressable>
  )
}

/** Barre du haut : retour/fermer à gauche, icône ou texte à droite. `left={null}` masque le bouton gauche. */
export function TopBar({ left = { name: 'arrow.left', android: 'arrow-back' }, onLeft, leftLabel, right, rightText, onRight, rightLabel }: {
  left?: IconName | null; onLeft?: () => void; leftLabel: string; right?: IconName; rightText?: string; onRight?: () => void; rightLabel?: string
}) {
  const t = useTone()
  return (
    <View style={styles.topBar}>
      {left ? <RoundButton icon={left} onPress={onLeft} label={leftLabel} /> : <View style={{ width: 42 }} />}
      {right ? <RoundButton icon={right} onPress={onRight} label={rightLabel ?? leftLabel} />
        : rightText ? (
          <Pressable onPress={onRight} disabled={!onRight} accessibilityRole="button" hitSlop={8}>
            <Text numberOfLines={1} style={[{ fontSize: 13, color: t.muted }, W.semibold]}>{rightText}</Text>
          </Pressable>
        ) : <View />}
    </View>
  )
}

/** Bouton flottant (58 pt) : icône seule ou icône + libellé. Posé au-dessus des onglets. */
export function Fab({ icon = { name: 'plus', android: 'add' }, label, onPress, bg, color, aboveTabs = true, a11y }: {
  icon?: IconName; label?: string; onPress?: () => void; bg?: string; color?: string; aboveTabs?: boolean; a11y: string
}) {
  const t = useTone()
  const insets = useSafeAreaInsets()
  const press = usePressScale()
  const fill = bg ?? t.accent
  const fg = color ?? (bg ? onColor(bg) : t.onAccent)
  return (
    <Animated.View style={[styles.fabWrap, { bottom: (aboveTabs ? TAB_BAR_HEIGHT + insets.bottom : insets.bottom) + 20 }, press.style]}>
      <Pressable onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} accessibilityRole="button" accessibilityLabel={a11y}
        style={[styles.fab, { backgroundColor: fill }, label ? { paddingLeft: kitPad(18), paddingRight: kitPad(22) } : { width: 58 }]}>
        <Icon {...icon} size={26} color={fg} />
        {label ? <Text style={[{ fontSize: 16, color: fg }, W.bold]}>{label}</Text> : null}
      </Pressable>
    </Animated.View>
  )
}

// ─── En-têtes ───────────────────────────────────────────────────────────────

/** Grand titre d'écran avec surtitre et sous-titre. */
export function Title({ eyebrow, title, size = 32, sub, pt = 14, color }: { eyebrow?: string; title: string; size?: number; sub?: string; pt?: number; color?: string }) {
  const t = useTone()
  return (
    <View style={{ paddingTop: pt, paddingHorizontal: kitPad(22) }}>
      {eyebrow ? <Eyebrow style={{ marginBottom: 10 }}>{eyebrow}</Eyebrow> : null}
      <Text style={[{ fontSize: size, lineHeight: Math.round(size * 1.08), letterSpacing: size > 40 ? -1.5 : -0.6, color: color ?? t.onBg }, W.title]}>{title}</Text>
      {sub ? <Text style={[{ fontSize: 16, lineHeight: 23, color: t.mutedOnBg, marginTop: 10 }, W.regular]}>{sub}</Text> : null}
    </View>
  )
}

/** En-tête d'accueil : photo, date, salutation, boutons ronds à droite (pastille sur l'un d'eux). */
export function Header({ image, eyebrow, title, actions = [], dot, dotColor, onImagePress }: {
  image?: Src; eyebrow: string; title: string; actions?: { icon: IconName; label: string; onPress?: () => void }[]; dot?: number; dotColor?: string; onImagePress?: () => void
}) {
  const t = useTone()
  return (
    <View style={styles.header}>
      {image ? (onImagePress ? <Pressable onPress={onImagePress} accessibilityRole="button" accessibilityLabel="Mon compte"><Image source={image} style={styles.headerImg} /></Pressable> : <Image source={image} style={styles.headerImg} />) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[{ fontSize: 13, color: t.mutedOnBg }, W.semibold]}>{eyebrow}</Text>
        <Text numberOfLines={1} style={[{ fontSize: 21, lineHeight: 24, letterSpacing: -0.3, color: t.onBg, marginTop: 2 }, W.title]}>{title}</Text>
      </View>
      {actions.map((a, i) => <RoundButton key={i} icon={a.icon} label={a.label} onPress={a.onPress} dot={dot === i} dotColor={dotColor} />)}
    </View>
  )
}

/** Titre de section avec action à droite. */
export function SectionHeader({ title, right, rightColor, onRight, pt = 20 }: { title: string; right?: string; rightColor?: string; onRight?: () => void; pt?: number }) {
  const t = useTone()
  return (
    <View style={[styles.sh, { paddingTop: pt }]}>
      <Text style={[{ fontSize: 18, lineHeight: 21, color: t.onBg, flexShrink: 1 }, W.title]}>{title}</Text>
      {right ? (
        <Pressable onPress={onRight} disabled={!onRight} hitSlop={8}>
          <Text style={[{ fontSize: 13, color: rightColor ?? t.mutedOnBg }, W.semibold]}>{right}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

/** Chiffre héros (60 pt par défaut) avec unité et légende. */
export function Hero({ eyebrow, value, unit, size = 60, caption, color, captionColor, pt = 18 }: {
  eyebrow?: string; value: string; unit?: string; size?: number; caption?: string; color?: string; captionColor?: string; pt?: number
}) {
  const t = useTone()
  // Dans une rangée, FitNum mesurerait sa propre largeur et rétrécirait en boucle (« 0 » minuscule) :
  // sa boîte prend la largeur du chiffre à taille pleine, bornée par la place laissée à l'unité.
  const [rowW, setRowW] = useState(0)
  const full = Math.ceil(value.length * size * 0.62)
  const numW = rowW > 0 ? Math.max(1, Math.min(full, rowW - (unit ? unit.length * 10 + 8 : 0))) : full
  return (
    <View style={{ paddingTop: pt, paddingHorizontal: kitPad(22) }}>
      {eyebrow ? <Eyebrow style={{ marginBottom: 10 }}>{eyebrow}</Eyebrow> : null}
      <View onLayout={(e) => setRowW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <View style={{ width: numW }}><FitNum value={value} size={size} color={color ?? t.onBg} /></View>
        {unit ? <Text style={[{ fontSize: 18, color: t.muted }, W.medium]}>{unit}</Text> : null}
      </View>
      {caption ? <Text style={[{ fontSize: 15, lineHeight: 22, color: captionColor ?? t.mutedOnBg, marginTop: 8 }, W.regular]}>{caption}</Text> : null}
    </View>
  )
}

/** Très grand titre (bilans, célébrations). */
export function Big({ eyebrow, title, size = 52, sub, center, color, pt = 20 }: { eyebrow?: string; title: string; size?: number; sub?: string; center?: boolean; color?: string; pt?: number }) {
  const t = useTone()
  const align = center ? ('center' as const) : undefined
  return (
    <View style={{ paddingTop: pt, paddingHorizontal: kitPad(22) }}>
      {eyebrow ? <Eyebrow style={{ marginBottom: 12, textAlign: align }}>{eyebrow}</Eyebrow> : null}
      <Text style={[{ fontSize: size, lineHeight: Math.round(size * 1.08), letterSpacing: size > 40 ? -1.5 : -0.6, color: color ?? t.onBg, textAlign: align }, W.title]}>{title}</Text>
      {sub ? <Text style={[{ fontSize: 17, lineHeight: 25, color: t.mutedOnBg, marginTop: 12, textAlign: align }, W.regular]}>{sub}</Text> : null}
    </View>
  )
}

/** Bloc centré qui remplit l'espace : grande pastille d'icône, chiffre, titre, texte. */
export function Center({ icon, iconSize = 120, square, iconBg, iconColor, value, valueSize = 80, valueColor, title, size = 32, titleColor, sub, subColor, children }: {
  icon?: IconName; iconSize?: number; square?: boolean; iconBg?: string; iconColor?: string; value?: string; valueSize?: number; valueColor?: string
  title?: string; size?: number; titleColor?: string; sub?: string; subColor?: string; children?: ReactNode
}) {
  const t = useTone()
  return (
    <View style={styles.centerBlock}>
      {icon ? (
        <View style={[styles.center, { width: iconSize, height: iconSize, borderRadius: square ? Math.min(RADIUS.card, 30) : iconSize / 2, backgroundColor: iconBg ?? (t.dark ? t.surface : '#FFFFFF') }]}>
          <Icon {...icon} size={iconSize * 0.5} color={iconColor ?? t.hl} />
        </View>
      ) : null}
      {children}
      {value ? <FitNum value={value} size={valueSize} color={valueColor ?? t.onBg} /> : null}
      {title ? <Text style={[{ fontSize: size, lineHeight: Math.round(size * 1.08), letterSpacing: -0.6, color: titleColor ?? t.onBg, textAlign: 'center' }, W.title]}>{title}</Text> : null}
      {sub ? <Text style={[{ fontSize: 16, lineHeight: 23, color: subColor ?? t.mutedOnBg, textAlign: 'center' }, W.regular]}>{sub}</Text> : null}
    </View>
  )
}

// ─── Données ────────────────────────────────────────────────────────────────

/** Anneau de progression (trait 8, bout arrondi) qui se remplit en 600 ms. */
export function Ring({ progress, value, valueSize = 30, caption, size = 150, color, track, pt = 18, children }: {
  progress: number; value?: string; valueSize?: number; caption?: string; size?: number; color?: string; track?: string; pt?: number; children?: ReactNode
}) {
  const t = useTone()
  const p = useTween(Math.max(0, Math.min(1, progress)))
  const C = 2 * Math.PI * 42
  return (
    <View style={{ paddingTop: pt, alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Circle cx={50} cy={50} r={42} fill="none" stroke={track ?? t.track} strokeWidth={8} />
          <Circle cx={50} cy={50} r={42} fill="none" stroke={color ?? t.accent} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={`${C} ${C}`} strokeDashoffset={C * (1 - p)} transform="rotate(-90 50 50)" />
        </Svg>
        {/* Contenu centré DANS l'anneau : marge = épaisseur du trait + air, chiffre centré
            (FitNum s'étire sur toute la largeur et alignait le chiffre à gauche). */}
        <View style={[StyleSheet.absoluteFill, styles.center, { paddingHorizontal: size * 0.16 }]}>
          {children}
          {value ? <FitNum value={value} size={valueSize} color={t.onBg} style={{ textAlign: 'center' }} /> : null}
          {caption ? <Text style={[{ fontSize: 12, color: t.muted, marginTop: 6, textAlign: 'center' }, W.medium]}>{caption}</Text> : null}
        </View>
      </View>
    </View>
  )
}

/** Barres verticales dans une carte ; la barre `highlight` (la dernière par défaut) est pleine,
 * les autres dans la même teinte atténuée (jamais la couleur des pistes : elles auraient l'air vides). */
export function Bars({ values, labels, title, right, height = 110, highlight, color, mt = 16 }: {
  values: number[]; labels?: string[]; title?: string; right?: string; height?: number; highlight?: number; color?: string; mt?: number
}) {
  const t = useTone()
  const max = Math.max(...values, 1)
  const hi = highlight ?? values.length - 1
  const hiColor = color ?? (t.dark ? t.hl : t.accent === t.surface ? t.ink : t.hl)
  return (
    <View style={{ marginTop: mt, marginHorizontal: 16 }}>
      <Card padding={16}>
        {title ? (
          <View style={styles.rowBetween}>
            <Text style={[{ fontSize: 15, color: t.ink }, W.bold]}>{title}</Text>
            {right ? <Text style={[{ fontSize: 13, color: t.dark ? t.hl : t.eyebrow }, W.semibold]}>{right}</Text> : null}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height, marginTop: title ? 12 : 0 }}>
          {values.map((v, i) => (
            <View key={i} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
              <View style={{ width: '100%', height: `${(v / max) * (labels ? 82 : 100)}%`, minHeight: v > 0 ? 4 : 0, borderRadius: kitRad(10), backgroundColor: hiColor, opacity: i === hi ? 1 : 0.28 }} />
              {labels ? <Text style={[{ fontSize: 11, color: t.muted }, W.semibold]}>{labels[i]}</Text> : null}
            </View>
          ))}
        </View>
      </Card>
    </View>
  )
}

/** Courbe dans une carte : en-tête (libellé, montant, pastille d'écart), aire teintée, point final. */
export function LineChart({ eyebrow, value, valueSize = 34, delta, deltaColor, deltaBg, values, values2, labels, legend, color, height = 100, mt = 16 }: {
  eyebrow?: string; value?: string; valueSize?: number; delta?: string; deltaColor?: string; deltaBg?: string; values: number[]; values2?: number[]
  labels?: string[]; legend?: string[]; color?: string; height?: number; mt?: number
}) {
  const t = useTone()
  const { width } = useWindowDimensions()
  const w = Math.min(width, 430) - 64
  const c = color ?? t.hl
  const all = values.concat(values2 ?? [])
  const mx = Math.max(...all)
  const mn = Math.min(...all)
  const rg = mx - mn || 1
  const pts = (v: number[]) => v.map((y, i) => [(i * w) / (v.length - 1), 8 + (height - 16) * (1 - (y - mn) / rg)])
  const d = (p: number[][]) => p.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ')
  const p1 = pts(values)
  const last = p1[p1.length - 1]
  return (
    <View style={{ marginTop: mt, marginHorizontal: 16 }}>
      <Card padding={16}>
        {eyebrow || value ? (
          <View style={[styles.rowBetween, { alignItems: 'flex-start' }]}>
            <View style={{ flexShrink: 1 }}>
              {eyebrow ? <Text style={[{ fontSize: 13, color: t.muted }, W.semibold]}>{eyebrow}</Text> : null}
              {value ? <FitNum value={value} size={valueSize} color={t.ink} style={{ marginTop: 6, letterSpacing: -1 }} /> : null}
            </View>
            {delta ? (
              <View style={{ paddingHorizontal: kitPad(9), paddingVertical: kitPad(6), borderRadius: 99, backgroundColor: deltaBg ?? (t.dark ? 'rgba(94,230,168,0.14)' : '#E3F5EA') }}>
                <Text style={[{ fontSize: 12, color: deltaColor ?? t.positive }, W.bold]}>{delta}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Svg width={w} height={height} style={{ marginTop: 14 }}>
          {[0.25, 0.5, 0.75].map((g) => <Line key={g} x1={0} x2={w} y1={height * g} y2={height * g} stroke={t.dark ? 'rgba(255,255,255,0.08)' : t.track} strokeDasharray="3 4" />)}
          {values2 ? <Path d={d(pts(values2))} fill="none" stroke={t.muted} strokeWidth={1.5} strokeDasharray="4 4" /> : null}
          <Path d={`${d(p1)} L${w} ${height} L0 ${height} Z`} fill={c} fillOpacity={0.14} />
          <Path d={d(p1)} fill="none" stroke={c} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={last[0]} cy={last[1]} r={5} fill={c} stroke={t.dark ? '#0A0A0C' : '#FFFFFF'} strokeWidth={2.5} />
        </Svg>
        {labels ? (
          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            {labels.map((l, i) => <Text key={i} style={[{ fontSize: 11, color: t.muted }, W.semibold]}>{l}</Text>)}
          </View>
        ) : null}
        {legend ? (
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
            {legend.map((l, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 14, borderTopWidth: 2.5, borderStyle: i ? 'dashed' : 'solid', borderColor: i ? t.muted : c }} />
                <Text style={[{ fontSize: 11.5, color: t.muted }, W.semibold]}>{l}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </View>
  )
}

export type DonutSegment = { value: number; color: string; label: string; display: string }
/** Anneau de répartition (catégories) + légende à droite. */
export function Donut({ segments, value, caption, size = 140, valueSize = 22, mt = 16 }: { segments: DonutSegment[]; value: string; caption?: string; size?: number; valueSize?: number; mt?: number }) {
  const t = useTone()
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const C = 2 * Math.PI * 40
  let off = 0
  return (
    <View style={{ marginTop: mt, marginHorizontal: 16 }}>
      <Card padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx={50} cy={50} r={40} fill="none" stroke={t.dark ? 'rgba(255,255,255,0.08)' : t.track} strokeWidth={13} />
            {segments.map((s, i) => {
              const L = (s.value / total) * C
              const l = Math.max(L - 2, 0.5)
              const el = <Circle key={i} cx={50} cy={50} r={40} fill="none" stroke={s.color} strokeWidth={13} strokeDasharray={`${l} ${C - l}`} strokeDashoffset={-off} transform="rotate(-90 50 50)" />
              off += L
              return el
            })}
          </Svg>
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <FitNum value={value} size={valueSize} color={t.ink} style={{ letterSpacing: -0.6 }} />
            {caption ? <Text style={[{ fontSize: 11, color: t.muted, marginTop: 4 }, W.medium]}>{caption}</Text> : null}
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 10 }}>
          {segments.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
              <Text numberOfLines={1} style={[{ flex: 1, fontSize: 13, color: t.ink }, W.semibold]}>{s.label}</Text>
              <Text style={[{ fontSize: 13, color: t.ink }, W.bold]}>{s.display}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  )
}

export type Metric = { value: string; label: string; icon?: IconName; bg?: string; color?: string; onPress?: () => void }
/** Rangée de 2-3 cartes chiffrées (icône, valeur, légende). `bg` : carte pleine couleur. */
export function Metrics({ items, mt = 16 }: { items: Metric[]; mt?: number }) {
  const t = useTone()
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingTop: mt, paddingHorizontal: kitPad(16) }}>
      {items.map((m, i) => {
        const fg = m.color ?? (m.bg ? onColor(m.bg) : t.ink)
        const tile = (
          <View style={[styles.metric, { backgroundColor: m.bg ?? t.surface }, t.shadow && !m.bg ? SHADOW : null]}>
            <Icon {...(m.icon ?? { name: 'bolt.fill', android: 'flash' })} size={20} color={m.bg ? fg : t.hl} />
            <Text numberOfLines={1} style={[num(24, fg), { marginTop: 10, lineHeight: 28 }]}>{m.value}</Text>
            <Text numberOfLines={2} style={[{ fontSize: 11, lineHeight: 14, color: m.bg ? alpha(fg === '#FFFFFF' ? '#FFFFFF' : fg, 0.85) : t.muted, marginTop: 6 }, W.semibold]}>{m.label}</Text>
          </View>
        )
        return m.onPress
          ? <Pressable key={i} onPress={m.onPress} accessibilityRole="button" style={{ flex: 1, minWidth: 0 }}>{tile}</Pressable>
          : <View key={i} style={{ flex: 1, minWidth: 0 }}>{tile}</View>
      })}
    </View>
  )
}

/** Jauge horizontale avec libellé et valeur. */
export function ProgressBar({ label, right, progress, color, height = 10, mt = 16, mx = 22 }: { label?: string; right?: string; progress: number; color?: string; height?: number; mt?: number; mx?: number }) {
  const t = useTone()
  const p = useTween(Math.max(0, Math.min(1, progress)))
  return (
    <View style={{ marginTop: mt, marginHorizontal: mx }}>
      {label ? (
        <View style={[styles.rowBetween, { marginBottom: 8 }]}>
          <Text style={[{ fontSize: 13, color: t.mutedOnBg }, W.semibold]}>{label}</Text>
          <Text style={[{ fontSize: 13, color: t.onBg }, W.semibold]}>{right ?? `${Math.round(progress * 100)} %`}</Text>
        </View>
      ) : null}
      <View style={{ height, borderRadius: 99, backgroundColor: t.track, overflow: 'hidden' }}>
        <View style={{ width: `${p * 100}%`, height: '100%', borderRadius: 99, backgroundColor: color ?? t.hl }} />
      </View>
    </View>
  )
}

/** Semaine en pastilles : jours faits (surlignage), jour actif (foncé), à venir (contour). */
export function Week({ labels, numbers, done = [], active = 3, onPress, mt = 16 }: { labels: string[]; numbers?: string[]; done?: number[]; active?: number; onPress?: (i: number) => void; mt?: number }) {
  const t = useTone()
  return (
    <View style={[styles.rowBetween, { paddingTop: mt, paddingHorizontal: kitPad(22) }]}>
      {labels.map((d, i) => {
        const act = i === active
        const ok = done.includes(i)
        const bg = act ? (t.dark ? '#FFFFFF' : t.ink) : ok ? t.hl : 'transparent'
        const fg = act ? (t.dark ? '#000000' : '#FFFFFF') : ok ? (contrast('#000000', t.hl) >= 4 ? '#000000' : '#FFFFFF') : t.onBg
        return (
          <Pressable key={i} onPress={onPress ? () => onPress(i) : undefined} disabled={!onPress} style={{ alignItems: 'center', gap: 6 }}>
            <Text style={[{ fontSize: 11, color: t.mutedOnBg }, W.semibold]}>{d}</Text>
            <View style={[styles.dayDot, { backgroundColor: bg }, !act && !ok ? { borderWidth: 1.5, borderColor: t.track } : null]}>
              <Text style={[{ fontSize: 13, color: fg }, W.bold]}>{numbers ? numbers[i] : ''}</Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

/** Barre de répartition (segments en %) + légende sur deux colonnes. */
export function Allocation({ title, segments, mt = 16 }: { title?: string; segments: { pct: number; color: string; label: string }[]; mt?: number }) {
  const t = useTone()
  return (
    <View style={{ marginTop: mt, marginHorizontal: 16 }}>
      <Card padding={16}>
        {title ? <Text style={[{ fontSize: 15, color: t.ink, marginBottom: 12 }, W.bold]}>{title}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 3, height: 12, borderRadius: 99, overflow: 'hidden' }}>
          {segments.map((s, i) => <View key={i} style={{ flex: s.pct, backgroundColor: s.color }} />)}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 9 }}>
          {segments.map((s, i) => (
            <View key={i} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: kitPad(14) }}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: s.color }} />
              <Text style={[{ flex: 1, fontSize: 12.5, color: t.ink }, W.semibold]}>{s.label}</Text>
              <Text style={[{ fontSize: 12.5, color: t.muted }, W.semibold]}>{s.pct} %</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  )
}

// ─── Listes ─────────────────────────────────────────────────────────────────

export type ListRow = {
  /** icône dans une tuile (fond `iconBg`, sinon tuile claire et icône surlignée) */
  icon?: IconName; iconBg?: string; iconColor?: string
  /** photo ronde à la place de l'icône */
  image?: Src
  title: string; sub?: string
  /** valeur à droite ; sans valeur ni interrupteur : chevron */
  right?: string; rightColor?: string
  toggle?: boolean; onToggle?: (v: boolean) => void
  onPress?: () => void
}
/** Liste groupée dans une carte, séparateurs fins, surtitre optionnel au-dessus. */
export function List({ title, rows, mt = 16 }: { title?: string; rows: ListRow[]; mt?: number }) {
  const t = useTone()
  return (
    <View style={{ marginTop: mt, marginHorizontal: 16 }}>
      {title ? <Eyebrow color={t.mutedOnBg} style={{ paddingHorizontal: kitPad(6), paddingBottom: kitPad(10) }}>{title}</Eyebrow> : null}
      <Card style={{ overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <Pressable key={i} onPress={r.onPress} disabled={!r.onPress} accessibilityRole={r.onPress ? 'button' : undefined}
            style={({ pressed }) => [styles.row, i < rows.length - 1 ? { borderBottomWidth: 1, borderBottomColor: t.dark ? 'rgba(255,255,255,0.07)' : t.track } : null, pressed && { opacity: 0.7 }]}>
            {r.image ? <Image source={r.image} style={styles.rowImg} />
              : r.icon ? (
                <View style={[styles.rowIcon, { backgroundColor: r.iconBg ?? t.chip }]}>
                  <Icon {...r.icon} size={22} color={r.iconColor ?? (r.iconBg ? '#FFFFFF' : !t.dark ? t.hl : t.chipInk)} />
                </View>
              ) : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={[{ fontSize: 15, lineHeight: 18, color: t.ink }, W.bold]}>{r.title}</Text>
              {r.sub ? <Text numberOfLines={2} style={[{ fontSize: 13, lineHeight: 17, color: t.muted, marginTop: 3 }, W.regular]}>{r.sub}</Text> : null}
            </View>
            {r.toggle != null ? <Toggle on={r.toggle} onChange={r.onToggle} label={r.title} />
              : r.right != null ? <Text style={[{ fontSize: 14, color: r.rightColor ?? t.ink, textAlign: 'right' }, W.bold]}>{r.right}</Text>
                : <Icon name="chevron.right" android="chevron-forward" size={20} color={t.muted} />}
          </Pressable>
        ))}
      </Card>
    </View>
  )
}

export type TxnRow = { mono: Mono; title: string; sub: string; amount: string; tag?: string; tagBg?: string; tagColor?: string; onPress?: () => void }
/** Opérations groupées par jour : titre du jour et total au-dessus de chaque carte. */
export function Transactions({ groups, mt = 16 }: { groups: { title?: string; total?: string; rows: TxnRow[] }[]; mt?: number }) {
  const t = useTone()
  return (
    <View style={{ marginTop: mt, marginHorizontal: 16, gap: 14 }}>
      {groups.map((g, gi) => (
        <View key={gi}>
          {g.title || g.total ? (
            <View style={[styles.rowBetween, { paddingHorizontal: kitPad(6), paddingBottom: kitPad(8) }]}>
              <Text style={[{ fontSize: 13, color: t.mutedOnBg }, W.semibold]}>{g.title}</Text>
              <Text style={[{ fontSize: 13, color: t.mutedOnBg }, W.semibold]}>{g.total ?? ''}</Text>
            </View>
          ) : null}
          <Card style={{ overflow: 'hidden' }}>
            {g.rows.map((r, i) => (
              <Pressable key={i} onPress={r.onPress} disabled={!r.onPress} accessibilityRole={r.onPress ? 'button' : undefined}
                style={({ pressed }) => [styles.txn, i < g.rows.length - 1 ? { borderBottomWidth: 1, borderBottomColor: t.dark ? 'rgba(255,255,255,0.08)' : t.track } : null, pressed && { opacity: 0.7 }]}>
                <MonoBadge mono={r.mono} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={[{ fontSize: 15, lineHeight: 18, color: t.ink }, W.bold]}>{r.title}</Text>
                  <Text numberOfLines={1} style={[{ fontSize: 12.5, lineHeight: 16, color: t.muted, marginTop: 3 }, W.medium]}>{r.sub}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[{ fontSize: 15, color: r.amount.startsWith('+') ? t.positive : t.ink, fontVariant: ['tabular-nums'] }, W.bold]}>{r.amount}</Text>
                  {r.tag ? (
                    <View style={{ marginTop: 5, paddingHorizontal: kitPad(7), paddingVertical: kitPad(4), borderRadius: 99, backgroundColor: r.tagBg ?? (t.dark ? 'rgba(255,255,255,0.1)' : t.track) }}>
                      <Text style={[{ fontSize: 11, color: r.tagColor ?? t.ink }, W.bold]}>{r.tag}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </Card>
        </View>
      ))}
    </View>
  )
}

export type BudgetRow = { mono: Mono; title: string; sub: string; right: string; progress: number; color?: string; onPress?: () => void }
/** Enveloppes / budgets par catégorie : pastille, montants, jauge (orange au-delà de 100 %). */
export function Budgets({ rows, mt = 16 }: { rows: BudgetRow[]; mt?: number }) {
  const t = useTone()
  return (
    <View style={{ marginTop: mt, marginHorizontal: 16 }}>
      <Card style={{ overflow: 'hidden' }}>
        {rows.map((r, i) => {
          const over = r.progress > 1
          return (
            <Pressable key={i} onPress={r.onPress} disabled={!r.onPress} accessibilityRole={r.onPress ? 'button' : undefined}
              style={({ pressed }) => [{ paddingVertical: kitPad(13), paddingHorizontal: kitPad(14) }, i < rows.length - 1 ? { borderBottomWidth: 1, borderBottomColor: t.dark ? 'rgba(255,255,255,0.08)' : t.track } : null, pressed && { opacity: 0.7 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MonoBadge mono={r.mono} size={38} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={[{ fontSize: 15, lineHeight: 18, color: t.ink }, W.bold]}>{r.title}</Text>
                  <Text numberOfLines={1} style={[{ fontSize: 12.5, lineHeight: 16, color: t.muted, marginTop: 3 }, W.medium]}>{r.sub}</Text>
                </View>
                <Text style={[{ fontSize: 14, color: over ? t.over : t.ink }, W.bold]}>{r.right}</Text>
              </View>
              <View style={{ height: 6, borderRadius: 99, backgroundColor: t.dark ? 'rgba(255,255,255,0.08)' : t.track, marginTop: 10, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(r.progress, 1) * 100}%`, height: '100%', borderRadius: 99, backgroundColor: over ? '#FF9500' : r.color ?? r.mono.fg ?? t.hl }} />
              </View>
            </Pressable>
          )
        })}
      </Card>
    </View>
  )
}

/** Carrousel horizontal de cartes de comptes en dégradé. */
export function Accounts({ items, width = 170, height = 108, mt = 16 }: {
  items: { name: string; sub: string; amount: string; gradient: string[]; color?: string; icon: IconName; onPress?: () => void }[]; width?: number; height?: number; mt?: number
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10, paddingTop: mt, paddingLeft: kitPad(16), paddingRight: kitPad(16) }}>
      {items.map((a, i) => {
        const fg = a.color ?? '#FFFFFF'
        return (
          <Pressable key={i} onPress={a.onPress} disabled={!a.onPress} accessibilityRole={a.onPress ? 'button' : undefined}>
            <Grad colors={a.gradient} style={{ width, height, borderRadius: Math.min(RADIUS.card, 22), padding: kitPad(14), justifyContent: 'space-between' }}>
              <View style={styles.rowBetween}>
                <Text style={[{ fontSize: 13, color: fg }, W.bold]}>{a.name}</Text>
                <Icon {...a.icon} size={18} color={fg} />
              </View>
              <View>
                <Text style={[num(22, fg), { letterSpacing: -0.6 }]}>{a.amount}</Text>
                <Text numberOfLines={1} style={[{ fontSize: 12, color: fg, marginTop: 5 }, W.medium]}>{a.sub}</Text>
              </View>
            </Grad>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

/** Encart d'information : icône colorée + phrase. */
export function Note({ icon = { name: 'info.circle', android: 'information-circle-outline' }, color, text, bg, mt = 16, onPress }: { icon?: IconName; color?: string; text: string; bg?: string; mt?: number; onPress?: () => void }) {
  const t = useTone()
  return (
    <View style={{ marginTop: mt, marginHorizontal: 16 }}>
      <Card bg={bg} onPress={onPress} style={{ paddingVertical: kitPad(14), paddingHorizontal: kitPad(16), flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Icon {...icon} size={24} color={color ?? t.hl} />
        <Text style={[{ flex: 1, fontSize: 14, lineHeight: 20, color: t.ink }, W.medium]}>{text}</Text>
      </Card>
    </View>
  )
}

// ─── Sélecteurs ─────────────────────────────────────────────────────────────

/** Contrôle segmenté (pilule). */
export function Segmented({ items, active, onChange, mt = 16 }: { items: string[]; active: number; onChange?: (i: number) => void; mt?: number }) {
  const t = useTone()
  return (
    <View style={[styles.seg, { marginTop: mt, backgroundColor: t.dark ? t.surface : t.track }]}>
      {items.map((x, i) => (
        <Pressable key={i} onPress={() => onChange?.(i)} accessibilityRole="tab" accessibilityState={{ selected: i === active }}
          style={[styles.segItem, i === active ? { backgroundColor: '#FFFFFF' } : null]}>
          <Text numberOfLines={1} style={[{ fontSize: 14, color: i === active ? (t.dark ? '#000000' : t.ink) : t.muted }, i === active ? W.bold : W.medium]}>{x}</Text>
        </Pressable>
      ))}
    </View>
  )
}

/** Filtres en pilules (défilement horizontal, ou retour à la ligne avec `wrap`). */
export function Chips({ items, active, onChange, wrap, mt = 16 }: { items: string[]; active: number; onChange?: (i: number) => void; wrap?: boolean; mt?: number }) {
  const t = useTone()
  const chips = items.map((x, i) => {
    const on = i === active
    return (
      <Pressable key={i} onPress={() => onChange?.(i)} accessibilityRole="button" accessibilityState={{ selected: on }}
        style={[styles.chip, { backgroundColor: on ? (t.dark ? t.accent : t.ink) : t.chip }, !on && !t.dark && t.shadow ? SHADOW : null]}>
        <Text numberOfLines={1} style={[{ fontSize: 14, color: on ? (t.dark ? t.onAccent : '#FFFFFF') : t.chipInk }, on ? W.bold : W.semibold]}>{x}</Text>
      </Pressable>
    )
  })
  if (wrap) return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: mt, paddingHorizontal: kitPad(20) }}>{chips}</View>
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingTop: mt, paddingHorizontal: kitPad(20) }}>{chips}</ScrollView>
}

export type TagItem = { label: string; active?: boolean; bg?: string; color?: string; icon?: IconName; onPress?: () => void }
/** Étiquettes à retour à la ligne (suggestions, filtres multiples). */
export function Tags({ items, center, mt = 14 }: { items: TagItem[]; center?: boolean; mt?: number }) {
  const t = useTone()
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: mt, paddingHorizontal: kitPad(20), justifyContent: center ? 'center' : 'flex-start' }}>
      {items.map((x, i) => {
        const bg = x.active ? x.bg ?? t.ink : t.dark ? 'rgba(255,255,255,0.08)' : t.chip
        const fg = x.active ? x.color ?? (t.dark ? '#000000' : '#FFFFFF') : t.dark ? '#FFFFFF' : t.chipInk
        return (
          <Pressable key={i} onPress={x.onPress} disabled={!x.onPress} accessibilityRole={x.onPress ? 'button' : undefined}
            style={[styles.tag, { backgroundColor: bg }, !x.active && !t.dark ? { borderWidth: 1, borderColor: t.track } : null]}>
            {x.icon ? <Icon {...x.icon} size={17} color={fg} /> : null}
            <Text style={[{ fontSize: 14, color: fg }, x.active ? W.bold : W.semibold]}>{x.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

/** Liste déroulante compacte pour choisir une enveloppe parmi une liste qui peut grandir. */
export function Dropdown({ items, placeholder = 'Choisir une enveloppe', mt = 10 }: { items: TagItem[]; placeholder?: string; mt?: number }) {
  const t = useTone()
  const [open, setOpen] = useState(false)
  const selected = items.find((item) => item.active)
  return (
    <View style={{ marginTop: mt }}>
      <Pressable onPress={() => setOpen((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: open }}
        accessibilityLabel={selected?.label ?? placeholder}
        style={({ pressed }) => [{ minHeight: 48, paddingHorizontal: 14, borderRadius: kitRad(14), backgroundColor: t.dark ? t.surface : '#FFFFFF', borderWidth: 1, borderColor: t.track, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.75 : 1 }]}>
        {selected?.icon ? <Icon {...selected.icon} size={19} color={t.hl} /> : null}
        <Text numberOfLines={1} style={[{ flex: 1, fontSize: 15, color: selected ? t.ink : t.muted }, selected ? W.semibold : W.medium]}>{selected?.label ?? placeholder}</Text>
        <Icon name="chevron.down" android="chevron-down" size={18} color={t.muted} />
      </Pressable>
      {open ? (
        <View style={{ marginTop: 6, maxHeight: 240, borderRadius: kitRad(14), overflow: 'hidden', backgroundColor: t.surface, ...(t.shadow ? SHADOW : {}) }}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {items.map((item, index) => (
              <Pressable key={`${item.label}-${index}`} onPress={() => { item.onPress?.(); setOpen(false) }} disabled={!item.onPress} accessibilityRole="button" accessibilityState={{ selected: !!item.active }}
                style={({ pressed }) => [{ minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: index < items.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: t.track, opacity: pressed ? 0.7 : 1 }]}>
                {item.icon ? <Icon {...item.icon} size={19} color={item.active ? t.hl : t.muted} /> : null}
                <Text numberOfLines={1} style={[{ flex: 1, fontSize: 15, color: t.ink }, item.active ? W.bold : W.medium]}>{item.label}</Text>
                {item.active ? <Icon name="checkmark.circle.fill" android="checkmark-circle" size={19} color={t.hl} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  )
}

/** Champ de saisie (56 pt) avec icône. */
export function Field({ icon, placeholder, value, onChangeText, mt = 16, onSubmit, keyboardType }: {
  icon?: IconName; placeholder: string; value?: string; onChangeText?: (v: string) => void; mt?: number; onSubmit?: () => void; keyboardType?: 'default' | 'numeric' | 'email-address'
}) {
  const t = useTone()
  return (
    <View style={{ marginTop: mt, marginHorizontal: 20 }}>
      <View style={[styles.field, { backgroundColor: t.dark ? t.surface : '#FFFFFF' }, !t.dark ? { borderWidth: 1.5, borderColor: t.track } : null]}>
        {icon ? <Icon {...icon} size={22} color={t.muted} /> : null}
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={t.muted} onSubmitEditing={onSubmit}
          keyboardType={keyboardType} returnKeyType="done" style={[{ flex: 1, fontSize: 16, color: t.ink, paddingVertical: 0 }, W.medium]} />
      </View>
    </View>
  )
}

// ─── Discussion ─────────────────────────────────────────────────────────────

/** Bulle de discussion ; `mine` : à droite, couleur d’accent. `text` peut contenir des <Text> en gras ; `children` : contenu riche sous le texte. */
export function Bubble({ text, mine, children }: { text: ReactNode; mine?: boolean; children?: ReactNode }) {
  const t = useTone()
  return (
    <View style={[styles.bubble, mine ? { alignSelf: 'flex-end', backgroundColor: t.accent, borderBottomRightRadius: kitRad(6) } : { alignSelf: 'flex-start', backgroundColor: t.dark ? t.surface : '#FFFFFF', borderBottomLeftRadius: kitRad(6) }]}>
      <Text style={[{ fontSize: 15, lineHeight: 21, color: mine ? t.onAccent : t.ink }, W.medium]}>{text}</Text>
      {children}
    </View>
  )
}

/** Zone de saisie d'une discussion : champ pilule + bouton d'envoi rond. */
export function Composer({ placeholder, value, onChangeText, onSend, sendLabel }: { placeholder: string; value: string; onChangeText: (v: string) => void; onSend: () => void; sendLabel: string }) {
  const t = useTone()
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={t.muted} onSubmitEditing={onSend} returnKeyType="send"
        style={[styles.composer, { backgroundColor: t.dark ? t.surface : '#FFFFFF', color: t.ink }, W.medium]} />
      <Pressable onPress={onSend} accessibilityRole="button" accessibilityLabel={sendLabel} style={[styles.send, { backgroundColor: t.accent }]}>
        <Icon name="paperplane.fill" android="send" size={20} color={t.onAccent} />
      </Pressable>
    </View>
  )
}

// ─── Photos et cartes visuelles ─────────────────────────────────────────────

/** Grande photo (bord à bord avec `full`), légende sur voile dégradé en bas. */
export function Photo({ source, height = 220, full, caption, eyebrow, captionSize = 26, mt = 16, children }: {
  source: Src; height?: number; full?: boolean; caption?: string; eyebrow?: string; captionSize?: number; mt?: number; children?: ReactNode
}) {
  return (
    <ImageBackground source={source} resizeMode="cover" style={{ marginTop: mt, marginHorizontal: full ? 0 : 16, height, borderRadius: full ? 0 : RADIUS.card, overflow: 'hidden', backgroundColor: caption ? '#1C1C1E' : '#CCCCCC' }}>
      {caption ? (
        <>
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', left: 18, right: 18, bottom: 16 }}>
            {eyebrow ? <Text style={[{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }, W.bold]}>{eyebrow}</Text> : null}
            <Text style={[{ fontSize: captionSize, lineHeight: Math.round(captionSize * 1.08), letterSpacing: -0.6, color: '#FFFFFF' }, W.title]}>{caption}</Text>
          </View>
        </>
      ) : null}
      {children}
    </ImageBackground>
  )
}

/** Rangée horizontale de vignettes photo avec titre, sous-titre et étiquette. */
export function PhotoRail({ items, width = 150, height = 110, mt = 16 }: { items: { source: Src; title: string; sub?: string; tag?: string; onPress?: () => void }[]; width?: number; height?: number; mt?: number }) {
  const t = useTone()
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10, paddingTop: mt, paddingLeft: kitPad(16), paddingRight: kitPad(16) }}>
      {items.map((p, i) => (
        <Pressable key={i} onPress={p.onPress} disabled={!p.onPress} style={{ width }}>
          <ImageBackground source={p.source} resizeMode="cover" style={{ height, borderRadius: Math.min(RADIUS.card, 18), overflow: 'hidden', backgroundColor: '#CCCCCC' }}>
            {p.tag ? (
              <View style={{ position: 'absolute', left: 10, top: 10, paddingHorizontal: kitPad(8), paddingVertical: kitPad(6), borderRadius: 99, backgroundColor: t.hl }}>
                <Text style={[{ fontSize: 11, color: contrast('#000000', t.hl) >= 4 ? '#000000' : '#FFFFFF' }, W.bold]}>{p.tag}</Text>
              </View>
            ) : null}
          </ImageBackground>
          <Text numberOfLines={2} style={[{ fontSize: 14, lineHeight: 17, color: t.onBg, marginTop: 8 }, W.bold]}>{p.title}</Text>
          {p.sub ? <Text numberOfLines={1} style={[{ fontSize: 12, color: t.mutedOnBg, marginTop: 3 }, W.medium]}>{p.sub}</Text> : null}
        </Pressable>
      ))}
    </ScrollView>
  )
}

/** Pile d'avatars qui se chevauchent + phrase. */
export function Avatars({ sources, text, size = 36, mt = 14 }: { sources: Src[]; text: string; size?: number; mt?: number }) {
  const t = useTone()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: mt, paddingHorizontal: kitPad(22) }}>
      <View style={{ flexDirection: 'row' }}>
        {sources.map((s, i) => (
          <Image key={i} source={s} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2.5, borderColor: t.dark ? '#000000' : '#FFFFFF', marginLeft: i ? -12 : 0, backgroundColor: '#CCCCCC' }} />
        ))}
      </View>
      <Text style={[{ flex: 1, fontSize: 14, lineHeight: 18, color: t.mutedOnBg }, W.semibold]}>{text}</Text>
    </View>
  )
}

/** Carte en dégradé (séance du jour, objectif) : surtitre, titre, texte, bouton blanc ou gros chiffre, photo fondue à droite. */
export function GradientCard({ colors, angle = 135, eyebrow, title, size = 26, sub, button, onPress, value, unit, image, orb, minHeight = 170, ink, mt = 16, children }: {
  colors: string[]; angle?: number; eyebrow?: string; title: string; size?: number; sub?: string; button?: string; onPress?: () => void
  value?: string; unit?: string; image?: Src; orb?: boolean; minHeight?: number; ink?: string; mt?: number; children?: ReactNode
}) {
  const fg = ink ?? '#FFFFFF'
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} style={{ marginTop: mt, marginHorizontal: 16 }}>
      <Grad colors={colors} angle={angle} style={{ borderRadius: RADIUS.card, minHeight, padding: kitPad(20), justifyContent: 'space-between' }}>
        {image ? (
          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '46%' }}>
            <Image source={image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <LinearGradient colors={[colors[0], alpha(colors[0].startsWith('#') ? colors[0] : '#000000', 0)]} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFill} />
          </View>
        ) : null}
        {orb ? <Orb /> : null}
        <View style={{ maxWidth: image ? '60%' : '100%' }}>
          {eyebrow ? <Text style={[{ fontSize: 11, letterSpacing: 1.5, color: alpha(fg, 0.85), textTransform: 'uppercase' }, W.bold]}>{eyebrow}</Text> : null}
          <Text style={[{ fontSize: size, lineHeight: Math.round(size * 1.1), letterSpacing: -0.5, color: fg, marginTop: 8 }, W.title]}>{title}</Text>
          {sub ? <Text style={[{ fontSize: 14, lineHeight: 20, color: alpha(fg, 0.9), marginTop: 8 }, W.regular]}>{sub}</Text> : null}
        </View>
        {button ? (
          <View style={[styles.cardBtn, { backgroundColor: ink ? fg : '#FFFFFF' }]}>
            <Text style={[{ fontSize: 14, color: ink ? '#FFFFFF' : '#111111' }, W.bold]}>{button}</Text>
          </View>
        ) : null}
        {value ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
            <FitNum value={value} size={52} color={fg} />
            {unit ? <Text style={[{ fontSize: 14, color: alpha(fg, 0.85) }, W.medium]}>{unit}</Text> : null}
          </View>
        ) : null}
        {children}
      </Grad>
    </Pressable>
  )
}

/** Bandeau dégradé arrondi en bas (détail d'une habitude) : surtitre, titre, gros chiffre. */
export function Band({ colors, eyebrow, title, size = 40, sub, value, orb, mt = 16, radius = 36, ink }: {
  colors: string[]; eyebrow?: string; title: string; size?: number; sub?: string; value?: string; orb?: boolean; mt?: number; radius?: number; ink?: string
}) {
  const fg = ink ?? '#FFFFFF'
  return (
    <Grad colors={colors} angle={160} style={{ marginTop: mt, paddingTop: kitPad(24), paddingHorizontal: kitPad(22), paddingBottom: kitPad(30), borderBottomLeftRadius: radius, borderBottomRightRadius: radius }}>
      {orb ? <Orb size={240} right={-60} top={-60} opacity={0.4} /> : null}
      {eyebrow ? <Text style={[{ fontSize: 12, letterSpacing: 1.5, color: alpha(fg, 0.85), textTransform: 'uppercase' }, W.bold]}>{eyebrow}</Text> : null}
      <Text style={[{ fontSize: size, lineHeight: Math.round(size * 1.04), letterSpacing: -1, color: fg, marginTop: 10 }, W.title]}>{title}</Text>
      {sub ? <Text style={[{ fontSize: 15, lineHeight: 21, color: alpha(fg, 0.9), marginTop: 10 }, W.regular]}>{sub}</Text> : null}
      {value ? <FitNum value={value} size={64} color={fg} style={{ letterSpacing: -2, marginTop: 14 }} /> : null}
    </Grad>
  )
}

export type TileItem = { icon?: IconName; image?: Src; title: string; sub?: string; bg?: string; onPress?: () => void }
/** Grille de tuiles (2 ou 3 colonnes) : icône en haut, titre et sous-titre en bas. */
export function Tiles({ items, cols = 2, height = 120, gap = 12, mt = 16 }: { items: TileItem[]; cols?: number; height?: number; gap?: number; mt?: number }) {
  const t = useTone()
  const { width } = useWindowDimensions()
  const w = (Math.min(width, 430) - 32 - gap * (cols - 1)) / cols
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, paddingTop: mt, paddingHorizontal: kitPad(16) }}>
      {items.map((x, i) => {
        const fg = x.image ? '#FFFFFF' : x.bg ? onColor(x.bg) : t.ink
        const inner = (
          <>
            {x.image ? <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']} locations={[0.4, 1]} style={StyleSheet.absoluteFill} /> : x.icon ? <Icon {...x.icon} size={32} color={x.bg ? fg : t.hl} /> : null}
            <View style={{ marginTop: 'auto' }}>
              <Text numberOfLines={2} style={[{ fontSize: 17, lineHeight: 19, color: fg }, W.heavy]}>{x.title}</Text>
              {x.sub ? <Text numberOfLines={1} style={[{ fontSize: 12, color: x.image || x.bg ? alpha(fg, 0.9) : t.muted, marginTop: 5 }, W.semibold]}>{x.sub}</Text> : null}
            </View>
          </>
        )
        const box = [styles.tile, { width: w, height, backgroundColor: x.bg ?? t.surface }, t.shadow && !x.bg && !x.image ? SHADOW : null] as StyleProp<ViewStyle>
        return (
          <Pressable key={i} onPress={x.onPress} disabled={!x.onPress} accessibilityRole={x.onPress ? 'button' : undefined}>
            {x.image ? <ImageBackground source={x.image} resizeMode="cover" style={box}>{inner}</ImageBackground> : <View style={box}>{inner}</View>}
          </Pressable>
        )
      })}
    </View>
  )
}

export type BentoItem = {
  /** 2 = pleine largeur */
  span?: 1 | 2; height?: number; bg?: string; gradient?: string[]; color?: string
  icon?: IconName; iconColor?: string; tag?: string; value?: string; valueSize?: number; label: string; image?: Src; onPress?: () => void; children?: ReactNode
}
/** Grille bento : une tuile par élément, demi ou pleine largeur, chiffre + légende en bas. */
export function Bento({ items, mt = 16 }: { items: BentoItem[]; mt?: number }) {
  const t = useTone()
  const { width } = useWindowDimensions()
  const half = (Math.min(width, 430) - 32 - 10) / 2
  // Une tuile simple seule sur sa rangée (nombre impair, ou suivie d'une tuile double)
  // s'élargit : jamais de trou dans la grille.
  const wide = items.map(() => false)
  let col = 0
  let lastSingle = -1
  items.forEach((x, i) => {
    if (x.span === 2) { if (col === 1 && lastSingle >= 0) wide[lastSingle] = true; col = 0; lastSingle = -1; return }
    if (col === 0) { lastSingle = i; col = 1 } else { col = 0; lastSingle = -1 }
  })
  if (col === 1 && lastSingle >= 0) wide[lastSingle] = true
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: mt, paddingHorizontal: kitPad(16) }}>
      {items.map((x, i) => {
        const fg = x.color ?? t.ink
        const w = x.span === 2 || wide[i] ? half * 2 + 10 : half
        const box: StyleProp<ViewStyle> = [styles.bento, { width: w, minHeight: x.height ?? 110 }, !x.bg && !x.gradient ? [{ backgroundColor: t.surface }, t.shadow ? SHADOW : null] : { backgroundColor: x.bg }]
        const content = (
          <>
            {x.image ? (
              <ImageBackground source={x.image} resizeMode="cover" style={StyleSheet.absoluteFill}>
                <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']} locations={[0.3, 1]} style={StyleSheet.absoluteFill} />
              </ImageBackground>
            ) : null}
            <View style={styles.rowBetween}>
              {x.icon ? <Icon {...x.icon} size={24} color={x.iconColor ?? x.color ?? t.hl} /> : <View />}
              {x.tag ? <View style={styles.bentoTag}><Text style={[{ fontSize: 11, color: fg }, W.bold]}>{x.tag}</Text></View> : null}
            </View>
            {x.children}
            <View>
              {x.value ? <Text numberOfLines={1} style={[num(x.valueSize ?? 30, fg), { letterSpacing: -1 }]}>{x.value}</Text> : null}
              <Text numberOfLines={2} style={[{ fontSize: 13, lineHeight: 17, color: fg, opacity: 0.85, marginTop: 6 }, W.semibold]}>{x.label}</Text>
            </View>
          </>
        )
        return (
          <Pressable key={i} onPress={x.onPress} disabled={!x.onPress} accessibilityRole={x.onPress ? 'button' : undefined}>
            {x.gradient ? <Grad colors={x.gradient} style={box}>{content}</Grad> : <View style={box}>{content}</View>}
          </Pressable>
        )
      })}
    </View>
  )
}

/** Feuille du bas (scan d'un ticket) : poignée, titre, lignes, bouton. */
export function Sheet({ title, sub, rows = [], button, onPress, children }: { title?: string; sub?: string; rows?: { icon: IconName; label: string; value?: string }[]; button?: string; onPress?: () => void; children?: ReactNode }) {
  const t = useTone()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.sheet, { backgroundColor: t.dark ? t.surface : '#FFFFFF', paddingBottom: Math.max(insets.bottom, 16) + 6 }]}>
      <View style={[styles.grabber, { backgroundColor: t.track }]} />
      {title ? <Text style={[{ fontSize: 22, lineHeight: 24, color: t.ink }, W.title]}>{title}</Text> : null}
      {sub ? <Text style={[{ fontSize: 14, lineHeight: 20, color: t.muted }, W.regular]}>{sub}</Text> : null}
      {rows.map((r, i) => (
        <View key={i} style={[styles.sheetRow, { borderTopColor: t.track }]}>
          <Icon {...r.icon} size={22} color={!t.surface.startsWith('#') || contrast(t.hl, t.surface) >= 3 ? t.hl : t.accent} />
          <Text style={[{ flex: 1, fontSize: 15, color: t.ink }, W.semibold]}>{r.label}</Text>
          <Text style={[{ fontSize: 14, color: t.muted }, W.semibold]}>{r.value ?? ''}</Text>
        </View>
      ))}
      {children}
      {button ? <Button label={button} onPress={onPress} /> : null}
    </View>
  )
}

/** Trace de parcours dessinée (aperçu sans carte) : ligne épaisse sur une grille de rues stylisée. */
export function RouteSketch({ points, height = 170, color, mt = 16, full }: { points: [number, number][]; height?: number; color?: string; mt?: number; full?: boolean }) {
  const t = useTone()
  const { width } = useWindowDimensions()
  const w = Math.min(width, 430) - (full ? 0 : 32)
  const pts = points.map(([x, y]) => `${(x * w).toFixed(1)},${(y * height).toFixed(1)}`).join(' ')
  return (
    <View style={{ marginTop: mt, marginHorizontal: full ? 0 : 16, height, borderRadius: full ? 0 : RADIUS.card, overflow: 'hidden', backgroundColor: t.dark ? '#1A1F2B' : '#E8EBEF' }}>
      <Svg width={w} height={height}>
        {Array.from({ length: 7 }).map((_, i) => <Line key={`v${i}`} x1={(i + 0.5) * (w / 7)} x2={(i + 0.2) * (w / 7)} y1={0} y2={height} stroke={t.dark ? '#262D3B' : '#FFFFFF'} strokeWidth={6} />)}
        {Array.from({ length: 4 }).map((_, i) => <Line key={`h${i}`} x1={0} x2={w} y1={(i + 0.5) * (height / 4)} y2={(i + 0.7) * (height / 4)} stroke={t.dark ? '#262D3B' : '#FFFFFF'} strokeWidth={5} />)}
        <SvgPolyline points={pts} fill="none" stroke={color ?? t.accent} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </View>
  )
}

/** Espace extensible (pousse les blocs suivants vers le bas). */
export function Spacer() {
  return <View style={{ flex: 1 }} />
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  card: { borderRadius: RADIUS.card },
  toggle: { width: 52, height: 32, borderRadius: 99, padding: 3, flexDirection: 'row' },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF' },
  button: { height: 58, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: kitPad(18) },
  dot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4 },
  topBar: { paddingTop: kitPad(4), paddingHorizontal: kitPad(20), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  fabWrap: { position: 'absolute', right: 20, zIndex: 3 },
  fab: { height: 58, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: kitPad(6), paddingHorizontal: kitPad(20) },
  headerImg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#CCCCCC' },
  sh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, paddingHorizontal: kitPad(22) },
  centerBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: kitPad(30) },
  metric: { paddingVertical: kitPad(14), paddingHorizontal: kitPad(12), borderRadius: RADIUS.card },
  dayDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: kitPad(13), paddingHorizontal: kitPad(16) },
  rowImg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#CCCCCC' },
  rowIcon: { width: 40, height: 40, borderRadius: kitRad(12), alignItems: 'center', justifyContent: 'center' },
  txn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: kitPad(12), paddingHorizontal: kitPad(14) },
  seg: { marginHorizontal: 20, flexDirection: 'row', gap: 4, padding: kitPad(4), borderRadius: 99 },
  segItem: { flex: 1, height: 40, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingVertical: kitPad(10), paddingHorizontal: kitPad(15), borderRadius: 99 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: kitPad(9), paddingHorizontal: kitPad(14), borderRadius: 99 },
  field: { height: 56, borderRadius: kitRad(18), flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: kitPad(16) },
  bubble: { maxWidth: 260, paddingVertical: kitPad(11), paddingHorizontal: kitPad(14), borderRadius: kitRad(20) },
  composer: { flex: 1, height: 46, borderRadius: 99, paddingHorizontal: kitPad(16), fontSize: 15 },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  cardBtn: { alignSelf: 'flex-start', marginTop: 14, paddingVertical: kitPad(12), paddingHorizontal: kitPad(18), borderRadius: 99 },
  tile: { borderRadius: RADIUS.card, padding: kitPad(14), overflow: 'hidden' },
  bento: { borderRadius: RADIUS.card, padding: kitPad(16), justifyContent: 'space-between', overflow: 'hidden' },
  bentoTag: { paddingHorizontal: kitPad(8), paddingVertical: kitPad(5), borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.25)' },
  sheet: { marginTop: 'auto', borderTopLeftRadius: kitRad(24), borderTopRightRadius: kitRad(24), paddingTop: kitPad(12), paddingHorizontal: kitPad(20), gap: 14 },
  grabber: { width: 44, height: 5, borderRadius: 99, alignSelf: 'center' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: kitPad(10), borderTopWidth: 1 },
})
