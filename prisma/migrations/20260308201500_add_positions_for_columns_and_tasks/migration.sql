-- AlterTable
ALTER TABLE "columns" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tasks" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill positions for existing columns by board and creation order
WITH ordered_columns AS (
  SELECT
    c."id",
    ROW_NUMBER() OVER (
      PARTITION BY c."board_id"
      ORDER BY c."created_at" ASC, c."id" ASC
    ) AS "new_position"
  FROM "columns" c
)
UPDATE "columns" c
SET "position" = oc."new_position"
FROM ordered_columns oc
WHERE c."id" = oc."id";

-- Backfill positions for existing tasks by column and creation order
WITH ordered_tasks AS (
  SELECT
    t."id",
    ROW_NUMBER() OVER (
      PARTITION BY t."column_id"
      ORDER BY t."created_at" ASC, t."id" ASC
    ) AS "new_position"
  FROM "tasks" t
)
UPDATE "tasks" t
SET "position" = ot."new_position"
FROM ordered_tasks ot
WHERE t."id" = ot."id";

-- CreateIndex
CREATE INDEX "columns_board_id_position_idx" ON "columns"("board_id", "position");
CREATE INDEX "tasks_column_id_position_idx" ON "tasks"("column_id", "position");
