import { useEffect, useState } from 'react'
import { Screen } from '../components/Screen'
import { Button, Field, Note, Title, TopBar } from '../components/ui'
import { A11Y, PLAN } from '../lib/content'
import { cap, confirm, fill, monthAt, monthName, parseAmount, useEnvelopesForMonth, useExpenses } from '../lib/budget'
import { type Nav } from '../lib/nav'

type EditorParams = { id?: string; monthOffset?: number }

export default function BudgetItemEditorScreen({ navigation, route }: { navigation: Nav; route?: { params?: EditorParams } }) {
  const id = route?.params?.id ?? ''
  const monthOffset = route?.params?.monthOffset ?? 0
  const envelopes = useEnvelopesForMonth(monthOffset)
  const { setItems: setExpenses } = useExpenses()
  const envelope = envelopes.items.find((item) => item.id === id)
  const itemTitle = envelope?.title
  const itemAmount = envelope?.budget
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [initialized, setInitialized] = useState(false)
  const month = monthAt(monthOffset)
  const validAmount = parseAmount(amount)

  useEffect(() => {
    if (!envelopes.ready || initialized || itemAmount === undefined) return
    setTitle(itemTitle ?? '')
    setAmount((itemAmount / 100).toFixed(2).replace('.', ','))
    setInitialized(true)
  }, [envelopes.ready, initialized, itemTitle, itemAmount])

  const save = () => {
    if (!id || !title.trim() || !Number.isFinite(validAmount) || validAmount < 0) return
    envelopes.update(id, { title: title.trim(), budget: validAmount })
    navigation.goBack()
  }
  const remove = () => {
    if (!envelope) return
    confirm(
      PLAN.confirmTitle,
      PLAN.confirmText,
      PLAN.remove,
      PLAN.cancel,
      () => {
        envelopes.remove(id)
        setExpenses((list) => list.filter((expense) => expense.envelope !== id))
        navigation.goBack()
      },
    )
  }
  const isValid = initialized && !!title.trim() && Number.isFinite(validAmount) && validAmount >= 0

  return (
    <Screen keyboardAware header={<TopBar onLeft={() => navigation.goBack()} leftLabel={A11Y.back} />} footer={
      <Button label={PLAN.save} onPress={save} disabled={!isValid} />
    }>
      <Title eyebrow={PLAN.envelopeKind} title={itemTitle ?? PLAN.editorTitle} sub={fill(PLAN.editorSub, { month: cap(monthName(month.m)) })} />
      {!envelopes.ready ? null : !itemTitle ? <Note icon={PLAN.noteIcon} text={PLAN.missingItem} /> : (
        <>
          <Field placeholder={PLAN.titlePlaceholder} value={title} onChangeText={setTitle} />
          <Field placeholder={PLAN.amountPlaceholder} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" mt={12} onSubmit={save} />
          <Button label={PLAN.remove} secondary onPress={remove} style={{ marginHorizontal: 20, marginTop: 14 }} />
        </>
      )}
    </Screen>
  )
}
