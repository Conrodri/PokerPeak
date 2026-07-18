# PokerPeak — Documentation technique

> Documentation interne pour développeurs. Décrit ce qui a été construit, comment, et — surtout — **pourquoi**, à partir d'une lecture directe du code source (pas seulement des intentions déclarées dans `CLAUDE.md`). Là où le code et `CLAUDE.md` divergent, cette doc suit le code et signale l'écart.
>
> Page non listée dans la navigation — accessible uniquement via `/documentation`. Navigation par section dans la barre latérale (menu déroulant sur mobile).

## 1. Vue d'ensemble & stack

PokerPeak est une plateforme d'entraînement au Texas Hold'em (préflop, postflop, pot odds, équité, outs, bet sizing, bluff, main complète) avec ranges calibrées sur des solveurs GTO (GTO Wizard, PioSolver), un système de progression (XP, achievements, streaks) et trois tiers d'accès (gratuit, premium, premium expert).

**Stack**
- Frontend : React 18 + TypeScript + Vite + Tailwind CSS, routing via `react-router-dom` v6, état via Zustand, animations via Framer Motion.
- Backend : Node.js + Express + Prisma ORM. SQLite en dev local, PostgreSQL (Neon) en prod.
- Auth : JWT (email/password) + Google OAuth 2.0.
- Déploiement : Vercel (front, SPA statique) + Render (API Node) + Neon (Postgres managé).

**Principe directeur du repo** (`CLAUDE.md`) : mobile-first strict (testé à 375px), politique "non-scroll" sur PC pour les écrans d'exercice, précalcul maximum côté CPU utilisateur plutôt que calcul serveur à la volée, DRY systématique (réutilisation des tables de ranges entre formats), et une échelle visuelle standardisée (voir [§18](#18-conventions-ui-et-direction-artistique)).

---

## 2. Moteur poker (backend)

Tous les fichiers dans `backend/src/services/poker/`.

### `handEvaluator.ts` — évaluation des mains

Évalue la meilleure main 5 cartes parmi 5 à 7 cartes (flop/turn/river + main).

- **Scoring numérique comparable** : chaque main est réduite à un unique entier via `computeScore(handRank, kickers)` = `handRank × 15⁵ + Σ kicker[i] × 15^(4-i)` (`POW15` précalculé : `[1,15,225,3375,50625,759375]`). Comparer deux mains devient une simple comparaison d'entiers — pas de logique de branchement par catégorie à la comparaison.
- **Chemin "riche" vs chemin "lean"** : `evaluate5Cards()` retourne un objet complet (`rank`, `score`, `description`, `bestCards`) pour l'affichage ; `bestScore()`/`score5Sorted()` est un **doublon volontaire** du même calcul qui saute toute allocation d'objet/description — utilisé sur le hot path de la simulation Monte Carlo (`equity.ts`), où `evaluateBestHand()` est appelé des dizaines de milliers de fois par exercice. Le commentaire du code confirme : *"proven score-for-score identical to the rich path by the fuzz harness"* — un test de fuzzing existe pour garantir que les deux implémentations ne divergent jamais silencieusement.
- **Meilleure main sur 5-7 cartes** : `chooseFiveIndices(n)` précalcule (et cache dans une `Map`) tous les indices de combinaisons C(n,5) pour `n=5,6,7` — évite de régénérer les combinaisons à chaque appel (`evaluateBestHand`/`bestScore` sont eux aussi appelés massivement en boucle Monte Carlo).
- Gère la quinte "wheel" (A-2-3-4-5, où l'As joue bas) comme cas spécial dans `isStraight()`.

**Exemple**
```ts
evaluateBestHand(['Ah', 'Kh', 'Qh', 'Jh', 'Th', '2c', '7d']);
// → { rank: HandRank.ROYAL_FLUSH, score: 9070649125, description: 'Royal Flush', bestCards: [...] }

compareHands(['Ah', 'Ad', '2c', '3d', '9s'], ['Kh', 'Kd', '2c', '3d', '9s']);
// → 1  (la première main gagne : paire d'As bat paire de Rois)
```

### `equity.ts` — simulation Monte Carlo d'équité

`calculateEquity(hand1, hand2, board, simulations=5000)` — trois stratégies selon combien de cartes restent à venir, choisies pour être **exactes quand c'est gratuit, échantillonnées seulement quand c'est nécessaire** :

| Cartes restantes | Stratégie | Pourquoi |
|---|---|---|
| 0 (river complète) | Évaluation unique déterministe (`compareHands` une fois) | Pas de hasard restant — inutile de simuler. |
| 1 (turn → river) | **Énumération exacte** des ~47 cartes du deck restant (boucle `for` sur `pool`) | Il n'y a que 47 issues possibles — moins cher qu'un tirage aléatoire de 300+ échantillons, et exact au lieu d'approximatif. |
| 2+ (flop → river) | Monte Carlo échantillonné (`simulations` tirages, `remainingBoard` cartes tirées par tirage) | Trop d'issues à énumérer exhaustivement (C(47,2)=1081, C(47,3)=16215...). |

Le tirage échantillonné réutilise un **Fisher-Yates partiel** sur un pool de cartes construit une seule fois (`removeCards(createDeck(), knownCards)`), et écrit dans des **buffers `cards1`/`cards2` réutilisés** entre itérations (pas de `[...hand1, ...board, ...runout]` recréé à chaque tour) — élimine l'allocation mémoire par itération sur un hot path exécuté des milliers de fois par requête.

**Exemple**
```ts
// AKs vs QQ, flop déjà tombé — 2 cartes à venir → Monte Carlo échantillonné
calculateEquity(['Ah', 'Kh'], ['Qc', 'Qd'], ['Kd', '7h', '2s'], 5000);
// → { hand1WinPct: 91.2, hand2WinPct: 8.8, tiePct: 0, simulations: 5000 }

// Même mains, turn tombée — 1 carte à venir → énumération exacte (pas d'aléa)
calculateEquity(['Ah', 'Kh'], ['Qc', 'Qd'], ['Kd', '7h', '2s', '9c']);
// → { hand1WinPct: 95.7, hand2WinPct: 4.3, tiePct: 0, simulations: 44 }
```

### `outs.ts` — comptage d'outs et génération procédurale

Voir aussi le travail de cette session sur la génération turn (résumé ci-dessous, déjà en prod).

- `OutsScenario` : `heroCards, board, street ('flop'|'turn'), outs, draws[], difficulty, trap?` (`trap` = réponse fausse tentante pour piéger le double-comptage d'outs qui se chevauchent, ex. tirage couleur + quinte où une carte compte dans les deux).
- **Génération procédurale** (`GENERATORS`) plutôt qu'une liste figée : `genPocketPairSet, genOneOver, genGutshot, genPairOver, genTwoOver, genOESD, genFlush` — chaque générateur produit des cartes aléatoires respectant un archétype de tirage donné (ex. "paire servie → 2 outs pour le brelan"), avec des boucles de rejet (`hasStraightDraw`, vérif flush accidentel) pour garantir que le tirage généré est **exactement** celui voulu, sans tirage additionnel non désiré.
- **Distribution non-expert** : 85% généré procéduralement, 15% pioché dans `OUTS_SCENARIOS` (liste statique de secours/variété). **Expert** : distribution pondérée sur 7 types d'outs (3 à 15) + 6% de scénarios "trap" curés à la main (`EXPERT_OUTS_SCENARIOS`).
- **Turn (ajout de cette session)** : `toTurnScenario()` convertit un scénario flop en scénario turn en ajoutant une 4e carte de board "neutre" (`blankTurnCard()` — ne complète aucun tirage, ne pousse aucune couleur à 4) ; `TURN_SHARE = 0.3` fait qu'environ 30% des scénarios générés (normal et expert) deviennent des scénarios turn (règle ×2) au lieu de rester flop (règle ×4) — avant cette session, la turn n'apparaissait que via la petite liste statique (~2.5% du temps en mode normal).
- `estimateEquityFromOuts(outs, street)` — Règle de 2 et 4 : `outs × 4` sur flop, `outs × 2` sur turn.
- `randomDrawShape(outs, street)` — **réutilisation DRY** : le module Pot Odds a besoin de tirages avec un nombre d'outs précis mais veut de la variété de cartes ; plutôt que maintenir un second générateur, il réutilise les générateurs d'Outs via `SHAPE_GENERATORS` (map `outsCount → générateur`).

**Exemple**
```ts
getRandomOutsScenario();
// → { heroCards: ['9h', '8h'], board: ['7c', 'Th', '2h'], street: 'flop', outs: 15, trap: 17,
//     difficulty: 'hard', draws: [{ fr: 'Tirage couleur (cœur)...', en: '...' }, { fr: 'Tirage quinte...', en: '...' }] }

estimateEquityFromOuts(9, 'flop');  // → 36  (9 outs × 4, deux cartes à venir)
estimateEquityFromOuts(9, 'turn');  // → 18  (9 outs × 2, une seule carte à venir)
```

### `potOdds.ts` — cotes du pot et implied odds

- `calculatePotOdds(pot, bet, heroEquity)` → `{ potOdds, requiredEquity, ev, isProfitable, reasoning }`. `requiredEquity = bet / (pot + 2×bet)`.
- Trois niveaux de génération procédurale, un par difficulté : `generateEasyPotOddsScenario` (basic), `generateClosePotOddsScenario` (advanced/expert — équité volontairement proche du seuil pour forcer une vraie décision), `generateImpliedOddsScenario` (expert uniquement).
- **Implied odds** : chaque scénario expert a un `impliedWinnings` (gains supplémentaires espérés si le tirage arrive) et un `villainStackBehind`. `impliedRequiredEquity = call / (potDirect + impliedWinnings)` — un seuil **plus bas** que le seuil direct, qui peut faire basculer la décision de fold à call.
- **Correction apportée cette session** : la validation backend (`checkPotOddsAnswer`, contrôleur) accepte historiquement **soit** l'action directe **soit** l'action implied comme correcte (`isCorrect = userAction === directCorrectAction || userAction === impliedCorrectAction`) — un choix délibérément permissif pour une question unique, documenté en commentaire *"either action is a defensible read of the spot"*. Le frontend pose désormais **2 questions strictes et séparées** (sans implied, puis avec) en mode expert — chacune jugée strictement contre son propre seuil, calculées côté client à partir des champs déjà renvoyés par l'exercice (`requiredEquity` et `impliedRequiredEquity`), sans changement d'API nécessaire.

**Exemple**
```ts
calculatePotOdds(/* pot */ 20, /* bet */ 10, /* heroEquity */ 28);
// → { potOdds: 0.25, requiredEquity: 25, ev: +0.6, isProfitable: true,
//     reasoning: '10 ÷ (20+10+10) = 25% requis, tu as 28% → call rentable' }

// Scénario expert avec implied odds : le direct dit fold, l'implied dit call
// requiredEquity: 20.8 (seuil direct)   → 16% d'équité < 20.8% → fold
// impliedRequiredEquity: 11.9 (avec 18bb d'implied winnings) → 16% ≥ 11.9% → call
```

### `bluffService.ts` — génération narrative de spots de bluff

Pas de matrice de fréquences ici — 5 **scénario builders** procéduraux, chacun encodant un concept pédagogique de bluff précis :
- `buildIpCbetDry` — c-bet en position sur board sec/haut → petite mise (range bet, range advantage). Mélange 60% "bloqueur" (hero tient une carte du rang le plus haut, réduisant les combos adverses) / 40% air pur.
- (4 autres templates : `wet`, `semiBluff`, `float`, `oopMissed` — mêmes principes, contextes différents).

Chaque générateur construit un board avec des contraintes de forme (ex. "carte haute + 2 basses non connectées, rainbow") via boucle de rejet (jusqu'à 50 tentatives, fallback codé en dur si échec), puis produit une explication bilingue (fr/en) détaillée qui **justifie pédagogiquement** la décision (range advantage, blockers, etc.) — pas juste "bluff correct/incorrect".

`BluffExercise.template` est renvoyé au frontend et utilisé pour **éviter de tirer deux fois le même template consécutivement** (variété perçue).

**Exemple** (extrait de la sortie de `buildIpCbetDry()`)
```ts
{
  heroHand: ['Ah', '6c'], board: ['Ks', '8c', '3d'], street: 'flop',
  heroPosition: 'BTN', villainPosition: 'BB', heroIsIP: true,
  potBB: 9, correctAction: 'bluff-small', bluffAmountBB: 3,
  factors: { position: { score: 'positive', fr: '...' }, board: { score: 'positive', fr: '...' }, ... },
  template: 'dry',
}
```

### `bbDefense.ts` — défense Big Blind (règles, pas matrice)

Contrairement aux ranges d'ouverture (matrices 13×13), la défense BB est un **arbre de règles codées à la main** (`getBBDefenseAction(notation)`) — parce que c'est une décision à 3 issues (fold/call/3-bet) avec des mains "mixtes" fréquentes (ex. `JJ` : 3-bet ou call, `mk('3bet', 'call', true, 'value3bet')`), plus simple à exprimer en cascade de conditions (paires → `if r >= 12`, Ax suited → `if lo === 13`...) qu'en matrice de fréquences continues. Retourne aussi `kind` (`value3bet | bluff3bet | call | fold`) — utilisé par le trainer Préflop pour la question bonus "value ou bluff ?" en mode avancé.

**Exemple**
```ts
getBBDefenseAction('AKs');  // → { action: '3bet', alt: '3bet', isMixed: false, kind: 'value3bet' }
getBBDefenseAction('JJ');   // → { action: '3bet', alt: 'call',  isMixed: true,  kind: 'value3bet' }  (mixte, lean 3-bet)
getBBDefenseAction('A5s');  // → { action: '3bet', alt: 'call',  isMixed: true,  kind: 'bluff3bet' }  (bluff 3-bet, blocker d'As)
getBBDefenseAction('72o');  // → { action: 'fold', alt: 'fold',  isMixed: false, kind: 'fold' }
```

### `preflopCanonical.ts`

Notation canonique des mains (`AKs`, `AA`, `72o`...) — 169 mains uniques, utilisée comme clé d'indexation partout (ranges, exercices, presets).

---

## 3. Ranges GTO — représentation et système custom

**Fichiers** : `services/poker/ranges.ts` (tables GTO figées), `controllers/rangesController.ts` (CustomRange + RangePreset), `controllers/expertRangesController.ts` (ExpertRange), `controllers/profilesController.ts` (RangeProfile + RangeStackRange + résolution runtime).

### ⚠️ Représentation réelle : pas de bitmask

`CLAUDE.md` décrit un encodage bitmask BigInt (`encodeBitmask()`, `decodeBitmask()`, `getCanonical()`). **Ces fonctions n'existent pas dans le code** — recherche exhaustive négative sur tout le repo. La représentation réelle, partout, est un **tableau plat `number[169]`** (matrice 13×13 aplatie row-major : `i===j` → paire, `i<j` → suited, `i>j` → offsuit), où la valeur encode soit une **fréquence continue** `[0,1]` (0=fold, ]0,0.5]=mixte/call, >0.5=raise) pour les positions d'ouverture, soit un **code entier discret 0-4** pour la défense BB (voir ci-dessous). Un vrai bitmask (bits individuels) serait incompatible avec des fréquences mixtes continues — c'est probablement pourquoi cette approche a été abandonnée en cours de route sans que `CLAUDE.md` soit mis à jour. Voir [§21](#21-écarts-connus-avec-claudemd).

### Tables GTO figées (`ranges.ts`)

Matrices `Record<Position, number[][]>` par format × game type : `OPEN_RAISE` (6-max CG), `OPEN_RAISE_8MAX`, `OPEN_RAISE_6MAX_MTT`, `OPEN_RAISE_8MAX_MTT`, `OPEN_RAISE_3MAX_CG/MTT`, `OPEN_RAISE_HU_CG/MTT` — sourcées de GTO Wizard (100bb effectif, antes ~12.5% pour MTT).

**DRY inter-formats** : en 8-max, les positions `LJ/HJ/CO/BTN/SB/BB` sont positionnellement identiques aux positions 6-max (même distance du bouton) → réutilisées telles quelles (`LJ: OPEN_RAISE.UTG`), seules les 2 positions supplémentaires (`UTG`, `UTG1`, plus resserrées) ont leur propre table. Même principe pour 3-max/HU. Les ranges MTT sont systématiquement plus larges que cash game (effet des antes), avec le delta documenté en commentaire pour chaque position (ex. UTG 6-max : ~14% CG → ~17% MTT).

Fonctions de lookup : `getMatrixIndices(notation)`, `getRangeFrequency(position, notation, format, gameType)`, `getCorrectAction(...)`, `getRangeMatrix(...)`, `getRangePercentage(...)` (pondérée par nombre de combos : 6 pour paires, 4 suited, 12 offsuit).

**Exemple**
```ts
getMatrixIndices('AKs');                  // → [0, 1]   (A=index 0, K=index 1, i<j → triangle suited)
getRangeFrequency('BTN', 'AKs');          // → 1.0      (raise à 100% en BTN, 6-max cash game)
getRangeFrequency('UTG', 'A5s');          // → 0.25     (mix : raise 25% du temps seulement en UTG)
getCorrectAction('UTG', 'A5s');           // → { action: 'raise', frequency: 0.25, isMixed: true }
getRangePercentage('BTN', '6max', 'cashgame'); // → ~45  (% de mains ouvertes en BTN, pondéré par combos)
```

### CustomRange (mode simple) vs ExpertRange (mode expert)

- **`CustomRange.cells`** : `number[169]`. Pour BB, ce sont des **codes d'action 0-4** (pas des fréquences) — validé explicitement côté serveur : `max = isBB ? 4 : 1`. Codes issus de `bbDefense.ts` : `fold=0, call=1, value3bet=3, bluff3bet=4` (le code `2`, "thin call", est mentionné en commentaire mais jamais produit — incohérence mineure entre commentaire et implémentation actuelle).
- **`ExpertRange.mix`** : `number[676]` (169 × 4). Chaque groupe de 4 = `[fold, call, raise3x, allin]`, doit sommer à ~1.0 (tolérance `[0.99, 1.01]`, `validateMix()`) — modèle multi-actions fréquentiel complet (vraie stratégie mixte GTO), alors que CustomRange est mono-action par main (sauf le cas "mixte" affiché comme call).

**Exemple**
```ts
// CustomRange.cells — flat 169, index 0 = AA (i===j), index 13 = AKo (i>j, ligne A)
cells[0]  = 1.0;   // AA → raise 100%
cells[169-1] = 0;  // 22 → fold

// ExpertRange.mix — 4 valeurs par main, ex. AA (index 0 → offsets 0-3)
mix.slice(0, 4);   // [fold, call, raise3x, allin] → [0, 0, 0.7, 0.3]  (AA : 70% 3-bet, 30% all-in, jamais fold/call)
```

### RangeProfile — regroupement par tranche de stack (MTT)

Système plus récent qui a remplacé conceptuellement `RangePreset` pour le mode Expert. Un `RangeProfile` nommé (`mode: 'standard'|'expert'`) regroupe plusieurs `RangeStackRange` (tranches `stackMin`–`stackMax`).

- **Seeding automatique** : au premier appel de `listProfiles`, si l'utilisateur n'a aucun profil, `seedDefaultProfile()` crée un profil "Profil type" (expert) avec 3 tranches par défaut (`<20bb`, `<50bb`, `<100bb`), pré-remplies par `tierData()` qui dérive un mix `[fold,call,raise,allin]` depuis les fréquences GTO d'ouverture, pondéré différemment par profondeur (`short` = jam-heavy 55% allin, `mid` = raise-dominant, `deep` = plus de flats/pas de jam).
- **Résolution runtime** (`resolveRange`, `GET /profiles/resolve?position=&stack=`) : cherche le profil actif → la tranche dont `stack ∈ [stackMin, stackMax[` → fallback sur la dernière tranche si aucune ne correspond → fallback sur `CustomRange` si aucun profil actif. `simpleOnly=true` bypass tout le système de profils.

**Exemple**
```
GET /api/profiles/resolve?position=BTN&stack=35

→ { success: true, data: {
      cells: [0, 1, 1, ...],     // 169 valeurs, tranche "<50bb" du profil actif
      source: 'profile',
      profileName: 'Profil type',
      stackRangeLabel: '< 50bb',
      includeFolds: true,
    } }
```

---

## 4. Base de données (Prisma)

`backend/prisma/schema.prisma` est **la seule source de vérité**, écrit pour PostgreSQL. `backend/prisma/dev.prisma` (SQLite, généré, **git-ignoré**) est produit par `backend/scripts/gen-dev-schema.js` :

1. Lit `schema.prisma`, vérifie par regex que `provider = "postgresql"` est présent (log de warning sinon, mais continue).
2. Remplace `postgresql` → `sqlite` (seule différence — tous les champs/index sont identiques bit à bit).
3. Écrit `dev.prisma` avec un banner `// AUTO-GENERATED ... do NOT edit or commit.`

`npm run dev` exécute `dev:schema && prisma generate --schema=prisma/dev.prisma && ts-node-dev ... src/server.ts` — donc le schéma dev est régénéré à chaque lancement, jamais commité, jamais désynchronisé manuellement du schéma prod.

### Modèles principaux

| Modèle | Rôle | Champs / relations clés |
|---|---|---|
| `User` | Compte utilisateur | `password?` (null si Google-only), `googleId?`, tiers `isPremium`/`isPremiumExpert` (+ dates), vérif email, reset password |
| `PlayerStats` | Compteurs agrégés (1—1 avec User) | XP/niveau global + par module + par position, `selectedTitleId` (achievement choisi manuellement) |
| `TrainingSession` / `SessionExercise` | Historique brut par exercice | `question`(JSON), `userAnswer`, `isCorrect`, `timeTaken`, `xpEarned` |
| `ExamRecord` | Meilleur score sprint | `@@unique([userId, module, mode])` — `mode: "advanced"\|"expert"` |
| `ExamRun` | Historique de chaque run sprint terminé | `score, createdAt` |
| `CustomRange` | Range simple par position | `cells: number[169]` (JSON) |
| `ExpertRange` | Range multi-actions par position | `mix: number[676]` (JSON) |
| `RangePreset` | Ancien système de presets nommés | `data: Record<Position, number[][]>` |
| `RangeProfile` / `RangeStackRange` | Système actuel de profils par tranche de stack | 1 profil → N tranches |
| `FreeUsage` | Quota gratuit journalier | `@@unique([userId, module, date])` — nouvelle ligne à chaque changement de jour, anciennes lignes jamais relues |
| `DailyChallenge` / `Challenge` | Défis quotidiens personnalisés (premium) | — |

**Note perf** : les agrégations "historique par jour" (leaderboard, stats perso) sont faites **en JavaScript après fetch**, pas via `GROUP BY DATE(...)` SQL — probablement pour rester portable entre la syntaxe de troncature de date SQLite (dev) et PostgreSQL (prod), qui diffèrent.

**Exemple** (requête Prisma typique, `examController.ts`)
```ts
const record = await prisma.examRecord.upsert({
  where:  { userId_module_mode: { userId, module: 'potodds', mode: 'expert' } },
  update: { best: 42 },
  create: { userId, module: 'potodds', mode: 'expert', best: 42 },
});
```

---

## 5. Authentification

**Fichiers** : `controllers/authController.ts`, `controllers/googleAuthController.ts`, `middleware/auth.ts`, `routes/auth.ts`, `services/emailService.ts`, `config/secrets.ts`.

### Register (`register`)
1. Valide `username`/`email`/`password` présents, `password.length >= 8`.
2. Vérifie l'absence d'un `User` existant par `email` OU `username` → 409 sinon.
3. Hash bcrypt (12 rounds).
4. Token de vérification e-mail : `crypto.randomBytes(32).toString('hex')`, expire dans 24h.
5. Crée le `User` **et** systématiquement une ligne `PlayerStats` associée — un compte a toujours des stats dès l'inscription.
6. Envoi de l'e-mail de vérification en **fire-and-forget** (`.catch(console.error)`) : un échec d'envoi ne bloque jamais l'inscription.
7. Répond `201` avec `{ needsVerification: true }` — **aucun JWT n'est délivré à l'inscription**, il faut d'abord vérifier l'e-mail.

### Login (`login`)
1. Cherche par `email` → 401 générique si absent (pas d'énumération distincte).
2. Si `user.password === null` (compte Google) → message dédié : *"Ce compte utilise la connexion Google."*
3. `bcrypt.compare` → 401 si invalide.
4. Si `!user.emailVerified` → 403 `EMAIL_NOT_VERIFIED` (le frontend peut proposer un renvoi de mail).
5. JWT signé avec `{ userId, username, isPremium, isPremiumExpert }`.

### JWT — génération, vérification, et ce qui n'existe **pas**
- Secret et durée dans `config/secrets.ts` — **fail-fast au boot** : si `NODE_ENV=production` et `JWT_SECRET` absent/faible (<16 car.)/égal au fallback dev → `throw` empêche le serveur de démarrer (*"so a misconfigured deploy can never fall back to a guessable key"*).
- `JWT_EXPIRES = '30d'` — un seul token longue durée.
- **Pas de refresh token** : aucun endpoint `/refresh`, aucun cookie de refresh. Le token expire après 30 jours, il faut se reconnecter.
- **Pas de logout serveur** : aucune route `/api/auth/logout` — le JWT est stateless (pas de blacklist), la déconnexion est purement côté client (le frontend supprime le token et dispatch `auth:logout` sur `window` sur toute réponse `401`, intercepté dans `services/api.ts`).
- Le payload JWT contient un **snapshot** du statut premium au moment du login — si le tier change en DB après coup, le token existant garde l'ancienne valeur. `isRequestPremiumExpert(req)` compense : si le flag JWT est absent/faux, il recharge l'utilisateur depuis la DB et applique `isActive(flag, until)` (perpétuel si `until === null`, expiré si `until` est passé), mis en cache sur `req.user` pour la durée de la requête.
- `requireAuth` (401 si token absent/invalide) vs `optionalAuth` (ignore silencieusement un token invalide/absent, `req.user` reste `undefined`) — utilisé sur les routes accessibles anonymement (ex. `postflop`).

### Rate limiting
`authLimiter` (15 min, 10 requêtes) sur `/register`, `/login`, `/forgot-password`, `/reset-password`, avec **`skipSuccessfulRequests: true`** — seules les tentatives échouées consomment le quota, pour ne pas pénaliser les utilisateurs légitimes qui enchaînent plusieurs logins réussis.

### Vérification e-mail / reset password
- `verifyEmail` (GET `/verify-email?token=...` — **query param**, pas un path param comme documenté ailleurs) : vérifie l'expiration, marque `emailVerified`, **génère et retourne directement un JWT** (connecte l'utilisateur sans re-login).
- `resendVerification`/`forgotPassword` : **toujours 200**, même si le compte n'existe pas / est déjà vérifié / est Google-only — anti-enumeration explicite en commentaire.
- `resetPassword` : token expirant en **1h**, exige seulement **6 caractères** minimum — incohérent avec les 8 caractères exigés par `register`/`changePassword` (vestige probable d'un refactor non harmonisé, à corriger si on nettoie ce flow).
- `deleteAccount` : exige le mot de passe en confirmation pour un compte email/password ; suppression directe (sans re-vérification) pour un compte Google-only, déjà authentifié via JWT.

### Google OAuth 2.0 (`googleAuthController.ts`)
1. `googleLogin` : génère un `state` CSRF aléatoire stocké dans un cookie **httpOnly**, `secure` en prod, `sameSite: lax`, `maxAge: 10min`, `path: '/api/auth/google'` (scope limité) ; redirige vers Google (`scope=openid email profile`, `access_type=online` — pas de refresh token Google demandé).
2. `googleCallback` : vérifie le `state` (CSRF), rejette si `gUser.verified_email === false` (*"an unverified address could otherwise be used to hijack an existing account"* via account-linking par e-mail) ; cherche un `User` par `googleId` OU `email` (lie automatiquement un compte email/password préexistant à son `googleId` s'il se connecte via Google pour la première fois), sinon crée un compte (`username` dérivé du nom Google, dédupliqué par suffixe numérique aléatoire si pris).
3. **Livraison du token en fragment d'URL** : redirige vers `${FRONTEND_URL}/auth/callback#token=...` — **`#`, pas `?`** — commentaire explicite : *"fragments are never sent to servers or leaked via the Referer header / proxy logs"*.

**Exemple**
```
POST /api/auth/register  { username: "conrodri", email: "c@x.com", password: "hunter22" }
→ 201  { success: true, data: { needsVerification: true, email: "c@x.com" } }

POST /api/auth/login  { email: "c@x.com", password: "hunter22" }
→ 200  { success: true, data: { token: "eyJhbGci...", user: { id, username, isPremium: true, ... } } }

// Payload JWT décodé (jwt.io) :
{ "userId": "clx...", "username": "conrodri", "isPremium": true, "isPremiumExpert": true, "iat": ..., "exp": ... }
```

---

## 6. Quota gratuit

### ⚠️ Constat majeur : le système documenté n'existe pas côté backend

`CLAUDE.md` documente un middleware `checkQuota`, une route `GET /api/quota`, et un décompte de 5 exercices/jour/module. **Aucun de ces éléments n'existe dans le code actuel** :
- Pas de fichier `middleware/quota.ts` (seul `middleware/auth.ts` existe).
- Aucune route `/api/quota` montée (`routes/index.ts` ne monte que `auth, training, stats, ranges, postflop, profiles, expert-ranges, exam, subscription, feedback, health`).
- Aucun contrôleur n'appelle `prisma.freeUsage` — le modèle **`FreeUsage` existe dans le schéma Prisma mais n'est référencé nulle part dans `backend/src`**. C'est un modèle mort côté backend.
- Côté frontend, aucun `quotaStore.ts` ni `quotaApi` n'existe non plus — le seul vestige est un type UI (`lockedVariant?: 'premium' | 'login' | 'quota'` dans `TrainerIntro.tsx`) sans aucune logique de comptage/appel réseau branchée dessus.

`CLAUDE.md` lui-même contient la trace de cette transition (section "Tiers d'accès") : *"Les routes premium ne sont plus gatées par middleware (accès ouvert) ; le quota gratuit reste suivi côté client via `quotaApi.consume()`"* — cette phrase décrit une architecture qui, à l'inspection du code, **n'a pas (ou plus) d'implémentation fonctionnelle ni côté serveur ni côté client**. En pratique, combiné au fait que `isPremium`/`isPremiumExpert` valent `true` par défaut pour tout nouveau compte (voir [§7](#7-abonnements-tiers)), la question du quota gratuit est aujourd'hui **largement théorique** dans l'état du code.

**Pour un développeur reprenant ce chantier** : soit réimplémenter le middleware + la route en s'appuyant sur le modèle `FreeUsage` déjà présent en DB (son commentaire de schéma décrit précisément le design voulu : reset par date calendaire Europe/Paris, nouvelle ligne à chaque jour, pas de purge), soit décider consciemment que ce garde-fou n'est plus nécessaire et nettoyer le modèle mort + la doc.

**Exemple** (à quoi ressemblerait une ligne `FreeUsage`, si le système était branché)
```ts
{ userId: "clx...", module: "postflop", date: "2026-07-18", count: 3 }
// Le 4e exercice postflop de la journée pour cet utilisateur incrémenterait
// count à 4 ; le 6e serait refusé (quota = 5/jour/module).
```

---

## 7. Abonnements (tiers)

**Fichiers** : `controllers/subscriptionController.ts`, `routes/subscription.ts` (toutes les routes en `requireAuth`).

### Champs (modèle `User`)
```prisma
isPremium       Boolean  @default(true)
isPremiumExpert Boolean  @default(true)
premiumSince/Until, premiumExpertSince/Until  DateTime?
```
**⚠️ Les deux flags valent `true` par défaut** — tout nouvel utilisateur (register ou Google) est **premium expert dès la création**, tant qu'aucun downgrade manuel n'est fait. Choix cohérent avec une phase de lancement/dev ("tout le monde premium pour l'instant"), mais à changer avant un vrai lancement avec facturation.

### `subTier()` — détermination du tier
```ts
expOk  = isPremiumExpert && (premiumExpertUntil === null || premiumExpertUntil > now);
premOk = isPremium       && (premiumUntil       === null || premiumUntil       > now);
→ expOk ? 'expert' : premOk ? 'premium' : 'free'
```
Logique dupliquée (non factorisée) avec `isActive()` dans `middleware/auth.ts` — candidat à un futur refactor DRY.

### Routes
- `GET /subscription/` — retourne `{ tier, isPremium, isPremiumExpert, ...dates }`.
- `POST /subscription/downgrade` — expert → premium (`isPremiumExpert: false`, `premiumExpertUntil: now`, `premiumExpertSince: null`), garde le tier premium simple intact.
- `POST /subscription/cancel` — annule les deux tiers d'un coup → `free`.

**Aucun paiement en ligne** — confirmé (aucun import Stripe/PayPal, aucune route webhook, aucun champ `stripeCustomerId`). Le mécanisme réel d'octroi est une **modification manuelle en DB** (Prisma Studio ou requête directe) ; les routes API existantes ne servent qu'à lire/downgrader/annuler, jamais à upgrader/payer.

### Seul enforcement serveur réel du tier "expert"
`profilesController.ts`, création de profil en mode `'expert'` :
```ts
if (mode === 'expert' && !(await isRequestPremiumExpert(req))) {
  res.status(403).json({ error: 'Premium Expert tier required' });
}
```
C'est le **seul** garde-fou serveur basé sur le tier trouvé dans le code (cohérent avec la note CLAUDE.md "routes premium plus gatées par middleware", sauf ce cas précis).

Le leaderboard filtre aussi sur le tier (`getLeaderboard` : `WHERE isPremium OR isPremiumExpert`) — mais comme les deux valent `true` par défaut, cela n'exclut en pratique que les comptes explicitement rétrogradés via `cancelSubscription`.

**Exemple**
```
GET /api/subscription/  (authentifié)
→ { success: true, data: {
      tier: 'expert', isPremium: true, isPremiumExpert: true,
      premiumSince: '2026-01-10T...', premiumUntil: null,
      premiumExpertSince: '2026-01-10T...', premiumExpertUntil: null,
    } }

// Octroi manuel d'un tier (Prisma Studio ou script) :
await prisma.user.update({
  where: { email: 'client@x.com' },
  data:  { isPremium: true, premiumSince: new Date(), premiumUntil: null },
});
```

---

## 8. Achievements

**Fichier** : `backend/src/utils/achievements.ts` — définitions statiques + calcul, purement fonctionnel (aucun accès DB), consommé par `statsController.ts`.

- **48 badges** répartis sur 8 catégories (`exercises` 10 paliers 50→5000, `accuracy` 10 paliers 60%→100%, `days` 6 paliers, `sprint_advanced`/`sprint_expert` 7 paliers chacun, `daily_ex`/`daily_correct` 4 paliers, `daily_acc` 4 paliers) × 4 tiers (`bronze/silver/gold/platinum`).
- **Garde-fou minimum d'échantillon** : `accuracy` n'est comptée que si `totalExercises >= 100` (sinon `value` forcé à 0 → badge verrouillé), `daily_acc` seulement si `>= 10` exercices ce jour-là — évite qu'un unique exercice réussi débloque un badge de précision à 100%. Note : la barre de progression, elle, ignore ce garde-fou et affiche le pourcentage réel — peut visuellement suggérer un badge "presque débloqué" alors qu'il est en fait à 0.
- **Calcul entièrement à la volée, jamais persisté** : pas de flag "unlocked" en DB, pas de job, pas de déclenchement à un moment précis — `computeAchievements()` est recalculé à chaque requête qui en a besoin (`getUserStats` avec les vraies données sur 730 jours, `getLeaderboard` avec des données **allégées** — `buildLeaderboardInput()` force `daysPlayed/bestDayExercises/... = 0`, donc les catégories `days`/`daily_*` ne peuvent jamais apparaître "unlocked" dans le contexte leaderboard, commentaire explicite du code).
- **Sélection du "meilleur" titre** : `TIER_WEIGHT` (platinum=40 → bronze=10) + `CAT_WEIGHT` (tie-breaker : `accuracy`=6 en tête, `days`/`exercises`=0 en dernier — priorité à la précision/au sprint expert sur le simple volume). `PlayerStats.selectedTitleId` (modifiable via `PUT /stats/title`, validé côté serveur contre la liste `ACHIEVEMENTS`) **prime** sur ce calcul automatique si défini par l'utilisateur.

**Exemple**
```ts
computeAchievements({
  totalExercises: 1200, accuracy: 78, daysPlayed: 45,
  bestSprintAdvanced: 22, bestSprintExpert: 9,
  bestDayExercises: 85, bestDayCorrect: 70, bestDayAccuracy: 91,
});
// → tableau de 48 badges, chacun avec { ...def, value, progress, unlocked }
// ex. { id: 'exercises_gold', category: 'exercises', tier: 'gold', threshold: 1000, value: 1200, unlocked: true }

getBestAchievement(achievements);
// → le badge débloqué le plus "fort" (poids tier + poids catégorie), ex. sprint_expert bronze si aucun gold débloqué
```

---

## 9. Mode Sprint / Exam

**Fichiers** : `controllers/examController.ts`, `routes/exam.ts`, modèles `ExamRecord`/`ExamRun`, `frontend/src/store/examStore.ts`, `frontend/src/hooks/useExamRunner.ts`.

### ⚠️ Le flow backend réel est beaucoup plus mince que ce que documente CLAUDE.md
CLAUDE.md décrit `POST /exam/start` + `POST /exam/check` + `GET /exam/history/:module`. **Aucune de ces 3 routes n'existe.** Le contrôleur n'expose que 2 endpoints :
- `GET /exam/records` → `{ [module]: { advanced: best, expert: best } }` (le mode `'beginner'` n'a jamais de record persistant).
- `POST /exam/record` → sauvegarde le score final d'un run terminé.

**Le déroulement complet d'un sprint (génération en boucle, décompte des vies/erreurs, chronométrage) est piloté entièrement côté frontend** (`useExamRunner`/`examStore`) en consommant les endpoints génériques d'exercices de chaque module ; le backend n'intervient **qu'à la toute fin**, pour persister le score. Cohérent avec le principe CLAUDE.md "précompute maximum côté client", mais la doc d'API `start`/`check`/`history` est obsolète.

### `saveExamScore` (POST `/exam/record`)
1. Valide `module` contre une liste blanche figée de **14 entrées** : 8 variantes préflop + `potodds, equity, outs, postflop, fullhand, betsizing`.
   **⚠️ Bug potentiel découvert** : `'bluff'` n'est **pas** dans cette liste, alors que `BluffTrainer.tsx` utilise bien `useExamRunner('bluff')` et propose un sprint. Un score de sprint Bluff serait donc rejeté par la validation serveur (400) — à vérifier/corriger si le sprint Bluff est censé fonctionner (voir [§21](#21-écarts-connus-avec-claudemd)).
2. Valide `score` entier `[0, 100000]`.
3. Crée **toujours** une ligne `ExamRun` (historique complet, même si ce n'est pas un record).
4. N'upsert `ExamRecord` **que si** `score > prevBest` (`isNewRecord`) — évite une écriture DB inutile sinon.
5. Retourne les **8 derniers runs** (`take: 8`) pour l'historique affiché par `ExamResult`.
6. Toutes les routes exam sont protégées via `router.use(requireAuth)` en tête de fichier (pas par-route) — *"Exam best-score records are tied to the account"*.

Un run **abandonné** (`forfeit`) n'appelle jamais `saveExamScore` — ni `ExamRun` ni `ExamRecord` n'en gardent trace, entièrement une décision côté frontend (le backend n'a aucune notion de run "en cours").

### Ajouts de cette session (déjà en prod, cohérents avec l'architecture ci-dessus)
- **Timer dégressif en mode expert** : `useExamRunner.ts` calcule `sprintSeconds` — base 30s, `-5s` tous les 5 bonnes réponses cumulées dans le run, plancher 10s (`SPRINT_BASE_SECONDS=30, SPRINT_STEP_SECONDS=5, SPRINT_STEP_CORRECT=5, SPRINT_MIN_SECONDS=10`). Avancé garde 30s fixe. Centralisé dans ce hook, partagé par les 7 trainers utilisant `<SprintTimer>`.
- **Récap détaillé** : `SprintMistake` (générique — `heroCards?, board?, street?, facts?, correct?, chosen?, timedOut?`) construit par chaque trainer sur ses erreurs, affiché par `ExamResult` sous forme de carte par exercice raté, avec repli sur une pastille simple (`label`) pour le module Préflop (pas de représentation "board" naturelle).

**Exemple**
```
POST /api/exam/record  (authentifié)  { module: "potodds", mode: "expert", score: 18 }
→ { success: true, data: {
      best: 18, isNewRecord: true,
      history: [{ score: 18, createdAt: '...' }, { score: 14, createdAt: '...' }, ...],  // 8 derniers runs
    } }
```
```tsx
// Câblage type d'un trainer (voir OutsTrainer.tsx pour l'implémentation réelle)
const { examActive, examFinished, startRun, quitRun, recordAnswer, sprintSeconds } = useExamRunner('outs');
// à la réponse : if (examActive) recordAnswer(isCorrect, handleNext, 1400, mistakeIfWrong);
```

---

## 10. Stats et classement

**Fichiers** : `controllers/statsController.ts`, `routes/stats.ts`.

### Leaderboard (`getLeaderboard`)

1. `prisma.playerStats.findMany({ where: { user: { OR: [{isPremium:true},{isPremiumExpert:true}] } }, orderBy: { xp: 'desc' }, take: limit })` — tri strict par XP, réservé aux comptes premium/expert.
2. Un seul batch `ExamRecord.findMany({ where: { userId: { in: userIds } } })` pour tout le top (évite le N+1).
3. `buildSprintMap()` regroupe par `userId → module → {advanced, expert}`.
4. `buildLeaderboardInput()` + `computeAchievements()` + `getBestAchievement()` déterminent le titre affiché (voir [§8](#8-achievements) pour la limitation liée à l'absence de `byDay`).
5. Les **variantes préflop** (`preflop8`, `preflop-mtt`, etc.) apparaissent dans `modules` uniquement via leurs `ExamRecord` — elles partagent toutes la même accuracy préflop de base (pas de compteur séparé par variante dans `PlayerStats`), commentaire du code : *"Variants share preflop accuracy; only their sprint records differ"*.

### Historique par jour

Deux endpoints (`getUserStats` pour un profil public, `getProgressHistory` pour l'utilisateur courant avec fenêtre `?days=`) chargent les `SessionExercise` bruts sur la période puis agrègent **en mémoire JS** (`byDay[date].total/.correct/.xp += ...`) plutôt qu'en SQL — probablement pour rester portable entre la syntaxe de troncature de date SQLite (dev) et PostgreSQL (prod).

**Exemple**
```
GET /api/stats/leaderboard?limit=10
→ { success: true, data: [
      { rank: 1, username: 'conrodri', isPremiumExpert: true, xp: 4820, level: 12,
        totalExercises: 1200, accuracy: 78, title: { title: 'Maître du Sprint', tier: 'gold', icon: '🏆' },
        modules: { potodds: { accuracy: 82, total: 340, advanced: 22, expert: 9 }, preflop8: { advanced: 15, expert: 4 }, ... } },
      ...
    ] }
```

---

## 11. Génération pré-calculée (pregeneration cache)

**Fichiers** : `scripts/pregenerate.ts`, `data/pregenerated.json`, `controllers/postflopController.ts` (consommateur), `utils/exercisePool.ts` (structure de pool générique).

### Ce qui est réellement pré-généré

**Seulement 3 pools** : `flop` (1500), `expertFlop` (800), `fullHand` (600) — confirmé par le contenu réel du fichier JSON (~14.7 Mo). Équité et Préflop sont volontairement **exclus** : trop rapides à générer à la volée (<0.01ms) pour justifier un cache, commentaire explicite du script.

### Flow

1. `pregenerate.ts` appelle **directement** les mêmes fonctions de construction que le runtime (`buildFlopExercise`, `buildExpertFlopExercise`, `buildFullHandExercise` importées de `postflopController.ts`) — garantit zéro divergence de format entre cache et génération live.
2. Déduplication par clé (union triée des cartes utilisées) pour éviter les doublons dans le pool.
3. **Checkpointing tous les 10 ajouts** (pas seulement à la fin) — un crash Windows en cours de génération (observé en pratique, commenté dans le code) ne perd qu'au plus 10 exercices.
4. `setImmediate` toutes les 20 tentatives pour laisser respirer l'event loop pendant la génération synchrone Monte Carlo (autre precaution anti-crash Windows documentée).

### Consommation au runtime

`loadPregen()` lit le JSON une fois au boot du serveur. Trois `ExercisePool` génériques (`createExercisePool()`) sont pré-remplis depuis ce cache jusqu'à un `target` (20 pour flop/fullHand, 30 pour expertFlop — plus gros pour expertFlop car c'est le type d'exercice le plus coûteux à générer, ~46ms mesurés pour 2400 simulations Monte Carlo). `take()` dépile en O(1) (`shift()`) et déclenche un **refill asynchrone non bloquant** (`setImmediate` entre chaque génération) dès que la taille du pool passe sous un `threshold` — la requête HTTP en cours ne paie jamais ce coût, le refill se fait après coup en tâche de fond.

Le mode **Expert de Main complète bypass volontairement le pool** (`getFullHandScenario`) : le pool est figé à un taux "in range" de 80%, alors que le mode expert veut viser 50% (plus de scénarios hors range = plus dur) — la génération à la demande est donc utilisée systématiquement pour ce cas précis, au prix de la latence.

**Exemple**
```ts
// Régénérer le cache localement (à lancer sur sa propre machine, cf. principe
// "précompute côté CPU utilisateur" de CLAUDE.md) :
// npm run pregenerate   (depuis backend/)

const flopPool = createExercisePool({ target: 20, threshold: 5, build: buildFlopExercise, label: 'flop' });
flopPool.take();  // → un exercice flop pré-généré (ou généré à la volée si le pool est vide), O(1)
```

---

## 12. Frontend — stores Zustand

Tous dans `frontend/src/store/`. Ceux qui portent une **préférence utilisateur durable** utilisent le middleware `persist` (localStorage) ; ceux qui portent de l'**état de session volatile** ne le font pas.

| Store | Persisté ? | Clé localStorage | Rôle |
|---|---|---|---|
| `authStore` | Non (token géré manuellement) | `token` (brute, hors zustand) | User courant, JWT, login/register/logout/Google OAuth |
| `trainingStore` | Non | — | Session d'entraînement en cours, exercice actif par module, stats de session |
| `examStore` | Non (records via API) | — | Logique de sprint (voir [§9](#9-mode-sprint--exam)) |
| `modeStore` | Oui | `poker-mode` | Mode (`basic`\|`advanced`\|`expert`) + visibilité des indices |
| `langStore` | Oui | `poker-lang` | Langue (`fr`\|`en`) |
| `themeStore` | Oui | `poker-theme` | Thème de fond, couleur de table, style de cartes, style de table (feutre/plat) |
| `customRangeStore` | Oui | `poker-custom-ranges` | Flag d'activation du range perso dans le trainer Préflop |
| `zoomStore` | Oui | `poker-zoom` | Niveau de zoom global (accessibilité) |

**`authStore`** ne persiste pas via le middleware zustand — le token est lu/écrit directement dans `localStorage` (`localStorage.getItem('token')` à l'init) pour contrôler finement l'invalidation (401, logout) sans repasser par la sérialisation JSON du middleware ; l'objet `user` complet n'est jamais persisté, il est re-fetché via `fetchMe()` au boot (`App.tsx`).

**`zoomStore`** expose une fonction hors-store `applyStoredZoom()` qui lit directement `localStorage` (parse JSON manuel) pour appliquer le zoom **avant** l'hydratation React — évite un flash de mauvaise taille de police au premier rendu.

**Exemple**
```tsx
// Lire (avec sélecteur — évite un re-render sur les champs non utilisés)
const mode = useModeStore(s => s.mode);              // 'basic' | 'advanced' | 'expert'
const { bgTheme, tableColor } = useThemeStore(useShallow(s => ({ bgTheme: s.bgTheme, tableColor: s.tableColor })));

// Écrire
useModeStore.getState().setMode('expert');            // hors composant React, lecture/écriture directe du store
useLangStore(s => s.setLang)('en');
```

---

## 13. Frontend — hooks personnalisés

`frontend/src/hooks/`.

- **`useExamRunner(module)`** — câblage partagé du mode examen : charge les records au montage, calcule `sprintSeconds` (voir [§9](#9-mode-sprint--exam)), expose `recordAnswer(isCorrect, next, delay=1400, mistake?)` qui gère l'auto-avance (timer nettoyé au démontage).
- **`useExerciseLock(active)`** — verrouille le changement de mode pendant qu'une décision est affichée, en pilotant `trainingStore.setIsExercising`. Remplace une paire de `useEffect` dupliquée dans chaque trainer (mount/unmount).
- **`useIsMobile()`** — `window.matchMedia('(max-width: 639px)')` réactif (breakpoint Tailwind `sm`), init SSR-safe.

**Exemple**
```tsx
function OutsTrainer() {
  const { examActive, examFinished, startRun, quitRun, recordAnswer, sprintSeconds } = useExamRunner('outs');
  useExerciseLock(!showIntro && phase === 'exercise' && !!outsExercise && !isLoading);
  const isMobile = useIsMobile();
  // ...
  const handleAnswer = (value: number) => {
    const correct = value === correctValue;
    if (examActive) recordAnswer(correct, handleNext, 1400, correct ? undefined : buildMistake(value));
  };
}
```

---

## 14. i18n

`frontend/src/i18n/fr.ts` / `en.ts` / `index.ts`.

- `fr.ts` définit l'objet de traduction `as const` (organisé par domaine : `nav, home, training, tutorial, stats, leaderboard, login`), ce qui rend chaque feuille un type littéral.
- Un type utilitaire `Widen<T>` (type conditionnel récursif) élargit chaque feuille littérale en `string` tout en préservant la forme exacte de l'objet — `en.ts` est typé `Translations = Widen<typeof fr>`, donc **le compilateur garantit qu'une clé ajoutée dans `fr` doit exister dans `en`** (filet de sécurité anti-oubli de traduction), sans forcer les mêmes valeurs littérales.
- Pas de hook `useTranslation()` classique : le hook réel est `useT()` (`lang === 'fr' ? fr : en`), qui retourne l'objet complet — les composants font `const t = useT(); t.nav.home`.
- La langue active (`poker-lang` en localStorage) est aussi lue **manuellement, hors React**, par `services/api.ts` pour injecter `?lang=` sur chaque requête API.

**Exemple**
```tsx
const t = useT();
const isEn = useLangStore(s => s.lang) === 'en';

<p>{t.training.next_ex}</p>                          // objet complet, accès direct par clé
<p>{isEn ? 'Start training' : "Commencer l'entraînement"}</p>  // pattern alternatif utilisé dans les trainers
```

---

## 15. Theming

`frontend/src/store/themeStore.ts` + `Layout.tsx`.

- Constantes de données : `BG_THEMES` (6 thèmes de fond), `TABLE_COLORS` (6 couleurs de table, dégradé `center/mid/edge`), `CARD_STYLES` (3 styles de cartes), `TABLE_STYLE_NAMES` (feutre vs plat/2D).
- **Application via CSS custom properties**, pas de classes Tailwind dynamiques pour le fond/table : `Layout.tsx` pose `--app-bg`, `--table-center`, `--table-mid`, `--table-edge` sur `document.documentElement` à chaque changement de thème (`useEffect`), consommées ailleurs via `var(--table-center)`. Les styles de cartes, eux, sont appliqués par classes Tailwind conditionnelles directement dans les composants de rendu de carte.
- Il n'y a pas de vrai switch clair/sombre — tous les `BG_THEMES` sont des fonds sombres ; "thème" ici désigne uniquement la palette (fond + table), pas un mode light/dark.

**Exemple**
```tsx
useThemeStore.getState().setTableColor('blue');
// → pose --table-center/--table-mid/--table-edge sur <html>, consommé par ex. :
<div style={{ background: `radial-gradient(var(--table-center), var(--table-edge))` }} />
```

---

## 16. Analytics

`frontend/src/lib/analytics.ts` — basé sur `@vercel/analytics` (`track()`), pas une solution maison. Événements : `moduleStarted`, `exerciseCompleted`, `premiumCtaClicked`, `signup`, `login(method)`, `emailVerified`. Les pageviews sont automatiques via `<Analytics />` monté dans `App.tsx`.

**Point notable** : le bandeau cookies (`CookieBanner.tsx`) est purement informatif — il stocke `cookie_consent` dans `localStorage` pour ne plus se réafficher, mais **rien ne lit cette clé pour activer/désactiver le tracking** : `<Analytics />` est monté inconditionnellement. Cohérent avec le texte du bandeau ("cookies techniques uniquement, aucun cookie publicitaire") si Vercel Analytics est effectivement cookieless côté navigateur — mais il n'y a pas de mécanisme technique de consentement conditionnant le SDK, seulement un bandeau qui ne se réaffiche pas deux fois.

**Exemple**
```ts
analytics.moduleStarted('potodds');
analytics.exerciseCompleted('potodds', true);
analytics.login('google');
```

---

## 17. Service API centralisé

`frontend/src/services/api.ts` — instance axios unique (`baseURL`, `timeout: 35000` — commenté : *"assez pour le cold start Render free-tier (~25s) + calcul"*).

- **Intercepteur requête** : ajoute `Authorization: Bearer <token>` (lu directement depuis `localStorage`, pas de state React) et `?lang=` (lu depuis `localStorage['poker-lang']`, parse JSON, fallback `'fr'`).
- **Intercepteur réponse** : sur `401`, supprime le token et dispatch `new Event('auth:logout')` sur `window` — pas de refresh JWT, déconnexion immédiate.
- Familles exportées : `authApi`, `trainingApi`, `rangesApi`, `profilesApi`, `postflopApi`, `examApi`, `subscriptionApi`, `statsApi` — toutes déballent la convention backend `{ success, data }` via `.then(r => r.data.data)`.
- `pingBackend()` (hors familles) — fetch fire-and-forget vers `/api/health` au montage de `App.tsx`, pour réveiller le service Render free-tier avant que l'utilisateur n'atteigne un module.

**Exemple**
```ts
const exercise = await trainingApi.getPreflopExercise('BTN', '6max', 'cashgame');
const result   = await trainingApi.checkPreflopAnswer('raise', 1240, '6max', 'cashgame');
const records  = await examApi.records();  // { [module]: { advanced, expert } }
```

---

## 18. Conventions UI et direction artistique

Résumé opérationnel (le détail exhaustif vit dans `CLAUDE.md`, section "Principes non négociables") :

- **Mobile-first strict** : testé à 375px (iPhone SE) comme largeur minimale, zones tactiles ≥44px, aucun débordement horizontal.
- **Non-scroll sur PC** (1280×800) pour les écrans d'exercice — exception explicite pour les écrans de récap/résultats.
- **Échelle visuelle standard** dérivée de `TrainerIntro.tsx` / `PokerRulesPage.tsx` : `max-w-xl mx-auto`, `gap-2.5`, cards en `bg-gray-900/50 rounded-xl px-3 py-2.5 border border-gray-800`, titres en `text-sm font-bold text-white mb-2`, etc. — toute nouvelle page doit s'aligner sur cette densité plutôt que d'inventer sa propre échelle.
- **Un module = une icône (Lucide) + une couleur, réutilisées partout** (cartes, menus, stats, classement) — un nouveau module clone le pattern d'un module existant plutôt que d'inventer une nouvelle structure.
- **Pattern auto-advance vs manuel** : en sprint (`examActive`), les trainers avancent automatiquement après un délai (`recordAnswer(..., delay)`) ; en pratique normale, l'avancement est toujours déclenché par un clic utilisateur explicite ("Exercice suivant"). Cette distinction a été respectée lors de l'ajout des flux à 2 questions consécutives (Équité/Pot Odds expert, voir [§2](#2-moteur-poker-backend)) : auto-avance en sprint, bouton "Continuer" en pratique normale.

**Exemple** (encart standard, échelle `TrainerIntro`)
```tsx
<div className="bg-gray-900/50 rounded-xl px-3 py-2.5 border border-gray-800">
  <h3 className="text-sm font-bold text-white mb-2">Titre de section</h3>
  <p className="text-xs text-gray-400">Texte corps principal.</p>
</div>
```

---

## 19. Tests

Backend uniquement (Vitest, `backend/vitest.config.ts`, `include: ['src/**/*.test.ts']`) — colocalisés avec le code testé, pas de dossier `__tests__` séparé :

| Fichier | Couvre |
|---|---|
| `controllers/postflopController.test.ts` | Génération flop / flop expert / main complète multi-street |
| `services/poker/bbDefense.test.ts` | Charte de défense BB vs BTN |
| `services/poker/bluffService.test.ts` | Invariants structurels des exercices de bluff |
| `services/poker/handEvaluator.test.ts` | Classement des mains, comparaison, score |
| `services/poker/outs.test.ts` | Règle de 2&4, validité des cartes sur tous les générateurs |
| `services/poker/potOdds.test.ts` | Calcul pot odds, 3 générateurs procéduraux par difficulté |
| `services/poker/ranges.test.ts` | Indexation matrice 13×13, sanité des fréquences/actions GTO |

Aucun test frontend (React/UI) trouvé — l'effort de test cible spécifiquement la **logique GTO/mathématique** où une régression serait silencieuse mais critique (un calcul d'équité ou une range faux ne "crashe" jamais, il enseigne juste des choses fausses).

**Exemple**
```bash
cd backend && npm test                          # lance toute la suite (58 tests)
cd backend && npx vitest run src/services/poker/outs.test.ts   # un seul fichier
```
```ts
// Style des tests — services/poker/outs.test.ts
describe('estimateEquityFromOuts — Rule of 2 & 4', () => {
  it('multiplies by 4 on the flop', () => {
    expect(estimateEquityFromOuts(9, 'flop')).toBe(36);
  });
});
```

---

## 20. Déploiement

- **`render.yaml`** (racine) : service `pokertrainer-api` (Node, région Frankfurt, plan free). `buildCommand: cd backend && npm install --include=dev && npm run build && npx prisma db push --accept-data-loss`. `startCommand: cd backend && node dist/server.js`. Variables sensibles (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `GOOGLE_CLIENT_ID/SECRET`, `FRONTEND_URL`, `RESEND_API_KEY`) marquées `sync:false` (à définir manuellement dans le dashboard Render, jamais committées).
- **`frontend/vercel.json`** : config SPA minimale — fallback `filesystem` puis `/.* → /index.html` pour laisser React Router gérer le routing côté client. Pas de config de build custom (Vercel détecte Vite automatiquement).
- **`backend/.env.example`** : `DATABASE_URL="file:./dev.db"` (SQLite dev), `CORS_ORIGIN=http://localhost:5173`, `RESEND_API_KEY` vide en dev (liens de vérification loggés en console au lieu d'être envoyés).
- Séparation confirmée : Vercel (front statique) + Render (API Express) + Neon (Postgres managé, consommé via `DATABASE_URL` sur Render). Le frontend cible le backend via `VITE_API_URL` (absente en dev → proxy Vite vers `localhost:3001`, définie en prod vers l'URL `*.onrender.com`).

**Exemple**
```bash
# Dev local (deux terminaux)
cd backend && npm run dev      # http://localhost:3001, régénère prisma/dev.prisma à chaque lancement
cd frontend && npm run dev     # http://localhost:5173, proxy /api vers le backend

# Vérifier que l'API prod est réveillée (cold start Render free-tier ~25s)
curl https://pokertrainer.onrender.com/api/health
```

---

## 21. Écarts connus avec CLAUDE.md

Cette section existe pour que personne ne perde de temps à chercher du code qui n'existe pas, ou à faire confiance à un comportement documenté mais non implémenté. Classés par sévérité décroissante.

### Fonctionnel — à vérifier/corriger si quelqu'un reprend ce chantier
- **Quota gratuit totalement absent côté backend** : ni middleware, ni route `/api/quota`, ni usage du modèle `FreeUsage` (qui existe en DB mais n'est référencé nulle part dans `backend/src`). Côté frontend, pas de `quotaStore`/`quotaApi` non plus — juste un type UI `'quota'` sans logique branchée. Voir [§6](#6-quota-gratuit).
- **Tous les comptes sont Premium Expert par défaut** (`isPremium`/`isPremiumExpert` `@default(true)` sur `User`) — combiné au point précédent, la distinction gratuit/premium n'a aujourd'hui aucun effet pratique pour un nouveau compte. Voir [§7](#7-abonnements-tiers).
- **Sprint Bluff potentiellement cassé côté serveur** : la liste blanche `MODULES` de `saveExamScore` (14 entrées) n'inclut pas `'bluff'`, alors que `BluffTrainer.tsx` propose un sprint via `useExamRunner('bluff')`. Un run Bluff terminé enverrait donc un `module` rejeté par la validation (400) — le score ne serait ni comptabilisé dans `ExamRun` ni dans `ExamRecord`. Voir [§9](#9-mode-sprint--exam).
- **Endpoints Exam `start`/`check`/`history/:module`** documentés dans CLAUDE.md **n'existent pas** — seuls `GET /exam/records` et `POST /exam/record` existent ; tout le déroulement du sprint est piloté côté frontend. Voir [§9](#9-mode-sprint--exam).
- **Pas de refresh token, pas de `/api/auth/logout` serveur** — CLAUDE.md documente les deux. Le JWT est un token stateless de 30 jours ; la déconnexion est purement client-side. Voir [§5](#5-authentification).

### Représentation de données — divergence de conception
- **Ranges en bitmask** : `CLAUDE.md` mentionne `encodeBitmask()`, `decodeBitmask()`, `getCanonical()` dans `ranges.ts`. **Ces fonctions n'existent pas.** La représentation réelle est `number[169]` (float par main, ou code entier 0-4 pour la défense BB). Voir [§3](#3-ranges-gto--représentation-et-système-custom).

### Ajouts de cette session non reflétés dans CLAUDE.md
- **Timer sprint 5s expert / 10s avancé** : CLAUDE.md documente un délai de base de 5s en expert et 10s en avancé. Avant cette session, **le code utilisait 30s partout** (aucune distinction). Le comportement actuel (30s → -5s tous les 5 corrects → plancher 10s, expert uniquement) a été ajouté cette session. Voir [§9](#9-mode-sprint--exam).
- **Récap de sprint détaillé** (situation + réponse correcte/choisie par exercice raté) — généralisé à tous les modules cette session, alors que CLAUDE.md ne mentionne que le récap basique existant.
- **Génération procédurale d'exercices Outs à la turn** (~30% des scénarios, avant ~2.5%) — ajout de cette session, non documenté dans CLAUDE.md.
- **2 questions consécutives en mode Expert** pour Équité (sans/avec bounty) et Pot Odds (sans/avec implied odds) — ajout de cette session, non documenté dans CLAUDE.md.

### Incohérences mineures internes au code (indépendantes de CLAUDE.md)
- `resetPassword` exige un mot de passe de 6 caractères minimum, alors que `register`/`changePassword` en exigent 8 — vestige probable d'un refactor non harmonisé.
- Le code d'action `2` ("thin call") pour la défense BB en `CustomRange` est mentionné en commentaire mais jamais produit par `bbDefense.ts` (`KIND_CODE`).
- `subTier()` (subscriptionController) et `isActive()` (middleware/auth.ts) implémentent la même logique de validité d'abonnement en deux endroits distincts, non factorisés.
