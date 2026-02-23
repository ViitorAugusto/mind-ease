-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "checklist" JSONB NOT NULL DEFAULT '[]';
