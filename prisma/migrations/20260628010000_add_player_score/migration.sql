-- CreateTable
CREATE TABLE "PlayerScore" (
    "id" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlayerScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerScore_round_playerId_key" ON "PlayerScore"("round", "playerId");
