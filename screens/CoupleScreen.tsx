// B7 · Budget à deux : les deux membres, charges et enveloppes communes avec leur répartition,
// et qui doit combien, calculé depuis les dépenses communes (qui a payé, part de chacun).
// La demande de remboursement passe par le partage du téléphone (aucun paiement réel).
import { Share } from 'react-native'
import { Screen } from '../components/Screen'
import { Avatars, Budgets, CtaBar, List, Title, TopBar } from '../components/ui'
import { IMAGES } from '../zzz/brandImages'
import { A11Y, COUPLE, FIXED, PARTNER } from '../lib/content'
import { swatch, tabsFor, type Nav } from '../lib/nav'
import { balanceWithPartner, euro, fill, inRange, money, monthAt, spentIn, useEnvelopes, useExpenses, useSettlements } from '../lib/budget'

export default function CoupleScreen({ navigation }: { navigation: Nav }) {
  const { items: envelopes } = useEnvelopes()
  const { items: expenses } = useExpenses()
  const [settled, setSettled] = useSettlements()
  const shared = envelopes.filter((e) => !!e.mine)
  const m = monthAt(0)
  const monthList = inRange(expenses, m.start, m.end)
  const { owed, count } = balanceWithPartner(expenses, envelopes, settled)
  const v = { partner: PARTNER.name, amount: money(Math.abs(owed)) }
  const even = Math.abs(owed) < 0.01
  const ask = () => {
    if (even) return
    Share.share({ message: fill(owed > 0 ? COUPLE.request : COUPLE.pay, v) }).catch((e) => console.warn('demande de remboursement', e))
  }
  const today = new Date().getDate()
  const rows = [
    ...FIXED.filter((f) => f.total).map((f) => ({
      mono: { icon: f.icon, bg: swatch('accent').bg, fg: swatch('accent').fg }, color: swatch('accent').bar, title: f.title,
      sub: fill(COUPLE.fixedSub, { total: euro(f.total ?? 0, false), split: f.split ?? '' }),
      right: today >= f.day ? COUPLE.paid : fill(COUPLE.due, { day: f.day }), progress: today >= f.day ? 1 : 0,
    })),
    ...shared.map((e) => {
      const spent = spentIn(monthList, e.id)
      const s = swatch(e.swatch)
      return {
        mono: { icon: e.icon, bg: s.bg, fg: s.fg }, color: s.bar, title: e.title,
        sub: fill(COUPLE.rowSub, { spent: euro(spent, false), budget: euro(e.budget, false), mine: e.mine ?? 0, theirs: 100 - (e.mine ?? 0) }),
        right: `${e.budget - spent < 0 ? '−' : ''}${euro(e.budget - spent, false)}`, progress: e.budget > 0 ? spent / e.budget : 0,
        onPress: () => navigation.navigate('Envelope', { id: e.id }),
      }
    }),
  ]
  return (
    <Screen tabs={tabsFor(navigation, 0)} footer={<CtaBar label={fill(owed >= 0 ? COUPLE.cta : COUPLE.ctaPay, v)} onPress={ask}
      link={even ? undefined : COUPLE.settle} onLink={() => setSettled((s) => Math.round((s + owed) * 100) / 100)} />} header={<TopBar onLeft={() => navigation.goBack()} leftLabel={A11Y.back} />}>
      <Title title={COUPLE.title} size={36} sub={fill(COUPLE.sub, v)} />
      <Avatars sources={COUPLE.photos.map((k) => IMAGES[k])} text={COUPLE.since} size={44} />
      <Budgets rows={rows} />
      <List rows={[{
        icon: COUPLE.oweIcon, title: even ? COUPLE.even : fill(owed > 0 ? COUPLE.theyOwe : COUPLE.iOwe, v),
        sub: even ? COUPLE.evenSub : fill(COUPLE.oweSub, { n: count }), right: even ? undefined : v.amount, onPress: even ? undefined : ask,
      }]} />
    </Screen>
  )
}
