import { DreamTeamBuilder } from "@/components/DreamTeamBuilder"

export const metadata = { title: "Dream Team · Preview" }

export default function DreamTeamPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dream Team</h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-neutral-500">
          Preview · armá un equipo de 7 (1 arquero + formación). Datos de prueba — 32 selecciones.
        </p>
      </div>
      <DreamTeamBuilder />
    </div>
  )
}
