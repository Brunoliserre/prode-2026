import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    if (!apiKey) {
    return NextResponse.json(
      { error: "FOOTBALL_DATA_API_KEY no configurada" },
      { status: 500 },
    )
  }

   const apiRes = await fetch(
        "https://api.football-data.org/v4/competitions/WC", {
            headers: {"X-Auth-Token": apiKey},
    })


   if (!apiRes.ok) {
    const text = await apiRes.text()
    return NextResponse.json(
      { error: `Error de la API externa (${apiRes.status}): ${text}` },
      { status: 502 },
    )
  }

  const data = await apiRes.json()
  return NextResponse.json(data.emblem)
}