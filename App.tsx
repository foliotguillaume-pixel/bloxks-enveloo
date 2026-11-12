// Modèle Bloxks · Budget · variante B « Enveloppes » (kit Clean).
// Parcours : accueil, opérations, enveloppes, compte, plan et réglages.
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAppFonts } from './zzz/fonts'
import { COLORS } from './theme'
import EnvelopesScreen from './screens/EnvelopesScreen'
import AddExpenseScreen from './screens/AddExpenseScreen'
import EnvelopeScreen from './screens/EnvelopeScreen'
import UnallocatedExpensesScreen from './screens/UnallocatedExpensesScreen'
import PlanScreen from './screens/PlanScreen'
import BudgetItemEditorScreen from './screens/BudgetItemEditorScreen'
import ImportCsvScreen from './screens/ImportCsvScreen'
import ProfileScreen from './common/ProfileScreen'
import SettingsScreen from './common/SettingsScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import { usePersistentState } from './lib/store'

const Stack = createStackNavigator()

export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export default function App() {
  const fontsReady = useAppFonts()
  const [onboardingDone, , onboardingReady] = usePersistentState<boolean>('onboardingComplete', false)
  return (
    <SafeAreaProvider>
      <Providers>
        <NavigationContainer>
          {fontsReady && onboardingReady ? (
            <Stack.Navigator initialRouteName={onboardingDone ? 'Envelopes' : 'Onboarding'} screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.bg } }}>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'none' }} />
              <Stack.Screen name="Envelopes" component={EnvelopesScreen} options={{ animation: 'none' }} />
              <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
              <Stack.Screen name="Envelope" component={EnvelopeScreen} />
              <Stack.Screen name="Unallocated" component={UnallocatedExpensesScreen} />
              <Stack.Screen name="Plan" component={PlanScreen} />
              <Stack.Screen name="BudgetItemEditor" component={BudgetItemEditorScreen} />
              <Stack.Screen name="ImportCsv" component={ImportCsvScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'none' }} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'none' }} />
            </Stack.Navigator>
          ) : <View style={{ flex: 1, backgroundColor: COLORS.bg }} />}
        </NavigationContainer>
      </Providers>
    </SafeAreaProvider>
  )
}
