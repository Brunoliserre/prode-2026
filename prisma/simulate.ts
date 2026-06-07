/**
 * Simulation script – group stage scoring verification
 *
 * Assigns random results to group stage fixtures (only those without a result),
 * recalculates points for all existing predictions, then prints the leaderboard.
 * Mirrors exactly what sync-results does when it pulls from the football-data API.
 *
 * Usage:
 *   npx tsx prisma/simulate.ts           – run simulation
 *   npx tsx prisma/simulate.ts --cleanup – reset all simulated results back to null
 */

import { PrismaClient } from "@prisma/client"
import { calcPoints } from "../src/lib/utils"

const prisma = new PrismaClient()
const CLEANUP = process.argv.includes("--cleanup")

// ── Scoring unit tests ─────────────────────────────────────────────────────────

function runUnitTests() {
  console.log("\n══════════════════════════════════════════════════")
  console.log("  TESTS UNITARIOS – calcPoints()")
  console.log("══════════════════════════════════════════════════")

  const tests: [number, number, number, number, string | null, number, string][] = [
    [2, 1, 2, 1, "GROUP_STAGE", 2, "Exacto gana local (2-1 = 2-1)"],
    [2, 1, 3, 1, "GROUP_STAGE", 1, "Tendencia local, score diferente"],
    [2, 1, 0, 0, "GROUP_STAGE", 0, "Tendencia incorrecta (empate vs local)"],
    [0, 0, 0, 0, "GROUP_STAGE", 2, "Exacto empate (0-0)"],
    [1, 1, 2, 2, "GROUP_STAGE", 1, "Tendencia empate, score diferente"],
    [3, 1, 3, 1, null,          2, "Exacto, stage null → group stage"],
    [2, 0, 1, 0, "LAST_32",    2, "Octavos – tendencia correcta → 2pts"],
    [2, 0, 1, 0, "LAST_16",    3, "Dieciseisavos – tendencia correcta → 3pts"],
    [2, 0, 1, 0, "QUARTER_FINALS", 4, "Cuartos – tendencia correcta → 4pts"],
    [2, 0, 1, 0, "SEMI_FINALS",    5, "Semis – tendencia correcta → 5pts"],
    [2, 0, 1, 0, "FINAL",          6, "Final – tendencia correcta → 6pts"],
    [2, 0, 0, 1, "LAST_16",    0, "Dieciseisavos – tendencia incorrecta → 0pts"],
  ]

  let passed = 0
  for (const [rH, rA, pH, pA, stage, expected, label] of tests) {
    const got = calcPoints(rH, rA, pH, pA, stage)
    const ok = got === expected
    console.log(`  ${ok ? "✅" : "❌"} ${label}`)
    if (!ok) console.log(`     → esperado ${expected}, obtuvo ${got}`)
    if (ok) passed++
  }

  console.log(`\n  Resultado: ${passed}/${tests.length} tests pasaron`)
  if (passed < tests.length) {
    console.error("\n  ⚠️  Tests fallidos. Revisar calcPoints() en src/lib/utils.ts")
    process.exit(1)
  }
}

// ── Cleanup ────────────────────────────────────────────────────────────────────

async function cleanup() {
  console.log("\n══════════════════════════════════════════════════")
  console.log("  LIMPIEZA – reseteando resultados simulados")
  console.log("══════════════════════════════════════════════════")

  // Reset all group stage fixtures that have results (simulation set them)
  const { count } = await prisma.fixture.updateMany({
    where: {
      OR: [{ stage: "GROUP_STAGE" }, { stage: null }],
      group: { not: null },
      homeScore: { not: null },
    },
    data: { homeScore: null, awayScore: null },
  })

  // Reset prediction points to 0
  const preds = await prisma.prediction.updateMany({
    where: { points: { gt: 0 } },
    data: { points: 0 },
  })

  console.log(`  Partidos reseteados: ${count}`)
  console.log(`  Predicciones reseteadas: ${preds.count}`)
  console.log("  ✓ Base de datos limpia\n")
}

// ── Random realistic score ─────────────────────────────────────────────────────

function randomGoals(): number {
  const r = Math.random()
  if (r < 0.28) return 0
  if (r < 0.58) return 1
  if (r < 0.80) return 2
  if (r < 0.93) return 3
  return 4
}

function randomResult(): [number, number] {
  return [randomGoals(), randomGoals()]
}

// ── Simulation ─────────────────────────────────────────────────────────────────

async function simulate() {
  console.log("\n══════════════════════════════════════════════════")
  console.log("  SIMULACIÓN – FASE DE GRUPOS")
  console.log("══════════════════════════════════════════════════")

  const fixtures = await prisma.fixture.findMany({
    where: {
      OR: [{ stage: "GROUP_STAGE" }, { stage: null }],
      group: { not: null },
      homeScore: null,
    },
    orderBy: [{ group: "asc" }, { matchday: "asc" }],
  })

  if (fixtures.length === 0) {
    console.log("\n  No hay partidos de grupo sin resultado.")
    console.log("  Si querés resetear: npx tsx prisma/simulate.ts --cleanup\n")
    return
  }

  console.log(`\n  Partidos sin resultado encontrados: ${fixtures.length}`)

  // Set results and recalculate points – same flow as sync-results API
  let totalPts = 0
  let predCount = 0
  for (const f of fixtures) {
    const [homeScore, awayScore] = randomResult()

    await prisma.fixture.update({
      where: { id: f.id },
      data: { homeScore, awayScore, stage: "GROUP_STAGE" },
    })

    const predictions = await prisma.prediction.findMany({ where: { fixtureId: f.id } })
    for (const p of predictions) {
      const pts = calcPoints(homeScore, awayScore, p.homeScore, p.awayScore, "GROUP_STAGE")
      await prisma.prediction.update({ where: { id: p.id }, data: { points: pts } })
      totalPts += pts
      predCount++
    }
  }

  console.log(`  Resultados cargados: ${fixtures.length}`)
  console.log(`  Predicciones evaluadas: ${predCount}`)
  console.log(`  Puntos totales otorgados: ${totalPts}`)

  // ── Leaderboard ──────────────────────────────────────────────────────────────

  const users = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      predictions: {
        select: { points: true, homeScore: true, awayScore: true, fixtureId: true },
      },
    },
  })

  type Row = {
    name: string
    matchPts: number
    exact: number
    tendency: number
    wrong: number
    predCount: number
  }

  const fixtureIds = new Set(fixtures.map((f) => f.id))

  const rows: Row[] = users
    .map((u) => {
      const simPreds = u.predictions.filter((p) => fixtureIds.has(p.fixtureId))
      let matchPts = 0, exact = 0, tendency = 0, wrong = 0
      for (const p of simPreds) {
        matchPts += p.points
        if (p.points === 2) exact++
        else if (p.points === 1) tendency++
        else wrong++
      }
      return { name: u.name ?? u.email ?? "?", matchPts, exact, tendency, wrong, predCount: simPreds.length }
    })
    .filter((r) => r.predCount > 0)
    .sort((a, b) => b.matchPts - a.matchPts)

  if (rows.length === 0) {
    console.log("\n  No hay predicciones cargadas para estos partidos.")
    console.log("  Los usuarios deben cargar sus predicciones primero.\n")
    return
  }

  const maxPts = fixtures.length * 2
  console.log(`\n══════════════════════════════════════════════════`)
  console.log(`  LEADERBOARD (máx posible en fase grupos: ${maxPts} pts)`)
  console.log(`══════════════════════════════════════════════════\n`)
  console.log(
    `  ${"#".padEnd(3)} ${"Usuario".padEnd(24)} ${"Pts".padStart(5)} ${"Exactos".padStart(8)} ${"Tendencia".padStart(10)} ${"Errores".padStart(8)} ${"Predijo".padStart(8)}`
  )
  console.log("  " + "─".repeat(68))

  for (const [i, r] of rows.entries()) {
    console.log(
      `  ${String(i + 1).padEnd(3)} ${r.name.slice(0, 24).padEnd(24)} ${String(r.matchPts).padStart(5)} ` +
      `${String(r.exact).padStart(8)} ${String(r.tendency).padStart(10)} ${String(r.wrong).padStart(8)} ` +
      `${String(r.predCount).padStart(8)}`
    )
  }

  // ── Sample group detail ──────────────────────────────────────────────────────

  const sampleGroup = fixtures[0]?.group
  const sampleFixtures = fixtures.filter((f) => f.group === sampleGroup)

  if (sampleGroup && sampleFixtures.length > 0) {
    console.log(`\n══════════════════════════════════════════════════`)
    console.log(`  DETALLE GRUPO ${sampleGroup} (muestra)`)
    console.log(`══════════════════════════════════════════════════`)

    const refreshed = await prisma.fixture.findMany({
      where: { id: { in: sampleFixtures.map((f) => f.id) } },
      include: { predictions: { include: { user: { select: { name: true } } } } },
      orderBy: { matchday: "asc" },
    })

    for (const f of refreshed) {
      console.log(`\n  MD${f.matchday ?? "?"} ${f.homeTeam} ${f.homeScore}-${f.awayScore} ${f.awayTeam}`)
      if (f.predictions.length === 0) {
        console.log("       (sin predicciones)")
        continue
      }
      for (const p of f.predictions) {
        const mark = p.points === 2 ? "★ exacto" : p.points === 1 ? "✓ tendencia" : "✗"
        console.log(`       ${(p.user.name ?? "?").slice(0, 20).padEnd(20)} ${p.homeScore}-${p.awayScore}  ${p.points}pts  ${mark}`)
      }
    }
  }

  console.log("\n══════════════════════════════════════════════════")
  console.log("  Para resetear: npx tsx prisma/simulate.ts --cleanup")
  console.log("══════════════════════════════════════════════════\n")
}

// ── Entry point ────────────────────────────────────────────────────────────────

async function main() {
  runUnitTests()
  if (CLEANUP) {
    await cleanup()
  } else {
    await simulate()
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
