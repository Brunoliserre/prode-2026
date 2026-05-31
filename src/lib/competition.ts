export async function getWCEmblem(): Promise<string | undefined> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) return undefined
  const res = await fetch("https://api.football-data.org/v4/competitions/WC", {
    headers: { "X-Auth-Token": apiKey },
    next: { revalidate: 86400 },
  })
  if (!res.ok) return undefined
  return (await res.json()).emblem
}
