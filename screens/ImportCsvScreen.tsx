import { useRef, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { Screen } from '../components/Screen'
import { Button, Card, Title, TopBar } from '../components/ui'
import { COLORS, W } from '../theme'
import { A11Y } from '../lib/content'
import { UNALLOCATED_ENVELOPE_ID, useEnvelopesForMonth, useExpenses, useSelectedMonth } from '../lib/budget'
import { usePersistentState } from '../lib/store'
import { tabsFor, type Nav } from '../lib/nav'

type CsvRow = { id: string; at: number; date: string; label: string; amount: number; duplicate: boolean; done?: boolean; ignored?: boolean }
const parseCsv = (text: string): string[][] => {
  const delimiter = (text.split(/\r?\n/, 1)[0] ?? '').includes(';') ? ';' : ','
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++ }
    else if (c === '"') quoted = !quoted
    else if (c === delimiter && !quoted) { row.push(cell.trim()); cell = '' }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = '' }
    else cell += c
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row)
  return rows
}
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const dateStamp = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const parseDate = (s: string) => {
  const iso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/), fr = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/)
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]).getTime()
  if (fr) return new Date(+fr[3], +fr[2] - 1, +fr[1]).getTime()
  return NaN
}
const parseCents = (s: string) => {
  const m = s.replace(/[€\s\u00a0]/g, '').replace(',', '.').match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/)
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 100 + Number((m[3] ?? '').padEnd(2, '0'))) : NaN
}
const monthKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
const formatMoney = (cents: number) => `${Math.floor(cents / 100)}${cents % 100 ? `,${String(cents % 100).padStart(2, '0')}` : ''} €`

export default function ImportCsvScreen({ navigation }: { navigation: Nav }) {
  const [monthOffset] = useSelectedMonth()
  const { items: envelopes } = useEnvelopesForMonth(monthOffset)
  const { items: expenses, add } = useExpenses()
  const [count, setCount] = usePersistentState<number>(`csv-imports-${monthKey()}`, 0)
  const [rows, setRows] = useState<CsvRow[]>([])
  const quotaCounted = useRef(false)
  const [positiveIsExpense, setPositiveIsExpense] = useState(false)
  const [message, setMessage] = useState('Sélectionne un relevé CSV. Seules la date, le libellé et le montant seront lus.')
  const choose = async () => {
    if (count >= 2) { setMessage('Tu as utilisé tes 2 imports gratuits ce mois-ci.'); return }
    const picked = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'], copyToCacheDirectory: true })
    if (picked.canceled || !picked.assets[0]) return
    try {
      const table = parseCsv((await FileSystem.readAsStringAsync(picked.assets[0].uri, { encoding: 'utf8' })).replace(/^\uFEFF/, ''))
      if (table.length < 2) { setMessage('Ce fichier ne contient pas de lignes à importer.'); return }
      const headers = table[0].map(norm)
      const dateCol = headers.findIndex((h) => ['date', 'date operation', 'date de operation', 'date transaction'].includes(h))
      const labelCol = headers.findIndex((h) => ['libelle', 'description', 'operation', 'transaction', 'merchant'].includes(h))
      const amountCol = headers.findIndex((h) => ['montant', 'amount', 'debit', 'somme'].includes(h))
      if (dateCol < 0 || labelCol < 0 || amountCol < 0) { setMessage('Colonnes introuvables : le fichier doit contenir date, libellé et montant.'); return }
      const seen = new Set(expenses.map((e) => `${dateStamp(e.at)}|${Math.round(e.amount)}|${norm(e.merchant)}`))
      const parsed: CsvRow[] = []
      for (const r of table.slice(1)) {
        const at = parseDate(r[dateCol] ?? ''), label = (r[labelCol] ?? '').trim(), raw = (r[amountCol] ?? '').trim(), cents = parseCents(raw)
        if (!Number.isFinite(at) || !label || !Number.isFinite(cents) || cents === 0) continue
        if (cents > 0 && !positiveIsExpense) continue
        const amount = Math.abs(cents), date = dateStamp(at), key = `${date}|${amount}|${norm(label)}`, duplicate = seen.has(key)
        seen.add(key); parsed.push({ id: `${parsed.length}-${key}`, at, date, label, amount, duplicate })
      }
      if (!parsed.length) { setRows([]); setMessage('Aucune dépense à classer. Les crédits sont exclus ; vérifie le réglage du signe si ton relevé utilise des débits positifs.'); return }
      setRows(parsed); quotaCounted.current = false
      setMessage('Choisis une enveloppe ou « À répartir » pour chaque opération. Pour chaque doublon, tu peux importer quand même ou l’ignorer.')
    } catch { setMessage('Impossible de lire ce fichier. Choisis un relevé CSV enregistré sur ton appareil.') }
  }
  const classify = (row: CsvRow, envelope: string, allowDuplicate = false) => {
    if (row.done || row.ignored || (row.duplicate && !allowDuplicate)) return
    add({ amount: row.amount, envelope, merchant: row.label, at: row.at, source: 'csv' })
    if (!quotaCounted.current) { quotaCounted.current = true; setCount((n) => n + 1) }
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, done: true } : item))
  }
  const ignore = (row: CsvRow) => setRows((current) => current.map((item) => item.id === row.id ? { ...item, ignored: true } : item))
  return (
    <Screen tabs={tabsFor(navigation, 0)} header={<TopBar left={{ name: 'xmark', android: 'close' }} onLeft={() => navigation.goBack()} leftLabel={A11Y.close} />}>
      <Title eyebrow="Import CSV" title="Vérifie tes opérations" sub={`${Math.max(0, 2 - count)} import${2 - count === 1 ? '' : 's'} gratuit${2 - count === 1 ? '' : 's'} ce mois-ci`} />
      <View style={{ marginHorizontal: 16, gap: 10 }}>
        <Text style={[{ color: COLORS.muted, fontSize: 14 }, W.regular]}>{message}</Text>
        <Pressable onPress={() => setPositiveIsExpense((v) => !v)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={[{ color: COLORS.accent, fontSize: 14 }, W.semibold]}>{positiveIsExpense ? 'Débits positifs sélectionnés · toucher pour changer' : 'Débits négatifs sélectionnés · toucher si ton relevé utilise des débits positifs'}</Text>
        </Pressable>
        <Button label="Choisir un fichier CSV" onPress={choose} disabled={count >= 2} />
      </View>
      <FlatList data={rows} keyExtractor={(item) => item.id} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }} renderItem={({ item }) => (
        <Card padding={14}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1 }}><Text numberOfLines={1} style={[{ color: COLORS.ink, fontSize: 15 }, W.semibold]}>{item.label}</Text><Text style={[{ color: COLORS.muted, fontSize: 13, marginTop: 3 }, W.regular]}>{item.date}</Text></View>
            <Text style={[{ color: item.duplicate ? COLORS.muted : COLORS.ink, fontSize: 15 }, W.semibold]}>{item.ignored ? 'Ignorée' : item.done ? 'Classée' : item.duplicate ? 'Doublon' : formatMoney(item.amount)}</Text>
          </View>
          {!item.done && !item.ignored ? <>
            {item.duplicate ? <Text style={[{ color: COLORS.muted, fontSize: 13, marginTop: 10 }, W.regular]}>Cette opération existe déjà. Importer quand même ?</Text> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {envelopes.map((env) => <Pressable key={env.id} onPress={() => classify(item, env.id, item.duplicate)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 18, backgroundColor: COLORS.accentSoft }}><Text numberOfLines={1} style={[{ color: COLORS.accentInk, fontSize: 13 }, W.semibold]}>{item.duplicate ? `Importer · ${env.title}` : env.title}</Text></Pressable>)}
              <Pressable onPress={() => classify(item, UNALLOCATED_ENVELOPE_ID, item.duplicate)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 18, backgroundColor: COLORS.accentSoft }}><Text numberOfLines={1} style={[{ color: COLORS.accentInk, fontSize: 13 }, W.semibold]}>{item.duplicate ? 'Importer · À répartir' : 'À répartir'}</Text></Pressable>
              {item.duplicate ? <Pressable onPress={() => ignore(item)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}><Text style={[{ color: COLORS.ink, fontSize: 14 }, W.semibold]}>Ignorer</Text></Pressable> : null}
            </View>
          </> : null}
        </Card>
      )} />
    </Screen>
  )
}
