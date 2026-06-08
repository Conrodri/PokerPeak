# 🃏 PokerTrainer

Application d'entraînement au poker Texas Hold'em — interactive, pédagogique, avec suivi de progression.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| State | Zustand |
| Animations | Framer Motion |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma (SQLite en dev, PostgreSQL en prod) |
| Auth | JWT (bcrypt) |
| Charts | Recharts |

## Prérequis

- **Node.js 18+** : https://nodejs.org (télécharger la version LTS)
- Git (optionnel)

## Installation & Démarrage

```powershell
# 1. Setup (une seule fois)
.\setup.ps1

# 2. Lancer l'app
.\start.ps1
```

Ou manuellement dans 2 terminaux :

```bash
# Terminal 1 - Backend (port 3001)
cd backend
npm install
npx prisma db push
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm install
npm run dev
```

Ouvrir : **http://localhost:5173**

## Architecture

```
PokerTrainerApp/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       ← Modèles DB (User, Stats, Session, Exercise)
│   └── src/
│       ├── config/             ← Prisma client
│       ├── controllers/        ← Handlers HTTP (auth, training, stats)
│       ├── middleware/         ← JWT auth, rate limiting
│       ├── routes/             ← Routes Express (/api/auth, /api/training, /api/stats)
│       ├── services/
│       │   ├── poker/          ← Moteur poker (cartes, évaluateur, ranges, equity, pot odds)
│       │   └── trainingService.ts  ← Génération d'exercices
│       ├── types/              ← Types TypeScript partagés
│       └── server.ts           ← Point d'entrée Express
│
└── frontend/
    └── src/
        ├── components/
        │   ├── layout/         ← Navbar, Layout
        │   ├── poker/          ← Card, Hand, RangeMatrix, PositionSelector
        │   ├── training/       ← PreflopTrainer, PotOddsTrainer, EquityTrainer
        │   └── ui/             ← Button, ProgressBar
        ├── pages/              ← HomePage, TrainingPage, StatsPage, LeaderboardPage
        ├── services/           ← API client (axios)
        ├── store/              ← Zustand (auth, training)
        ├── types/              ← Types TypeScript
        └── utils/              ← Utilitaires poker (notations, couleurs, XP)
```

## Modules d'entraînement

### 🎯 Pré-flop
- Tire une main aléatoire selon la position choisie
- Demande : Fold ou Raise ?
- Corrige avec la fréquence GTO exacte
- Affiche la range complète sous forme de matrice 13×13
- Gère les stratégies mixtes (ex: "Raise 50% du temps")

### 📐 Pot Odds
- Présente une situation : pot, bet adverse, ton équité
- Demande : Call ou Fold ?
- Calcule l'equity requise et l'EV exact
- Explique le raisonnement étape par étape

### ⚖️ Équité (Monte Carlo)
- Montre deux mains face à face (avec ou sans board)
- Demande quelle main a le plus d'équité
- Affiche les vrais pourcentages calculés par simulation

## API Endpoints

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET  /api/training/preflop/exercise?position=BTN
POST /api/training/preflop/check
GET  /api/training/preflop/range/:position
GET  /api/training/potodds/exercise
POST /api/training/potodds/check
GET  /api/training/equity/exercise

GET  /api/stats/leaderboard
GET  /api/stats/me          (auth required)
GET  /api/stats/history     (auth required)
```

## Passer à PostgreSQL

Modifier `backend/.env` :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pokertrainer"
```

Et dans `backend/prisma/schema.prisma`, changer :
```prisma
datasource db {
  provider = "postgresql"  ← ici
  url      = env("DATABASE_URL")
}
```

## Features à venir

- [ ] Post-flop trainer (texture de board, continuation bet)
- [ ] Hand reading (réduire la range adverse depuis les actions)
- [ ] Problème du jour (type Chess.com puzzles)
- [ ] Tournois d'entraînement multi-joueurs
- [ ] Mode "Session libre" avec timer Pomodoro
- [ ] Export PDF des statistiques
