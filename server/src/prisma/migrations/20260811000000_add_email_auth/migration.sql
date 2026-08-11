ALTER TABLE "User" ALTER COLUMN "googleId" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "verificationTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "resetTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "resetExpiresAt" TIMESTAMP(3);
UPDATE "User" SET "emailVerified" = true WHERE "googleId" IS NOT NULL;
