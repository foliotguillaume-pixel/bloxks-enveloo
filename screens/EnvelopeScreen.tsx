// B3 · Détail d'une enveloppe : montant mensuel, anneau du reste, dépenses de la semaine, opérations.
// Calculé depuis les dépenses enregistrées ; toucher une dépense l'ouvre pour la modifier.
import { Text, View } from 'react-native'
import { Screen } from '../components/Screen'
import { Bars, Button, Ring, Title, TopBar, Transactions } from '../components/ui'
import { MonthNavigator } from '../components/MonthNavigator'
import { COLORS, W } from '../theme'
import { A11Y, ENVELOPE, EXPENSE_SOURCE, WEEK_LETTERS } from '../lib/content'
import { swatch, tabsFor, type Nav } from '../lib/nav'
import { DAY, euro, fill, inRange, monthAt, money, startOfDay, total, useEnvelopesForMonth, useExpenses, useSelectedMonth, when } from '../lib/budget'

export default function EnvelopeScreen({ navigation, route }: { navigation: Nav; route?: { params?: { id?: string } } }) {
  const [monthOffset, setMonthOffset] = useSelectedMonth()
  const { items: envelopes } = useEnvelopesForMonth(monthOffset)
  const { items: expenses } = useExpenses()
  const env = envelopes.find((e) => e.id === route?.params?.id) ?? (route?.params?.id ? undefined : envelopes[0])
  if (!env) {
    return (
      <Screen tabs={tabsFor(navigation, 0)} header={<TopBar onLeft={() => navigation.goBack()} leftLabel={A11Y.back} />}>
        <Text style={[{ fontSize: 16, color: COLORS.ink, textAlign: 'center', marginTop: 40 }, W.semibold]}>{ENVELOPE.missing}</Text>
      </Screen>
    )
  }
  const now = Date.now()
  const m = monthAt(monthOffset, now)
  const mine = expenses.filter((e) => e.envelope === env.id)
  const month = inRange(mine, m.start, m.end).sort((a, b) => b.at - a.at)
  const spent = total(month)
  const left = env.budget - spent
  const anchor = monthOffset === 0 ? now : monthOffset < 0 ? m.end - DAY : m.start
  const daysLeft = monthOffset < 0 ? 0 : m.days - new Date(anchor).getDate() + 1
  const anchorDay = new Date(anchor)
  const monday = startOfDay(anchor) - ((anchorDay.getDay() + 6) % 7) * DAY
  const week = WEEK_LETTERS.map((_, i) => total(inRange(mine, monday + i * DAY, monday + (i + 1) * DAY)))
  const sw = swatch(env.swatch)
  const add = () => navigation.navigate('AddExpense', { envelope: env.id, monthOffset })
  return (
    <Screen tabs={tabsFor(navigation, 0)} header={<TopBar onLeft={() => navigation.goBack()} leftLabel={A11Y.back} right={{ name: 'pencil', android: 'pencil' }} rightLabel={A11Y.edit} onRight={() => navigation.navigate('Plan')} />}>
      <MonthNavigator offset={monthOffset} onChange={setMonthOffset} />
      <Title eyebrow={fill(ENVELOPE.eyebrow, { budget: euro(env.budget, false) })} title={env.title} size={36} />
      <Ring progress={env.budget > 0 ? Math.max(0, left) / env.budget : 0} value={`${left < 0 ? '−' : ''}${euro(left, false)}`} valueSize={32}
        caption={fill(left >= 0 ? ENVELOPE.ringCaption : ENVELOPE.overCaption, { days: daysLeft })} size={170} color={COLORS.accent} />
      <Bars values={week} labels={WEEK_LETTERS} title={ENVELOPE.weekTitle} right={euro(week.reduce((s, v) => s + v, 0), false)} height={70} highlight={(anchorDay.getDay() + 6) % 7} />
      {month.length ? (
        <Transactions groups={[{ title: ENVELOPE.monthTitle, total: money(spent), rows: month.map((t) => ({
          mono: { letter: t.merchant.trim()[0]?.toUpperCase() ?? '?', bg: sw.bg, fg: sw.fg }, title: t.merchant,
          sub: `${when(t.at)} · ${t.source === 'csv' ? EXPENSE_SOURCE.csv : EXPENSE_SOURCE.manual}`, amount: `−${money(t.amount).replace(' €', '')}`,
          onPress: () => navigation.navigate('AddExpense', { id: t.id, monthOffset }),
        })) }]} />
      ) : (
        <View style={{ alignItems: 'center', gap: 14, marginTop: 24, paddingHorizontal: 40 }}>
          <Text style={[{ fontSize: 15, color: COLORS.muted, textAlign: 'center' }, W.medium]}>{ENVELOPE.empty}</Text>
          <Button label={ENVELOPE.add} secondary onPress={add} />
        </View>
      )}
    </Screen>
  )
}
