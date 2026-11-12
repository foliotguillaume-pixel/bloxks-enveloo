import { useMemo, useState } from 'react'
import { Image, Text, View } from 'react-native'
import { Screen } from '../components/Screen'
import { Button, Card, Field, ProgressBar, Title, TopBar } from '../components/ui'
import { APP_ICON } from '../zzz/appAssets'
import { COLORS, W } from '../theme'
import { parseAmount, money, useEnvelopes, useMonth } from '../lib/budget'
import { usePersistentState } from '../lib/store'
import type { Nav } from '../lib/nav'

const SPLITS = [
  { name: 'Équilibrée', values: [50, 25, 10, 15] },
  { name: 'Charges prioritaires', values: [60, 25, 5, 10] },
  { name: 'Épargne renforcée', values: [45, 25, 10, 20] },
]

type Split = { name: string; values: number[] }

export default function OnboardingScreen({ navigation }: { navigation: Nav }) {
  const [step, setStep] = useState(0)
  const [salary, setSalary] = useState('')
  const [split, setSplit] = useState<Split>(SPLITS[0])
  const [, setOnboardingDone] = usePersistentState<boolean>('onboardingComplete', false)
  const envelopes = useEnvelopes()
  const [month, setMonth] = useMonth()
  const income = parseAmount(salary)
  const amounts = useMemo(() => {
    if (!Number.isFinite(income) || income <= 0) return []
    let assigned = 0
    return split.values.map((percent, index) => {
      const amount = index === split.values.length - 1 ? income - assigned : Math.round(income * percent / 100)
      assigned += amount
      return amount
    })
  }, [income, split])

  const finish = () => {
    if (amounts.length !== 4 || envelopes.items.length < 4) return
    setMonth({ ...month, income })
    envelopes.setItems((current) => current.map((item, index) => index < 4 ? { ...item, budget: amounts[index] } : item))
    setOnboardingDone(true)
    navigation.replace('Envelopes')
  }
  const next = () => {
    if (step === 0) setStep(1)
    else if (step === 1 && income > 0) setStep(2)
    else if (step === 2) finish()
  }

  return (
    <Screen
      header={<TopBar left={step > 0 ? undefined : null} leftLabel="Retour" onLeft={() => setStep((current) => Math.max(0, current - 1))} rightText={`${step + 1} / 3`} />}
      footer={<Button label={step === 2 ? 'Créer mon budget' : 'Continuer'} onPress={next} disabled={step === 1 && (!Number.isFinite(income) || income <= 0)} />}
    >
      {step === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 24, paddingHorizontal: 22 }}>
          <Image source={APP_ICON} style={{ width: 96, height: 96, borderRadius: 24, marginBottom: 24 }} />
          <Title title="Ton budget, sans connexion bancaire" sub="Répartis ton salaire dans des enveloppes et garde le contrôle, simplement." size={30} />
          <Card padding={18} style={{ marginHorizontal: 0, marginTop: 24, alignSelf: 'stretch' }}>
            <Text style={[{ color: COLORS.ink, fontSize: 16, lineHeight: 23 }, W.regular]}>Tes opérations restent sur cet appareil. Tu les ajoutes toi-même ou tu importes un relevé CSV quand tu le souhaites.</Text>
          </Card>
        </View>
      ) : step === 1 ? (
        <View>
          <Title eyebrow="TON SALAIRE" title="Combien veux-tu répartir ?" sub="Tu pourras saisir un montant différent pour chaque mois." size={28} />
          <Field placeholder="Salaire net du mois, en euros" value={salary} onChangeText={setSalary} keyboardType="decimal-pad" mt={24} />
          <Card padding={16} style={{ marginTop: 16 }}>
            <Text style={[{ color: COLORS.muted, fontSize: 14, lineHeight: 20 }, W.regular]}>Exemple : 2 000,00. La devise se choisit ensuite dans les réglages.</Text>
          </Card>
        </View>
      ) : (
        <View>
          <Title eyebrow="PREMIÈRE RÉPARTITION" title="Choisis ton point de départ" sub="Les montants seront ajustables à tout moment." size={28} />
          <View style={{ marginHorizontal: 18, gap: 10, marginTop: 20 }}>
            {SPLITS.map((option) => {
              const selected = split.name === option.name
              return (
                <Card key={option.name} padding={16} onPress={() => setSplit(option)} style={selected ? { borderWidth: 2, borderColor: COLORS.accent } : undefined}>
                  <Text style={[{ color: COLORS.ink, fontSize: 16 }, W.semibold]}>{selected ? '✓  ' : ''}{option.name}</Text>
                  <Text style={[{ color: COLORS.muted, fontSize: 13, marginTop: 4 }, W.regular]}>{option.values.join(' · ')} %</Text>
                </Card>
              )
            })}
          </View>
          <Card padding={16} style={{ marginTop: 18 }}>
            {envelopes.items.slice(0, 4).map((item, index) => (
              <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, gap: 12 }}>
                <Text numberOfLines={1} style={[{ flex: 1, color: COLORS.ink, fontSize: 14 }, W.regular]}>{item.title} · {split.values[index]} %</Text>
                <Text style={[{ color: COLORS.accent, fontSize: 14 }, W.semibold]}>{money(amounts[index] ?? 0)}</Text>
              </View>
            ))}
            <Text style={[{ color: COLORS.muted, fontSize: 13, marginTop: 8 }, W.regular]}>Salaire réparti : {money(income)}</Text>
          </Card>
        </View>
      )}
    </Screen>
  )
}
