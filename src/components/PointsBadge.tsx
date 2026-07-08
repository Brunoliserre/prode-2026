import { cn } from "@/lib/utils"

// Badge de puntos ganados en un partido, con color según el puntaje.
// Se usa en la lista de predicciones propias y en el modal "Ver predicciones".
export function PointsBadge({ points, className }: { points: number; className?: string }) {
  return (
    <span className={cn(
      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
      points >= 4 && "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400",
      points >= 2 && points < 4 && "bg-blue-500/15 text-blue-500 dark:text-blue-400",
      points === 1 && "bg-amber-500/15 text-amber-500 dark:text-amber-400",
      points === 0 && "bg-red-500/10 text-red-500",
      className,
    )}>
      {points > 0 ? `+${points}` : "0"}
    </span>
  )
}
