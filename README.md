# Code exporté depuis Bloxks

Ce ZIP contient le code source de ton application (écrans, composants,
fichiers `zzz/*.ts` gérés par le builder). Ce n'est **pas** un projet Expo
prêt à builder tel quel : il manque `app.json`, `eas.json`, le point
d'entrée généré et certaines dépendances npm. Ces fichiers sont générés côté
plateforme au moment du build (App Store / Google Play).

## Images, vidéos, audio

Les médias de l'app (`zzz/videoAssets.ts`, `zzz/audioAssets.ts`, etc.) sont
référencés par URL distante, pas embarqués dans ce ZIP. Ils continueront de
fonctionner tant que ces URLs restent en ligne côté Bloxks.

## Clés déjà présentes dans le code

- **Supabase** (`zzz/supabaseConfig.ts`) : URL + clé publique (anon). C'est
  une clé publique par conception, protégée par les règles RLS côté serveur —
  pas un secret à cacher.
- **RevenueCat** (`zzz/paywallConfig.ts`) : clé publique SDK. Également
  publique par conception.

## Clés absentes (volontairement)

Les secrets tiers (par ex. OpenAI) ne sont jamais inclus dans le code de
l'app : ils restent stockés comme secrets d'Edge Function côté Supabase et
ne sont accessibles que côté serveur.

## Synchronisation GitHub

Si ce dépôt est relié à Bloxks, chaque nouvelle version de l'app y est
poussée automatiquement sous forme d'un commit qui remplace tout le contenu.
Travaille sur une autre branche pour ne pas voir tes modifications écrasées.
