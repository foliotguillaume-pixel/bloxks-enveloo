// Identité, libellés et données de démonstration d’Enveloo.
import type { IconProps } from '../zzz/Icon'
import { IMAGES } from '../zzz/brandImages'
type IconName = Pick<IconProps, 'name' | 'android'>
export type ImageKey = keyof typeof IMAGES
export const APP_NAME = 'Enveloo'
export type Swatch = { bg: string; fg: string; bar: string }
export type SwatchName = 'green' | 'orange' | 'pink' | 'blue' | 'grey'
export const SWATCHES: Record<SwatchName, Swatch> = {
 green:{bg:'#E7F7EC',fg:'#1E9E50',bar:'#34C759'},orange:{bg:'#FFF1E0',fg:'#E07800',bar:'#FF9500'},pink:{bg:'#FDEBF3',fg:'#D63384',bar:'#FF2D80'},blue:{bg:'#E3F2FF',fg:'#0A84FF',bar:'#0A84FF'},grey:{bg:'#F2F2F7',fg:'#3A3A3C',bar:'#8E8E93'},
}
export type SwatchRef = SwatchName | 'accent'
/** Montants monétaires stockés en centimes entiers. */
export type Envelope = {id:string;title:string;icon:IconName;swatch:SwatchRef;budget:number;mine?:number}
export const ENVELOPES_SEED: Envelope[] = [
 {id:'e-daily',title:'Vie courante',icon:{name:'cart.fill',android:'cart'},swatch:'green',budget:42000},
 {id:'e-leisure',title:'Loisirs',icon:{name:'sparkles',android:'sparkles'},swatch:'orange',budget:18000},
 {id:'e-health',title:'Santé',icon:{name:'cross.case.fill',android:'medkit'},swatch:'pink',budget:8000},
 {id:'e-projects',title:'Projets',icon:{name:'airplane',android:'airplane'},swatch:'grey',budget:12000},
]
export const NEW_ENVELOPE_LOOKS:{icon:IconName;swatch:SwatchRef}[]=[
 {icon:{name:'gift.fill',android:'gift'},swatch:'pink'},{icon:{name:'car.fill',android:'car'},swatch:'blue'},
 {icon:{name:'heart.fill',android:'heart'},swatch:'green'},{icon:{name:'tag.fill',android:'pricetag'},swatch:'orange'},
]
/** Démonstration variée ; tous les montants sont en centimes. */
export const EXPENSES_SEED:{daysAgo:number;time:string;envelope:string;merchant:string;amount:number;partner?:boolean}[]=[
 {daysAgo:0,time:'12:04',envelope:'e-daily',merchant:'Marché du quartier',amount:4820},{daysAgo:1,time:'19:30',envelope:'e-leisure',merchant:'Dîner entre amis',amount:4200},
 {daysAgo:2,time:'10:15',envelope:'e-daily',merchant:'Boulangerie',amount:850},{daysAgo:2,time:'16:40',envelope:'e-leisure',merchant:'Cinéma',amount:2350},
 {daysAgo:4,time:'18:20',envelope:'e-daily',merchant:'Épicerie',amount:6430},{daysAgo:5,time:'13:00',envelope:'__unallocated__',merchant:'Électricité',amount:5990},
 {daysAgo:6,time:'20:45',envelope:'e-leisure',merchant:'Restaurant',amount:3100},{daysAgo:8,time:'11:10',envelope:'e-daily',merchant:'Courses',amount:2740},
 {daysAgo:9,time:'15:30',envelope:'e-health',merchant:'Pharmacie',amount:1290},{daysAgo:11,time:'17:05',envelope:'e-daily',merchant:'Épicerie',amount:5280},
 {daysAgo:12,time:'09:00',envelope:'__unallocated__',merchant:'Assurance habitation',amount:9500},{daysAgo:13,time:'21:00',envelope:'e-leisure',merchant:'Sortie',amount:5800},
 {daysAgo:15,time:'12:30',envelope:'e-daily',merchant:'Maison et entretien',amount:7250},{daysAgo:16,time:'18:00',envelope:'e-daily',merchant:'Courses',amount:7120},
 {daysAgo:19,time:'19:45',envelope:'e-leisure',merchant:'Repas',amount:4600},{daysAgo:21,time:'10:30',envelope:'e-daily',merchant:'Marché',amount:4100},
 {daysAgo:24,time:'14:20',envelope:'e-projects',merchant:'Librairie',amount:1890},{daysAgo:26,time:'18:10',envelope:'e-daily',merchant:'Courses',amount:5860},
 {daysAgo:29,time:'20:00',envelope:'e-leisure',merchant:'Restaurant',amount:5100},{daysAgo:33,time:'11:00',envelope:'e-daily',merchant:'Courses',amount:6610},
 {daysAgo:36,time:'15:00',envelope:'e-projects',merchant:'Équipement',amount:4400},{daysAgo:38,time:'09:00',envelope:'__unallocated__',merchant:'Internet',amount:2990},
 {daysAgo:40,time:'19:00',envelope:'e-leisure',merchant:'Repas',amount:6400},{daysAgo:43,time:'12:00',envelope:'e-daily',merchant:'Courses',amount:5530},
 {daysAgo:47,time:'17:30',envelope:'e-health',merchant:'Pharmacie',amount:4990},{daysAgo:50,time:'18:15',envelope:'e-daily',merchant:'Courses',amount:8240},
 {daysAgo:54,time:'20:30',envelope:'e-leisure',merchant:'Sortie',amount:5700},{daysAgo:58,time:'11:45',envelope:'e-daily',merchant:'Courses',amount:9170},
 {daysAgo:63,time:'16:00',envelope:'e-leisure',merchant:'Cinéma',amount:2400},{daysAgo:68,time:'09:00',envelope:'__unallocated__',merchant:'Téléphone',amount:1990},
 {daysAgo:71,time:'12:20',envelope:'e-daily',merchant:'Marché',amount:7450},{daysAgo:77,time:'19:10',envelope:'e-leisure',merchant:'Restaurant',amount:6200},
 {daysAgo:84,time:'14:00',envelope:'e-projects',merchant:'Papeterie',amount:3990},{daysAgo:92,time:'18:40',envelope:'e-daily',merchant:'Courses',amount:10230},
 {daysAgo:100,time:'20:00',envelope:'e-leisure',merchant:'Repas',amount:4900},{daysAgo:110,time:'11:30',envelope:'e-daily',merchant:'Courses',amount:9600},
]
export const MONTH_SEED={income:200000}
export type Goal={id:string;title:string;icon:IconName;swatch:SwatchRef;target:number;saved:number}
export const GOALS_SEED:Goal[]=[
 {id:'g-safety',title:'Épargne de précaution',icon:{name:'shield.lefthalf.filled',android:'shield-half'},swatch:'accent',target:300000,saved:216000},
 {id:'g-project',title:'Projet personnel',icon:{name:'sparkles',android:'sparkles'},swatch:'blue',target:120000,saved:66000},
 {id:'g-home',title:'Maison et équipement',icon:{name:'house.fill',android:'home'},swatch:'grey',target:160000,saved:36000},
 {id:'g-gifts',title:'Cadeaux',icon:{name:'gift.fill',android:'gift'},swatch:'pink',target:30000,saved:5000},
]
export const PARTNER={name:'À deux',me:'Moi'}
export const MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
export const MONTHS_SHORT=['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.']
export const DAYS=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
export const WEEK_LETTERS=['L','M','M','J','V','S','D']
export const DATE_WORDS={today:'Aujourd’hui',yesterday:'Hier',twoDays:'Avant-hier'}
export const TABS:{icon:IconName;label:string;route:string;root:boolean}[]=[
 {icon:{name:'envelope.fill',android:'mail'},label:'Enveloppes',route:'Envelopes',root:true},
 {icon:{name:'person.crop.circle.fill',android:'person-circle'},label:'Mon compte',route:'Profile',root:true},
 {icon:{name:'gearshape.fill',android:'settings'},label:'Réglages',route:'Settings',root:true},
]
export const A11Y={back:'Retour',close:'Fermer',edit:'Modifier l’enveloppe',share:'Partager le suivi',scan:'Importer un relevé CSV',flash:'Flash',shoot:'Photographier',gallery:'Choisir un fichier CSV',retake:'Reprendre',addExpense:'Ajouter une opération',erase:'Effacer',profile:'Mon compte'}
export const PROFILE={title:'Mon compte',app:'Enveloo',statusLabel:'Statut d’accès',statusLoading:'Vérification en cours…',statusFree:'Version gratuite',statusPro:'Version complète active',data:'Tes données de budget restent sur cet appareil.',settings:'Réglages'}
export const SETTINGS_LINK={title:'Ouvrir les réglages',icon:{name:'gearshape.fill',android:'settings'} as IconName}
export const ENVELOPES={eyebrow:'{month} · jour {day} sur {days}',title:'Mon budget',photo:'avatar-1' as ImageKey,remaining:{label:'Solde restant',budget:'Budget prévu {amount}',spent:'Dépensé {amount}'},rowSub:'{spent} dépensés · budget {budget}',shared:'',unallocatedTitle:'Sans enveloppe',unallocatedSub:'Opérations sans enveloppe · {count} à classer',menuTitle:'Ajouter une opération',manual:'Saisie manuelle',import:'Importer un relevé CSV',plan:'Salaire et enveloppe',empty:'Aucune enveloppe pour l’instant.',emptyAction:'Répartir mon salaire',fab:'Ajouter une opération'}
export const EXPENSE_SOURCE={manual:'Saisie manuelle',csv:'Import CSV'}
export const ADD_EXPENSE={currency:'€',decimal:',',merchantPlaceholder:'Libellé de l’opération',merchantIcon:{name:'tag.fill',android:'pricetag'} as IconName,keys:['1','2','3','4','5','6','7','8','9',',','0'],save:'Enregistrer dans {category}',update:'Enregistrer',delete:'Supprimer',paidBy:'Payé par',confirmTitle:'Supprimer cette opération ?',confirmText:'Cette opération sera retirée de ton budget.',cancel:'Annuler',noEnvelope:'Choisis d’abord une enveloppe.'}
export const ENVELOPE={eyebrow:'Enveloppe · {budget} prévus ce mois',ringCaption:'disponibles · {days} jours',overCaption:'au-delà du prévu · {days} jours',weekTitle:'Cette semaine',monthTitle:'Ce mois-ci',empty:'Aucune opération classée ici ce mois-ci.',add:'Ajouter une opération',missing:'Cette enveloppe n’existe plus.'}
export const GOALS={eyebrow:'{n} objectifs · {amount} épargnés',title:'Épargne',featuredEyebrow:'Prioritaire',featuredSub:'Objectif de {target} · {pct} atteint',featuredDone:'{target} · objectif atteint',rowSub:'{saved} sur {target}',amountPlaceholder:'Montant en euros',deposit:'Ajouter',withdraw:'Retirer',remove:'Supprimer l’objectif',newGoal:'Nouvel objectif',titlePlaceholder:'Nom de l’objectif',targetPlaceholder:'Montant visé en euros',create:'Créer',cancel:'Annuler',newLook:{icon:{name:'star.fill',android:'star'} as IconName,swatch:'blue' as SwatchRef},empty:'Aucun objectif d’épargne.'}
export const RECAP={exportTitle:'Exporter le suivi mensuel',exportSub:'Bilan de {month}',share:'Mon suivi de {month} : salaire {income}, dépenses saisies {expenses}, reste après saisies {saved}.'}
export const UNALLOCATED={title:'Opérations sans enveloppe',emptyTitle:'Aucune opération sans enveloppe',emptySub:'Importe un relevé CSV et choisis « Sans enveloppe » pour classer une opération plus tard.',assignLabel:'Affecter à une enveloppe',import:'Importer un relevé CSV'}
export const PLAN={validate:'Enregistrer',sub:'Répartis {income} dans tes enveloppes.',progressLabel:'Réparti',progressRight:'{planned} / {income}',incomeTitle:'Salaire du mois',incomeSub:'à distribuer',envelopeSub:'{month} · {amount} dépensés',left:'Il te reste {amount} à distribuer.',over:'Tu as réparti {amount} de plus que ton salaire.',balanced:'Tout est réparti : chaque euro a sa place.',budgetVsSpent:'Le budget prévu est une limite ; les dépenses correspondent aux opérations enregistrées.',missingItem:'Cet élément de budget n’existe plus.',noteIcon:{name:'info.circle.fill',android:'information-circle'} as IconName,amountPlaceholder:'Montant en euros',save:'Enregistrer',remove:'Supprimer',addEnvelope:'Nouvelle enveloppe',titlePlaceholder:'Nom',editorTitle:'Modifier le budget',envelopeKind:'Enveloppe',editorSub:'{month} · les changements s’appliquent à ce mois et aux suivants.',create:'Créer',confirmTitle:'Supprimer cette enveloppe ?',confirmText:'Ses opérations seront supprimées aussi.',cancel:'Annuler'}
export const COUPLE={title:'Budget partagé',sub:'Exemple de répartition du budget',photos:['avatar-1','avatar-2'] as ImageKey[],since:'Les enveloppes restent privées sur cet appareil',rowSub:'{spent} sur {budget}',oweIcon:{name:'lock.fill',android:'lock-closed'} as IconName,theyOwe:'Budget prévu',iOwe:'Dépenses du mois',even:'Aucune connexion bancaire',oweSub:'sur {n} opérations',evenSub:'Saisie manuelle ou import CSV, au choix.',cta:'Ajouter une opération',ctaPay:'Importer un relevé CSV',settle:'Voir le suivi',request:'Tu gardes le contrôle : les opérations sont ajoutées par toi.',pay:'Enveloo ne se connecte pas à ta banque.'}
export const SCAN_COLORS={night:'#000000'}
export const SCAN={aim:'Choisis un relevé CSV exporté depuis ta banque',receipt:{merchant:'Relevé CSV',lines:[{label:'Courses',price:4820,envelope:0},{label:'Facture',price:4200,envelope:0},{label:'Sortie',price:3600,envelope:1},{label:'Pharmacie',price:2350,envelope:2},{label:'Courses',price:6430,envelope:0},{label:'Librairie',price:5990,envelope:3}]},detected:'Relevé prêt · {n} lignes',sheet:{title:'{store} · {total}',sub:'{n} opérations à classer',button:'Ajouter les opérations'}}
export const CAMERA={starting:'Choisis un relevé CSV sur ton appareil.',deniedTitle:'Fichier non sélectionné',deniedSub:'Sélectionne un relevé exporté depuis ta banque.',allow:'Continuer',unavailableTitle:'Import CSV',unavailableSub:'Le fichier ne sera pas conservé ; seules les opérations extraites seront ajoutées.',importPhoto:'Choisir un fichier CSV'}
