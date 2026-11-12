// Écran de compte du kit Clean : état réel de l’accès Bloxks Pay et accès aux réglages.
import { useEffect, useState } from 'react'
import { Share, Text, View } from 'react-native'
import { Screen } from '../components/Screen'
import { Card, List, Metrics, Title, TopBar } from '../components/ui'
import { COLORS, W } from '../theme'
import { A11Y, PROFILE, RECAP, SETTINGS_LINK } from '../lib/content'
import { cap, euro, fill, inRange, monthAt, monthName, total, useExpenses, useMonthFor, useSelectedMonth } from '../lib/budget'
import { tabsFor, type Nav } from '../lib/nav'
import { isEntitlementActiveNow, onCustomerInfoUpdate } from '../zzz/revenueCat'

type Profile = { name: string; email: string; bio: string }
export type ProfileParams = {
  initial?: Profile
  stats?: { label: string; value: string }[]
  /** écrans propres à l'app ouverts depuis le profil */
  links?: { label: string; icon: { name: string; android: string }; route: string }[]
}

export default function ProfileScreen({ navigation, route }: {
  navigation: Nav & { canGoBack?: () => boolean }
  route?: { params?: ProfileParams }
}) {
  const [access, setAccess] = useState<'loading' | 'free' | 'pro'>('loading')
  useEffect(() => {
    let mounted = true
    isEntitlementActiveNow('pro').then((active) => { if (mounted) setAccess(active ? 'pro' : 'free') })
    const unsubscribe = onCustomerInfoUpdate((active) => { if (mounted) setAccess(active ? 'pro' : 'free') }, 'pro')
    return () => { mounted = false; unsubscribe() }
  }, [])
  const [monthOffset] = useSelectedMonth()
  const { items: expenses } = useExpenses()
  const [baseMonth] = useMonthFor(0)
  const [month] = useMonthFor(monthOffset, monthOffset > 0 ? baseMonth : undefined)
  const m = monthAt(monthOffset)
  const expensesTotal = total(inRange(expenses, m.start, m.end))
  const saved = month.income - expensesTotal
  const signedSaved = `${saved >= 0 ? '+' : '−'}${euro(Math.abs(saved), false)}`
  const monthLabel = cap(`${monthName(m.m)} ${m.y}`)
  const exportMonth = () => {
    Share.share({ message: fill(RECAP.share, { month: monthLabel, income: euro(month.income, false), expenses: euro(expensesTotal, false), saved: signedSaved }) })
      .catch((error) => console.warn('partage du bilan', error))
  }
  const canGoBack = navigation.canGoBack?.() ?? false
  return (
    <Screen tabs={tabsFor(navigation, 1)} header={<TopBar left={canGoBack ? undefined : null} onLeft={() => navigation.goBack()} leftLabel={A11Y.back} />}>
      <Title eyebrow={PROFILE.app} title={PROFILE.title} sub={PROFILE.data} />
      <Card padding={18} style={{ marginHorizontal: 16, marginTop: 20, gap: 8 }}>
        <Text style={[{ fontSize: 13, color: COLORS.muted }, W.medium]}>{PROFILE.statusLabel}</Text>
        <View style={{ minHeight: 34, justifyContent: 'center' }}>
          <Text style={[{ fontSize: 20, color: COLORS.ink }, W.semibold]}>
            {access === 'loading' ? PROFILE.statusLoading : access === 'pro' ? PROFILE.statusPro : PROFILE.statusFree}
          </Text>
        </View>
      </Card>
      {route?.params?.stats?.length ? <Metrics items={route.params.stats.map((item) => ({ label: item.label, value: item.value }))} /> : null}
      <List mt={20} rows={[
        { icon: { name: 'square.and.arrow.up', android: 'share-outline' }, title: RECAP.exportTitle, sub: fill(RECAP.exportSub, { month: monthLabel }), onPress: exportMonth },
        ...(route?.params?.links ?? []).map((link) => ({ icon: link.icon as never, title: link.label, onPress: () => navigation.navigate(link.route) })),
        { icon: SETTINGS_LINK.icon, title: SETTINGS_LINK.title, sub: PROFILE.settings, onPress: () => navigation.replace('Settings') },
      ]} />
    </Screen>
  )
}
