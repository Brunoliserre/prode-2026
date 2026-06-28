// Dream team: 7 jugadores = 1 arquero fijo + 6 de campo (DEF-MED-DEL).
export type Pos = "GK" | "DEF" | "MED" | "FWD"

export const FORMATIONS = ["2-2-2", "3-1-2", "3-2-1", "2-3-1", "2-1-3"] as const
export type Formation = (typeof FORMATIONS)[number]

// Cantidad de jugadores por línea para una formación dada.
export function lineCounts(f: Formation): Record<Pos, number> {
  const [def, mid, fwd] = f.split("-").map(Number)
  return { GK: 1, DEF: def, MED: mid, FWD: fwd }
}

export const POS_LABEL: Record<Pos, string> = {
  GK: "ARQ",
  DEF: "DEF",
  MED: "MED",
  FWD: "DEL",
}
