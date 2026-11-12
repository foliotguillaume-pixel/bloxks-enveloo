// Réglages du mois à venir : salaire et enveloppes.
import { useState } from 'react'
import { View } from 'react-native'
import { Screen } from '../components/Screen'
import { Button, Field, List, Note, ProgressBar, Title, TopBar } from '../components/ui'
import { COLORS } from '../theme'
import { A11Y, MONTHS_SHORT, NEW_ENVELOPE_LOOKS, PLAN } from '../lib/content'
import { type Nav } from '../lib/nav'
import { cap, euro, fill, inRange, monthAt, monthName, parseAmount, plannedAllocation, spentIn, useEnvelopesForMonth, useExpenses, useMonthFor, useSelectedMonth } from '../lib/budget'
import { MonthNavigator } from '../components/MonthNavigator'

type Editing = { kind: 'income' } | { kind: 'new' } | null

export default function PlanScreen({ navigation }: { navigation: Nav }) {
  const [selectedOffset, setSelectedOffset] = useSelectedMonth()
  const [baseMonth] = useMonthFor(0)
  const [referenceMonth] = useMonthFor(selectedOffset, selectedOffset > 0 ? baseMonth : undefined)
  const planOffset = selectedOffset + 1
  const { items: envelopes, add } = useEnvelopesForMonth(planOffset)
  const { items: expenses } = useExpenses()
  const [month, setMonth] = useMonthFor(planOffset, planOffset > 0 ? referenceMonth : undefined)
  const [editing, setEditing] = useState<Editing>(null)
  const [draft, setDraft] = useState('')
  const [title, setTitle] = useState('')
  const next = monthAt(planOffset)
  const current = monthAt(selectedOffset)
  const currentExpenses = inRange(expenses, current.start, current.end)
  const planned = plannedAllocation(envelopes)
  const left = month.income - planned
  const value = parseAmount(draft)
  const open = (kind: Editing, initial: number) => { setEditing(kind); setDraft((initial / 100).toFixed(2).replace('.', ',')); setTitle('') }
  const save = () => {
    if (!editing || !Number.isFinite(value) || value < 0) return
    if (editing.kind === 'income') setMonth((m) => ({ ...m, income: value }))
    if (editing.kind === 'new') {
      if (!title.trim()) return
      const look = NEW_ENVELOPE_LOOKS[envelopes.length % NEW_ENVELOPE_LOOKS.length]
      add({ title: title.trim(), budget: value, ...look })
    }
    setEditing(null)
  }
  const note = left > 0 ? fill(PLAN.left, { amount: euro(left, false) }) : left < 0 ? fill(PLAN.over, { amount: euro(left, false) }) : PLAN.balanced
  const editor = (kind: 'income' | 'new') => {
    if (editing?.kind !== kind) return null
    const valid = Number.isFinite(value) && value >= 0 && (kind !== 'new' || !!title.trim())
    return (
      <View style={{ marginHorizontal: 16, marginTop: 12, gap: 10 }}>
        {kind === 'new' ? <Field placeholder={PLAN.titlePlaceholder} value={title} onChangeText={setTitle} mt={0} /> : null}
        <Field placeholder={PLAN.amountPlaceholder} value={draft} onChangeText={setDraft} keyboardType="decimal-pad" mt={0} onSubmit={save} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label={PLAN.cancel} secondary onPress={() => setEditing(null)} style={{ flex: 1 }} />
          <Button label={kind === 'new' ? PLAN.create : PLAN.save} onPress={save} disabled={!valid} style={{ flex: 1 }} />
        </View>
      </View>
    )
  }

  return (
    <Screen keyboardAware header={<TopBar left={{ name: 'xmark', android: 'close' }} onLeft={() => navigation.goBack()} leftLabel={A11Y.close} />}>
      <MonthNavigator offset={planOffset} onChange={(offset) => setSelectedOffset(offset - 1)} />
      <Title title={cap(monthName(next.m))} size={36} sub={fill(PLAN.sub, { income: euro(month.income, false) })} />
      <ProgressBar label={PLAN.progressLabel} right={fill(PLAN.progressRight, { planned: euro(planned, false).replace(' €', ''), income: euro(month.income, false) })}
        progress={month.income > 0 ? planned / month.income : 0} color={COLORS.accent} />
      <List rows={[{ icon: { name: 'eurosign.circle.fill', android: 'cash' }, title: PLAN.incomeTitle, sub: PLAN.incomeSub, right: euro(month.income, false), onPress: () => open({ kind: 'income' }, month.income) }]} />
      {editor('income')}
      <List rows={envelopes.map((item) => ({
        icon: item.icon,
        title: item.title,
        sub: fill(PLAN.envelopeSub, { month: MONTHS_SHORT[current.m], amount: euro(spentIn(currentExpenses, item.id), false) }),
        right: euro(item.budget, false),
        onPress: () => navigation.navigate('BudgetItemEditor', { id: item.id, monthOffset: planOffset }),
      }))} />
      {editor('new') ?? <View style={{ marginHorizontal: 20, marginTop: 14 }}><Button label={PLAN.addEnvelope} secondary icon={{ name: 'plus', android: 'add' }} onPress={() => open({ kind: 'new' }, 0)} /></View>}
      <Note icon={PLAN.noteIcon} text={`${note} ${PLAN.budgetVsSpent}`} />
      <View style={{ height: 24 }} />
    </Screen>
  )
}
