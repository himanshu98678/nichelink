const prisma = require('./src/lib/prisma');

async function exec(statement, label) {
  try {
    await prisma.$executeRawUnsafe(statement);
    console.log(`Applied: ${label}`);
  } catch (error) {
    console.error(`Error applying ${label}:`, error.message || error);
    throw error;
  }
}

async function main() {
  try {
    await exec(`CREATE TABLE IF NOT EXISTS "public"."TaskComment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "taskId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`, 'TaskComment table');

    await exec(`CREATE TABLE IF NOT EXISTS "public"."TaskAttachment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "taskId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "fileName" TEXT NOT NULL,
      "fileType" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`, 'TaskAttachment table');

    await exec(`CREATE TABLE IF NOT EXISTS "public"."Subtask" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "taskId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'todo',
      "assigneeId" TEXT,
      "dueDate" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`, 'Subtask table');

    await exec(`CREATE TABLE IF NOT EXISTS "public"."TimeEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "taskId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "description" TEXT,
      "startedAt" TIMESTAMP(3) NOT NULL,
      "endedAt" TIMESTAMP(3),
      "durationMinutes" INTEGER,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`, 'TimeEntry table');

    await exec(`CREATE TABLE IF NOT EXISTS "public"."TaskActivity" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "taskId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "detail" TEXT NOT NULL,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`, 'TaskActivity table');

    const foreignKeyStatements = [
      {
        label: 'TaskComment taskId fk',
        statement: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskComment_taskId_fkey') THEN ALTER TABLE "public"."TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END$$;`,
      },
      {
        label: 'TaskComment userId fk',
        statement: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskComment_userId_fkey') THEN ALTER TABLE "public"."TaskComment" ADD CONSTRAINT "TaskComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END$$;`,
      },
      {
        label: 'TaskAttachment taskId fk',
        statement: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskAttachment_taskId_fkey') THEN ALTER TABLE "public"."TaskAttachment" ADD CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END$$;`,
      },
      {
        label: 'TaskAttachment userId fk',
        statement: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskAttachment_userId_fkey') THEN ALTER TABLE "public"."TaskAttachment" ADD CONSTRAINT "TaskAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END$$;`,
      },
      {
        label: 'Subtask taskId fk',
        statement: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subtask_taskId_fkey') THEN ALTER TABLE "public"."Subtask" ADD CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END$$;`,
      },
      {
        label: 'Subtask assigneeId fk',
        statement: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subtask_assigneeId_fkey') THEN ALTER TABLE "public"."Subtask" ADD CONSTRAINT "Subtask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END$$;`,
      },
      {
        label: 'TimeEntry taskId fk',
        statement: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimeEntry_taskId_fkey') THEN ALTER TABLE "public"."TimeEntry" ADD CONSTRAINT "TimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END$$;`,
      },
      {
        label: 'TimeEntry userId fk',
        statement: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimeEntry_userId_fkey') THEN ALTER TABLE "public"."TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END$$;`,
      },
      {
        label: 'TaskActivity taskId fk',
        statement: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskActivity_taskId_fkey') THEN ALTER TABLE "public"."TaskActivity" ADD CONSTRAINT "TaskActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END$$;`,
      },
      {
        label: 'TaskActivity userId fk',
        statement: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskActivity_userId_fkey') THEN ALTER TABLE "public"."TaskActivity" ADD CONSTRAINT "TaskActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END$$;`,
      },
    ];

    for (const fk of foreignKeyStatements) {
      await exec(fk.statement, fk.label);
    }

    console.log('Missing task-related tables created or verified.');
  } catch (error) {
    console.error('Failed to create task-related tables:', error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
