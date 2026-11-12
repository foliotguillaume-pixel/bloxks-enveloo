// Saisie d'une dépense avec calendrier, enveloppe, libellé et montant.
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native'
import { Screen } from '../components/Screen'
import { Button, Card, Tags, TopBar } from '../components/ui'
import { Icon } from '../zzz/Icon'
import { COLORS, W } from '../theme'
import { A11Y, ADD_EXPENSE, DAYS, MONTHS, PARTNER, WEEK_LETTERS } from '../lib/content'
import { DAY, confirm, fill, monthAt, parseAmount, startOfDay, useEnvelopesForMonth, useExpenses } from '../lib/budget'
import { type Nav } from '../lib/nav'

function press(amount: string, key: string): string {
  const sep = ADD_EXPENSE.decimal
  if (key === sep) return amount.includes(sep) ? amount : `${amount || '0'}${sep}`
  const [, dec] = amount.split(sep)
  if (dec != null && dec.length >= 2) return amount
  if (amount.replace(sep, '').length >= 7) return amount
  return amount === '0' ? key : amount + key
}
const pad = (n: number) => String(n).padStart(2, '0')
const dateLabel = (stamp: number) => {
  const d = new Date(stamp)
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default function AddExpenseScreen({ navigation, route }: { navigation: Nav; route?: { params?: { id?: string; envelope?: string; monthOffset?: number } } }) {
  const monthOffset = route?.params?.monthOffset ?? 0
  const { items: envelopes } = useEnvelopesForMonth(monthOffset)
  const { items: expenses, add, update, remove } = useExpenses()
  const existing = expenses.find((e) => e.id === route?.params?.id)
  const [amount, setAmount] = useState(existing ? (existing.amount / 100).toFixed(2).replace('.', ADD_EXPENSE.decimal) : '')
  const [merchant, setMerchant] = useState(existing?.merchant ?? '')
  const [envId, setEnvId] = useState(existing?.envelope ?? route?.params?.envelope ?? envelopes[0]?.id ?? '')
  const [selectedDate, setSelectedDate] = useState(() => {
    if (existing) return startOfDay(existing.at)
    const m = monthAt(monthOffset)
    return monthOffset === 0 ? startOfDay(Date.now()) : m.start
  })
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(selectedDate)
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [partner, setPartner] = useState(existing?.partner ?? false)
  const env = envelopes.find((e) => e.id === envId) ?? envelopes[0]
  const keys = ADD_EXPENSE.keys
  const { width } = useWindowDimensions()
  const keyW = Math.floor((Math.min(width, 430) - 40 - 16) / 3)
  const value = parseAmount(amount)
  const valid = !!env && value > 0
  const first = new Date(calendarMonth)
  const leading = (first.getDay() + 6) % 7
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)
  const today = startOfDay(Date.now())
  const save = () => {
    if (!valid || !env) return
    const time = existing ? existing.at - startOfDay(existing.at) : Date.now() - today
    const at = selectedDate + time
    const data = { amount: value, envelope: env.id, merchant: merchant.trim() || env.title, at, partner: !!env.mine && partner, source: existing?.source ?? 'manual' as const }
    if (existing) update(existing.id, data)
    else add(data)
    navigation.goBack()
  }
  const del = () => existing && confirm(ADD_EXPENSE.confirmTitle, ADD_EXPENSE.confirmText, ADD_EXPENSE.delete, ADD_EXPENSE.cancel, () => { remove(existing.id); navigation.goBack() })
  const changeCalendarMonth = (delta: number) => {
    const d = new Date(calendarMonth)
    setCalendarMonth(new Date(d.getFullYear(), d.getMonth() + delta, 1).getTime())
  }
  return (
    <Screen keyboardAware header={<TopBar left={{ name: 'xmark', android: 'close' }} onLeft={() => navigation.goBack()} leftLabel={A11Y.close} />} footer={
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {existing ? <Button label={ADD_EXPENSE.delete} secondary onPress={del} style={{ flex: 1 }} /> : null}
        <Button label={existing ? ADD_EXPENSE.update : fill(ADD_EXPENSE.save, { category: env?.title ?? '' })} onPress={save} disabled={!valid} style={{ flex: 2 }} />
      </View>
    }>
      <View style={styles.head}>
        <Text style={[styles.amount, { color: COLORS.ink }, W.title]} numberOfLines={1} adjustsFontSizeToFit>{`${amount || '0'} ${ADD_EXPENSE.currency}`}</Text>
        <View style={[styles.merchant, { backgroundColor: COLORS.card }]}>
          <Icon {...ADD_EXPENSE.merchantIcon} size={18} color={COLORS.accentInk} />
          <TextInput value={merchant} onChangeText={setMerchant} placeholder={ADD_EXPENSE.merchantPlaceholder} placeholderTextColor={COLORS.muted}
            returnKeyType="done" style={[{ fontSize: 15, color: COLORS.ink, minWidth: 110, maxWidth: 220, paddingVertical: 0 }, W.semibold]} />
        </View>
      </View>
      <View style={styles.dateBlock}>
        <Text style={[{ fontSize: 14, color: COLORS.muted }, W.semibold]}>Date de l’opération</Text>
        <Pressable onPress={() => setCalendarOpen((open) => !open)} accessibilityRole="button" accessibilityLabel={`Date de l’opération : ${dateLabel(selectedDate)}`} style={({ pressed }) => [styles.dateButton, { backgroundColor: COLORS.card, opacity: pressed ? 0.75 : 1 }]}>
          <Icon name="calendar" android="calendar" size={20} color={COLORS.accent} />
          <Text style={[{ fontSize: 16, color: COLORS.ink, flex: 1 }, W.semibold]}>{dateLabel(selectedDate)}</Text>
          <Icon name={calendarOpen ? 'chevron.up' : 'chevron.down'} android={calendarOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.muted} />
        </Pressable>
        {calendarOpen ? <Card padding={12} style={{ marginTop: 8 }}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={() => changeCalendarMonth(-1)} accessibilityRole="button" accessibilityLabel="Mois précédent" style={styles.calendarArrow}><Icon name="chevron.left" android="chevron-back" size={20} color={COLORS.ink} /></Pressable>
            <Text style={[{ fontSize: 16, color: COLORS.ink }, W.semibold]}>{MONTHS[first.getMonth()]} {first.getFullYear()}</Text>
            <Pressable onPress={() => changeCalendarMonth(1)} accessibilityRole="button" accessibilityLabel="Mois suivant" style={styles.calendarArrow}><Icon name="chevron.right" android="chevron-forward" size={20} color={COLORS.ink} /></Pressable>
          </View>
          <View style={styles.calendarGrid}>
            {WEEK_LETTERS.map((label, i) => <Text key={`w${i}`} style={[styles.weekday, { color: COLORS.muted }, W.semibold]}>{label}</Text>)}
            {cells.map((day, i) => {
              if (day === null) return <View key={`blank${i}`} style={styles.dayCell} />
              const stamp = startOfDay(new Date(first.getFullYear(), first.getMonth(), day).getTime())
              const active = stamp === selectedDate
              const disabled = stamp > today
              return <Pressable key={day} disabled={disabled} onPress={() => { setSelectedDate(stamp); setCalendarOpen(false) }} accessibilityRole="button" accessibilityState={{ selected: active, disabled }} accessibilityLabel={dateLabel(stamp)} style={[styles.dayCell, active && { backgroundColor: COLORS.accent }, disabled && { opacity: 0.35 }]}>
                <Text style={[{ fontSize: 14, color: active ? COLORS.onAccent : COLORS.ink }, W.semibold]}>{day}</Text>
              </Pressable>
            })}
          </View>
        </Card> : null}
      </View>
      {!calendarOpen ? <>
        {envelopes.length ? <Tags items={envelopes.map((c) => ({ label: c.title, icon: c.icon, active: c.id === env?.id, bg: COLORS.accent, color: COLORS.onAccent, onPress: () => setEnvId(c.id) }))} /> : <Text style={[{ fontSize: 14, color: COLORS.muted, textAlign: 'center', marginTop: 14 }, W.medium]}>{ADD_EXPENSE.noEnvelope}</Text>}
        {env?.mine ? <Tags items={[PARTNER.me, PARTNER.name].map((label, i) => ({ label: i === 0 ? `${ADD_EXPENSE.paidBy} ${label.toLowerCase()}` : label, active: (i === 1) === partner, onPress: () => setPartner(i === 1) }))} mt={10} /> : null}
        <View style={styles.pad}>
          {keys.map((k) => <Pressable key={k} onPress={() => setAmount((a) => press(a, k))} accessibilityRole="button" accessibilityLabel={k} style={({ pressed }) => [styles.key, { width: keyW, backgroundColor: COLORS.card }, pressed && { opacity: 0.6 }]}><Text style={[{ fontSize: 24, color: COLORS.ink }, W.semibold]}>{k}</Text></Pressable>)}
          <Pressable onPress={() => setAmount((a) => a.slice(0, -1))} accessibilityRole="button" accessibilityLabel={A11Y.erase} style={({ pressed }) => [styles.key, { width: keyW, backgroundColor: COLORS.card }, pressed && { opacity: 0.6 }]}><Icon name="delete.left" android="backspace" size={24} color={COLORS.ink} /></Pressable>
        </View>
      </> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: 12, paddingTop: 16, paddingHorizontal: 20 },
  amount: { fontSize: 60, lineHeight: 64, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  merchant: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 14, borderRadius: 99 },
  dateBlock: { marginTop: 18, marginHorizontal: 20 },
  dateButton: { minHeight: 52, borderRadius: 18, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calendarArrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, height: 36, textAlign: 'center', textAlignVertical: 'center', fontSize: 13 },
  dayCell: { width: `${100 / 7}%`, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 16, paddingHorizontal: 20 },
  key: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
})
