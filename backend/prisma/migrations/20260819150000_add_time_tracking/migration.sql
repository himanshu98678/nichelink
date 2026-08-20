-- Preserve existing task time entries while adding project ownership and timer state.
ALTER TABLE "TimeEntry" ADD COLUMN "projectId" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "accumulatedSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TimeEntry" ADD COLUMN "pausedAt" TIMESTAMP(3);
ALTER TABLE "TimeEntry" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "TimeEntry" ALTER COLUMN "taskId" DROP NOT NULL;

UPDATE "TimeEntry" AS entry
SET "projectId" = task."projectId",
    "status" = CASE WHEN entry."endedAt" IS NULL THEN 'RUNNING' ELSE 'COMPLETED' END
FROM "Task" AS task
WHERE entry."taskId" = task."id";

ALTER TABLE "TimeEntry" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "TimeEntry_userId_status_idx" ON "TimeEntry"("userId", "status");
CREATE INDEX "TimeEntry_userId_startedAt_idx" ON "TimeEntry"("userId", "startedAt");
CREATE INDEX "TimeEntry_projectId_taskId_idx" ON "TimeEntry"("projectId", "taskId");