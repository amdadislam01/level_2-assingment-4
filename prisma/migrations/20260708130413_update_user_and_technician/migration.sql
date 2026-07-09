-- AlterTable
ALTER TABLE "TechnicianProfile" ADD COLUMN     "availability" TEXT[],
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false;
