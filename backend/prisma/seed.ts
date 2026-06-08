/**
 * Seed script — fake users with random stats for leaderboard testing.
 * Run with: npx ts-node prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── RNG helpers ──────────────────────────────────────────────────────────────

function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function rf(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function clamp(v: number, lo = 0.05, hi = 0.98) {
  return Math.min(hi, Math.max(lo, v));
}

// ─── XP → level (same thresholds as backend) ──────────────────────────────────

function xpToLevel(xp: number): number {
  const thr = [0, 100, 250, 500, 900, 1500, 2500, 4000, 6500, 10000, 15000];
  let lvl = 1;
  for (let i = 0; i < thr.length; i++) {
    if (xp >= thr[i]) lvl = i + 1; else break;
  }
  return Math.min(lvl, thr.length);
}

// ─── Fake user profiles ────────────────────────────────────────────────────────
// Each profile defines the skill tier — exact numbers are randomised below.

interface Profile {
  username: string;
  email: string;
  xp: number;
  acc: number;   // overall accuracy 0-1
  total: number; // total exercises
  streak: number;
  best: number;  // longest streak
}

const PROFILES: Profile[] = [
  // ── Débutants ──────────────────────────────────────────────────────────────
  { username: 'poker_noob_42',     email: 'noob42@fake.dev',      xp: 40,    acc: 0.40, total: 10,   streak: 0,  best: 1  },
  { username: 'Marie_learns',      email: 'marie@fake.dev',       xp: 135,   acc: 0.50, total: 28,   streak: 2,  best: 3  },
  { username: 'first_hand_ever',   email: 'first@fake.dev',       xp: 80,    acc: 0.44, total: 18,   streak: 0,  best: 2  },
  { username: 'CallStationPierre', email: 'pierre@fake.dev',      xp: 210,   acc: 0.48, total: 42,   streak: 1,  best: 4  },

  // ── Intermédiaires ─────────────────────────────────────────────────────────
  { username: 'CardShark_Tom',     email: 'tom@fake.dev',         xp: 640,   acc: 0.64, total: 100,  streak: 4,  best: 9  },
  { username: 'BluffMaster99',     email: 'bluff@fake.dev',       xp: 890,   acc: 0.68, total: 145,  streak: 3,  best: 12 },
  { username: 'RiverRat_Lisa',     email: 'lisa@fake.dev',        xp: 520,   acc: 0.62, total: 88,   streak: 1,  best: 7  },
  { username: 'TheTightAgg',       email: 'tight@fake.dev',       xp: 760,   acc: 0.70, total: 120,  streak: 5,  best: 11 },
  { username: 'BreakEvenBob',      email: 'bob@fake.dev',         xp: 1100,  acc: 0.58, total: 185,  streak: 0,  best: 5  },
  { username: 'Fold_Equity_Fan',   email: 'fold@fake.dev',        xp: 960,   acc: 0.66, total: 158,  streak: 2,  best: 8  },

  // ── Avancés ────────────────────────────────────────────────────────────────
  { username: 'GTO_Wizard',        email: 'gto@fake.dev',         xp: 2250,  acc: 0.79, total: 325,  streak: 8,  best: 21 },
  { username: 'RangeReader_Paul',  email: 'paul@fake.dev',        xp: 1850,  acc: 0.76, total: 275,  streak: 6,  best: 18 },
  { username: 'PokerProdigy',      email: 'prodigy@fake.dev',     xp: 2900,  acc: 0.82, total: 410,  streak: 12, best: 25 },
  { username: 'ThreeBetter',       email: 'three@fake.dev',       xp: 3150,  acc: 0.83, total: 455,  streak: 15, best: 30 },
  { username: 'LeakFinder',        email: 'leak@fake.dev',        xp: 4300,  acc: 0.85, total: 590,  streak: 18, best: 38 },

  // ── Experts ────────────────────────────────────────────────────────────────
  { username: 'Phi_GTO_Hero',      email: 'phi@fake.dev',         xp: 5600,  acc: 0.88, total: 730,  streak: 20, best: 45 },
  { username: 'SolverKing',        email: 'solver@fake.dev',      xp: 8400,  acc: 0.91, total: 1060, streak: 32, best: 62 },
  { username: 'EliteGrinder',      email: 'elite@fake.dev',       xp: 13200, acc: 0.94, total: 1650, streak: 47, best: 88 },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const hashedPw = await bcrypt.hash('FakePass_123!', 10);
  let created = 0;
  let skipped = 0;

  for (const p of PROFILES) {
    // Idempotent — skip if already seeded
    const exists = await prisma.user.findUnique({ where: { username: p.username } });
    if (exists) { skipped++; continue; }

    const totalCorrect = Math.round(p.total * p.acc);

    // ── Module split (30 % preflop, 20 % potodds, 20 % equity, 15 % outs, 15 % bbdefense)
    const preflopTotal    = Math.round(p.total * 0.30);
    const potoddsTotal    = Math.round(p.total * 0.20);
    const equityTotal     = Math.round(p.total * 0.20);
    const outsTotal       = Math.round(p.total * 0.15);
    const bbdefenseTotal  = p.total - preflopTotal - potoddsTotal - equityTotal - outsTotal;

    const preflopAcc    = clamp(p.acc + rf(-0.07, 0.07));
    const potoddsAcc    = clamp(p.acc + rf(-0.07, 0.07));
    const equityAcc     = clamp(p.acc + rf(-0.07, 0.07));
    const outsAcc       = clamp(p.acc + rf(-0.07, 0.07));
    const bbdefenseAcc  = clamp(p.acc + rf(-0.07, 0.07));

    const preflopCorrect    = Math.round(preflopTotal   * preflopAcc);
    const potoddsCorrect    = Math.round(potoddsTotal   * potoddsAcc);
    const equityCorrect     = Math.round(equityTotal    * equityAcc);
    const outsCorrect       = Math.round(outsTotal      * outsAcc);
    const bbdefenseCorrect  = Math.round(bbdefenseTotal * bbdefenseAcc);

    // ── Position split within preflop (UTG 15 %, HJ 20 %, CO 20 %, BTN 25 %, SB 20 %)
    const utgTotal  = Math.round(preflopTotal * 0.15);
    const hjTotal   = Math.round(preflopTotal * 0.20);
    const coTotal   = Math.round(preflopTotal * 0.20);
    const btnTotal  = Math.round(preflopTotal * 0.25);
    const sbTotal   = preflopTotal - utgTotal - hjTotal - coTotal - btnTotal;

    const utgAcc  = clamp(preflopAcc + rf(-0.08, 0.08));
    const hjAcc   = clamp(preflopAcc + rf(-0.08, 0.08));
    const coAcc   = clamp(preflopAcc + rf(-0.08, 0.08));
    const btnAcc  = clamp(preflopAcc + rf(-0.05, 0.10)); // btn typically better
    const sbAcc   = clamp(preflopAcc + rf(-0.10, 0.05)); // sb typically harder

    const utgCorrect  = Math.round(utgTotal * utgAcc);
    const hjCorrect   = Math.round(hjTotal  * hjAcc);
    const coCorrect   = Math.round(coTotal  * coAcc);
    const btnCorrect  = Math.round(btnTotal * btnAcc);
    const sbCorrect   = Math.round(sbTotal  * sbAcc);

    // ── Create user + stats
    const user = await prisma.user.create({
      data: { username: p.username, email: p.email, password: hashedPw },
    });

    await prisma.playerStats.create({
      data: {
        userId: user.id,
        xp:            p.xp,
        level:         xpToLevel(p.xp),
        streak:        p.streak,
        longestStreak: p.best,
        totalExercises: p.total,
        totalCorrect,

        preflopTotal,    preflopCorrect,    preflopAccuracy:  preflopAcc,
        potoddsTotal,    potoddsCorrect,    potOddsAccuracy:  potoddsAcc,
        equityTotal,     equityCorrect,     equityAccuracy:   equityAcc,
        outsTotal,       outsCorrect,
        bbdefenseTotal,  bbdefenseCorrect,

        utgTotal,  utgCorrect,  utgAccuracy: utgAcc,
        hjTotal,   hjCorrect,   hjAccuracy:  hjAcc,
        coTotal,   coCorrect,   coAccuracy:  coAcc,
        btnTotal,  btnCorrect,  btnAccuracy: btnAcc,
        sbTotal,   sbCorrect,   sbAccuracy:  sbAcc,
      },
    });

    console.log(`✓ ${p.username.padEnd(22)} ${p.xp.toString().padStart(6)} XP  ${Math.round(p.acc * 100)}%  lvl ${xpToLevel(p.xp)}`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} already existed.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
