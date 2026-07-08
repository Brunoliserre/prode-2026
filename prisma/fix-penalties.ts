/**
 * Corrige resultados de mata-mata definidos por penales: guarda el resultado de
 * tiempo regular en homeScore/awayScore (base del puntaje) y la definición por
 * penales en homePens/awayPens. Recalcula los puntos de las predicciones.
 * Fuente: ESPN scoreboard (mismo endpoint que /api/sync-results).
 */
import { PrismaClient } from "@prisma/client"
import { calcPoints } from "../src/lib/utils"
const prisma = new PrismaClient()

const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=300"
const API_TO_LOCAL: Record<string, string> = {
  "United States": "USA", "Côte d'Ivoire": "Ivory Coast", "Korea Republic": "South Korea",
  "IR Iran": "Iran", "Türkiye": "Turkey", "Bosnia-Herzegovina": "Bosnia",
  "Cabo Verde": "Cape Verde", "Cape Verde Islands": "Cape Verde",
  Czechia: "Czech Republic", "Congo DR": "DR Congo",
}
const norm = (n: string) => (API_TO_LOCAL[n] ?? n).toLowerCase()
const sameDay = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) < 24 * 60 * 60 * 1000

const DRY = process.argv.includes("--dry-run")

async function main() {
  const res = await fetch(ESPN_URL, { cache: "no-store" })
  const data = await res.json()
  const events: any[] = data.events ?? []
  const fixtures = await prisma.fixture.findMany()

  let changed = 0
  for (const ev of events) {
    if (!ev.status?.type?.completed) continue
    const cs = ev.competitions?.[0]?.competitors ?? []
    const H = cs.find((c: any) => c.homeAway === "home")
    const A = cs.find((c: any) => c.homeAway === "away")
    if (!H || !A) continue
    let hs = Number(H.score), as = Number(A.score)
    if (Number.isNaN(hs) || Number.isNaN(as)) continue
    let hp = H.shootoutScore != null ? Number(H.shootoutScore) : null
    let ap = A.shootoutScore != null ? Number(A.shootoutScore) : null

    const evDate = new Date(ev.date)
    const hN = norm(H.team.displayName), aN = norm(A.team.displayName)
    let f = fixtures.find((x) => norm(x.homeTeam) === hN && norm(x.awayTeam) === aN && sameDay(new Date(x.matchDate), evDate))
    if (!f) {
      f = fixtures.find((x) => norm(x.homeTeam) === aN && norm(x.awayTeam) === hN && sameDay(new Date(x.matchDate), evDate))
      if (f) { [hs, as] = [as, hs]; [hp, ap] = [ap, hp] }
    }
    if (!f) continue

    if (f.homeScore === hs && f.awayScore === as && f.homePens === hp && f.awayPens === ap) continue

    const pensLabel = hp != null ? `  [pens ${hp}-${ap}]` : ""
    console.log(`${f.homeTeam} ${f.homeScore}-${f.awayScore}${f.homePens != null ? `(${f.homePens}-${f.awayPens}p)` : ""}  →  ${hs}-${as}${pensLabel}  ${f.awayTeam}`)
    changed++
    if (DRY) continue

    await prisma.fixture.update({ where: { id: f.id }, data: { homeScore: hs, awayScore: as, homePens: hp, awayPens: ap } })
    const preds = await prisma.prediction.findMany({ where: { fixtureId: f.id } })
    await Promise.all(preds.map((p) =>
      prisma.prediction.update({ where: { id: p.id }, data: { points: calcPoints(hs, as, p.homeScore, p.awayScore, f!.stage) } })
    ))
  }
  console.log(`\n${DRY ? "[DRY] " : ""}Partidos corregidos: ${changed}`)
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
