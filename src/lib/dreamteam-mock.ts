import type { Pos } from "./formations"
import type { PitchPlayer } from "@/components/DreamTeamPitch"
import { REAL_SQUADS } from "./dreamteam-squads"

const espnHead = (id: string) =>
  `https://a.espncdn.com/i/headshots/soccer/players/full/${id}.png`

// 32 selecciones de prueba para el preview del dream team.
export const TEAMS = [
  "Argentina", "Brasil", "Francia", "España", "Inglaterra", "Portugal",
  "Países Bajos", "Alemania", "Bélgica", "Croacia", "Uruguay", "Colombia",
  "México", "USA", "Marruecos", "Japón", "Corea del Sur", "Senegal",
  "Suiza", "Dinamarca", "Ecuador", "Australia", "Canadá", "Nigeria",
  "Costa de Marfil", "Suecia", "Noruega", "Egipto", "Argelia", "Qatar",
  "Austria", "Polonia",
] as const

const SURNAMES = [
  "Pérez", "Gómez", "Silva", "Rossi", "Müller", "Costa", "Díaz", "López",
  "Kane", "Vidal", "Sané", "Torres", "Romero", "Navas", "Okafor", "Haaland",
  "Sosa", "Brandt", "Kovacic", "Mendes", "Ferrari", "Núñez", "Adeyemi", "Pavón",
]
const INITIALS = "ABCDEFGHIJKLMNOPQRST"

// Hash determinístico simple → para ratings estables por jugador.
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function makePlayers(team: string, pos: Pos, count: number, offset: number): PitchPlayer[] {
  return Array.from({ length: count }, (_, i) => {
    const idx = offset + i
    const surname = SURNAMES[(hash(team) + idx * 7) % SURNAMES.length]
    const initial = INITIALS[(hash(team + pos) + idx) % INITIALS.length]
    const rating = 3 + ((hash(`${team}${pos}${idx}`) % 71) / 10) // 3.0 – 10.0
    return {
      id: `${team}-${pos}-${idx}`,
      name: `${initial}. ${surname}`,
      club: team,
      position: pos,
      rating: Math.round(rating * 10) / 10,
      photoUrl: null,
    }
  })
}

// Plantel real (ESPN) si lo tenemos; si no, squad mock 2 ARQ / 6 DEF / 6 MED / 4 DEL.
export function squadFor(team: string): PitchPlayer[] {
  const real = REAL_SQUADS[team]
  if (real) {
    return real.map((p) => ({
      id: `${team}-${p.id}`,
      name: p.name,
      club: team,
      position: p.position,
      rating: Math.round((3 + (hash(p.id) % 71) / 10) * 10) / 10,
      photoUrl: espnHead(p.id), // 404 → silueta (lo maneja el componente)
    }))
  }
  return [
    ...makePlayers(team, "GK", 2, 0),
    ...makePlayers(team, "DEF", 6, 0),
    ...makePlayers(team, "MED", 6, 0),
    ...makePlayers(team, "FWD", 4, 0),
  ]
}
