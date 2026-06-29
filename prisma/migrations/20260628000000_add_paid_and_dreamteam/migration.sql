-- AlterTable
ALTER TABLE "User" ADD COLUMN "hasPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "wantsToJoin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DreamTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "formation" TEXT NOT NULL,

    CONSTRAINT "DreamTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DreamTeamPick" (
    "id" TEXT NOT NULL,
    "dreamTeamId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "DreamTeamPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DreamTeam_userId_round_key" ON "DreamTeam"("userId", "round");

-- CreateIndex
CREATE UNIQUE INDEX "DreamTeamPick_dreamTeamId_slot_key" ON "DreamTeamPick"("dreamTeamId", "slot");

-- AddForeignKey
ALTER TABLE "DreamTeam" ADD CONSTRAINT "DreamTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DreamTeamPick" ADD CONSTRAINT "DreamTeamPick_dreamTeamId_fkey" FOREIGN KEY ("dreamTeamId") REFERENCES "DreamTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
