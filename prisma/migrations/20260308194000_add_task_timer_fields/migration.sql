-- AlterTable
ALTER TABLE
    "tasks"
ADD
    COLUMN "focus_minutes" INTEGER NOT NULL DEFAULT 25,
ADD
    COLUMN "short_break_minutes" INTEGER NOT NULL DEFAULT 5,
ADD
    COLUMN "long_break_minutes" INTEGER NOT NULL DEFAULT 15,
ADD
    COLUMN "long_break_every" INTEGER NOT NULL DEFAULT 4;