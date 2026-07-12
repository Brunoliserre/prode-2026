-- CreateTable
-- Idempotente: la tabla puede haberse creado a mano en la DB compartida (Neon).
CREATE TABLE IF NOT EXISTS "TournamentResult" (
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "TournamentResult_pkey" PRIMARY KEY ("category")
);
