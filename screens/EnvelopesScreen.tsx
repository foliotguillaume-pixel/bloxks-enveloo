// Accueil Enveloo : solde calculé, opérations à répartir et enveloppes avec dépenses réelles.
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Screen, TAB_BAR_HEIGHT } from '../components/Screen'
import { Budgets, Button, Card, Header, List } from '../components/ui'
import { IMAGES } from '../zzz/brandImages'
import { COLORS, W } from '../theme'
import { A11Y, ENVELOPES } from '../lib/content'
import { swatch, tabsFor, type Nav } from '../lib/nav'
import { cap, euro, fill, inRange, isUnallocatedExpense, monthAt, monthName, plannedAllocation, spentIn, total, useEnvelopesForMonth, useExpenses, useMonthFor, useSelectedMonth } from '../lib/budget'
import { MonthNavigator } from '../components/MonthNavigator'

function signedMoney(value: number) {
  return `${value < 0 ? '−' : ''}${euro(Math.abs(value), false)}`
}

function RemainingCard({ value, planned, spent }: { value: number; planned: number; spent: number }) {
  return (
    <View style={{ marginTop: 16, marginHorizontal: 16 }}>
      <Card padding={18}>
        <Text style={[{ fontSize: 13, color: COLORS.muted }, W.medium]}>{ENVELOPES.remaining.label}</Text>
        <Text style={styles.value} numberOfLines={1}>{signedMoney(value)}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, W.semibold]}>{fill(ENVELOPES.remaining.budget, { amount: euro(planned, false) })}</Text>
          <Text style={[styles.meta, W.semibold]}>{fill(ENVELOPES.remaining.spent, { amount: euro(spent, false) })}</Text>
        </View>
      </Card>
    </View>
  )
}

export default function EnvelopesScreen({ navigation }: { navigation: Nav }) {
  const [monthOffset, setMonthOffset] = useSelectedMonth()
  const { items: envelopes } = useEnvelopesForMonth(monthOffset)
  const { items: expenses } = useExpenses()
  const [baseMonth] = useMonthFor(0)
  const [month] = useMonthFor(monthOffset, monthOffset > 0 ? baseMonth : undefined)
  const monthInfo = monthAt(monthOffset)
  const monthList = inRange(expenses, monthInfo.start, monthInfo.end)
  const spent = total(monthList)
  const planned = plannedAllocation(envelopes)
  const unallocatedList = monthList.filter(isUnallocatedExpense)
  const unallocatedTotal = total(unallocatedList)
  const remaining = month.income - spent
  const [menuOpen, setMenuOpen] = useState(false)
  const insets = useSafeAreaInsets()
  const rows = envelopes.map((item) => {
    const actual = spentIn(monthList, item.id)
    const left = item.budget - actual
    const color = swatch(item.swatch)
    return {
      mono: { icon: item.icon, bg: color.bg, fg: color.fg }, title: item.title, color: color.bar,
      sub: fill(ENVELOPES.rowSub, { spent: euro(actual, false), budget: euro(item.budget, false) }),
      right: signedMoney(left), progress: item.budget > 0 ? actual / item.budget : actual > 0 ? 2 : 0,
      onPress: () => navigation.navigate('Envelope', { id: item.id, monthOffset }),
    }
  })
  const overlay = menuOpen ? (
    <View style={StyleSheet.absoluteFill}>
      <Pressable onPress={() => setMenuOpen(false)} accessibilityRole="button" accessibilityLabel={A11Y.close} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
      <Card padding={18} style={{ position: 'absolute', left: 16, right: 16, bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 12, gap: 10 }}>
        <Text style={[{ color: COLORS.ink, fontSize: 20 }, W.title]}>{ENVELOPES.menuTitle}</Text>
        <Button label={ENVELOPES.manual} icon={{ name: 'plus', android: 'add' }} onPress={() => { setMenuOpen(false); navigation.navigate('AddExpense', { monthOffset }) }} />
        <Button label={ENVELOPES.import} icon={{ name: 'doc.text.fill', android: 'document-text' }} secondary onPress={() => { setMenuOpen(false); navigation.navigate('ImportCsv') }} />
        <Button label={ENVELOPES.plan} icon={{ name: 'calendar', android: 'calendar' }} secondary onPress={() => { setMenuOpen(false); navigation.navigate('Plan') }} />
      </Card>
    </View>
  ) : null

  return (
    <Screen tabs={tabsFor(navigation, 0)} header={<Header image={IMAGES[ENVELOPES.photo]} onImagePress={() => navigation.replace('Profile')} eyebrow={cap(monthName(monthInfo.m))} title={ENVELOPES.title}
      actions={[{ icon: { name: 'plus', android: 'add' }, label: ENVELOPES.fab, onPress: () => setMenuOpen(true) }]} />} overlay={overlay}>
      <MonthNavigator offset={monthOffset} onChange={setMonthOffset} />
      <RemainingCard value={remaining} planned={planned} spent={spent} />
      <List rows={[{ icon: { name: 'arrow.left.arrow.right', android: 'swap-horizontal' }, title: ENVELOPES.unallocatedTitle, sub: fill(ENVELOPES.unallocatedSub, { count: unallocatedList.length }), right: euro(unallocatedTotal, false), onPress: () => navigation.navigate('Unallocated', { monthOffset }) }]} />
      {rows.length ? <Budgets rows={rows} /> : (
        <View style={{ alignItems: 'center', gap: 14, marginTop: 32, paddingHorizontal: 40 }}>
          <Text style={[{ fontSize: 15, color: COLORS.muted, textAlign: 'center' }, W.medium]}>{ENVELOPES.empty}</Text>
          <Button label={ENVELOPES.emptyAction} secondary onPress={() => navigation.navigate('Plan')} />
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  value: { fontSize: 44, lineHeight: 50, letterSpacing: -1.2, marginTop: 8, color: COLORS.ink, fontVariant: ['tabular-nums'], ...W.title },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  meta: { fontSize: 13, color: COLORS.muted },
})
