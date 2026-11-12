// Logique du budget par enveloppes : enveloppes, dépenses, objectifs d'épargne, réglages du mois,
// remboursements à deux. Tout est enregistré sur le téléphone (lib/store) ; lib/content.ts ne
// fournit que les données du premier lancement. Chaque chiffre affiché est calculé ici.
import { useCallback, useEffect } from 'react'
import { Alert, Platform } from 'react-native'
import { newId, useCollection, usePersistentState } from './store'
import {
  DATE_WORDS, DAYS, ENVELOPES_SEED, EXPENSES_SEED, FIXED, GOALS_SEED, MONTHS, MONTH_SEED,
  type Envelope, type FixedCost, type Goal,
} from './content'

export const DAY = 86400000

// ─── Formats ───────────────────────────────────────────────────────────────
/** Formate un montant stocké en centimes entiers, sans signe. */
export function euro(n: number, cents = true): string {
  const abs = Math.abs(Math.trunc(n))
  const whole = cents ? Math.floor(abs / 100) : Math.round(abs / 100)
  const dec = cents ? String(abs % 100).padStart(2, '0') : ''
  const int = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${int}${dec ? `,${dec}` : ''} €`
}
/** Montant au centime près, sans centimes nuls. */
export const money = (n: number) => euro(n, Math.abs(Math.trunc(n)) % 100 !== 0)
/** Remplace les {clés} d'un texte de lib/content.ts. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}
/** Convertit une saisie en euros en centimes entiers, sans calcul flottant. */
export function parseAmount(text: string): number {
  const clean = text.replace(/\s/g, '').replace('€', '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return NaN
  const [euros, decimals = ''] = clean.split('.')
  return Number(euros) * 100 + Number(decimals.padEnd(2, '0'))
}
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// ─── Dates ─────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')
export const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() }
export const clock = (t: number) => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
/** Mois décalé de `offset` depuis aujourd'hui : { y, m, start, end, days }. */
export function monthAt(offset: number, now = Date.now()) {
  const d = new Date(now)
  const start = new Date(d.getFullYear(), d.getMonth() + offset, 1).getTime()
  const end = new Date(d.getFullYear(), d.getMonth() + offset + 1, 1).getTime()
  const s = new Date(start)
  return { y: s.getFullYear(), m: s.getMonth(), start, end, days: new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate() }
}
export const monthName = (m: number) => MONTHS[((m % 12) + 12) % 12]
/** « Aujourd'hui · 12:04 », « Hier · 19:30 », « Samedi · 10:15 » (au-delà d'une semaine : « 12 octobre »). */
export function when(t: number, now = Date.now()): string {
  const diff = Math.round((startOfDay(now) - startOfDay(t)) / DAY)
  const d = new Date(t)
  const day = diff === 0 ? DATE_WORDS.today : diff === 1 ? DATE_WORDS.yesterday : diff < 7 ? DAYS[d.getDay()] : `${d.getDate()} ${MONTHS[d.getMonth()]}`
  return diff < 2 ? `${day} · ${clock(t)}` : day
}

// ─── Données de démo (premier lancement) ───────────────────────────────────
/** Dépense enregistrée : montant positif, enveloppe, commerçant, date ; `partner` = payée par l'autre. */
export type Expense = { id: string; amount: number; envelope: string; merchant: string; at: number; partner?: boolean; source?: 'manual' | 'csv' }
export const UNALLOCATED_ENVELOPE_ID = '__unallocated__'
export const isUnallocatedExpense = (expense: Expense) => !expense.envelope || expense.envelope === UNALLOCATED_ENVELOPE_ID

function seedExpenses(now = Date.now()): Expense[] {
  const today = startOfDay(now)
  return EXPENSES_SEED.flatMap((e, i) => {
    const env = ENVELOPES_SEED[e.envelope]
    if (!env) return []
    const [h, m] = e.time.split(':').map(Number)
    return [{ id: `seed-${i}`, amount: e.amount, envelope: env.id, merchant: e.merchant, at: Math.min(now, today - e.daysAgo * DAY + h * 3600000 + m * 60000), partner: e.partner }]
  })
}
const monthKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}` }
const seedSettledKey = () => (new Date().getDate() >= MONTH_SEED.autoSaveDay ? monthKey(Date.now()) : '')

// ─── Données enregistrées ──────────────────────────────────────────────────
export const useEnvelopes = () => useCollection<Envelope>('envelopes', ENVELOPES_SEED)
export const useExpenses = () => useCollection<Expense>('expenses', seedExpenses())
export const useGoals = () => useCollection<Goal>('goals', GOALS_SEED)
export type MonthSettings = { income: number; autoSave: number; autoSaveDay: number; autoSaveEnabled?: boolean }
const EMPTY_MONTH_SETTINGS: MonthSettings = { income: 0, autoSave: 0, autoSaveDay: MONTH_SEED.autoSaveDay }
const EMPTY_MONTH_ENVELOPES: Record<string, Envelope[]> = {}
const monthStorageId = (offset: number) => {
  const m = monthAt(offset)
  return `${m.y}-${pad(m.m + 1)}`
}

/** Réglages indépendants pour chaque mois ; le mois courant conserve la clé existante. */
export function useMonthFor(offset = 0, fallback?: MonthSettings) {
  const initial = offset === 0 ? MONTH_SEED : fallback ?? EMPTY_MONTH_SETTINGS
  return usePersistentState<MonthSettings>(offset === 0 ? 'month' : `month:${monthStorageId(offset)}`, initial)
}
export const useMonth = () => useMonthFor(0)

/** Enveloppes mensuelles indépendantes, initialisées depuis le mois précédent. */
export function useEnvelopesForMonth(offset = 0) {
  const base = useEnvelopes()
  const [snapshots, setSnapshots, snapshotsReady] = usePersistentState<Record<string, Envelope[]>>('envelopes:months:v1', EMPTY_MONTH_ENVELOPES)
  const key = monthStorageId(offset)
  const previousKey = monthStorageId(offset - 1)
  // Le mois courant reste relié à la liste configurée; un ancien instantané ne doit pas la masquer.
  const items = offset === 0 ? base.items : snapshots[key] ?? snapshots[previousKey] ?? base.items

  useEffect(() => {
    if (offset === 0 || !base.ready || !snapshotsReady || snapshots[key]) return
    const source = snapshots[previousKey] ?? base.items
    setSnapshots((current) => current[key] ? current : {
      ...current,
      [key]: source.map((item) => ({ ...item, icon: { ...item.icon } })),
    })
  }, [offset, base.ready, base.items, snapshotsReady, snapshots, key, previousKey, setSnapshots])

  const setItems = useCallback((next: Envelope[] | ((previous: Envelope[]) => Envelope[])) => {
    if (offset === 0) {
      base.setItems(next)
      return
    }
    setSnapshots((current) => {
      const previous = current[key] ?? items
      const updated = typeof next === 'function' ? next(previous) : next
      return { ...current, [key]: updated }
    })
  }, [offset, base.setItems, setSnapshots, key, items])
  const add = useCallback((item: Omit<Envelope, 'id'> & { id?: string }) => {
    const created = { ...item, id: item.id ?? newId() } as Envelope
    setItems((current) => [created, ...current])
    return created
  }, [setItems])
  const update = useCallback((id: string, patch: Partial<Envelope>) => {
    const apply = (list: Envelope[]) => list.map((item) => item.id === id ? { ...item, ...patch } : item)
    if (offset === 0) base.setItems(apply)
    setSnapshots((current) => {
      const next = { ...current }
      if (offset !== 0 || current[key]) next[key] = apply(current[key] ?? items)
      for (const snapshotKey of Object.keys(current)) {
        if (snapshotKey > key) next[snapshotKey] = apply(current[snapshotKey])
      }
      return next
    })
  }, [offset, base.setItems, setSnapshots, key, items])
  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [setItems])
  const toggle = useCallback((id: string, field: keyof Envelope) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: !item[field] } : item))
  }, [setItems])
  return { items, setItems, add, update, remove, toggle, ready: offset === 0 ? base.ready && snapshotsReady : base.ready && snapshotsReady && !!snapshots[key], byId: (id: string) => items.find((item) => item.id === id) }
}

/** Charges fixes enregistrées par mois ; modifier un mois propage vers les mois futurs déjà préparés. */
const EMPTY_FIXED_SNAPSHOTS: Record<string, FixedCost[]> = {}
export function useFixedForMonth(offset = 0) {
  const [baseItems, setBaseItems, baseReady] = usePersistentState<FixedCost[]>('fixed-costs:v1', FIXED)
  const [snapshots, setSnapshots, snapshotsReady] = usePersistentState<Record<string, FixedCost[]>>('fixed-costs:months:v1', EMPTY_FIXED_SNAPSHOTS)
  const key = monthStorageId(offset)
  const previousKey = monthStorageId(offset - 1)
  const items = offset === 0 ? baseItems : snapshots[key] ?? snapshots[previousKey] ?? baseItems

  useEffect(() => {
    if (offset === 0 || !baseReady || !snapshotsReady || snapshots[key]) return
    const source = snapshots[previousKey] ?? baseItems
    setSnapshots((current) => current[key] ? current : {
      ...current,
      [key]: source.map((item) => ({ ...item, icon: { ...item.icon } })),
    })
  }, [offset, baseReady, snapshotsReady, snapshots, key, previousKey, baseItems, setSnapshots])

  const update = useCallback((id: string, patch: Partial<FixedCost>) => {
    const apply = (list: FixedCost[]) => list.map((item) => item.id === id ? { ...item, ...patch } : item)
    if (offset === 0) setBaseItems(apply)
    setSnapshots((current) => {
      const next = { ...current }
      if (offset !== 0) next[key] = apply(current[key] ?? items)
      for (const snapshotKey of Object.keys(current)) {
        if (snapshotKey > key) next[snapshotKey] = apply(current[snapshotKey])
      }
      return next
    })
  }, [offset, setBaseItems, setSnapshots, key, items])

  const remove = (id: string) => {
    const apply = (list: FixedCost[]) => list.filter((item) => item.id !== id)
    if (offset === 0) setBaseItems(apply)
    setSnapshots((current) => {
      const next = { ...current }
      if (offset !== 0) next[key] = apply(current[key] ?? items)
      else if (current[key]) next[key] = apply(current[key])
      for (const snapshotKey of Object.keys(current)) {
        if (snapshotKey > key) next[snapshotKey] = apply(current[snapshotKey])
      }
      return next
    })
  }

  return { items, update, remove, ready: offset === 0 ? baseReady : baseReady && snapshotsReady && !!snapshots[key] }
}
export const useSelectedMonth = () => usePersistentState<number>('selected-month-offset:v1', 0)
/** Remboursements déjà faits entre partenaires (positif = l'autre t'a remboursé). */
export const useSettlements = () => usePersistentState<number>('settlements', SEED_SETTLED)

/**
 * Virement automatique vers l'objectif prioritaire : une fois par mois, le jour choisi.
 * Monté une fois dans `Providers`.
 */
export function AutoSaver() {
  const goals = useGoals()
  const [month, , monthReady] = useMonth()
  const [last, setLast, lastReady] = usePersistentState<string>('autosave-last', seedSettledKey())
  const ready = goals.ready && monthReady && lastReady
  useEffect(() => {
    if (!ready) return
    const now = Date.now()
    const key = monthKey(now)
    if (last === key || new Date(now).getDate() < month.autoSaveDay || month.autoSave <= 0) return
    const first = goals.items[0]
    setLast(key)
    if (first) goals.update(first.id, { saved: Math.round(first.saved + month.autoSave) })
  }, [ready, last, month.autoSave, month.autoSaveDay]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// ─── Calculs ───────────────────────────────────────────────────────────────
export const inRange = (list: Expense[], start: number, end: number) => list.filter((e) => e.at >= start && e.at < end)
export const total = (list: Expense[]) => list.reduce((s, e) => s + Math.round(e.amount), 0)
export const fixedTotal = (fixed: FixedCost[] = FIXED) => fixed.reduce((s, f) => s + f.amount, 0)
/** Budget réellement planifié, sans compter deux fois les charges fixes et leur enveloppe de suivi. */
export function plannedAllocation(envelopes: Envelope[], fixed: FixedCost[], autoSave = 0) {
  const fixedEnvelope = envelopes.find((item) => item.id === 'e-fixed')?.budget ?? 0
  const otherEnvelopes = envelopes.reduce((sum, item) => sum + (item.id === 'e-fixed' ? 0 : item.budget), 0)
  return Math.max(fixedTotal(fixed), fixedEnvelope) + otherEnvelopes + Math.max(0, autoSave)
}
/** Dépensé dans une enveloppe sur une liste de dépenses. */
export const spentIn = (list: Expense[], envelopeId: string) => total(list.filter((e) => e.envelope === envelopeId))

/** État du mois en cours : fixe, dépensé, libre, reste par jour. */
export function monthStatus(expenses: Expense[], income: number, offset = 0, now = Date.now(), fixedCosts: FixedCost[] = FIXED) {
  const m = monthAt(offset, now)
  const spent = total(inRange(expenses, m.start, m.end))
  const fixed = fixedTotal(fixedCosts)
  const free = income - fixed - spent
  const day = offset === 0 ? new Date(now).getDate() : offset < 0 ? m.days : 1
  const daysLeft = m.days - day + 1
  return { m, day, daysLeft, spent, fixed, free, perDay: daysLeft > 0 ? free / daysLeft : free }
}

/**
 * Ce que l'autre te doit (positif) ou ce que tu lui dois (négatif) sur les enveloppes communes :
 * chaque dépense commune est partagée selon ta part `mine` (en %), moins les remboursements faits.
 */
export function balanceWithPartner(expenses: Expense[], envelopes: Envelope[], settled: number) {
  let owed = 0
  let count = 0
  for (const e of expenses) {
    const env = envelopes.find((x) => x.id === e.envelope)
    if (!env?.mine) continue
    count++
    owed += e.partner ? -e.amount * (env.mine / 100) : e.amount * (1 - env.mine / 100)
  }
  return { owed: Math.round(owed - settled), count }
}

/** Démo : les dépenses communes de plus d'une semaine sont considérées comme déjà réglées. */
const SEED_SETTLED = (() => {
  const old = seedExpenses().filter((e) => e.at < Date.now() - 7 * DAY)
  return balanceWithPartner(old, ENVELOPES_SEED, 0).owed
})()

/** Confirmation avant suppression (l'aperçu web n'a pas de boîte native). */
export function confirm(title: string, message: string, ok: string, cancel: string, run: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || window.confirm(`${title}\n${message}`)) run()
    return
  }
  Alert.alert(title, message, [{ text: cancel, style: 'cancel' }, { text: ok, style: 'destructive', onPress: run }])
}
