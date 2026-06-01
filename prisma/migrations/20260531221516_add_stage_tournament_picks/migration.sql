-- AlterTable
ALTER TABLE "Fixture" ADD COLUMN     "stage" TEXT;

-- CreateTable
CREATE TABLE "TournamentPick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TournamentPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentPick_userId_category_key" ON "TournamentPick"("userId", "category");

-- AddForeignKey
ALTER TABLE "TournamentPick" ADD CONSTRAINT "TournamentPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
