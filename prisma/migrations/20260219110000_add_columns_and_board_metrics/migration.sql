-- AlterTable
ALTER TABLE "boards" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#3B82F6';

-- CreateTable
CREATE TABLE "columns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "columns_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "column_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN "hours" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Use board IDs as the default column IDs to keep UUID compatibility
CREATE TEMP TABLE "board_default_columns" AS
SELECT
  b."id" AS "board_id",
  b."user_id" AS "user_id",
  b."id" AS "column_id",
  'geral-' || substring(b."id" from 1 for 8) AS "slug"
FROM "boards" b;

-- Seed default column for each board
INSERT INTO "columns" ("id", "user_id", "board_id", "name", "slug", "created_at", "updated_at")
SELECT
  bdc."column_id",
  bdc."user_id",
  bdc."board_id",
  'Geral',
  bdc."slug",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "board_default_columns" bdc;

-- Move current tasks to default column from their board
UPDATE "tasks"
SET "column_id" = bdc."column_id"
FROM "board_default_columns" bdc
WHERE "tasks"."board_id" = bdc."board_id";

DROP TABLE "board_default_columns";

-- Replace old board relation with new column relation
DROP INDEX "tasks_user_id_board_id_idx";
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_board_id_fkey";
ALTER TABLE "tasks" ALTER COLUMN "column_id" SET NOT NULL;
ALTER TABLE "tasks" DROP COLUMN "board_id";

-- CreateIndex
CREATE INDEX "columns_user_id_board_id_idx" ON "columns"("user_id", "board_id");
CREATE UNIQUE INDEX "columns_user_id_slug_key" ON "columns"("user_id", "slug");
CREATE INDEX "tasks_user_id_column_id_idx" ON "tasks"("user_id", "column_id");

-- AddForeignKey
ALTER TABLE "columns" ADD CONSTRAINT "columns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "columns" ADD CONSTRAINT "columns_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
