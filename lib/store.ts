// Données de l'app, gardées sur le téléphone (AsyncStorage) — commun à tous les modèles Bloxks.
// Chaque écran lit et écrit les MÊMES données par clé : un ajout sur un écran apparaît
// aussitôt sur les autres, et tout est retrouvé à la relance de l'app.
// Les données de démo (lib/content.ts) ne servent qu'au tout premier lancement.
import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'app:v1:'
const cache = new Map<string, unknown>()
const listeners = new Map<string, Set<() => void>>()
const loading = new Map<string, Promise<void>>()
const loaded = new Set<string>()

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn())
}

function load(key: string): Promise<void> {
  const pending = loading.get(key)
  if (pending) return pending
  const p = AsyncStorage.getItem(PREFIX + key)
    .then((raw) => {
      if (raw != null && !cache.has(key)) cache.set(key, JSON.parse(raw))
    })
    .catch((e) => console.warn('lecture des données impossible', key, e))
    .finally(() => { loaded.add(key); notify(key) })
  loading.set(key, p)
  return p
}

function save(key: string, value: unknown) {
  cache.set(key, value)
  notify(key)
  AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)).catch((e) => console.warn('sauvegarde impossible', key, e))
}

/**
 * Valeur persistante partagée par clé. `initial` sert tant que rien n'est enregistré.
 * Renvoie [valeur, modifier, prête] — « prête » passe à true une fois la lecture faite.
 */
export function usePersistentState<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [, force] = useState(0)
  const [ready, setReady] = useState(loaded.has(key))
  useEffect(() => {
    const set = listeners.get(key) ?? new Set()
    const fn = () => force((n) => n + 1)
    set.add(fn)
    listeners.set(key, set)
    load(key).then(() => setReady(true))
    return () => { set.delete(fn) }
  }, [key])
  const value = (cache.has(key) ? cache.get(key) : initial) as T
  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    const prev = (cache.has(key) ? cache.get(key) : initial) as T
    save(key, typeof next === 'function' ? (next as (p: T) => T)(prev) : next)
  }, [key, initial])
  return [value, setValue, ready]
}

/** Identifiant unique pour un nouvel élément. */
export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/** Liste persistante d'éléments : ajouter, modifier, supprimer, réordonner. */
export function useCollection<T extends { id: string }>(key: string, seed: T[]) {
  const [items, setItems, ready] = usePersistentState<T[]>(key, seed)
  const add = useCallback((item: Omit<T, 'id'> & { id?: string }) => {
    const created = { ...item, id: item.id ?? newId() } as T
    setItems((prev) => [created, ...prev])
    return created
  }, [setItems])
  const update = useCallback((id: string, patch: Partial<T>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [setItems])
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [setItems])
  const toggle = useCallback((id: string, field: keyof T) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: !it[field] } : it)))
  }, [setItems])
  return { items, setItems, add, update, remove, toggle, ready, byId: (id: string) => items.find((it) => it.id === id) }
}

/** Efface toutes les données de l'app : chaque écran revient aux données du premier lancement. */
export async function resetAllData(): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX))
  await AsyncStorage.multiRemove(keys)
  const touched = [...cache.keys()]
  cache.clear()
  touched.forEach(notify)
}
