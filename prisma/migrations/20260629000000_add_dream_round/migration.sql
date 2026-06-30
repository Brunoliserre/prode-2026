-- CreateTable
CREATE TABLE "DreamRound" (
    "round" TEXT NOT NULL,
    "finalized" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DreamRound_pkey" PRIMARY KEY ("round")
);
