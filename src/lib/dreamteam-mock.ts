import type { PitchPlayer } from "@/components/DreamTeamPitch"
import { esTeamName } from "./flags"
import { REAL_SQUADS } from "./dreamteam-squads"

// 32 selecciones de 16vos (claves = nombre canónico en inglés de REAL_SQUADS),
// ordenadas por su nombre en español para mostrar.
export const TEAMS = Object.keys(REAL_SQUADS).sort((a, b) =>
  esTeamName(a).localeCompare(esTeamName(b)),
)

export function squadFor(team: string): PitchPlayer[] {
  const real = REAL_SQUADS[team] ?? []
  return real.map((p) => ({
    id: `${team}-${p.id}`,
    name: p.name,
    club: esTeamName(team),
    position: p.position,
    rating: null, // se muestra recién cuando se carga el puntaje real (FotMob)
    photoUrl: p.photo,
  }))
}

// Índice global id → jugador, para resolver los picks guardados.
export const PLAYER_BY_ID: Map<string, PitchPlayer> = (() => {
  const m = new Map<string, PitchPlayer>()
  for (const t of TEAMS) for (const p of squadFor(t)) m.set(p.id, p)
  return m
})()
