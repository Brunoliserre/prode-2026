import { prisma } from "@/lib/prisma"
import Image from "next/image"

export const revalidate = 60

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    include: { predictions: true },
    orderBy: { name: "asc" },
  })

  const rows = users
    .map((u) => {
      const total = u.predictions.reduce((s, p) => s + p.points, 0)
      const exact = u.predictions.filter((p) => p.points === 3).length
      const correct = u.predictions.filter((p) => p.points === 1).length
      const played = u.predictions.filter((p) => p.points > 0 || true).length
      return { id: u.id, name: u.name, image: u.image, total, exact, correct, played }
    })
    .sort((a, b) => b.total - a.total)

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[#1a3a6b]">Tabla de Posiciones</h1>
      <p className="mb-6 text-sm text-gray-500">
        3 pts · marcador exacto &nbsp;|&nbsp; 1 pt · resultado correcto
      </p>

      {rows.length === 0 ? (
        <p className="text-gray-500">Todavía no hay participantes.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Jugador</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Pts</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 hidden sm:table-cell">
                  Exactos
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 hidden sm:table-cell">
                  Resultado
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 hidden sm:table-cell">
                  Pronósticos
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-400">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.image ? (
                        <Image
                          src={row.image}
                          alt={row.name ?? ""}
                          width={28}
                          height={28}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                          {row.name?.[0] ?? "?"}
                        </div>
                      )}
                      <span className="font-medium">{row.name ?? "Anónimo"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-[#1a3a6b]">
                    {row.total}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">{row.exact}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">{row.correct}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">{row.played}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
