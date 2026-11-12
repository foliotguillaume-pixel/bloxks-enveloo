import { FlatList, Text, View } from 'react-native'
import { Screen } from '../components/Screen'
import { Button, Card, Dropdown, Title, TopBar } from '../components/ui'
import { MonthNavigator } from '../components/MonthNavigator'
import { A11Y, UNALLOCATED } from '../lib/content'
import { euro, inRange, isUnallocatedExpense, monthAt, total, useEnvelopesForMonth, useExpenses, useSelectedMonth, when } from '../lib/budget'
import { tabsFor, type Nav } from '../lib/nav'
import { COLORS, W } from '../theme'

export default function UnallocatedExpensesScreen({ navigation }: { navigation: Nav }) {
  const [monthOffset, setMonthOffset] = useSelectedMonth()
  const { items: envelopes } = useEnvelopesForMonth(monthOffset)
  const { items: expenses, update } = useExpenses()
  const month = monthAt(monthOffset)
  const pending = inRange(expenses.filter(isUnallocatedExpense), month.start, month.end).sort((a, b) => b.at - a.at)
  const pendingTotal = total(pending)
  const summary = `${pending.length} opération${pending.length === 1 ? '' : 's'} · ${euro(pendingTotal, false)} à classer`

  return (
    <Screen tabs={tabsFor(navigation, 0)} scroll={false} header={<TopBar left={{ name: 'chevron.left', android: 'chevron-back' }} onLeft={() => navigation.goBack()} leftLabel={A11Y.back} />}>
      <FlatList
        style={{ flex: 1, marginHorizontal: 16 }}
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16, gap: 10 }}
        ListHeaderComponent={(
          <View style={{ marginHorizontal: -16 }}>
            <MonthNavigator offset={monthOffset} onChange={setMonthOffset} />
            <Title eyebrow="À RÉPARTIR" title={UNALLOCATED.title} sub={summary} />
          </View>
        )}
        ListEmptyComponent={(
          <View style={{ marginTop: 18 }}>
            <Card padding={18} style={{ gap: 12 }}>
              <Text style={[{ color: COLORS.ink, fontSize: 17 }, W.semibold]}>{UNALLOCATED.emptyTitle}</Text>
              <Text style={[{ color: COLORS.muted, fontSize: 14 }, W.regular]}>{UNALLOCATED.emptySub}</Text>
              <Button label={UNALLOCATED.import} secondary onPress={() => navigation.navigate('ImportCsv')} />
            </Card>
          </View>
        )}
        renderItem={({ item }) => (
          <Card padding={14} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[{ color: COLORS.ink, fontSize: 16 }, W.semibold]}>{item.merchant}</Text>
                <Text style={[{ color: COLORS.muted, fontSize: 13, marginTop: 3 }, W.regular]}>{when(item.at)}</Text>
              </View>
              <Text style={[{ color: COLORS.ink, fontSize: 16, fontVariant: ['tabular-nums'] }, W.semibold]}>−{euro(item.amount, false)}</Text>
            </View>
            <Text style={[{ color: COLORS.muted, fontSize: 13 }, W.medium]}>{UNALLOCATED.assignLabel}</Text>
            {envelopes.length ? (
              <Dropdown items={envelopes.map((envelope) => ({
                label: envelope.title,
                icon: envelope.icon,
                onPress: () => update(item.id, { envelope: envelope.id }),
              }))} placeholder="Choisir une enveloppe" mt={0} />
            ) : (
              <Button label="Préparer mes enveloppes" secondary onPress={() => navigation.navigate('Plan')} />
            )}
          </Card>
        )}
      />
    </Screen>
  )
}
