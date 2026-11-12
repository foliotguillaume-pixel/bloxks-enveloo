// Caméra en direct (expo-camera) qui s'ouvre DÈS l'arrivée sur l'écran, comme Cal AI :
// - la permission est demandée tout de suite si elle n'a jamais été posée ;
// - pendant le démarrage, le panneau de l'écran (fond du kit + indicateur), jamais un cadre noir ;
// - refus → panneau qui explique, avec « Autoriser » (réglages du téléphone si le refus est définitif) ;
// - caméra absente ou en panne (onMountError) → panneau « importer une photo ».
// L'écran fournit l'habillage : `renderPanel` (textes et boutons du kit) et les enfants posés
// sur l'image en direct (cadre de visée…). Aucun texte ici.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { Linking, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import type { BarcodeType } from 'expo-camera'

/** État affiché à la place de l'image en direct. `action` : bouton « Autoriser » du refus. */
export type CameraPanel = { kind: 'starting' | 'denied' | 'unavailable'; action?: () => void }
export type LiveCameraHandle = {
  /** Prend la photo (qualité 0,6) ; null si la caméra n'est pas prête ou en cas d'échec. */
  takePhoto: () => Promise<string | null>
}

export const LiveCamera = forwardRef<LiveCameraHandle, {
  /** fond du kit, visible pendant le démarrage et sous les panneaux */
  bg: string
  renderPanel: (panel: CameraPanel) => ReactNode
  style?: StyleProp<ViewStyle>
  facing?: 'back' | 'front'
  flash?: boolean
  torch?: boolean
  /** codes lus en direct (ean13, qr…) ; `onBarcode` reçoit le contenu du code */
  barcodeTypes?: BarcodeType[]
  onBarcode?: (data: string) => void
  /** posé sur l'image en direct (cadre de visée, consigne…) */
  children?: ReactNode
}>(function LiveCamera({ bg, renderPanel, style, facing = 'back', flash, torch, barcodeTypes, onBarcode, children }, ref) {
  const [permission, requestPermission] = useCameraPermissions()
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const camera = useRef<CameraView>(null)
  const lastScan = useRef(0)
  const status = permission?.status
  // Première visite : la demande système s'ouvre d'elle-même, sans écran intermédiaire.
  useEffect(() => {
    if (status === 'undetermined') requestPermission().catch((e) => console.warn('permission caméra', e))
  }, [status, requestPermission])
  const granted = !!permission?.granted
  // Filet : une caméra qui ne signale jamais qu'elle est prête ne laisse pas l'indicateur tourner sans fin.
  useEffect(() => {
    if (!granted || ready) return
    const timer = setTimeout(() => setReady(true), 4000)
    return () => clearTimeout(timer)
  }, [granted, ready])
  useImperativeHandle(ref, () => ({
    takePhoto: async () => {
      try {
        const picture = await camera.current?.takePictureAsync({ quality: 0.6 })
        return picture?.uri ?? null
      } catch (e) {
        console.warn('photo impossible', e)
        return null
      }
    },
  }), [])
  const allow = () => {
    if (permission && !permission.canAskAgain) Linking.openSettings().catch((e) => console.warn('réglages', e))
    else requestPermission().catch((e) => console.warn('permission caméra', e))
  }
  const panel: CameraPanel | null = failed ? { kind: 'unavailable' }
    : !permission || status === 'undetermined' ? { kind: 'starting' }
    : !granted ? { kind: 'denied', action: allow }
    : null
  const scanned = (data: string) => {
    const now = Date.now()
    if (now - lastScan.current < 2500) return
    lastScan.current = now
    onBarcode?.(data)
  }
  return (
    <View style={[styles.box, { backgroundColor: bg }, style]}>
      {panel ? null : (
        <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing} flash={flash ? 'on' : 'off'} enableTorch={!!torch}
          onCameraReady={() => setReady(true)}
          onMountError={(e) => { console.warn('caméra indisponible', e.message); setFailed(true) }}
          barcodeScannerSettings={barcodeTypes ? { barcodeTypes } : undefined}
          onBarcodeScanned={onBarcode ? (r) => scanned(r.data) : undefined} />
      )}
      {panel || !ready ? <View style={[StyleSheet.absoluteFill, styles.panel, { backgroundColor: bg }]}>{renderPanel(panel ?? { kind: 'starting' })}</View> : children}
    </View>
  )
})

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  panel: { alignItems: 'center', justifyContent: 'center', padding: 24 },
})
