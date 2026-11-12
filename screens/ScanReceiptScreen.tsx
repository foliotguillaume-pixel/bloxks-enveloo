// B8 · Scanner un ticket : écran caméra noir, la vraie caméra s'ouvre dès l'arrivée
// (components/LiveCamera) avec les coins de visée et une consigne. Le déclencheur photographie
// le ticket (la galerie en fait choisir un) ; la photo reste dans le cadre, « Ticket détecté »
// s'affiche et la feuille du bas donne la répartition par enveloppe, calculée ligne à ligne.
// La LECTURE du ticket est simulée (SCAN dans lib/content.ts) : à brancher sur un service d'OCR.
// « Ajouter » enregistre une vraie dépense par enveloppe ; « Reprendre » rouvre la caméra.
// Permission refusée → panneau qui explique avec « Autoriser » ; caméra indisponible →
// « Importer une photo ».
import { useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Screen, useTone } from '../components/Screen'
import { Button, Center, RoundButton, Sheet } from '../components/ui'
import { LiveCamera, type CameraPanel, type LiveCameraHandle } from '../components/LiveCamera'
import { Icon } from '../zzz/Icon'
import { Image } from '../zzz/RemoteImage'
import { COLORS, W, contrast, mix } from '../theme'
import { A11Y, CAMERA, SCAN, SCAN_COLORS } from '../lib/content'
import type { Nav } from '../lib/nav'
import { fill, money, useEnvelopes, useExpenses } from '../lib/budget'
import type { IconProps } from '../zzz/Icon'

type SheetRow = { icon: Pick<IconProps, 'name' | 'android'>; label: string; value: string }

/** Coin de visée (équerre arrondie). */
function Corner({ pos, color }: { pos: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
  const top = pos[0] === 't'
  const left = pos[1] === 'l'
  return (
    <View pointerEvents="none" style={[styles.corner, { borderColor: color }, top ? { top: 22, borderTopWidth: 4 } : { bottom: 22, borderBottomWidth: 4 },
      left ? { left: 28, borderLeftWidth: 4 } : { right: 28, borderRightWidth: 4 }]} />
  )
}

/** Habillage du cadre : quatre coins et une pastille (consigne ou ticket détecté). */
function Frame({ label, strong }: { label: string; strong?: boolean }) {
  const t = useTone()
  const corner = mix(t.accent, '#FFFFFF', 0.35)
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Corner pos="tl" color={corner} />
      <Corner pos="tr" color={corner} />
      <Corner pos="bl" color={corner} />
      <Corner pos="br" color={corner} />
      <View style={styles.pillWrap}>
        <View style={[styles.pill, { backgroundColor: strong ? t.accent : 'rgba(0,0,0,0.55)' }]}>
          <Text style={[{ fontSize: 13, color: strong ? t.onAccent : '#FFFFFF' }, W.bold]}>{label}</Text>
        </View>
      </View>
    </View>
  )
}

function SheetRows({ rows }: { rows: SheetRow[] }) {
  const t = useTone()
  const iconColor = contrast(t.hl, t.surface) >= 3 ? t.hl : t.accent
  return (
    <View>
      {rows.map((r, i) => (
        <View key={i} style={[styles.sheetRow, { borderTopColor: t.track }]}>
          <Icon {...r.icon} size={22} color={iconColor} />
          <Text style={[{ flex: 1, fontSize: 15, color: t.ink }, W.semibold]}>{r.label}</Text>
          <Text style={[{ fontSize: 14, color: t.muted }, W.semibold]}>{r.value}</Text>
        </View>
      ))}
    </View>
  )
}

async function pickReceipt(): Promise<string | null> {
  try {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    return res.canceled ? null : res.assets[0]?.uri ?? null
  } catch (e) {
    console.warn('galerie indisponible', e)
    return null
  }
}

export default function ScanReceiptScreen({ navigation }: { navigation: Nav }) {
  const [flash, setFlash] = useState(true)
  const [photo, setPhoto] = useState<string | null>(null)
  const camera = useRef<LiveCameraHandle>(null)
  const { items: envelopes } = useEnvelopes()
  const { add } = useExpenses()
  // Lignes du ticket regroupées par enveloppe (position dans la liste, sinon la première).
  const groups = new Map<string, number>()
  for (const l of SCAN.receipt.lines) {
    const env = envelopes[l.envelope] ?? envelopes[0]
    if (env) groups.set(env.id, (groups.get(env.id) ?? 0) + l.price)
  }
  const rows: SheetRow[] = [...groups.entries()].flatMap(([id, amount]) => {
    const env = envelopes.find((e) => e.id === id)
    return env ? [{ icon: env.icon, label: env.title, value: money(amount) }] : []
  })
  const sum = SCAN.receipt.lines.reduce((s, l) => s + l.price, 0)
  const addAll = () => {
    const at = Date.now()
    groups.forEach((amount, id) => add({ amount, envelope: id, merchant: SCAN.receipt.merchant, at }))
    navigation.navigate('Envelopes')
  }
  const fromGallery = () => pickReceipt().then((uri) => { if (uri) setPhoto(uri) })
  // Pas d'image en direct (refus, caméra absente) : le déclencheur se rabat sur la galerie.
  const shoot = () => camera.current?.takePhoto().then((uri) => (uri ? setPhoto(uri) : fromGallery()))
  const panel = (p: CameraPanel) => p.kind === 'starting' ? (
    <Center sub={CAMERA.starting}><ActivityIndicator color={COLORS.white} /></Center>
  ) : (
    <>
      <Center title={p.kind === 'denied' ? CAMERA.deniedTitle : CAMERA.unavailableTitle} size={22}
        sub={p.kind === 'denied' ? CAMERA.deniedSub : CAMERA.unavailableSub} />
      <View style={styles.actions}>
        {p.action ? <Button label={CAMERA.allow} onPress={p.action} /> : null}
        <Button secondary label={CAMERA.importPhoto} icon={{ name: 'photo.on.rectangle', android: 'images' }} onPress={fromGallery} />
      </View>
    </>
  )
  return (
    <Screen tone="dark" bg={SCAN_COLORS.night} scroll={false} header={
      <View style={styles.top}>
        <RoundButton icon={{ name: 'xmark', android: 'close' }} label={A11Y.close} bg="rgba(255,255,255,0.14)" onPress={() => navigation.goBack()} />
        <RoundButton icon={flash ? { name: 'bolt.fill', android: 'flash' } : { name: 'bolt.slash.fill', android: 'flash-off' }} label={A11Y.flash}
          bg="rgba(255,255,255,0.14)" onPress={() => setFlash((f) => !f)} />
      </View>
    }>
      {photo ? (
        <>
          <View style={[styles.frame, { backgroundColor: COLORS.nightSurface }]}>
            <Image source={{ uri: photo }} alt="" style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Frame strong label={fill(SCAN.detected, { n: SCAN.receipt.lines.length })} />
            <View style={styles.retake}>
              <RoundButton icon={{ name: 'arrow.counterclockwise', android: 'refresh' }} label={A11Y.retake} bg="rgba(0,0,0,0.55)" onPress={() => setPhoto(null)} />
            </View>
          </View>
          <Sheet title={fill(SCAN.sheet.title, { store: SCAN.receipt.merchant, total: money(sum) })} sub={fill(SCAN.sheet.sub, { n: SCAN.receipt.lines.length })}
            button={rows.length ? SCAN.sheet.button : undefined} onPress={addAll}>
            <SheetRows rows={rows} />
          </Sheet>
        </>
      ) : (
        <>
          <LiveCamera ref={camera} bg={COLORS.nightSurface} flash={flash} renderPanel={panel} style={styles.frame}>
            <Frame label={SCAN.aim} />
          </LiveCamera>
          <View style={styles.controls}>
            <Pressable onPress={fromGallery} accessibilityRole="button" accessibilityLabel={A11Y.gallery} hitSlop={10}>
              <Icon name="photo.on.rectangle" android="images" size={28} color={COLORS.white} />
            </Pressable>
            <Pressable onPress={shoot} accessibilityRole="button" accessibilityLabel={A11Y.shoot}
              style={({ pressed }) => [styles.shutterRing, pressed && { transform: [{ scale: 0.94 }] }]}>
              <View style={styles.shutter} />
            </Pressable>
            {/* Place de la troisième commande : garde le déclencheur au centre. */}
            <View style={styles.side} />
          </View>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, paddingHorizontal: 20 },
  // Cadre de la caméra (puis de la photo prise) : toute la hauteur libre, au moins 240 pt.
  frame: { flex: 1, minHeight: 240, marginTop: 12, marginHorizontal: 16, borderRadius: 26, overflow: 'hidden' },
  corner: { position: 'absolute', width: 34, height: 34, borderRadius: 6 },
  pillWrap: { position: 'absolute', left: 0, right: 0, bottom: 30, alignItems: 'center' },
  pill: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 99 },
  retake: { position: 'absolute', top: 12, right: 12 },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 12 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40, paddingTop: 20, paddingBottom: 30 },
  side: { width: 28 },
  // Déclencheur 76 pt + anneau translucide de 6 pt.
  shutterRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFFFFF' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1 },
})
