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
        <div className="space-y-3">
          <RuleRow
            label="Acierto de Tendencia"
            sublabel="Gana Local, Empate o Gana Visitante"
            points={1}
          />
          <RuleRow
            label="Resultado Exacto (Pleno)"
            sublabel="No suma puntos, pero cuenta para desempate"
            points={0}
            badge="+1 desempate"
          />
        </div>
      </Section>

      {/* Fase Eliminatoria */}
      <Section title="Fase Eliminatoria (Mata-Mata)" icon="⚔️">
        <p className="mb-4 text-sm text-gray-500 dark:text-neutral-400">
          Una vez finalizada la fase de grupos se habilita la carga para las rondas finales.
        </p>
        <div className="space-y-3">
          <RuleRow label="Octavos de Final" sublabel="Acierto de tendencia" points={2} />
          <RuleRow label="Cuartos de Final" sublabel="Acierto de tendencia" points={3} />
          <RuleRow label="Semifinales" sublabel="Acierto de tendencia" points={4} />
          <RuleRow label="Final y 3er Puesto" sublabel="Acierto de tendencia" points={5} />
        </div>
      </Section>

      {/* Predicciones del Torneo */}
      <Section title="Predicciones del Torneo" icon="🎯">
        <p className="mb-4 text-sm text-gray-500 dark:text-neutral-400">
          Se deben completar antes de que comience el Mundial.
        </p>
        <div className="space-y-3">
          <RuleRow label="Campeón del Mundo" points={15} />
          <RuleRow label="Subcampeón" points={8} />
        </div>
      </Section>

      {/* Premios Especiales */}
      <Section title="Premios Especiales (Bonus)" icon="✨">
        <p className="mb-4 text-sm text-gray-500 dark:text-neutral-400">
          Se deben completar antes de que comience el Mundial.
        </p>
        <div className="space-y-3">
          <RuleRow
            label="Equipo Revelación"
            sublabel="Solo si el equipo llega a Cuartos y nunca antes había superado Octavos"
            points={5}
          />
          <RuleRow
            label="Premio Fair Play"
            sublabel="Equipo con menor cantidad de tarjetas al finalizar el Mundial"
            points={5}
          />
          <RuleRow
            label="Premio Rústico"
            sublabel="Equipo con mayor cantidad de tarjetas acumuladas"
            points={5}
          />
        </div>
      </Section>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
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
