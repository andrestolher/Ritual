CREATE TYPE "HabitType" AS ENUM ('BUILD', 'AVOID');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "googleId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Habit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "HabitType" NOT NULL,
  "identityStatement" TEXT,
  "stackedAfterId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_stackedAfterId_fkey" FOREIGN KEY ("stackedAfterId") REFERENCES "Habit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "HabitLog" (
  "id" TEXT NOT NULL,
  "habitId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "completed" BOOLEAN NOT NULL,
  "notes" TEXT,
  CONSTRAINT "HabitLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HabitLog_habitId_date_key" ON "HabitLog"("habitId", "date");
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
