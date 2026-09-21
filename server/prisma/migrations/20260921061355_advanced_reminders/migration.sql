-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" DATETIME NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "reminder_stage" INTEGER NOT NULL DEFAULT 0,
    "last_reminded_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("course_id", "created_at", "description", "due_date", "id", "is_completed", "priority", "reminder_sent", "title", "user_id") SELECT "course_id", "created_at", "description", "due_date", "id", "is_completed", "priority", "reminder_sent", "title", "user_id" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_user_id_idx" ON "Task"("user_id");
CREATE INDEX "Task_course_id_idx" ON "Task"("course_id");
CREATE INDEX "Task_due_date_idx" ON "Task"("due_date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
