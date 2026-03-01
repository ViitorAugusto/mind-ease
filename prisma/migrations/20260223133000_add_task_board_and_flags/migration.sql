-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "board_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN "is_concluded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tasks" ADD COLUMN "enable_sound_alerts" BOOLEAN NOT NULL DEFAULT false;

-- Backfill board_id from column
UPDATE "tasks" t
SET "board_id" = c."board_id"
FROM "columns" c
WHERE t."column_id" = c."id";

-- Enforce not null and relations
ALTER TABLE "tasks" ALTER COLUMN "board_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "tasks_user_id_column_id_board_id_idx" ON "tasks"("user_id", "column_id", "board_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
