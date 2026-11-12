// Objectifs d'épargne : objectif prioritaire, progression des autres objectifs et versements manuels.
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Screen } from '../components/Screen'
import { Budgets, Button, Card, Field, GradientCard, Title } from '../components/ui'
import { COLORS, W, mix } from '../theme'
import { GOALS, type Goal } from '../lib/content'
import { swatch, tabsFor, type Nav } from '../lib/nav'
import { newId } from '../lib/store'
import { confirm, euro, fill, parseAmount, useGoals } from '../lib/budget'

const pct = (g: Goal) => (g.target > 0 ? Math.min(1, g.saved / g.target) : 0)

export default function GoalsScreen({ navigation }: { navigation: Nav }) {
  const { items: goals, setItems, update, remove } = useGoals()
  const [open, setOpen] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const saved = goals.reduce((s, g) => s + g.saved, 0)
  const [first, ...others] = goals
  const value = parseAmount(draft)
  const move = (g: Goal, sign: number) => {
    if (!(value > 0)) return
    update(g.id, { saved: Math.max(0, Math.round((g.saved + sign * value) * 100) / 100) })
    setDraft('')
    setOpen(null)
  }
  const target = parseAmount(newTarget)
  const create = () => {
    if (!newTitle.trim() || !(target > 0)) return
    // Ajouté à la fin : l'objectif prioritaire reste en tête.
    setItems((prev) => [...prev, { id: newId(), title: newTitle.trim(), target, saved: 0, ...GOALS.newLook }])
    setNewTitle(''); setNewTarget(''); setCreating(false)
  }
  const firstSub = first
    ? first.saved >= first.target
      ? fill(GOALS.featuredDone, { target: euro(first.target, false) })
      : fill(GOALS.featuredSub, { target: euro(first.target, false), pct: `${Math.round(pct(first) * 100)} %` })
    : ''
  const editor = (g: Goal) => (
    <Card padding={16} style={{ marginHorizontal: 16, marginTop: 12, gap: 4 }}>
      <Text style={[{ fontSize: 15, color: COLORS.ink, paddingHorizontal: 4 }, W.bold]}>{g.title}</Text>
      <Field placeholder={GOALS.amountPlaceholder} value={draft} onChangeText={setDraft} keyboardType="numeric" mt={8} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Button label={GOALS.withdraw} secondary onPress={() => move(g, -1)} disabled={!(value > 0)} style={{ flex: 1 }} />
        <Button label={GOALS.deposit} onPress={() => move(g, 1)} disabled={!(value > 0)} style={{ flex: 1 }} />
      </View>
      <Button label={GOALS.remove} secondary onPress={() => confirm(GOALS.remove, g.title, GOALS.remove, GOALS.cancel, () => { remove(g.id); setOpen(null) })} style={{ marginTop: 10 }} />
    </Card>
  )
  return (
    <Screen tabs={tabsFor(navigation, 2)}>
      <Title eyebrow={fill(GOALS.eyebrow, { n: goals.length, amount: euro(saved, false) })} title={GOALS.title} size={36} pt={12} />
      {first ? (
        <GradientCard colors={[COLORS.accent, mix(COLORS.accent, '#FFFFFF', 0.2)]} eyebrow={GOALS.featuredEyebrow} title={first.title} size={24} sub={firstSub}
          value={euro(first.saved, false)} minHeight={140} onPress={() => setOpen(open === first.id ? null : first.id)} />
      ) : <Text style={[{ fontSize: 15, color: COLORS.muted, textAlign: 'center', marginTop: 24 }, W.medium]}>{GOALS.empty}</Text>}
      {first && open === first.id ? editor(first) : null}
      {others.length ? (
        <Budgets rows={others.map((g) => {
          const s = swatch(g.swatch)
          return {
            mono: { icon: g.icon, bg: s.bg, fg: s.fg }, title: g.title, color: s.bar, progress: pct(g), right: `${Math.round(pct(g) * 100)} %`,
            sub: fill(GOALS.rowSub, { saved: euro(g.saved, false), target: euro(g.target, false) }),
            onPress: () => { setOpen(open === g.id ? null : g.id); setDraft('') },
          }
        })} />
      ) : null}
      {others.map((g) => (open === g.id ? <View key={g.id}>{editor(g)}</View> : null))}
      {creating ? (
        <Card padding={16} style={{ marginHorizontal: 16, marginTop: 12 }}>
          <Field placeholder={GOALS.titlePlaceholder} value={newTitle} onChangeText={setNewTitle} mt={0} />
          <Field placeholder={GOALS.targetPlaceholder} value={newTarget} onChangeText={setNewTarget} keyboardType="numeric" mt={10} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Button label={GOALS.cancel} secondary onPress={() => setCreating(false)} style={{ flex: 1 }} />
            <Button label={GOALS.create} onPress={create} disabled={!newTitle.trim() || !(target > 0)} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <View style={{ marginHorizontal: 20, marginTop: 16 }}><Button label={GOALS.newGoal} secondary icon={{ name: 'plus', android: 'add' }} onPress={() => setCreating(true)} /></View>
      )}
    </Screen>
  )
}
