import { Pressable, Text, View } from 'react-native'
import { Icon } from '../zzz/Icon'
import { COLORS, W } from '../theme'
import { monthAt, monthName, cap } from '../lib/budget'

type Props = { offset: number; onChange: (offset: number) => void }

export function MonthNavigator({ offset, onChange }: Props) {
  const month = monthAt(offset)
  const label = `${cap(monthName(month.m))} ${new Date(month.start).getFullYear()}`
  const step = (delta: number, accessibilityLabel: string) => (
    <Pressable onPress={() => onChange(offset + delta)} accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, opacity: pressed ? 0.65 : 1 })}>
      <Icon name={delta < 0 ? 'chevron.left' : 'chevron.right'} android={delta < 0 ? 'chevron-back' : 'chevron-forward'} size={20} color={COLORS.ink} />
    </Pressable>
  )
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {step(-1, 'Mois précédent')}
      <Text style={[{ color: COLORS.ink, fontSize: 17, textAlign: 'center' }, W.semibold]}>{label}</Text>
      {step(1, 'Mois suivant')}
    </View>
  )
}
