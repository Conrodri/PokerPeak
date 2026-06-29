/**
 * Dev-only seed: inject realistic stats onto the Conrodri dev account.
 * Run from backend/: npx ts-node --require dotenv/config prisma/seed-dev-stats.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TARGET = 'constant';

// ─── Sprint records ───────────────────────────────────────────────────────────

const EXAM_RECORDS: { module: string; advanced: number; expert: number }[] = [
  { module: 'preflop',          advanced: 42, expert: 28 },
  { module: 'preflop-mtt',      advanced: 35, expert: 21 },
  { module: 'preflop8',         advanced: 38, expert: 19 },
  { module: 'preflop8-mtt',     advanced: 29, expert: 15 },
  { module: 'preflop-3max',     advanced: 53, expert: 31 },
  { module: 'preflop-mtt-3max', advanced: 44, expert: 12 },
  { module: 'preflop-hu',       advanced: 78, expert: 52 },
  { module: 'preflop-mtt-hu',   advanced: 22, expert:  8 },
  { module: 'potodds',          advanced: 71, expert: 44 },
  { module: 'equity',           advanced: 61, expert: 38 },
  { module: 'outs',             advanced: 55, expert: 33 },
  { module: 'postflop',         advanced: 47, expert:  0 },
  { module: 'fullhand',         advanced: 39, expert:  0 },
  { module: 'betsizing',        advanced: 44, expert:  0 },
];

// ─── ExamRun history (progression visible) ───────────────────────────────────

const EXAM_RUNS: { module: string; mode: string; score: number; daysAgo: number }[] = [
  { module: 'preflop-hu', mode: 'advanced', score: 12, daysAgo: 30 },
  { module: 'preflop-hu', mode: 'advanced', score: 29, daysAgo: 21 },
  { module: 'preflop-hu', mode: 'advanced', score: 51, daysAgo: 14 },
  { module: 'preflop-hu', mode: 'advanced', score: 63, daysAgo:  7 },
  { module: 'preflop-hu', mode: 'advanced', score: 78, daysAgo:  2 },
  { module: 'preflop-hu', mode: 'expert',   score:  8, daysAgo: 20 },
  { module: 'preflop-hu', mode: 'expert',   score: 22, daysAgo: 10 },
  { module: 'preflop-hu', mode: 'expert',   score: 52, daysAgo:  3 },
  { module: 'potodds',    mode: 'advanced', score: 30, daysAgo: 25 },
  { module: 'potodds',    mode: 'advanced', score: 55, daysAgo: 15 },
  { module: 'potodds',    mode: 'advanced', score: 71, daysAgo:  5 },
  { module: 'equity',     mode: 'advanced', score: 38, daysAgo: 18 },
  { module: 'equity',     mode: 'advanced', score: 61, daysAgo:  6 },
  { module: 'equity',     mode: 'expert',   score: 38, daysAgo:  4 },
  { module: 'preflop',    mode: 'advanced', score: 18, daysAgo: 35 },
  { module: 'preflop',    mode: 'advanced', score: 42, daysAgo: 10 },
  { module: 'preflop',    mode: 'expert',   score: 28, daysAgo:  4 },
  { module: 'outs',       mode: 'advanced', score: 55, daysAgo:  8 },
  { module: 'outs',       mode: 'expert',   score: 33, daysAgo:  4 },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const user = await prisma.user.findUnique({ where: { username: TARGET } });
  if (!user) {
    console.error(`✗ User "${TARGET}" not found — register first, then re-run.`);
    process.exit(1);
  }
  console.log(`✓ Found user "${TARGET}" (${user.id})`);

  // 1. PlayerStats ─────────────────────────────────────────────────────────────
  //    Numbers that sum cleanly: 1847 total, 1680 correct = 91% accuracy
  const ps = {
    totalExercises: 1847, totalCorrect: 1680,
    xp: 8740, level: 9,
    streak: 14, longestStreak: 34,

    preflopTotal:     555, preflopCorrect:     516, preflopAccuracy:  516 / 555,
    potoddsTotal:     370, potoddsCorrect:     344, potOddsAccuracy:  344 / 370,
    equityTotal:      296, equityCorrect:      274, equityAccuracy:   274 / 296,
    outsTotal:        222, outsCorrect:        200,
    postflopTotal:    185, postflopCorrect:    157, postflopAccuracy: 157 / 185,
    fullhandTotal:    111, fullhandCorrect:     93,
    bbdefenseTotal:   108, bbdefenseCorrect:    96,

    utgTotal:  80,  utgCorrect:  73,  utgAccuracy:  73 / 80,
    hjTotal:  111,  hjCorrect: 103,   hjAccuracy:  103 / 111,
    coTotal:  111,  coCorrect: 103,   coAccuracy:  103 / 111,
    btnTotal: 139,  btnCorrect: 131,  btnAccuracy: 131 / 139,
    sbTotal:  114,  sbCorrect:  106,  sbAccuracy:  106 / 114,
  };

  await prisma.playerStats.upsert({
    where:  { userId: user.id },
    update: ps,
    create: { userId: user.id, ...ps },
  });
  console.log('✓ PlayerStats upserted (91% accuracy, 1847 exercises, XP 8740)');

  // 2. ExamRecords ─────────────────────────────────────────────────────────────
  for (const rec of EXAM_RECORDS) {
    for (const [mode, best] of [['advanced', rec.advanced], ['expert', rec.expert]] as [string, number][]) {
      if (best === 0) continue;
      await prisma.examRecord.upsert({
        where:  { userId_module_mode: { userId: user.id, module: rec.module, mode } },
        update: { best },
        create: { userId: user.id, module: rec.module, mode, best },
      });
    }
  }
  console.log('✓ ExamRecords upserted (14 modules × advanced + expert)');

  // 3. ExamRuns ────────────────────────────────────────────────────────────────
  const existingRuns = await prisma.examRun.count({ where: { userId: user.id } });
  if (existingRuns > 0) {
    console.log(`ℹ ExamRuns already exist (${existingRuns}) — skipped`);
  } else {
    const now = Date.now();
    for (const r of EXAM_RUNS) {
      await prisma.examRun.create({
        data: {
          userId:    user.id,
          module:    r.module,
          mode:      r.mode,
          score:     r.score,
          createdAt: new Date(now - r.daysAgo * 86_400_000),
        },
      });
    }
    console.log(`✓ ExamRuns created (${EXAM_RUNS.length} runs)`);
  }

  // 4. Sessions + exercises (byDay data for achievements) ──────────────────────
  const existingSessions = await prisma.trainingSession.count({ where: { userId: user.id } });
  if (existingSessions > 0) {
    console.log(`ℹ Sessions already exist (${existingSessions}) — skipped`);
  } else {
    await generateSessions(user.id);
  }

  console.log('\n✅ All done. Hard-refresh the frontend to see updated stats.');
}

// ─── Session generation ───────────────────────────────────────────────────────

async function generateSessions(userId: string) {
  const now      = Date.now();
  const modules  = ['preflop', 'potodds', 'equity', 'outs', 'postflop'] as const;
  const DAYS     = 40;

  for (let d = DAYS; d >= 1; d--) {
    const dayTs      = now - d * 86_400_000;
    const isBigDay   = d === 5;   // 60 exercises, 55 correct  → unlocks day_50 + dayc_50
    const isPerfect  = d === 3;   // 12 exercises, 12 correct  → unlocks dacc_100

    const exCount  = isBigDay ? 60 : isPerfect ? 12 : 42;
    const corCount = isBigDay ? 55 : isPerfect ? 12 : Math.round(exCount * 0.88);
    const module   = modules[d % modules.length];

    const session = await prisma.trainingSession.create({
      data: {
        userId,
        module,
        startedAt: new Date(dayTs),
        endedAt:   new Date(dayTs + 1_800_000),
      },
    });

    const exercises = Array.from({ length: exCount }, (_, i) => ({
      sessionId:     session.id,
      exerciseType:  modules[(d + i) % modules.length],
      question:      '{}',
      userAnswer:    i < corCount ? 'raise' : 'fold',
      correctAnswer: 'raise',
      isCorrect:     i < corCount,
      timeTaken:     Math.floor(Math.random() * 4000) + 800,
      xpEarned:      i < corCount ? 2 : 0,
      createdAt:     new Date(dayTs + i * 30_000),
    }));

    await prisma.sessionExercise.createMany({ data: exercises });
  }

  console.log('✓ Sessions created (40 days of exercises)');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
