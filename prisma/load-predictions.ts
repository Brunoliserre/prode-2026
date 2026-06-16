/**
 * Bulk-load match predictions for one or more users.
 *
 * Loads a block of predictions (one match per line) into the DB as Prediction
 * rows for every given userID. Mirrors what the app does: upserts the pick and,
 * if the fixture already has a result, recomputes its points with calcPoints().
 *
 * ── How to use ──────────────────────────────────────────────────────────────
 *  1. Paste the target user IDs into USER_IDS (or pass them as CLI args).
 *  2. Paste the predictions into PREDICTIONS, one match per line. Format:
 *
 *         HomeTeam  homeScore-awayScore  AwayTeam
 *
 *     e.g.  Argentina 2-1 Chile
 *           Países Bajos 0-0 Mexico
 *           Spain 3 - 1 Croatia
 *
 *     Team names work in English or Spanish, in any order (if you list the away
 *     team first the scores are swapped to match the real fixture). Lines that
 *     are blank or start with "#" are ignored. Separators -, –, :, x all work.
 *
 *  3. Run it:
 *         npx tsx prisma/load-predictions.ts                 (uses USER_IDS)
 *         npx tsx prisma/load-predictions.ts <id1> <id2>     (overrides USER_IDS)
 *         npx tsx prisma/load-predictions.ts --dry-run       (preview, no writes)
 */

import { PrismaClient } from "@prisma/client"
import { calcPoints } from "../src/lib/utils"

const prisma = new PrismaClient()

// ── Config: edit these two ───────────────────────────────────────────────────

// User IDs to load the predictions into. CLI args (if any) override this list.
const USER_IDS: string[] = [
  // "clxxxxxxxxxxxxxxxxxx",
]

// One match per line: "HomeTeam homeScore-awayScore AwayTeam"
const PREDICTIONS = `
# Pegá acá los pronósticos, uno por línea. Ejemplo:
# Argentina 2-1 Chile
# Brasil 1-1 Francia
`

// ── Spanish → canonical (DB) team names ──────────────────────────────────────

// The DB stores team names in English (see prisma/seed.ts). This maps common
// Spanish names to those, so you can paste predictions in Spanish.
const ALIASES: Record<string, string> = {
  "estados unidos": "USA", eeuu: "USA", "ee.uu.": "USA", usa: "USA",
  panama: "Panama",
  marruecos: "Morocco",
  polonia: "Poland",
  mexico: "Mexico",
  peru: "Peru",
  "paises bajos": "Netherlands", holanda: "Netherlands",
  camerun: "Cameroon",
  canada: "Canada",
  honduras: "Honduras",
  alemania: "Germany",
  senegal: "Senegal",
  noruega: "Norway",
  irak: "Iraq", iraq: "Iraq",
  argentina: "Argentina",
  chile: "Chile",
  japon: "Japan",
  turquia: "Turkey",
  brasil: "Brazil",
  venezuela: "Venezuela",
  nigeria: "Nigeria",
  francia: "France",
  inglaterra: "England",
  colombia: "Colombia",
  "costa de marfil": "Ivory Coast",
  "corea del sur": "South Korea", corea: "South Korea",
  espana: "Spain",
  "costa rica": "Costa Rica",
  iran: "Iran",
  serbia: "Serbia",
  portugal: "Portugal",
  uruguay: "Uruguay",
  egipto: "Egypt",
  austria: "Austria",
  belgica: "Belgium",
  "arabia saudita": "Saudi Arabia", "arabia saudi": "Saudi Arabia", arabia: "Saudi Arabia",
  ghana: "Ghana",
  croacia: "Croatia",
  suiza: "Switzerland",
  jamaica: "Jamaica",
  tunez: "Tunisia",
  dinamarca: "Denmark",
  italia: "Italy",
  sudafrica: "South Africa",
  australia: "Australia",
  escocia: "Scotland",
  ecuador: "Ecuador",
  paraguay: "Paraguay",
  indonesia: "Indonesia",
  ucrania: "Ukraine",
  curazao: "Curaçao", curacao: "Curaçao",
  qatar: "Qatar",
  haiti: "Haiti",
  "cabo verde": "Cape Verde Islands", "cabo verde islas": "Cape Verde Islands", "islas de cabo verde": "Cape Verde Islands",
  "nueva zelanda": "New Zealand", "nueva zelandia": "New Zealand",
}

// Strip accents, lowercase, collapse whitespace → for forgiving comparisons.
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

// ── Parsing ──────────────────────────────────────────────────────────────────

interface ParsedLine {
  raw: string
  home: string
  away: string
  homeScore: number
  awayScore: number
}

const LINE_RE = /^(.+?)\s+(\d+)\s*[-–:xX]\s*(\d+)\s+(.+)$/

function parsePredictions(text: string): { parsed: ParsedLine[]; errors: string[] } {
  const parsed: ParsedLine[] = []
  const errors: string[] = []

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim().replace(/^\s*(\d+[.)]|[-*•])\s*/, "") // drop bullets/numbering
    if (!line || line.startsWith("#")) continue

    const m = line.match(LINE_RE)
    if (!m) {
      errors.push(`No se entiende la línea: "${rawLine.trim()}"`)
      continue
    }
    parsed.push({
      raw: rawLine.trim(),
      home: m[1].trim(),
      away: m[4].trim(),
      homeScore: Number(m[2]),
      awayScore: Number(m[3]),
    })
  }

  return { parsed, errors }
}

// Resolve a free-text team name to its canonical DB name (or null if unknown).
function canonical(name: string, dbNames: Set<string>): string | null {
  const n = norm(name)
  if (ALIASES[n]) return ALIASES[n]
  for (const db of dbNames) if (norm(db) === n) return db
  return null
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const cliUserIds = args.filter((a) => !a.startsWith("--"))
  const userIds = cliUserIds.length > 0 ? cliUserIds : USER_IDS

  console.log("\n══════════════════════════════════════════════════")
  console.log(`  CARGA DE PRONÓSTICOS${dryRun ? "  (DRY RUN — no escribe)" : ""}`)
  console.log("══════════════════════════════════════════════════\n")

  if (userIds.length === 0) {
    console.error("  ✗ No hay userIDs. Editá USER_IDS o pasalos como argumentos.")
    process.exit(1)
  }

  // Validate users exist
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })
  const foundIds = new Set(users.map((u) => u.id))
  const missing = userIds.filter((id) => !foundIds.has(id))
  if (missing.length > 0) {
    console.error(`  ✗ userIDs inexistentes: ${missing.join(", ")}`)
    process.exit(1)
  }
  console.log(`  Usuarios (${users.length}): ${users.map((u) => u.name ?? u.email).join(", ")}\n`)

  // Parse predictions
  const { parsed, errors } = parsePredictions(PREDICTIONS)
  if (errors.length > 0) {
    console.error("  ✗ Líneas inválidas:")
    for (const e of errors) console.error(`     - ${e}`)
    console.error("")
    process.exit(1)
  }
  if (parsed.length === 0) {
    console.error("  ✗ No hay pronósticos para cargar. Editá la constante PREDICTIONS.\n")
    process.exit(1)
  }

  // Load all fixtures and match each parsed line to one
  const fixtures = await prisma.fixture.findMany()
  const dbNames = new Set(fixtures.map((f) => f.homeTeam).concat(fixtures.map((f) => f.awayTeam)))

  type Resolved = {
    fixtureId: string
    label: string
    stage: string | null
    homeScore: number
    awayScore: number
    result: { home: number; away: number } | null
  }
  const resolved: Resolved[] = []
  const matchErrors: string[] = []
  const seen = new Set<string>()

  for (const p of parsed) {
    const home = canonical(p.home, dbNames)
    const away = canonical(p.away, dbNames)
    if (!home) { matchErrors.push(`Equipo desconocido: "${p.home}"  (línea: "${p.raw}")`); continue }
    if (!away) { matchErrors.push(`Equipo desconocido: "${p.away}"  (línea: "${p.raw}")`); continue }

    // A pair meets only once in the group stage — match in either direction.
    const direct = fixtures.find((f) => f.homeTeam === home && f.awayTeam === away)
    const reverse = fixtures.find((f) => f.homeTeam === away && f.awayTeam === home)
    const f = direct ?? reverse
    if (!f) { matchErrors.push(`No existe partido ${home} vs ${away}  (línea: "${p.raw}")`); continue }

    // If listed in reverse order, swap the scores to align with the fixture.
    const homeScore = direct ? p.homeScore : p.awayScore
    const awayScore = direct ? p.awayScore : p.homeScore

    if (seen.has(f.id)) { matchErrors.push(`Partido repetido: ${f.homeTeam} vs ${f.awayTeam}  (línea: "${p.raw}")`); continue }
    seen.add(f.id)

    resolved.push({
      fixtureId: f.id,
      label: `${f.homeTeam} ${homeScore}-${awayScore} ${f.awayTeam}`,
      stage: f.stage,
      homeScore,
      awayScore,
      result: f.homeScore != null && f.awayScore != null ? { home: f.homeScore, away: f.awayScore } : null,
    })
  }

  if (matchErrors.length > 0) {
    console.error("  ✗ No se pudieron mapear estas líneas:")
    for (const e of matchErrors) console.error(`     - ${e}`)
    console.error("\n  No se escribió nada. Corregí y volvé a correr.\n")
    process.exit(1)
  }

  console.log(`  Pronósticos a cargar: ${resolved.length}`)
  for (const r of resolved) {
    const pts = r.result ? `  → ${calcPoints(r.result.home, r.result.away, r.homeScore, r.awayScore, r.stage)} pts (resultado ${r.result.home}-${r.result.away})` : ""
    console.log(`     ${r.label}${pts}`)
  }
  console.log("")

  if (dryRun) {
    console.log("  DRY RUN: no se escribió nada.\n")
    return
  }

  // Upsert for every user
  let writes = 0
  for (const u of users) {
    for (const r of resolved) {
      const points = r.result
        ? calcPoints(r.result.home, r.result.away, r.homeScore, r.awayScore, r.stage)
        : 0
      await prisma.prediction.upsert({
        where: { userId_fixtureId: { userId: u.id, fixtureId: r.fixtureId } },
        update: { homeScore: r.homeScore, awayScore: r.awayScore, points },
        create: { userId: u.id, fixtureId: r.fixtureId, homeScore: r.homeScore, awayScore: r.awayScore, points },
      })
      writes++
    }
  }

  console.log(`  ✓ ${writes} predicciones cargadas (${resolved.length} × ${users.length} usuarios)\n`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
