// Animations du kit Clean :
// - anneau qui se remplit après un ajout (600 ms, sortie cubique) ;
// - bouton flottant qui s'enfonce au toucher (1 → 0,92 → 1 en 160 ms, vibration légère).
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

/** Le pilote natif n'existe pas dans l'aperçu web. */
export const NATIVE = Platform.OS !== 'web'

/** Valeur qui glisse vers `target` (anneaux, jauges) : renvoie la valeur courante à chaque image. */
export function useTween(target: number, duration = 600, from = 0): number {
  const v = useRef(new Animated.Value(from)).current
  const [now, setNow] = useState(from)
  useEffect(() => {
    const id = v.addListener(({ value }) => setNow(value))
    const anim = Animated.timing(v, { toValue: target, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false })
    anim.start()
    return () => {
      anim.stop()
      v.removeListener(id)
    }
  }, [v, target, duration])
  return now
}

/** Pression « bouton flottant » : échelle 0,92 puis retour, vibration légère. */
export function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current
  const to = (value: number) => Animated.timing(scale, { toValue: value, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start()
  return {
    style: { transform: [{ scale }] },
    onPressIn: () => {
      to(0.92)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((e) => console.warn('haptique', e))
    },
    onPressOut: () => to(1),
  }
}

/** Fondu + légère montée à l'apparition d'un bloc. */
export function useAppear(delay = 0) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration: 320, delay, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE })
    anim.start()
    return () => anim.stop()
  }, [v, delay])
  return { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }
}

/** Respiration douce (halo, cercle de validation) : opacité qui va et vient. */
export function usePulse(min = 0.55, max = 0.95, duration = 5000) {
  const v = useRef(new Animated.Value(min)).current
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: max, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      Animated.timing(v, { toValue: min, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
    ]))
    anim.start()
    return () => anim.stop()
  }, [v, min, max, duration])
  return v
}
