-- AlterTable
-- Idempotente: las columnas pueden haberse creado a mano en la DB compartida (Neon).
ALTER TABLE "Fixture" ADD COLUMN IF NOT EXISTS "homePens" INTEGER;
ALTER TABLE "Fixture" ADD COLUMN IF NOT EXISTS "awayPens" INTEGER;
