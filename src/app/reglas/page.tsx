import { PICK_POINTS, plenoValue } from "@/lib/utils"

const KO_ROUNDS: [string, string][] = [
  ["16vos", "LAST_32"],
  ["8vos", "LAST_16"],
  ["4tos", "QUARTER_FINALS"],
  ["Semis", "SEMI_FINALS"],
  ["Final", "FINAL"],
]

export default function ReglasPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🏆 Sistema de Puntajes y Reglas</h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-neutral-500">
          Cómo se calculan los puntos en cada etapa del torneo.
        </p>
      </div>

      {/* Fase de Grupos */}
      <Section title="Fase de Grupos" icon="⚽">
        <p className="mb-4 text-sm text-gray-500 dark:text-neutral-400">
          Cada partido se puntúa por separado: acertar quién gana vale lo más, y sumás extra
          si le pegás a los goles. El resultado exacto da el máximo (7 puntos).
        </p>
        <div className="space-y-3">
          <RuleRow
            label="Acierto del signo (1X2)"
            sublabel="Gana Local, Empate o Gana Visitante"
            points={4}
          />
          <RuleRow
            label="Goles de un equipo"
            sublabel="+1 por cada equipo al que le aciertes los goles (hasta +2)"
            points={1}
          />
          <RuleRow
            label="Resultado Exacto (Pleno)"
            sublabel="Signo + goles de los dos equipos + bonus combo. También cuenta para desempate."
            points={7}
            badge="+1 combo"
          />
        </div>
      </Section>

      {/* Fase Eliminatoria */}
      <Section title="Fase Eliminatoria (Mata-Mata)" icon="⚔️">
        <p className="mb-4 text-sm text-gray-500 dark:text-neutral-400">
          Mismo sistema que la fase de grupos, pero cada ronda suma un <span className="font-medium">bonus</span>:
          cuanto más avanzada, más valen los aciertos. El bonus se aplica al acertar el signo.
        </p>
        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left dark:bg-neutral-800/50">
                <th className="px-4 py-2 font-semibold text-gray-500 dark:text-neutral-400">Ronda</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-500 dark:text-neutral-400">Acierta signo</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-500 dark:text-neutral-400">Resultado exacto</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100 dark:border-white/5">
                <td className="px-4 py-2 text-gray-600 dark:text-neutral-400">Grupos</td>
                <td className="px-4 py-2 text-center font-semibold tabular-nums text-gray-700 dark:text-neutral-200">+4</td>
                <td className="px-4 py-2 text-center font-bold tabular-nums text-emerald-600 dark:text-emerald-400">+7</td>
              </tr>
              {KO_ROUNDS.map(([label, stage]) => {
                const pleno = plenoValue(stage)
                return (
                  <tr key={stage} className="border-t border-gray-100 dark:border-white/5">
                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-neutral-100">{label}</td>
                    <td className="px-4 py-2 text-center font-semibold tabular-nums text-gray-700 dark:text-neutral-200">+{pleno - 3}</td>
                    <td className="px-4 py-2 text-center font-bold tabular-nums text-emerald-600 dark:text-emerald-400">+{pleno}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-neutral-500">
          Entre el signo y el exacto valen igual que en grupos los goles de cada equipo (+1 c/u). 3er puesto = igual que Semis.
        </p>
      </Section>

      {/* Dream Team */}
      <Section id="dream-team" title="Dream Team (Mata-Mata)" icon="🌟">
        <p className="mb-4 text-sm text-gray-500 dark:text-neutral-400">
          En cada ronda armás un equipo de 7 (1 arquero + la formación que elijas) con jugadores de las
          selecciones en carrera. Cada jugador suma su <span className="font-medium">rating de FotMob</span>;
          la suma define tu puesto de la ronda. El <span className="font-medium">1º puesto vale el pleno de
          esa fase</span> (igual que un pronóstico exacto), y del 2º en adelante la escala es fija:
        </p>
        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left dark:bg-neutral-800/50">
                <th className="px-4 py-2 font-semibold text-gray-500 dark:text-neutral-400">Puesto</th>
                {KO_ROUNDS.map(([label]) => (
                  <th key={label} className="px-3 py-2 text-center font-semibold text-gray-500 dark:text-neutral-400">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100 dark:border-white/5">
                <td className="px-4 py-2 font-medium text-gray-800 dark:text-neutral-100">1º</td>
                {KO_ROUNDS.map(([label, stage]) => (
                  <td key={label} className="px-3 py-2 text-center font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{plenoValue(stage)}
                  </td>
                ))}
              </tr>
              {[["2º", 6], ["3º", 5], ["4º", 4], ["5º", 3], ["6º", 2], ["7º en adelante", 1]].map(([label, pts]) => (
                <tr key={label} className="border-t border-gray-100 dark:border-white/5">
                  <td className="px-4 py-2 font-medium text-gray-800 dark:text-neutral-100">{label}</td>
                  <td colSpan={KO_ROUNDS.length} className="px-3 py-2 text-center tabular-nums text-gray-700 dark:text-neutral-200">
                    +{pts} <span className="text-xs text-gray-400 dark:text-neutral-500">(en todas las fases)</span>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-100 dark:border-white/5">
                <td className="px-4 py-2 font-medium text-gray-800 dark:text-neutral-100">No participás</td>
                <td colSpan={KO_ROUNDS.length} className="px-3 py-2 text-center tabular-nums text-gray-400 dark:text-neutral-500">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-neutral-500">
          Empates comparten puesto y puntos. Los jugadores de un equipo se bloquean cuando arranca su partido.
        </p>
      </Section>

      {/* Predicciones del Torneo */}
      <Section title="Predicciones del Torneo" icon="🎯">
        <p className="mb-4 text-sm text-gray-500 dark:text-neutral-400">
          Se deben completar antes de que comience el Mundial.
        </p>
        <div className="space-y-3">
          <RuleRow label="Campeón del Mundo" points={PICK_POINTS.CHAMPION} />
          <RuleRow label="Subcampeón" points={PICK_POINTS.RUNNER_UP} />
        </div>
      </Section>

      {/* Premios Especiales */}
      <Section title="Premios Especiales (Bonus)" icon="✨">
        <p className="mb-4 text-sm text-gray-500 dark:text-neutral-400">
          Se deben completar antes de que comience el Mundial.
        </p>
        <div className="space-y-3">
          <RuleRow
            label="MVP del Mundial"
            sublabel="MVP del torneo elegido por la FIFA"
            points={PICK_POINTS.MVP}
          />
          <RuleRow
            label="Pichichi"
            sublabel="Goleador del torneo"
            points={PICK_POINTS.PICHICHI}
          />
          <RuleRow
            label="Equipo Revelación"
            sublabel="Selección que nunca había superado los Octavos en su historia y llega a Cuartos o más"
            points={PICK_POINTS.REVELATION}
          />
          <RuleRow
            label="Premio Fair Play"
            sublabel="Equipo con menor puntaje de tarjetas al finalizar el Mundial"
            points={PICK_POINTS.FAIR_PLAY}
          />
          <RuleRow
            label="Premio Rústico"
            sublabel="Equipo con mayor puntaje de tarjetas (Amarilla = 1 pt, Roja = 3 pts) al finalizar el Mundial"
            points={PICK_POINTS.RUSTICO}
          />
          <RuleRow
            label="Premio Desastroso"
            sublabel="Selección más goleada del torneo"
            points={PICK_POINTS.DESASTROSO}
          />
          <RuleRow
            label="Premio Decepción"
            sublabel="Selección TOP 10 del ranking FIFA que no supera la Fase de Grupos"
            points={PICK_POINTS.DECEPCION}
          />
        </div>
      </Section>

      {/* Resumen */}
      <Section title="Resumen de puntos máximos" icon="📊">
        <div className="space-y-2">
          <SummaryRow label="Fase de Grupos (72 partidos)" value="hasta 504 pts" />
          <SummaryRow label="Fase Eliminatoria" value="por partido, +5 a +12" />
          <SummaryRow label="Dream Team" value="por ronda, +1 a +8" />
          <SummaryRow label="Campeón + Subcampeón" value="hasta 28 pts" />
          <SummaryRow label="7 Premios Especiales" value="hasta 72 pts" />
          <div className="mt-3 rounded-xl bg-gray-900 px-4 py-3 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white dark:text-white">Total máximo posible</span>
              <span className="font-bold text-emerald-400">a confirmar</span>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ id, title, icon, children }: { id?: string; title: string; icon: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
      <div className="flex items-center gap-2.5 border-b border-gray-200 px-5 py-4 dark:border-white/5">
        <span className="text-lg">{icon}</span>
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function RuleRow({
  label,
  sublabel,
  points,
  badge,
}: {
  label: string
  sublabel?: string
  points: number
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3 dark:bg-neutral-800/50">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-neutral-100">{label}</p>
        {sublabel && <p className="mt-0.5 text-xs text-gray-400 dark:text-neutral-500">{sublabel}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            {badge}
          </span>
        )}
        <span className={`min-w-[2.5rem] rounded-full px-2.5 py-1 text-center text-sm font-bold tabular-nums ${
          points >= 10
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : points >= 5
            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
            : points >= 2
            ? "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400"
            : points === 1
            ? "bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300"
            : "bg-gray-100 text-gray-400 dark:bg-neutral-800 dark:text-neutral-500"
        }`}>
          {points === 0 ? "—" : `+${points}`}
        </span>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5 dark:bg-neutral-800/50">
      <span className="text-sm text-gray-600 dark:text-neutral-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{value}</span>
    </div>
  )
}